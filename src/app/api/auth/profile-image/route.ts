import { ACCESS_TOKEN_COOKIE, AUTH_API_URL, BASE_API_URL } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function forward(req: Request, method: "PUT" | "DELETE") {
  const accessToken = getCookie(req, ACCESS_TOKEN_COOKIE);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (method === "DELETE") {
    const res = await fetch(`${AUTH_API_URL}/me/profile-image`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: res.status });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const profileImage = contentType.includes("multipart/form-data")
    ? await uploadProfileImageFile(req, accessToken)
    : await readProfileImageUrl(req);

  if (!profileImage.ok) {
    return NextResponse.json(
      { error: profileImage.error },
      { status: profileImage.status },
    );
  }

  const res = await fetch(`${AUTH_API_URL}/me/profile-image`, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileImage: profileImage.url }),
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? { profileImage: profileImage.url }, { status: res.status });
}

async function readProfileImageUrl(req: Request) {
  const json = await req.json().catch(() => null);
  const profileImage =
    typeof json?.profileImage === "string"
      ? json.profileImage.trim()
      : "";

  if (!profileImage) {
    return { ok: false as const, status: 400, error: "Missing profile image URL." };
  }

  return { ok: true as const, url: profileImage };
}

async function uploadProfileImageFile(req: Request, accessToken: string) {
  const formData = await req.formData();
  const file = formData.get("file") ?? formData.get("profileImage");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, status: 400, error: "Missing image file." };
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);

  const uploadRes = await fetch(`${BASE_API_URL}/media/upload`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: uploadForm,
  });

  const text = await uploadRes.text();
  if (!uploadRes.ok) {
    return {
      ok: false as const,
      status: uploadRes.status,
      error: text || `Image upload failed with HTTP ${uploadRes.status}.`,
    };
  }

  const url = extractUploadedUrl(text);
  if (!url) {
    return {
      ok: false as const,
      status: 502,
      error: "Image uploaded, but the upload API did not return a URL.",
    };
  }

  return { ok: true as const, url };
}

function extractUploadedUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const json = JSON.parse(trimmed);
    if (typeof json === "string") return json;
    if (json?.payload && typeof json.payload === "string") return json.payload;
    if (typeof json?.profileImage === "string") return json.profileImage;
    if (typeof json?.url === "string") return json.url;
  } catch {
    return trimmed;
  }

  return "";
}

export async function PUT(req: Request) {
  return forward(req, "PUT");
}

export async function DELETE(req: Request) {
  return forward(req, "DELETE");
}
