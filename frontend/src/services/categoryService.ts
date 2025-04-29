import api from "./api";

export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  taskCount?: number;
  createdAt?: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data;
  },

  createCategory: async (
    category: Omit<Category, "id" | "createdAt" | "taskCount">
  ): Promise<Category> => {
    const response = await api.post("/categories", category);
    return response.data;
  },

  updateCategory: async (
    id: number,
    category: Partial<Omit<Category, "id" | "createdAt" | "taskCount">>
  ): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
