import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifyFirebaseToken } from "../../../../../server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await verifyFirebaseToken(request);
  } catch {
    return json({ error: "Profile photo uploads are temporarily unavailable." }, 503);
  }

  if (!user) {
    return json({ error: "Please sign in to upload a profile photo." }, 401);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: "Cloudinary is not configured on the server." }, 503);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const userKey = createHash("sha256").update(user.uid).digest("hex").slice(0, 32);
  const paramsToSign = {
    timestamp,
    folder: "healthtracker/avatars",
    public_id: userKey,
    overwrite: true,
  };

  try {
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );
    return json({
      cloudName,
      apiKey,
      ...paramsToSign,
      signature,
    });
  } catch {
    return json({ error: "A profile photo upload could not be authorized." }, 503);
  }
}
