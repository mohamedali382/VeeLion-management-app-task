import { NextResponse } from "next/server";
import { BackendApiError } from "@/lib/backendApi";

export function apiRouteErrorResponse(error: unknown, fallback: string) {
  if (error instanceof BackendApiError && error.statusCode >= 400 && error.statusCode < 500) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.statusCode }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { message: fallback } },
    { status: 502 }
  );
}
