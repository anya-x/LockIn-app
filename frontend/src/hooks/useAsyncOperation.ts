import { useState, useCallback } from "react";

interface AsyncOperationState {
  loading: boolean;
  error: string;
}

interface AsyncOperationResult<T> extends AsyncOperationState {
  /**
   * Execute an async operation with automatic loading/error state management
   */
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;

  /**
   * Clear the error state
   */
  clearError: () => void;

  /**
   * Set error manually
   */
  setError: (error: string) => void;
}

/**
 * Custom hook for managing async operations with automatic loading and error states.
 * Consolidates duplicate try-catch-finally patterns found across 8+ components.
 *
 * @param options Configuration options
 * @param options.onSuccess Optional callback executed on successful operation
 * @param options.onError Optional callback executed on error
 * @returns Object with loading state, error state, and execute function
 *
 * @example
 * const { loading, error, execute } = useAsyncOperation({
 *   onSuccess: () => console.log("Success!"),
 * });
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     const result = await apiService.createTask(data);
 *     return result;
 *   });
 * };
 *
 * @example
 * // With custom error handling
 * const { loading, error, execute, clearError } = useAsyncOperation({
 *   onError: (err) => showToast(err),
 * });
 */
export const useAsyncOperation = <T = void>(options?: {
  onSuccess?: (result: T) => void;
  onError?: (error: string) => void;
}): AsyncOperationResult<T> => {
  const [state, setState] = useState<AsyncOperationState>({
    loading: false,
    error: "",
  });

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      setState({ loading: true, error: "" });

      try {
        const result = await operation();

        setState({ loading: false, error: "" });

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "An unexpected error occurred";

        setState({ loading: false, error: errorMessage });

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return undefined;
      }
    },
    [options]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    execute,
    clearError,
    setError,
  };
};

export default useAsyncOperation;
