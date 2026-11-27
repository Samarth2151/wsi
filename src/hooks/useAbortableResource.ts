import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client';

type ResourceLoader<TValue> = (signal: AbortSignal) => Promise<TValue>;

interface AbortableResource<TValue> {
  data: TValue | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

function getLoadError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Could not load this information. Please try again.';
}

export function useAbortableResource<TValue>(
  load: ResourceLoader<TValue>,
): AbortableResource<TValue> {
  const [data, setData] = useState<TValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadRef = useRef(load);
  const dataRef = useRef<TValue | null>(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  loadRef.current = load;

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;
    const hasData = dataRef.current !== null;
    setIsLoading(!hasData);
    setIsRefreshing(hasData);
    setError(null);

    try {
      const result = await loadRef.current(controller.signal);
      if (
        mountedRef.current &&
        requestId === requestIdRef.current &&
        !controller.signal.aborted
      ) {
        dataRef.current = result;
        setData(result);
      }
    } catch (requestError: unknown) {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current &&
        !controller.signal.aborted
      ) {
        setError(getLoadError(requestError));
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.abort();
    };
  }, [refresh]);

  return { data, error, isLoading, isRefreshing, refresh };
}
