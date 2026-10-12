import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { ApiError, mapUnknownError } from "@/lib/api-errors";

/**
 * Anexos de projeto no Supabase Storage (bucket privado `project-attachments`).
 * O arquivo vive no Storage; o vínculo, a versão e o histórico vivem no banco.
 * Sem Supabase, só os metadados são guardados (modo local).
 */
export const PROJECT_BUCKET = "project-attachments";

export type UploadedFile = {
  storage_path: string;
  mime_type: string;
  size_bytes: number;
};

function safeName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 120) || "arquivo";
}

export async function uploadProjectFile(
  file: File,
  ownerId: string,
  projectId: string,
): Promise<UploadedFile> {
  if (file.size > 20 * 1024 * 1024) {
    throw new ApiError("VALIDATION", "Arquivo muito grande (máx. 20 MB).");
  }
  if (!isSupabaseConfigured) {
    // modo local: guarda apenas os metadados (sem Storage)
    return { storage_path: "", mime_type: file.type, size_bytes: file.size };
  }
  try {
    const db = requireSupabase();
    const path = `${ownerId}/${projectId}/${Date.now()}-${safeName(file.name)}`;
    const { error } = await db.storage
      .from(PROJECT_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return { storage_path: path, mime_type: file.type, size_bytes: file.size };
  } catch (e) {
    throw mapUnknownError(e);
  }
}

/** URL temporária (assinada) para abrir um anexo — o bucket é privado. */
export async function getAttachmentUrl(
  storagePath: string,
): Promise<string | null> {
  if (!storagePath || !isSupabaseConfigured) return null;
  try {
    const db = requireSupabase();
    const { data, error } = await db.storage
      .from(PROJECT_BUCKET)
      .createSignedUrl(storagePath, 60 * 10);
    if (error) throw error;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
