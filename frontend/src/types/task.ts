export interface Task {
  id: number;
  title: string;
  description?: string;
  isUrgent: boolean;
  isImportant: boolean;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string;
}
