import { NextResponse } from "next/server";
import { getUserChatUsage, verifyFirebaseToken } from "../../../../server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logError(label: string, error: unknown) {
  const detail = error instanceof Error
    ? { name: error.name, message: error.message }
    : { message: String(error) };
  console.error(`[chat/usage] ${label}`, detail);
}

export async function GET(request: Request) {
  let firebaseUser;
  try {
    firebaseUser = await verifyFirebaseToken(request);
  } catch (error) {
    logError("Firebase Admin token verification failed.", error);
    return NextResponse.json(
      { error: "Chat sign-in verification is not configured yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!firebaseUser) {
    return NextResponse.json(
      { error: "Please sign in to check your chat allowance." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const usage = await getUserChatUsage(firebaseUser.uid);
    return NextResponse.json(
      {
        chats_left: usage.chatsLeft,
        restore_time: usage.restoreTime === null ? null : new Date(usage.restoreTime).toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    logError("Firestore allowance read failed.", error);
    return NextResponse.json(
      { error: "Your chat allowance could not be loaded. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
