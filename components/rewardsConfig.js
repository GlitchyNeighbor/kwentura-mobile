export const rewardsConfig = [
  { 
    id: 1, 
    starsRequired: 3, 
    title: "Busy Bee", 
    description: "The tiniest story helper", 
    image: require('../images/animals/Bee.png'),
    color: "#FFD700", 
    bgColor: "#FFF9C4" 
  },
  { 
    id: 2, 
    starsRequired: 6, 
    title: "Cheerful Chicken", 
    description: "Pecks at beginner tales", 
    image: require('../images/animals/Chicken.png'),
    color: "#FF9800", 
    bgColor: "#FFF3E0" 
  },
  { 
    id: 3, 
    starsRequired: 12, 
    title: "Steady Snail", 
    description: "Slow but sure storyteller", 
    image: require('../images/animals/Snail.png'),
    color: "#9E9E9E", 
    bgColor: "#F5F5F5" 
  },
  { 
    id: 4, 
    starsRequired: 18, 
    title: "Playful Parrot", 
    description: "Repeats stories full of color", 
    image: require('../images/animals/Parrot.png'),
    color: "#4CAF50", 
    bgColor: "#E8F5E8" 
  },
  { 
    id: 5, 
    starsRequired: 27, 
    title: "Lucky Ladybug", 
    description: "Tiny hero of big tales", 
    image: require('../images/animals/Ladybug.png'),
    color: "#F44336", 
    bgColor: "#FFEBEE" 
  },
  { 
    id: 6, 
    starsRequired: 36, 
    title: "Feisty Fox", 
    description: "Clever with curious stories", 
    image: require('../images/animals/Fox.png'),
    color: "#FF5722", 
    bgColor: "#FBE9E7" 
  },
  { 
    id: 7, 
    starsRequired: 48, 
    title: "Resourceful Raccoon", 
    description: "Loves tricky tale adventures", 
    image: require('../images/animals/Raccoon.png'),
    color: "#607D8B", 
    bgColor: "#ECEFF1" 
  },
  { 
    id: 8, 
    starsRequired: 60, 
    title: "Smart Squirrel",
    description: "Collector of cozy tales", 
    image: require('../images/animals/Squirrel.png'),
    color: "#795548", 
    bgColor: "#EFEBE9" 
  },
  { 
    id: 9, 
    starsRequired: 75, 
    title: "Calm Capybara", 
    description: "Peaceful guardian of tales", 
    image: require('../images/animals/Capybara.png'),
    color: "#8BC34A", 
    bgColor: "#F1F8E9" 
  },
  { 
    id: 10, 
    starsRequired: 90, 
    title: "Kindly Kangaroo", 
    description: "Hops across story lands", 
    image: require('../images/animals/Kangaroo.png'),
    color: "#9C27B0", 
    bgColor: "#F3E5F5" 
  },
  { 
    id: 11, 
    starsRequired: 108, 
    title: "Friendly Frog", 
    description: "Jumps into fun adventures", 
    image: require('../images/animals/Frog.png'),
    color: "#4CAF50", 
    bgColor: "#E8F5E8" 
  },
  { 
    id: 12, 
    starsRequired: 126, 
    title: "Loyal Lion", 
    description: "Protector of mighty stories", 
    image: require('../images/animals/Lion.png'),
    color: "#FFD700", 
    bgColor: "#FFFDE7" 
  },
  { 
    id: 13, 
    starsRequired: 150, 
    title: "Outstanding Ostrich", 
    description: "Runs through thrilling tales", 
    image: require('../images/animals/Ostrich.png'),
    color: "#FF9800", 
    bgColor: "#FFF3E0" 
  },
  { 
    id: 14, 
    starsRequired: 180, 
    title: "Curious Cat", 
    description: "Explorer of magical stories", 
    image: require('../images/animals/Cat.png'),
    color: "#FF6DA8", 
    bgColor: "#FCE4EC" 
  },
  { 
    id: 15, 
    starsRequired: 210, 
    title: "Daring Dog", 
    description: "The ultimate story legend", 
    image: require('../images/animals/Dog.png'),
    color: "#2196F3", 
    bgColor: "#E3F2FD" 
  },
];

// Utility to get unlocked animal images for a user
export const getUnlockedAnimalAvatars = (unlockedSet) => {
  return rewardsConfig
    .filter(reward => unlockedSet.has(reward.id))
    .map(reward => reward.image);
};