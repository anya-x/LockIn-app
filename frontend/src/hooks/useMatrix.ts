import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { Task } from "../types/task";

interface MatrixData {
  doFirst: Task[];
  schedule: Task[];
  delegate: Task[];
  eliminate: Task[];
}

// 2 minutes stale time - matrix should refresh when revisiting after task changes
const MATRIX_STALE_TIME = 2 * 60 * 1000;

export function useMatrix() {
  return useQuery({
    queryKey: ["matrix"],
    queryFn: async () => {
      // Backend now excludes completed tasks server-side
      const response = await api.get<MatrixData>("/tasks/matrix");
      return response.data;
    },
    staleTime: MATRIX_STALE_TIME,
  });
}

export function useUpdateTaskQuadrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      isUrgent,
      isImportant,
    }: {
      taskId: number;
      isUrgent: boolean;
      isImportant: boolean;
    }) => {
      await api.patch(`/tasks/${taskId}/quadrant`, null, {
        params: { isUrgent, isImportant },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrix"] });
    },
  });
}
