import api from "./api";
import type { Task, TaskRequest, FilterState } from "../types/task";

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const taskService = {
  async getTasksPaginated(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<Task>> {
    const response = await api.get<PaginatedResponse<Task>>(
      `/tasks?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getTasks(): Promise<Task[]> {
    const response = await api.get<Task[] | PaginatedResponse<Task>>("/tasks");
    if (
      response.data &&
      typeof response.data === "object" &&
      "content" in response.data
    ) {
      return response.data.content;
    }

    return response.data as Task[];
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

  filterTasks: async (filters: FilterState): Promise<Task[]> => {
    const params: any = {};

    if (filters.status !== "all") {
      params.status = filters.status;
    }

    if (filters.category !== "all") {
      params.categoryId = Number(filters.category);
    }

    if (filters.urgent !== "all") {
      params.isUrgent = filters.urgent === "true";
    }

    if (filters.important !== "all") {
      params.isImportant = filters.important === "true";
    }

    const response = await api.get("/tasks/filter", { params });
    return response.data;
  },

  filterTasksPaginated: async (
    filters: FilterState,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<Task>> => {
    const params: any = {
      page,
      size,
    };

    if (filters.status !== "all") {
      params.status = filters.status;
    }

    if (filters.category !== "all") {
      params.categoryId = Number(filters.category);
    }

    if (filters.urgent !== "all") {
      params.isUrgent = filters.urgent === "true";
    }

    if (filters.important !== "all") {
      params.isImportant = filters.important === "true";
    }

    const response = await api.get<PaginatedResponse<Task>>("/tasks/filter", {
      params,
    });
    return response.data;
  },
};

export type { PaginatedResponse };
