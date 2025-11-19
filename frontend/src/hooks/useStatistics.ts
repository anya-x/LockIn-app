import { useQuery } from "@tanstack/react-query";
import { sessionService } from "../services/sessionService";
import { taskService } from "../services/taskService";

export interface StatisticsData {
  sessions: any[];
  taskStats: any;
  tasks: any[];
}

export function useStatisticsData() {
  return useQuery({
    queryKey: ["statistics-page"],
    queryFn: async () => {
      const [sessions, taskStats, tasks] = await Promise.all([
        sessionService.getUserSessions(),
        taskService.getStatistics(),
        taskService.getTasks(),
      ]);

      return {
        sessions,
        taskStats,
        tasks: Array.isArray(tasks) ? tasks : [],
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour - statistics change with each completed task/session
  });
}
