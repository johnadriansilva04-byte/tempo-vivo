import { useState } from "react";
import { Award, BriefcaseBusiness, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageSkeleton } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useCareerChapters, useCreateCareerChapter } from "@/hooks/use-career-chapters";
import { Field } from "@/components/pages/shared";
import { TimelineSection } from "@/components/pages/shared";

// ---------------------------------------------------------------- Currículo Vivo

export function ResumePage() {
  const { chapters, isLoading } = useCareerChapters();
  const create = useCreateCareerChapter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    period: "",
    document_type: "EXPERIENCE",
    content: "",
  });

  const byType = (t: string) => chapters.filter((c) => c.document_type === t);
  const experiences = byType("EXPERIENCE");
  const education = byType("EDUCATION");
  const productions = byType("PRODUCTION");
  const certificates = byType("CERTIFICATE");
  // Tipos que o dono criar sem se encaixar nas seções acima não somem da página.
  const otherTypes = chapters.filter(
    (c) =>
      !["EXPERIENCE", "EDUCATION", "PRODUCTION", "CERTIFICATE", "PROLOGUE"].includes(
        c.document_type,
      ),
  );

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft as Parameters<typeof create.mutate>[0], {
      onSuccess: () => {
        setDraft({ title: "", period: "", document_type: "EXPERIENCE", content: "" });
        setOpen(false);
      },
    });
  };

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Trajetória profissional"
        title="Currículo vivo"
        mark="II"
        description="Formação e experiências apresentadas como partes de uma história humana, prontas para compartilhar."
        lede="Currículo não é lista de cargos: é a prova de que algo em você mudou a cada etapa."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Adicionar capítulo"}
          </Button>
        }
      />

      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Cargo, formação ou produção"
              />
            </Field>
            <Field label="Período">
              <Input
                value={draft.period}
                onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                placeholder="Ex.: 2022 — hoje"
              />
            </Field>
            <Field label="Tipo">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.document_type}
                onChange={(e) => setDraft({ ...draft, document_type: e.target.value })}
              >
                <option value="EXPERIENCE">Experiência</option>
                <option value="EDUCATION">Formação</option>
                <option value="PRODUCTION">Produção</option>
                <option value="CERTIFICATE">Certificado</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Conteúdo">
                <Textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="Breve descrição"
                  rows={2}
                />
              </Field>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={submit}
            disabled={!draft.title.trim() || create.isPending}
          >
            Salvar capítulo
          </Button>
        </div>
      )}

      {chapters.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="size-5" />}
          title="Seu currículo vivo está vazio"
          description="Adicione experiências, formações e produções acima. Tudo fica salvo e aparece aqui — nada é inventado."
          actionLabel="Adicionar o primeiro capítulo"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="reveal grid gap-9 lg:grid-cols-[1fr_280px]">
          <div className="space-y-9">
            {experiences.length > 0 && (
              <TimelineSection
                icon={BriefcaseBusiness}
                title="Experiência"
                rows={experiences.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {education.length > 0 && (
              <TimelineSection
                icon={GraduationCap}
                title="Formação"
                rows={education.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {productions.length > 0 && (
              <TimelineSection
                icon={Sparkles}
                title="Produção"
                rows={productions.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {certificates.length > 0 && (
              <TimelineSection
                icon={Award}
                title="Certificados"
                rows={certificates.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {otherTypes.length > 0 && (
              <TimelineSection
                icon={BriefcaseBusiness}
                title="Outros registros"
                rows={otherTypes.map((c) => [c.period, c.title, c.content])}
              />
            )}
          </div>
          <aside className="space-y-7">
            {chapters.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Preencha seu histórico para montar sua página.
              </p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
