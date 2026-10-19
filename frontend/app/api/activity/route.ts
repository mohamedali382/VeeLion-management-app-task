import { NextResponse } from "next/server";
import { getActivityFromBackend } from "@/lib/backendApi";
import { apiRouteErrorResponse } from "@/lib/apiRouteError";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    return apiRouteErrorResponse(error, "Unable to fetch activity logs.");
  }
}
