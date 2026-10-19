import { NextResponse } from "next/server";
import { updateTaskInBackend } from "@/lib/backendApi";
import { isRecord } from "@/lib/apiValidation";
import { apiRouteErrorResponse } from "@/lib/apiRouteError";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: { message: "Request body must contain valid JSON." } },
      { status: 400 }
    );
  }

  if (
    !isRecord(payload) ||
    Object.keys(payload).some((key) => key !== "completed") ||
    typeof payload.completed !== "boolean"
  ) {
    return NextResponse.json(
      { error: { message: "Body must contain only a boolean completed value." } },
      { status: 400 }
    );
  }

  try {
    const task = await updateTaskInBackend(params.id, payload.completed);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    return apiRouteErrorResponse(error, "Unable to update task.");
  }
}
