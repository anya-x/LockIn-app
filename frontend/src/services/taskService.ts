import api from "./api";
import type { Task, TaskRequest } from "../types/task";

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await api.get<Task[]>("/tasks");
    return response.data;
  },

  async getTask(id: number): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(request: TaskRequest): Promise<Task> {
    const response = await api.post<Task>("/tasks", request);
    return response.data;
  },

  async updateTask(id: number, request: TaskRequest): Promise<Task> {
    const response = await api.put<Task>(`/tasks/${id}`, request);
    return response.data;
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  searchTasks: async (searchTerm: string): Promise<Task[]> => {
    const response = await api.get(
      `/tasks/search?query=${encodeURIComponent(searchTerm)}`
    );
    return response.data;
  },
};
