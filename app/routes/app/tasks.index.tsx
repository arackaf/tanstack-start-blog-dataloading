import { Fragment, Suspense, use } from "react";
import { Await, createFileRoute, Link } from "@tanstack/react-router";
import { getTasksList } from "../../serverFnQueries/tasks";

export const Route = createFileRoute("/app/tasks/")({
  component: IndexX,
  loader: async ({ context }) => {
    const now = +new Date();
    console.log(`/tasks/index path loader. Loading tasks at + ${now - context.timestarted}ms since start`);
    const tasks = getTasksList();
    return { tasks };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div className="m-4 p-4 text-xl">Loading tasks list...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});

function IndexX() {
  const { tasks: tasksPromise } = Route.useLoaderData();
  return (
    <Await promise={tasksPromise} fallback={<span>Yoooo</span>}>
      {data => <Index data={data} />}
    </Await>
  );
}

function Index({ data: tasks }) {
  const { tasks: tasksPromise } = Route.useLoaderData();
  const matchData = Route.useMatch();

  const { isFetching } = matchData;

  //const tasks = use(tasksPromise);

  return (
    <div className="p-2">
      <h3 className="text-lg">Tasks page! {isFetching ? "Loading ..." : null}</h3>
      <div className="inline-grid gap-x-8 gap-y-4 grid-cols-[auto_auto_auto] items-center p-3">
        {tasks.map((t, idx) => (
          <Fragment key={idx}>
            <div>{t.title}</div>
            <Link to="/app/tasks/$taskId" className="border p-1 rounded" params={{ taskId: t.id }}>
              View
            </Link>
            <Link to="/app/tasks/$taskId/edit" className="border p-1 rounded" params={{ taskId: t.id }}>
              Edit
            </Link>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
