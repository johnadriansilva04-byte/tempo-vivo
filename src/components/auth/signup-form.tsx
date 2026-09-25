import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessBlock, IdentityBlock, RecoveryBlock } from "@/components/auth/signup-blocks";
import { ENTRY_COPY, type SignupBlockId } from "@/components/auth/copy";
import type { SignupDraftState } from "@/components/auth/use-signup-draft";

// ---------------------------------------------------------------------------
// Criar conta: três blocos, na ordem em que a história precisa deles.
// A tela só apresenta; quem guarda o rascunho é `useSignupDraft`.
// ---------------------------------------------------------------------------

export function SignUpForm({
  draft,
  pending,
  onSubmit,
}: {
  draft: SignupDraftState;
  pending: boolean;
  onSubmit: () => void;
}) {
  const admit = (id: SignupBlockId) => () => draft.setOpenBlock(id);

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {ENTRY_COPY.signup.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{ENTRY_COPY.signup.subtitle}</p>

      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <IdentityBlock
          draft={draft}
          open={draft.openBlock === "identity"}
          onOpenChange={(v) => draft.setOpenBlock(v ? "identity" : "")}
          onAdvance={admit("access")}
        />
        <AccessBlock
          draft={draft}
          open={draft.openBlock === "access"}
          onOpenChange={(v) => draft.setOpenBlock(v ? "access" : "")}
          onAdvance={admit("recovery")}
        />
        <RecoveryBlock
          draft={draft}
          open={draft.openBlock === "recovery"}
          onOpenChange={(v) => draft.setOpenBlock(v ? "recovery" : "")}
          onAdvance={() => undefined}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {ENTRY_COPY.signup.submit}
        </Button>
      </form>
    </>
  );
}
