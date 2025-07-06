import api from "./api";

export interface Goal {
  id: number;
  title: string;
  description?: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  targetTasks?: number;
  targetPomodoros?: number;
  targetFocusMinutes?: number;
  currentTasks: number;
  currentPomodoros: number;
  currentFocusMinutes: number;
  progressPercentage: number;
  completed: boolean;
  completedDate?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: string;
  endDate: string;
  targetTasks?: number;
  targetPomodoros?: number;
  targetFocusMinutes?: number;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  type?: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate?: string;
  endDate?: string;
  targetTasks?: number;
  targetPomodoros?: number;
  targetFocusMinutes?: number;
  currentTasks?: number;
  currentPomodoros?: number;
  currentFocusMinutes?: number;
}

const goalService = {
  getAllGoals: () => {
    return api.get<Goal[]>("/goals");
  },

  getGoalById: (id: number) => {
    return api.get<Goal>(`/goals/${id}`);
  },

  createGoal: (data: CreateGoalRequest) => {
    return api.post<Goal>("/goals", data);
  },

  updateGoal: (id: number, data: UpdateGoalRequest) => {
    return api.put<Goal>(`/goals/${id}`, data);
  },

  deleteGoal: (id: number) => {
    return api.delete(`/goals/${id}`);
  },
};

export default goalService;
