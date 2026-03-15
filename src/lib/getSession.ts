import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Returns the current session. If no session exists, returns a 401 response.
 * Usage:
 *   const { session, response } = await requireSession();
 *   if (response) return response;
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null };
}

/**
 * Resolves the Patient record that belongs to the currently authenticated user.
 * Returns null when no patient is associated with the session user.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
