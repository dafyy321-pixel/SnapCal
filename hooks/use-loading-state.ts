/**
 * 简化的加载状态管理Hook
 * 提供基础的加载状态和错误处理
 */

import { useState, useCallback } from 'react'

export interface LoadingState {
  isLoading: boolean
  isIdle: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  data: any
  lastUpdated: Date | null
}

export interface LoadingActions {
  startLoading: () => void
  setError: (error: Error | null) => void
  setData: (data: any) => void
  reset: () => void
  executeAsync: <P = any>(
    asyncFn: () => Promise<P>,
    options?: {
      onSuccess?: (data: P) => void
      onError?: (error: Error) => void
    }
  ) => Promise<P | undefined>
}

export function useLoadingState(initialData?: any): LoadingState & LoadingActions {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    isIdle: true,
    isSuccess: false,
    isError: false,
    error: null,
    data: initialData || null,
    lastUpdated: null
  })

  const updateState = useCallback((updates: Partial<LoadingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const startLoading = useCallback(() => {
    updateState({
      isLoading: true,
      isIdle: false,
      isSuccess: false,
      isError: false,
      error: null
    })
  }, [updateState])

  const setError = useCallback((error: Error | null) => {
    updateState({
      isLoading: false,
      isError: !!error,
      error,
      isSuccess: false,
      lastUpdated: new Date()
    })
  }, [updateState])

  const setData = useCallback((data: any) => {
    updateState({
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      data,
      lastUpdated: new Date()
    })
  }, [updateState])

  const reset = useCallback(() => {
    updateState({
      isLoading: false,
      isIdle: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: initialData || null,
      lastUpdated: null
    })
  }, [updateState, initialData])

  const executeAsync = useCallback(async <P = any>(
    asyncFn: () => Promise<P>,
    options: {
      onSuccess?: (data: P) => void
      onError?: (error: Error) => void
    } = {}
  ): Promise<P | undefined> => {
    try {
      startLoading()
      const result = await asyncFn()
      setData(result)
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setError(err)
      options.onError?.(err)
      return undefined
    }
  }, [startLoading, setData, setError])

  return {
    ...state,
    startLoading,
    setError,
    setData,
    reset,
    executeAsync
  }
}

/**
 * 骨架屏Hook
 */
export function useSkeleton<T = any>(
  isLoading: boolean,
  data: T | null,
  skeletonCount: number = 1
) {
  const [showSkeleton, setShowSkeleton] = useState(true)

  // 简化的逻辑
  const shouldShowSkeleton = isLoading || (!data && !showSkeleton)

  return {
    showSkeleton,
    shouldShowSkeleton,
    skeletonItems: Array.from({ length: skeletonCount }, (_, i) => i)
  }
}