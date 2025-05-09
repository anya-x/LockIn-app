import type { Category } from "../services/categoryService";

export interface Task {
  id: number;
  title: string;
  description?: string;
  isUrgent: boolean;
  isImportant: boolean;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
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
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string;
  categoryId?: number | null;
}

export interface FilterState {
  status: string;
  category: string;
  urgent: "all" | "true" | "false";
  important: "all" | "true" | "false";
}
