import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import goalService, {
  type CreateGoalRequest,
} from "../services/goalService";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await goalService.getAllGoals();
      return response.data;
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: CreateGoalRequest) => {
      const response = await goalService.createGoal(goalData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: number) => {
      await goalService.deleteGoal(goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
