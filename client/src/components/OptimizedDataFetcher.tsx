import React from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import queryClient from '@/lib/optimizedQueryClient';

interface OptimizedDataFetcherProps<TData> {
  /** Query key for React Query (required) */
  queryKey: string[];
  
  /** Endpoint URI to fetch data from (optional, uses queryKey[0] if not provided) */
  endpoint?: string;
  
  /** Function to transform the response data (optional) */
  transformer?: (data: any) => TData;
  
  /** Component to render when loading (optional) */
  loadingComponent?: React.ReactNode;
  
  /** Component to render when error occurs (optional) */
  errorComponent?: React.ReactNode;
  
  /** Component to render when no data is available (optional) */
  emptyComponent?: React.ReactNode;
  
  /** Whether to show loading state (default: true) */
  showLoading?: boolean;
  
  /** Whether to show error state (default: true) */
  showError?: boolean;
  
  /** Whether to prefetch related queries (default: false) */
  prefetchRelated?: boolean;
  
  /** Related query keys to prefetch (optional) */
  relatedQueries?: string[][];
  
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  
  /** Whether to use lightweight version of data for mobile (default: auto-detect) */
  useLightweight?: boolean;
  
  /** Children render prop function to render the data */
  children: (result: UseQueryResult<TData, Error>) => React.ReactNode;
  
  /** Additional class name for the container */
  className?: string;
}

/**
 * A component for optimized data fetching with built-in loading, error,
 * and empty states, as well as caching and prefetching capabilities.
 */
export function OptimizedDataFetcher<TData>({
  queryKey,
  endpoint,
  transformer,
  loadingComponent,
  errorComponent,
  emptyComponent,
  showLoading = true,
  showError = true,
  prefetchRelated = false,
  relatedQueries = [],
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  useLightweight = window.innerWidth < 768, // Auto use lightweight for mobile
  children,
  className,
}: OptimizedDataFetcherProps<TData>) {
  // Determine if we should use the lightweight endpoint
  const apiUri = useLightweight
    ? endpoint || `${queryKey[0]}/lightweight`
    : endpoint || queryKey[0];

  // The actual query
  const queryResult = useQuery<TData, Error>({
    queryKey,
    staleTime: cacheTTL,
    select: transformer,
  });

  // Prefetch related queries if needed
  React.useEffect(() => {
    if (prefetchRelated && queryResult.isSuccess && relatedQueries.length > 0) {
      relatedQueries.forEach((relatedKey) => {
        queryClient.prefetchQuery({ queryKey: relatedKey });
      });
    }
  }, [prefetchRelated, queryResult.isSuccess, relatedQueries]);

  // Default loading component
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Default error component
  const defaultErrorComponent = (
    <div className="bg-destructive/10 text-destructive p-4 rounded-md my-2">
      <p className="font-medium">Error loading data</p>
      <p className="text-sm">{queryResult.error?.message || 'Unknown error occurred'}</p>
    </div>
  );

  // Default empty component
  const defaultEmptyComponent = (
    <div className="text-muted-foreground text-center p-4">
      No data available
    </div>
  );

  return (
    <div className={cn('optimized-data-container', className)}>
      {queryResult.isLoading && showLoading
        ? loadingComponent || defaultLoadingComponent
        : null}

      {queryResult.isError && showError
        ? errorComponent || defaultErrorComponent
        : null}

      {queryResult.isSuccess && !queryResult.data && emptyComponent
        ? emptyComponent || defaultEmptyComponent
        : null}

      {children(queryResult)}
    </div>
  );
}

export default OptimizedDataFetcher;