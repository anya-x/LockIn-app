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
  category?: Category;
}

export interface TaskRequest {
  title: string;
  description?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string;
}
