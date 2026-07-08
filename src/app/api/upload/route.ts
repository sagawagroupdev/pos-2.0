import { uploadImage } from "@/lib/r2";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const prefix = (formData.get("prefix") as string) || "partnership";

  if (!file || !(file instanceof File) || file.size === 0) {
    return Response.json({ error: "File diperlukan" }, { status: 400 });
  }

  const ALLOWED_TYPES = ["image/webp", "image/png", "image/jpeg"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Format harus WebP, PNG, atau JPG" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ error: "Ukuran maksimal 2 MB" }, { status: 400 });
  }

  try {
    const url = await uploadImage(file, prefix);
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Gagal upload ke R2" }, { status: 500 });
  }
}
