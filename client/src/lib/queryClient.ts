import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Store CSRF token
let csrfToken: string | null = null;

// Function to fetch CSRF token
async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const method = options?.method || 'GET';
  const data = options?.body;
  
  // For GET requests, we don't need a CSRF token
  const isModifyingRequest = method !== 'GET';
  let headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add custom headers if provided
  if (options?.headers) {
    headers = { ...headers, ...options.headers };
  }
  
  // Exclude some endpoints from CSRF token requirement
  const skipCsrfEndpoints = [
    '/api/login',
    '/api/register',
    '/api/verify',
    '/api/logout',
    '/api/web3/verify',
    '/api/user/connect-wallet',
    '/api/moralis/webhook',
    '/api/developer/login',
    '/api/developer/logout',
    '/api/user/change-password',
    '/api/user/add-email',
    '/api/user/verify-email',
    '/api/user/profile',
    '/api/onboarding/progress',
    '/api/onboarding/select-persona'
  ];
  
  const needsCsrfToken = isModifyingRequest && !skipCsrfEndpoints.some(endpoint => url.startsWith(endpoint));
  
  // Get CSRF token for modifying requests if not already provided
  if (needsCsrfToken && !headers['CSRF-Token']) {
    try {
      const token = await fetchCsrfToken();
      headers['CSRF-Token'] = token;
    } catch (error) {
      console.warn('Failed to include CSRF token in request:', error);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Detect if we're on a mobile device for setting performance-oriented options
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true, // Enable reconnect for better UX
      staleTime: 1000 * 60 * 5, // 5 minute cache for better performance
      gcTime: 1000 * 60 * 60 * 2, // 2 hour garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && 
            error?.status !== 408 && error?.status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});
