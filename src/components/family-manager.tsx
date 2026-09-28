import { useState } from "react";
import {
  ArrowRight,
  HeartHandshake,
  Link2,
  MailQuestion,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { Metric, PageHeader, Section } from "@/components/page-kit";
import {
  useAddFamilyMember,
  useFamilyMembers,
  useRemoveFamilyMember,
  useUpdateFamilyMember,
} from "@/hooks/use-family";
import { FAMILY_RELATIONS, FAMILY_RELATION_LABELS } from "@/lib/validators";
import { formatPhone, normalizePhone } from "@/lib/schedule";
import type { FamilyMember, ProfilePrivacy } from "@/types/profile";

const PRIVACY_META: Record<
  ProfilePrivacy,
  { label: string; className: string; hint: string }
> = {
  PUBLIC: {
    label: "Público",
    className: "status-open",
    hint: "Aparece no seu link público (nome e relação).",
  },
  FAMILY: {
    label: "Família",
    className: "status-review",
    hint: "Visível apenas para familiares conectados ao seu perfil.",
  },
  PRIVATE: {
    label: "Privado",
    className: "status-archive",
    hint: "Só você vê esta relação.",
  },
};

const STATUS_META: Record<
  FamilyMember["invite_status"],
  { label: string; className: string }
> = {
  LINKED: { label: "Conta vinculada", className: "status-open" },
  PENDING: { label: "Convite pendente", className: "status-review" },
  DECLINED: { label: "Recusado", className: "status-archive" },
  REMOVED: { label: "Removido", className: "status-archive" },
};

const emptyDraft = {
  display_name: "",
  phone: "",
  relation: "outro" as FamilyMember["relation"],
  privacy: "FAMILY" as ProfilePrivacy,
  note: "",
};

/**
 * Família — continuidade digital: adição por número de celular (descoberta de
 * conta via ID único ou convite confirmável), graus de relação e privacidade
 * em camadas. Nada aqui expõe dados de terceiros automaticamente.
 */
export function FamilyManager() {
  const { members, isLoading } = useFamilyMembers();
  const add = useAddFamilyMember();
  const update = useUpdateFamilyMember();
  const remove = useRemoveFamilyMember();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const submit = () => {
    if (!draft.display_name.trim()) return;
    const phone = normalizePhone(draft.phone);
    if (phone.length < 10) {
      toast.error("Informe o celular com DDD — ex.: +55 11 99999-9999.");
      return;
    }
    add.mutate(
      {
        display_name: draft.display_name.trim(),
        phone: draft.phone.trim(),
        relation: draft.relation,
        privacy: draft.privacy,
        note: draft.note.trim(),
      },
      {
        onSuccess: ({ linked }) => {
          if (linked) {
            toast.success(
              "Conta encontrada — relação familiar vinculada pelo ID único.",
            );
          } else {
            toast.success(
              "Número ainda sem conta: convite registrado. A relação será confirmada quando a pessoa entrar com este número.",
            );
          }
          setDraft(emptyDraft);
          setOpen(false);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao adicionar."),
      },
    );
  };

  const linked = members.filter((m) => m.invite_status === "LINKED").length;
  const pending = members.filter((m) => m.invite_status === "PENDING").length;

  return (
    <>
      <PageHeader
        eyebrow="Continuidade digital"
        title="Família"
        description="Pessoa → família → gerações → memória → legado. Adicione familiares pelo número de celular: se já possui conta, a relação se vincula ao ID único; se não, o convite espera a confirmação."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? (
              "Fechar"
            ) : (
              <>
                <UserPlus className="size-3.5" /> Adicionar familiar
              </>
            )}
          </Button>
        }
      />

      {open && (
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Nome
              </Label>
              <Input
                value={draft.display_name}
                onChange={(e) =>
                  setDraft({ ...draft, display_name: e.target.value })
                }
                placeholder="Como você chama essa pessoa"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Número de celular
              </Label>
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+55 (11) 99999-9999"
                inputMode="tel"
              />
              <p className="text-[11px] text-faint">
                O número é usado apenas para descobrir/convitar a conta — nunca
                criamos conta por você.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Grau de relação
              </Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.relation}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    relation: e.target.value as FamilyMember["relation"],
                  })
                }
              >
                {FAMILY_RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {FAMILY_RELATION_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Privacidade desta relação
              </Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.privacy}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    privacy: e.target.value as ProfilePrivacy,
                  })
                }
              >
                <option value="PUBLIC">Público — aparece no link</option>
                <option value="FAMILY">Família — só entre conectados</option>
                <option value="PRIVATE">Privado — só eu</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Contexto (opcional)
              </Label>
              <Textarea
                rows={2}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Ex.: me acompanhou desde a mudança para SP em 2019"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="mt-3"
            disabled={!draft.display_name.trim() || add.isPending}
            onClick={submit}
          >
            {add.isPending ? "Verificando número…" : "Adicionar à família"}
          </Button>
        </div>
      )}

      <Section
        title="Estrutura familiar"
        detail={`${members.length} ${members.length === 1 ? "relação" : "relações"} · ${linked} vinculada(s) · ${pending} convite(s) pendente(s)`}
      >
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-lg border border-border bg-card" />
        ) : members.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="size-5" />}
            title="Sua estrutura familiar começa aqui"
            description="Adicione pelo celular. Se a pessoa já usa o Perfil Vivo, a relação se conecta pelos IDs; se não, um convite fica aguardando a confirmação dela."
            actionLabel="Adicionar familiar"
            onAction={() => setOpen(true)}
          />
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {m.display_name}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPhone(m.phone)} ·{" "}
                    <span className="first-letter:uppercase">
                      {FAMILY_RELATION_LABELS[m.relation]}
                    </span>
                  </p>
                  {m.note && (
                    <p className="mt-1 text-xs leading-5 text-faint">
                      {m.note}
                    </p>
                  )}
                </div>
                <span
                  className={`status ${STATUS_META[m.invite_status].className}`}
                >
                  {m.invite_status === "PENDING" && (
                    <MailQuestion className="size-3" />
                  )}
                  {m.invite_status === "LINKED" && <Link2 className="size-3" />}
                  {STATUS_META[m.invite_status].label}
                </span>
                <select
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  value={m.privacy}
                  title={PRIVACY_META[m.privacy].hint}
                  onChange={(e) =>
                    update.mutate(
                      {
                        id: m.id,
                        patch: { privacy: e.target.value as ProfilePrivacy },
                      },
                      {
                        onSuccess: () =>
                          toast.success("Privacidade atualizada."),
                        onError: (e) =>
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Falha ao atualizar.",
                          ),
                      },
                    )
                  }
                >
                  <option value="PUBLIC">Público</option>
                  <option value="FAMILY">Família</option>
                  <option value="PRIVATE">Privado</option>
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Remover ${m.display_name} da sua família?`,
                      )
                    )
                      return;
                    remove.mutate(m.id, {
                      onSuccess: () => toast.success("Relação removida."),
                      onError: (e) =>
                        toast.error(
                          e instanceof Error ? e.message : "Falha ao remover.",
                        ),
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs leading-5 text-faint">
          Uma relação familiar nunca torna os dados de outra pessoa públicos:
          cada um é dono do próprio perfil e decide as camadas PÚBLICO / FAMÍLIA
          / PRIVADO.
        </p>
      </Section>

      <Section
        title="Continuidade e legado"
        detail="Por que isto existe — a família como estrutura que atravessa o tempo"
        className="mt-10"
      >
        <div className="grid gap-4 sm:grid-cols-5">
          {["Pessoa", "Família", "Gerações", "Memória", "Legado"].map(
            (step, i) => (
              <div
                key={step}
                className="quiet-panel flex items-center gap-3 !py-3 sm:block"
              >
                <span className="goal-number">0{i + 1}</span>
                <p className="text-sm font-semibold sm:mt-2">{step}</p>
              </div>
            ),
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Metric value={String(members.length)} label="Relações registradas" />
          <Metric value={String(pending)} label="Convites aguardando" />
          <Metric value={String(linked)} label="Contas vinculadas" />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          O legado não é promessa de eternidade: é mecanismo real — exportação
          de dados em JSON, backups, portabilidade e privacidade por camadas,
          todos em{" "}
          <a
            href="/configuracoes"
            className="font-medium text-primary underline underline-offset-2"
          >
            Configurações
          </a>
          . <ArrowRight className="inline size-3.5 align-[-2px]" />
        </p>
      </Section>
    </>
  );
}
