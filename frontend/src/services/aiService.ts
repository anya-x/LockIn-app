import api from "./api";
import type { Task } from "../types/task";

/**
 * Subtask suggestion from AI breakdown.
 */
export interface SubtaskSuggestion {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Result of AI task breakdown.
 */
export interface TaskBreakdownResult {
  originalTask: Task | null;
  subtasks: SubtaskSuggestion[];
  tokensUsed: number;
  costUSD: number;
  reasoning: string;
}

/**
 * Request for breakdown preview (task not yet in DB).
 */
export interface TaskBreakdownRequest {
  title: string;
  description?: string;
}

/**
 * Result of AI description enhancement.
 */
export interface EnhancementResult {
  enhancedDescription: string;
  tokensUsed: number;
  costUSD: number;
}

/**
 * Result of daily briefing generation.
 */
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

/**
 * AI service for task breakdown and other AI features.
 *
 * CURRENT LIMITATIONS:
 * - No rate limiting on frontend (backend enforces limits)
 * - No caching of results
 * - No offline support
 */
export const aiService = {
  /**
   * Get AI breakdown for an existing task.
   *
   * @param taskId ID of the task to break down
   * @returns Task breakdown with suggested subtasks
   */
  breakdownTask: async (taskId: number): Promise<TaskBreakdownResult> => {
    const response = await api.post<TaskBreakdownResult>(
      `/ai/breakdown/${taskId}`
    );
    return response.data;
  },

  /**
   * Get AI breakdown preview before creating task.
   *
   * Useful for getting suggestions before committing to create the task.
   *
   * @param title Task title
   * @param description Optional task description
   * @returns Task breakdown with suggested subtasks
   */
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

  /**
   * Enhance a task description using AI.
   *
   * Takes a vague or minimal description and expands it into
   * a clear, actionable description.
   *
   * @param title Task title for context
   * @param description Current description to enhance
   * @returns Enhanced description with usage stats
   */
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

  /**
   * Get daily briefing for user's tasks.
   *
   * Generates an AI-powered summary of the day's tasks with
   * priority recommendations and time management insights.
   *
   * @returns Daily briefing with task summary
   */
  getDailyBriefing: async (): Promise<BriefingResult> => {
    const response = await api.get<BriefingResult>("/ai/daily-briefing");
    return response.data;
  },
};

export default aiService;
