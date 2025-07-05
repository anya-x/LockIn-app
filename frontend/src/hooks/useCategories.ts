import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService, type Category } from "../services/categoryService";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: (newCategory) => {
      queryClient.setQueryData(["categories"], (old: Category[] = []) => {
        return [...old, newCategory];
      });
      // queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
