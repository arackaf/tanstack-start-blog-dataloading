import { createMiddleware, useServerFn } from "@tanstack/start";
import { hashKey, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { epicQueryOptions } from "../../../../queries/epicQuery";
import { useEffect, useRef, useState } from "react";
import { postToApi } from "../../../../../backend/fetchUtils";
import { createServerFn } from "@tanstack/start";
import { epicsQueryOptions } from "../../../../queries/epicsQuery";
import { queryClient } from "../../../../queryClient";

const reactQueryMiddleware = createMiddleware()
  .client(async ({ next }) => {
    console.log("Client before");

    try {
      const res = await next();
      console.log("in client", "result", { res });

      queryClient.setQueryData(["epics", "list", 1], res.context.query.listData, { updatedAt: +new Date() });

      return res;
    } catch (er) {
      console.log({ er });
      throw er;
    }
  })
  .server(async ({ next, context }) => {
    console.log("Middleware server before", { context });

    try {
      var serverFnResult = await next({ sendContext: { xyz: 999, query: {} as Record<string, any> } });

      const epicsListOptions = epicsQueryOptions(0, 1);
      const epicOptions = epicQueryOptions(0, "1");

      const listData = await epicsListOptions.queryFn();
      //const epicData = await epicOptions.queryFn();

      serverFnResult.sendContext.query.listData = listData;
      //serverFnResult.sendContext.query.epicData = epicData;
    } catch (er) {
      console.log("Server middleware error", er);
      throw er;
    }

    // types fine, but does not work - blows up at runtime - serverFnResult.clientAfterContext is undefined
    // serverFnResult.clientAfterContext.query.abc = "def";

    // works, but TS no likey
    // serverFnResult.sendContext.query.abc = "def";

    return serverFnResult;
  });

/*



*/

export const saveEpic = createServerFn({ method: "POST" })
  .middleware([reactQueryMiddleware])
  .validator((updates: { id: string; newName: string }) => updates)
  .handler(async ({ data, context }) => {
    console.log("Running server function");

    await postToApi("api/epic/update", {
      id: data.id,
      name: data.newName,
    });
    console.log("Server function finished", { context });

    //return {};
    throw redirect({ to: "/app/epics", search: { page: 1 } });
  });

export const Route = createFileRoute("/app/epics/$epicId/edit")({
  component: EditEpic,
  context({ context, params }) {
    return {
      currentEpicOptions: epicQueryOptions(context.timestarted, params.epicId),
    };
  },
  loader({ context }) {
    context.queryClient.prefetchQuery(context.currentEpicOptions);
  },
});

function EditEpic() {
  const { epicId } = Route.useParams();
  const { currentEpicOptions } = Route.useRouteContext();
  const { data: epic } = useSuspenseQuery(currentEpicOptions);
  const newName = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const runSave = useServerFn(saveEpic);

  const save = async () => {
    setSaving(true);

    const result: any = await runSave({
      data: {
        id: epic.id,
        newName: newName.current!.value,
      },
    });

    console.log({ result });

    const listOptions = epicsQueryOptions(0, 1);
    const epicOptions = epicQueryOptions(0, "1");

    //queryClient.invalidateQueries({ queryKey: ["epics"], refetchType: "none" });
    //queryClient.invalidateQueries({ queryKey: ["epic"], refetchType: "none" });

    //queryClient.setQueryData(["epics", "list", 1], result.query.listData, { updatedAt: Date.now() });
    //queryClient.setQueryData(["epic", "1"], result.query.epicData, { updatedAt: Date.now() });

    //queryClient.refetchQueries({ queryKey: ["epics"], type: "active", stale: true });
    //queryClient.refetchQueries({ queryKey: ["epic"], type: "active", stale: true });

    setSaving(false);
  };

  useEffect(() => {
    newName.current!.value = epic.name;
  }, [epic.name]);

  return (
    <div className="flex flex-col gap-5 p-3">
      <div>
        <Link to="/app/epics" search={{ page: 1 }}>
          Back
        </Link>
      </div>
      <div>
        <div className="flex flex-col gap-2">
          <span>Edit epic {epic.id}</span>
          <span>{epic.name}</span>
          <input className="self-start border p-2 w-64" ref={newName} defaultValue={epic.name} />
          <div className="flex gap-2"></div>
          <button className="self-start p-2 border" onClick={save}>
            Save
          </button>
          {saving && <span>Saving...</span>}
        </div>
      </div>
    </div>
  );
}
