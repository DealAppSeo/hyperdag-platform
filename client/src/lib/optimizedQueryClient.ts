import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized fetch function that handles caching headers,
 * aborts pending requests if needed, and handles serializing arrays
 */
async function optimizedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Track ongoing requests to avoid duplicates
  const requestKey = typeof input === 'string' ? input : input.toString();
  const alreadyPending = pendingRequests.get(requestKey);
  
  if (alreadyPending) {
    return alreadyPending;
  }
  
  // Set up request with proper caching headers
  const headers = new Headers(init?.headers);
  
  // Use client-side cache when appropriate
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'max-age=60');
  }
  
  // Create an abort controller with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  const requestPromise = fetch(input, {
    ...init,
    headers,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
    pendingRequests.delete(requestKey);
  });
  
  // Store the pending request
  pendingRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

// Map to track pending requests to enable request deduplication
const pendingRequests = new Map<string, Promise<Response>>();

/**
 * Creates API request with proper error handling
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  headers: HeadersInit = {}
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  // For GET requests with data, append as query parameters
  if (data && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays properly
        value.forEach((v) => params.append(`${key}[]`, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
    
    endpoint = `${endpoint}?${params.toString()}`;
  }

  const response = await optimizedFetch(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unexpected error occurred',
    }));
    
    const error = new Error(errorData.message || 'An unexpected error occurred');
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response;
}

/**
 * Default fetch function for React Query
 */
export const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  // Make sure the query key starts with a string endpoint
  if (typeof queryKey[0] !== 'string') {
    throw new Error('Invalid query key: first element must be a string endpoint');
  }

  // Extract endpoint from the query key
  const endpoint = queryKey[0];
  
  // Extract query parameters from the rest of the query key
  const params = queryKey.slice(1).reduce<Record<string, unknown>>((acc, param) => {
    if (typeof param === 'object' && param !== null && !Array.isArray(param)) {
      // Type assertion with a safe merge
      const paramObj = param as Record<string, unknown>;
      return { ...acc, ...paramObj };
    }
    return acc;
  }, {});

  const response = await apiRequest('GET', endpoint, params);
  return response.json();
};

/**
 * Creates a configured query client with optimized settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Using any here to bypass the type checking issues
      // This is safe as the actual implementation handles QueryKey properly
      queryFn: defaultQueryFn as any,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Helper to create an optimized query function with specific parameters
 */
export const getQueryFn = (options: {
  on401?: 'redirect' | 'throw' | 'returnNull';
  timeout?: number;
  cacheControl?: string;
}) => {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (typeof queryKey[0] !== 'string') {
      throw new Error('Invalid query key: first element must be a string endpoint');
    }

    const endpoint = queryKey[0];
    
    try {
      const headers: HeadersInit = {};
      if (options.cacheControl) {
        headers['Cache-Control'] = options.cacheControl;
      }
      
      const controller = new AbortController();
      if (options.timeout) {
        setTimeout(() => controller.abort(), options.timeout);
      }
      
      const response = await optimizedFetch(endpoint, {
        headers,
        signal: controller.signal,
      });
      
      if (response.status === 401) {
        if (options.on401 === 'redirect') {
          window.location.href = '/auth';
          return undefined;
        } else if (options.on401 === 'returnNull') {
          return null;
        } else {
          throw new Error('Unauthorized');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message || 'An unexpected error occurred');
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };
};

export default queryClient;