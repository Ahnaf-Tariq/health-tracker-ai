import { NextResponse } from "next/server";
import { deleteConversation, verifyFirebaseToken } from "../../../../server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  let user;
  try {
    user = await verifyFirebaseToken(request);
  } catch {
    return NextResponse.json(
      { error: "Chat sign-in verification is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to delete a conversation." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { conversationId } = await params;
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(conversationId)) {
    return NextResponse.json(
      { error: "This conversation ID is invalid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const deleted = await deleteConversation(user.uid, conversationId);
    if (!deleted) {
      return NextResponse.json(
        { error: "This conversation was already deleted or could not be found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The conversation could not be deleted. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
