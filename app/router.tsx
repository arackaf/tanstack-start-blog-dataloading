import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient();

export function createRouter() {
  const queryClientToUse = typeof window === "object" ? queryClient : new QueryClient();

  const router = routerWithQueryClient(
    createTanStackRouter({
      context: { user: { id: "1", name: "Adam" }, queryClient: queryClientToUse, timestarted: +new Date() },
      routeTree,
    }),
    queryClientToUse,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
