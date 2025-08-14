import { useState, useCallback } from "react";

interface AsyncOperationState {
  loading: boolean;
  error: string;
}

interface AsyncOperationResult<T> extends AsyncOperationState {
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  clearError: () => void;
  setError: (error: string) => void;
}

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
