import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { epicsCountQueryOptions, epicsQueryOptions } from "../../../queries/epicsQuery";
import { Fragment } from "react/jsx-runtime";
import { useDeferredValue, useState } from "react";

type SearchParams = {
  page: number;
};

export const Route = createFileRoute("/app/epics/")({
  validateSearch(search: Record<string, unknown>): SearchParams {
    return {
      page: parseInt(search.page as string, 10) || 1,
    };
  },
  loaderDeps: ({ search }) => {
    return { page: search.page };
  },
  async loader({ context, deps }) {
    const queryClient = context.queryClient;

    await Promise.allSettled([
      queryClient.ensureQueryData(epicsQueryOptions(context.timestarted, deps.page)),
      queryClient.ensureQueryData(epicsCountQueryOptions(context.timestarted)),
    ]);
  },
  component: Index,
  pendingComponent: () => <div className="p-3 text-xl">Loading epics ...</div>,
  pendingMinMs: 200,
  pendingMs: 10,
});

function Index() {
  const { page } = Route.useSearch();
  const context = Route.useRouteContext();

  const deferredPage = useDeferredValue(page);
  const loading = page !== deferredPage;

  const { data: epicsData } = useQuery(epicsQueryOptions(context.timestarted, deferredPage));
  const { data: epicsCount } = useQuery(epicsCountQueryOptions(context.timestarted));

  return (
    <div className="flex flex-col gap-2 p-3">
      <h3 className="text-2xl">Epics page!</h3>
      <h3 className="text-lg">There are {epicsCount?.count} epics</h3>
      <div>
        <div
          className={`inline-grid gap-x-8 gap-y-4 grid-cols-[auto_auto_auto] items-center p-3 ${loading ? "opacity-40" : ""}`}
        >
          {epicsData?.map((e, idx) => (
            <Fragment key={idx}>
              <div>{e.name}</div>
              <Link to="/app/epics/$epicId" params={{ epicId: e.id }} className="border p-1 rounded">
                View
              </Link>
              <Link to="/app/epics/$epicId/edit" params={{ epicId: e.id }} className="border p-1 rounded">
                Edit
              </Link>
            </Fragment>
          ))}
          <div className="flex gap-3">
            <Link
              to="/app/epics"
              search={{ page: page - 1 }}
              className="border p-1 rounded"
              disabled={loading || page === 1}
            >
              Prev
            </Link>
            <Link
              to="/app/epics"
              search={{ page: page + 1 }}
              className="border p-1 rounded"
              disabled={loading || !epicsData.length}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
