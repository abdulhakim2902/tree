import { QueryCache, QueryClient } from "@tanstack/react-query";

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      // onError: (error: any, query) => {
      //   if (process.env.NODE_ENV !== "production") {
      //     console.error(`[Query Error]: ${query.queryHash}`, {
      //       message: error.message,
      //       description: error.description ?? "",
      //     });
      //   }
      //   if (error instanceof JsonRpcClientError && error.code === 401) {
      //     const isMeQuery = query.queryKey.includes(resourceKeys.me);
      //     if (isMeQuery) {
      //       signOut();
      //     }
      //   }
      // },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 2,
      },
      mutations: {
        retry: 0,

        // onError(error) {
        //   if (process.env.NODE_ENV !== "production") {
        //     console.error("[Mutation Error]: ", error);
        //   }
        // },
      },
    },
  });

// this works safely in both server and client environments
let browserQueryClient: QueryClient | undefined;
export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // server side: create a new query client for each server request
    return createQueryClient();
  }

  // client side: reuse the same query client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
};
