import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService, type Category } from "../services/categoryService";

// 5 minutes stale time - allows caching while ensuring freshness across navigation
const CATEGORIES_STALE_TIME = 5 * 60 * 1000;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
    staleTime: CATEGORIES_STALE_TIME,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: (newCategory) => {
      // Optimistically add to cache for immediate UI update
      queryClient.setQueryData(["categories"], (old: Category[] = []) => {
        return [...old, newCategory];
      });
      // Invalidate to refetch with accurate taskCount from server
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
