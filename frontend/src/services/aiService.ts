import api from "./api";
import type { Task } from "../types/task";

export interface SubtaskSuggestion {
  title: string;
  description: string;
  estimatedMinutes: number;

  isUrgent: boolean;
  isImportant: boolean;
}

export interface TaskBreakdownResult {
  originalTask: Task | null;
  subtasks: SubtaskSuggestion[];
  tokensUsed: number;
  costUSD: number;
  reasoning: string;
}

export interface TaskBreakdownRequest {
  title: string;
  description?: string;
}

export interface EnhancementResult {
  enhancedDescription: string;
  tokensUsed: number;
  costUSD: number;
}

export interface BriefingResult {
  summary: string;
  urgentImportantCount: number;
  importantCount: number;
  urgentCount: number;
  otherCount: number;
  topPriorities: string[];
  tokensUsed: number;
  costUSD: number;
}

export const aiService = {
  breakdownTask: async (taskId: number): Promise<TaskBreakdownResult> => {
    const response = await api.post<TaskBreakdownResult>(
      `/ai/breakdown/${taskId}`
    );
    return response.data;
  },

  breakdownPreview: async (
    title: string,
    description?: string
  ): Promise<TaskBreakdownResult> => {
    const response = await api.post<TaskBreakdownResult>(
      "/ai/breakdown-preview",
      {
        title,
        description: description || "",
      }
    );
    return response.data;
  },

  enhanceDescription: async (
    title: string,
    description: string
  ): Promise<EnhancementResult> => {
    const response = await api.post<EnhancementResult>(
      "/ai/enhance-description",
      {
        title,
        description,
      }
    );
    return response.data;
  },

  getDailyBriefing: async (): Promise<BriefingResult> => {
    const response = await api.get<BriefingResult>("/ai/daily-briefing");
    return response.data;
  },
};

export default aiService;
