import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Use clone() to avoid consuming the body stream
      const resClone = res.clone();
      
      // Try to parse as JSON first
      const data = await resClone.json();
      const error: any = new Error(`${res.status}: ${data.message || res.statusText}`);
      error.response = { status: res.status, data };
      throw error;
    } catch (jsonError) {
      // If not JSON, use text (with another clone to avoid consuming the stream)
      const resClone = res.clone();
      const text = await resClone.text() || res.statusText;
      const error: any = new Error(`${res.status}: ${text}`);
      error.response = { status: res.status, text };
      throw error;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making ${method} request to ${url} with data:`, data);
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Create a clone of the response before checking if it's ok
    // This prevents the "body stream already read" error
    const resClone = res.clone();
    
    await throwIfResNotOk(res);
    return resClone;
  } catch (error) {
    console.error(`API request failed (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // The first entry is always the base URL/endpoint
    const baseUrl = queryKey[0] as string;
    
    // Check if there are additional params in the queryKey
    // For example: queryKey = ['/api/clients', { withBalances: true }]
    const params = queryKey[1];
    
    // Only append query params if they exist and are an object
    let url = baseUrl;
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const searchParams = new URLSearchParams();
      
      // Add each parameter to the URL
      for (const [key, value] of Object.entries(params)) {
        if (value === true) {
          searchParams.append(key, 'true');
        } else if (value === false) {
          searchParams.append(key, 'false'); 
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      
      // Append the search parameters to the URL if we have any
      const searchString = searchParams.toString();
      if (searchString) {
        url = `${baseUrl}?${searchString}`;
      }
    }
    
    // Now fetch with the properly constructed URL
    const res = await fetch(url, {
      credentials: "include",
    });
    
    // Create a clone for error checking and for returning the response
    const resClone = res.clone();

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await resClone.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
