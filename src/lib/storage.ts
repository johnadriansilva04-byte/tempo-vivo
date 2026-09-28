import { requireSupabase } from "@/lib/supabase";
import { ApiError, mapUnknownError } from "@/lib/api-errors";

/**
 * Upload de avatar/banner para o bucket `avatars` (migration 3).
 * Se o bucket não estiver configurado cai no fallback data-URL local.
 * Retorna a URL pública (ou data-URL se offline).
 */
export async function uploadAvatar(
  file: File,
  prefix = "avatar",
): Promise<string> {
  if (file.size > 4 * 1024 * 1024)
    throw new ApiError("VALIDATION", "Imagem muito grande (máx. 4 MB).");
  if (!file.type.startsWith("image/"))
    throw new ApiError("VALIDATION", "Só imagens são aceitas.");
  try {
    const db = requireSupabase();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}.${ext}`;
    const { error } = await db.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = db.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    const mapped = mapUnknownError(e);
    if (
      mapped.code === "NOT_CONFIGURED" ||
      mapped.code === "NETWORK" ||
      mapped.code === "TIMEOUT"
    ) {
      // Fallback: data-URL — o app continua funcionando offline
      return await fileToDataUrl(file);
    }
    throw mapped;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new ApiError("UNKNOWN", "Falha ao ler imagem."));
    r.readAsDataURL(file);
  });
}
