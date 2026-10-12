import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProjectFile } from "@/lib/project-storage";
import { addAttachment } from "@/services/project-service";
import { useAuth } from "@/hooks/use-auth";

/**
 * Anexa um documento a uma fase ou missão ainda não concluída. O arquivo vai
 * para o Storage (bucket privado) e os metadados para o banco. A proteção do
 * que já foi concluído é garantida na função SQL `add_phase_attachment`.
 */
export function AttachmentUploader({
  projectId,
  phaseId,
  missionId,
  replaces,
  label = "Anexar documento",
  onUploaded,
}: {
  projectId: string;
  phaseId?: string | null;
  missionId?: string | null;
  replaces?: string | null;
  label?: string;
  onUploaded: () => void;
}) {
  const { account } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadProjectFile(
        file,
        account?.id ?? "local",
        projectId,
      );
      await addAttachment({
        project_id: projectId,
        file_name: file.name,
        storage_path: uploaded.storage_path,
        mime_type: uploaded.mime_type,
        size_bytes: uploaded.size_bytes,
        phase_id: phaseId ?? null,
        mission_id: missionId ?? null,
        label: note,
        replaces: replaces ?? null,
      });
      setNote("");
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Documento anexado.");
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao anexar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-[11px] uppercase tracking-[0.12em] text-faint">
          Rótulo (opcional)
        </Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: minuta, comprovante…"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={pick}
      >
        <Paperclip className="size-3.5" />
        {uploading ? "Enviando…" : label}
      </Button>
    </div>
  );
}
