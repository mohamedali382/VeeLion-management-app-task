import { NextResponse } from "next/server";
import { apiRouteErrorResponse } from "@/lib/apiRouteError";
import { getTasksSummaryFromBackend } from "@/lib/backendApi";

export async function GET() {
  try {
    const summary = await getTasksSummaryFromBackend();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return apiRouteErrorResponse(error, "Unable to fetch the task report.");
  }
}
