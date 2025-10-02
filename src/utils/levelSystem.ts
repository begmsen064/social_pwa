export interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  badge: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Başlangıç', minPoints: 0, maxPoints: 99, color: '#8B4513', badge: '🥉' },
  { level: 2, name: 'Bronz', minPoints: 100, maxPoints: 299, color: '#CD7F32', badge: '🥉' },
  { level: 3, name: 'Gümüş', minPoints: 300, maxPoints: 599, color: '#C0C0C0', badge: '🥈' },
  { level: 4, name: 'Altın', minPoints: 600, maxPoints: 999, color: '#FFD700', badge: '🥇' },
  { level: 5, name: 'Platin', minPoints: 1000, maxPoints: 1999, color: '#E5E4E2', badge: '💎' },
  { level: 6, name: 'Elmas', minPoints: 2000, maxPoints: 3999, color: '#B9F2FF', badge: '💎' },
  { level: 7, name: 'Master', minPoints: 4000, maxPoints: 7999, color: '#9966CC', badge: '👑' },
  { level: 8, name: 'Efsane', minPoints: 8000, maxPoints: 15999, color: '#FF1493', badge: '🔥' },
  { level: 9, name: 'Titan', minPoints: 16000, maxPoints: 31999, color: '#FF4500', badge: '⚡' },
  { level: 10, name: 'Tanrı', minPoints: 32000, maxPoints: Infinity, color: '#FFD700', badge: '✨' },
];

export const getLevelInfo = (points: number): LevelInfo => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
};

export const getProgress = (points: number): number => {
  const currentLevel = getLevelInfo(points);
  
  // If max level, return 100%
  if (currentLevel.maxPoints === Infinity) {
    return 100;
  }
  
  const pointsInLevel = points - currentLevel.minPoints;
  const pointsNeededForLevel = currentLevel.maxPoints - currentLevel.minPoints + 1;
  
  return (pointsInLevel / pointsNeededForLevel) * 100;
};

export const getNextLevelInfo = (points: number): LevelInfo | null => {
  const currentLevel = getLevelInfo(points);
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex < LEVELS.length) {
    return LEVELS[nextLevelIndex];
  }
  
  return null;
};

export const getPointsToNextLevel = (points: number): number => {
  const currentLevel = getLevelInfo(points);
  
  if (currentLevel.maxPoints === Infinity) {
    return 0;
  }
  
  return currentLevel.maxPoints + 1 - points;
};
