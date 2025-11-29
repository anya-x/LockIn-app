import type { Category } from "../services/categoryService";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

export interface Task {
  id: number;
  title: string;
  description?: string;
  isUrgent: boolean;
  isImportant: boolean;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: number | null;
  category?: Category;
}

export interface TaskRequest {
  title: string;
  description?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
  status?: TaskStatus;
  dueDate?: string;
  categoryId?: number | null;
}

export interface FilterState {
  status: string;
  category: string;
  urgent: "all" | "true" | "false";
  important: "all" | "true" | "false";
  priority: "all" | "do-first" | "schedule" | "delegate" | "eliminate";
  hideCompleted: boolean;
}

export type SortField = "date" | "priority" | "status" | "title" | "created";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
