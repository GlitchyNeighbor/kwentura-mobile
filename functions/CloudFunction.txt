const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Poppler } = require("node-poppler");
const path = require("path");
const os = require("os");
const fs = require("fs-extra"); // For easier file system operations

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Configuration
const IMAGE_FORMAT = "png"; // Supported: "png", "jpeg", "tiff", "ppm" (check Poppler docs for pdftoppm)
const IMAGE_RESOLUTION = 300; // DPI for the output images

/**
 * Firebase Cloud Function (HTTPS Callable) to split a PDF into images.
 *
 * @param {object} data The data passed to the function.
 * @param {string} data.storyId The ID of the story (used for Firestore doc and Storage path).
 * @param {string} data.pdfStoragePath The full path to the PDF file in Firebase Storage
 *                                     (e.g., "stories/story123/original.pdf").
 * @param {functions.https.CallableContext} context The context of the function call.
 * @returns {Promise<object>} A promise that resolves with the result of the operation.
 */
exports.splitPdfToImages = functions
  .runWith({
    timeoutSeconds: 300, // Adjust as needed, max 540 for HTTP, longer for Gen 2 background
    memory: "1GB", // Adjust based on PDF complexity and size
  })
  .https.onCall(async (data, context) => {
    // Optional: Authenticate user
    // if (!context.auth) {
    //   throw new functions.https.HttpsError(
    //     "unauthenticated",
    //     "The function must be called while authenticated."
    //   );
    // }

    const { storyId, pdfStoragePath } = data;

    if (!storyId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'storyId' in request data."
      );
    }
    if (!pdfStoragePath) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'pdfStoragePath' in request data."
      );
    }

    const bucket = storage.bucket(); // Default Firebase Storage bucket
    const tempLocalDir = path.join(os.tmpdir(), `pdf_split_${storyId}_${Date.now()}`);
    const localPdfPath = path.join(tempLocalDir, "source.pdf");
    const outputImagePrefix = "page"; // `pdftoppm` will append page numbers, e.g., page-1.png

    try {
      functions.logger.log(`Starting PDF split for storyId: ${storyId}, PDF: ${pdfStoragePath}`);
      await fs.ensureDir(tempLocalDir); // Create a temporary directory

      // 1. Download the PDF from Storage
      functions.logger.log(`Downloading PDF from gs://${bucket.name}/${pdfStoragePath} to ${localPdfPath}`);
      await bucket.file(pdfStoragePath).download({ destination: localPdfPath });
      functions.logger.log("PDF downloaded successfully.");

      // 2. Split PDF into images using Poppler (via node-poppler)
      // This assumes 'pdftoppm' is available. For Gen 2, install 'poppler-utils' in Dockerfile.
      functions.logger.log("Starting PDF to image conversion...");
      const poppler = new Poppler(); // You can pass Poppler's bin path: new Poppler('/usr/bin/poppler')

      const options = {
        resolutionXYAxis: IMAGE_RESOLUTION,
        // firstPageToConvert: 1, // Optional: specify page range
        // lastPageToConvert: 5,  // Optional: specify page range
      };
      if (IMAGE_FORMAT === "png") options.pngFile = true;
      else if (IMAGE_FORMAT === "jpeg") options.jpegFile = true;
      // Add other formats as needed, e.g., options.tiffFile = true;

      // The `convertTo` method of `node-poppler` (or `pdfToPpm`) saves files to the CWD by default,
      // or to the directory of the `outputFilePrefix` if it includes a path.
      const conversionOutputPath = path.join(tempLocalDir, outputImagePrefix);
      await poppler.pdfToPpm(localPdfPath, conversionOutputPath, options);
      functions.logger.log(`PDF to image conversion successful. Output prefix: ${conversionOutputPath}`);

      // 3. Upload resulting images back to Firebase Storage
      const imageFiles = await fs.readdir(tempLocalDir);
      const pageImageUrlsMap = {}; // To store URLs like { "page1": "url", "page2": "url" }
      let imagesUploadedCount = 0;

      for (const file of imageFiles) {
        // pdftoppm names files like "prefix-1.png", "prefix-01.png", "prefix-001.png"
        const imagePattern = new RegExp(`^${outputImagePrefix}-(\d+)\.${IMAGE_FORMAT}$`);
        const match = file.match(imagePattern);

        if (match) {
          const pageNumber = parseInt(match[1], 10);
          const localImagePath = path.join(tempLocalDir, file);
          const imageName = `page_${pageNumber}.${IMAGE_FORMAT}`;
          const destinationPath = `stories/${storyId}/pages/${imageName}`;

          functions.logger.log(`Uploading ${localImagePath} to gs://${bucket.name}/${destinationPath}`);
          const [uploadedFile] = await bucket.upload(localImagePath, {
            destination: destinationPath,
            metadata: {
              contentType: `image/${IMAGE_FORMAT}`,
              cacheControl: "public, max-age=31536000", // Optional: cache for 1 year
            },
          });

          await uploadedFile.makePublic(); // Make the image publicly accessible
          const publicUrl = uploadedFile.publicUrl();
          pageImageUrlsMap[`page${pageNumber}`] = publicUrl;
          imagesUploadedCount++;
          functions.logger.log(`Uploaded ${imageName}, URL: ${publicUrl}`);
        }
      }

      if (imagesUploadedCount === 0) {
        functions.logger.warn("No images were generated or uploaded. Check PDF content or Poppler output.");
      } else {
        functions.logger.log(`${imagesUploadedCount} images uploaded successfully.`);
      }

      // 4. Optionally, store the URLs in Firestore
      if (imagesUploadedCount > 0) {
        functions.logger.log(`Storing image URLs in Firestore for story ${storyId}`);
        const storyRef = db.collection("stories").doc(storyId);
        await storyRef.set(
          {
            pageImages: pageImageUrlsMap, // Stores as a map: { "page1": "url1", "page2": "url2", ... }
            pdfProcessed: true,
            pdfLastProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true } // Merge with existing document data
        );
        functions.logger.log("Image URLs stored in Firestore.");
      }

      return {
        success: true,
        message: `PDF processed. ${imagesUploadedCount} images uploaded.`,
        storyId: storyId,
        imageUrls: pageImageUrlsMap,
      };
    } catch (error) {
      functions.logger.error("Error in splitPdfToImages function:", error);
      // Ensure HttpsError is thrown for client-side handling
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred during PDF processing.",
        error.message
      );
    } finally {
      // 5. Cleanup temporary files
      if (await fs.pathExists(tempLocalDir)) {
        functions.logger.log(`Cleaning up temporary directory: ${tempLocalDir}`);
        try {
          await fs.remove(tempLocalDir);
          functions.logger.log("Temporary directory cleaned up.");
        } catch (cleanupError) {
          functions.logger.error("Error cleaning up temporary directory:", cleanupError);
        }
      }
    }
  });
