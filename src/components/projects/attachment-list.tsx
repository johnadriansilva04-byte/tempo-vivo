import { useState } from "react";
import { FileText, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAttachmentUrl } from "@/lib/project-storage";
import type { ProjectAttachment } from "@/types/projects";

/**
 * Lista de anexos. Anexos que já integram um registro de conclusão ficam
 * marcados como protegidos e não podem ser removidos (a remoção real é barrada
 * no banco também).
 */
export function AttachmentList({
  attachments,
  frozen,
  onDelete,
  onReplace,
}: {
  attachments: ProjectAttachment[];
  frozen: boolean;
  onDelete?: (id: string) => void;
  onReplace?: (attachment: ProjectAttachment) => void;
}) {
  const [opening, setOpening] = useState<string | null>(null);

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
    );
  }

  const open = async (att: ProjectAttachment) => {
    setOpening(att.id);
    try {
      const url = await getAttachmentUrl(att.storage_path);
      if (!url) {
        toast.info(
          att.storage_path
            ? "Não foi possível abrir o arquivo agora."
            : "Este anexo não tem arquivo armazenado (modo local).",
        );
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpening(null);
    }
  };

  return (
    <ul className="space-y-2">
      {attachments.map((att) => {
        const protectedAtt = frozen || att.kind === "final";
        return (
          <li
            key={att.id}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
          >
            <FileText className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {att.file_name}
              </p>
              <p className="text-[11px] text-faint">
                {att.label ? `${att.label} · ` : ""}
                {protectedAtt ? "no registro protegido" : "planejado"}
                {att.replaces_attachment_id
                  ? " · substitui versão anterior"
                  : ""}
              </p>
            </div>
            {att.storage_path && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Abrir anexo"
                disabled={opening === att.id}
                onClick={() => void open(att)}
              >
                <Link2 className="size-3.5" />
              </Button>
            )}
            {!protectedAtt && onReplace && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onReplace(att)}
              >
                Substituir
              </Button>
            )}
            {!protectedAtt && onDelete && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remover anexo"
                onClick={() => onDelete(att.id)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
