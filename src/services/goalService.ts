import { kvLoad, kvSave } from './intelligenceService';

export interface Goal {
  id: string;
  name: string;
  targetPrice: number;
  symbol: string;
  createdAt: number;
}

export const getGoals = async (): Promise<Goal[]> => {
  return await kvLoad('nexus_goals', []);
};

export const saveGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
  const goals = await getGoals();
  const newGoal: Goal = {
    ...goal,
    id: Math.random().toString(36).substring(7),
    createdAt: Date.now(),
  };
  await kvSave('nexus_goals', [...goals, newGoal]);
  return newGoal;
};

export const deleteGoal = async (id: string) => {
  const goals = await getGoals();
  await kvSave('nexus_goals', goals.filter(g => g.id !== id));
};

export const calculateSharesNeeded = (targetPrice: number, currentPrice: number) => {
  if (currentPrice <= 0) return 0;
  return Math.ceil(targetPrice / currentPrice);
};

export const calculateGoalProgress = (targetPrice: number, currentStockPrice: number, userHoldings: number) => {
  if (targetPrice <= 0) return 0;
  const currentVal = currentStockPrice * userHoldings;
  return Math.min(100, (currentVal / targetPrice) * 100);
};
