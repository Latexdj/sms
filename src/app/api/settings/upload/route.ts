import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "HEADTEACHER", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, or SVG allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 2 MB limit." }, { status: 400 });
    }

    // Sanitise filename to prevent path traversal
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const safeName = `schools/${schoolId}/logo.${ext}`;

    const blob = await put(safeName, file, {
      access: "public",
      allowOverwrite: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    // Graceful degradation: if Blob token is missing, return a clear message
    if (err?.message?.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        { error: "File storage not configured. Set BLOB_READ_WRITE_TOKEN in environment variables." },
        { status: 503 }
      );
    }
    console.error("[UPLOAD_ERR]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
