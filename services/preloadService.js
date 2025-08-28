
import { collection, getDocs } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../FirebaseConfig';

const CACHE_MAP_KEY = 'assetCacheMap';

const getCachedAsset = async (remoteUrl) => {
  try {
    const cacheMapStr = await AsyncStorage.getItem(CACHE_MAP_KEY);
    const cacheMap = cacheMapStr ? JSON.parse(cacheMapStr) : {};
    return cacheMap[remoteUrl];
  } catch (e) {
    console.error('Failed to get cached asset from AsyncStorage', e);
    return null;
  }
};

const createSafeFilename = (url) => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const extension = url.split('.').pop().split('?')[0];
  return `${hash}.${extension}`;
};

const cacheAsset = async (remoteUrl) => {
  try {
    const filename = createSafeFilename(remoteUrl);
    const localUri = `${FileSystem.cacheDirectory}${filename}`;
    const { exists } = await FileSystem.getInfoAsync(localUri);

    if (exists) {
      return localUri;
    }

    await FileSystem.downloadAsync(remoteUrl, localUri);

    const cacheMapStr = await AsyncStorage.getItem(CACHE_MAP_KEY);
    const cacheMap = cacheMapStr ? JSON.parse(cacheMapStr) : {};
    cacheMap[remoteUrl] = localUri;
    await AsyncStorage.setItem(CACHE_MAP_KEY, JSON.stringify(cacheMap));

    return localUri;
  } catch (e) {
    console.error(`Failed to cache asset: ${remoteUrl}`, e);
    return null;
  }
};

export const preloadAllStories = async () => {
  console.log('Starting to preload all stories...');
  try {
    const storiesCollection = collection(db, 'stories');
    const querySnapshot = await getDocs(storiesCollection);
    const stories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const assetUrls = [];
    stories.forEach(story => {
      if (story.pageImages && Array.isArray(story.pageImages)) {
        story.pageImages.forEach(url => assetUrls.push(url));
      }
      if (story.ttsAudioData && Array.isArray(story.ttsAudioData)) {
        story.ttsAudioData.forEach(audio => assetUrls.push(audio.audioUrl));
      }
    });

    console.log(`Found ${assetUrls.length} assets to preload.`);

    for (const url of assetUrls) {
      if (url) {
        await cacheAsset(url);
      }
    }

    console.log('Finished preloading all stories.');
  } catch (error) {
    console.error('Failed to preload stories:', error);
  }
};

export const getCachedUri = async (remoteUrl) => {
    if (!remoteUrl) return null;
    const localUri = await getCachedAsset(remoteUrl);
    return localUri || remoteUrl;
};
