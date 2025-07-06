import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { Task } from "../types/task";

interface MatrixData {
  doFirst: Task[];
  schedule: Task[];
  delegate: Task[];
  eliminate: Task[];
}


export function useMatrix() {
  return useQuery({
    queryKey: ["matrix"],
    queryFn: async () => {
      const response = await api.get<MatrixData>("/tasks/matrix");
      const data = response.data;
      const filteredMatrix: MatrixData = {
        doFirst: data.doFirst.filter(
          (task: Task) => task.status !== "COMPLETED"
        ),
        schedule: data.schedule.filter(
          (task: Task) => task.status !== "COMPLETED"
        ),
        delegate: data.delegate.filter(
          (task: Task) => task.status !== "COMPLETED"
        ),
        eliminate: data.eliminate.filter(
          (task: Task) => task.status !== "COMPLETED"
        ),
      };

      return filteredMatrix;
    },
    staleTime: Infinity,
    refetchOnMount: false,
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
