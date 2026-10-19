import { NextResponse } from "next/server";
import { getTasksFromBackend } from "@/lib/backendApi";
import { apiRouteErrorResponse } from "@/lib/apiRouteError";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return apiRouteErrorResponse(error, "Unable to fetch tasks.");
  }
}
