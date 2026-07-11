import { NextResponse } from "next/server";

import { DocumentAuthorizationError } from "@/lib/authorization/documentAccess";
import { DocumentMembershipError } from "@/services/documentService";
import { DocumentVersionError } from "@/services/versionService";


export function documentErrorResponse(error: unknown): NextResponse {
  if (error instanceof DocumentAuthorizationError) {
    const status = error.reason === "not-a-member" ? 404 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (
    error instanceof DocumentMembershipError ||
    error instanceof DocumentVersionError
  ) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  throw error;
}
