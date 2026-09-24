import {
  createCareerChapter,
  createMilestone,
  createWeeklyFocus,
  setLifePrologue,
  updateProfile,
  upsertDailyLog,
  upsertProject,
} from "@/services/profile-service";
import { buildStarterLife, EMPTY_ANSWERS } from "@/lib/life-story";
import type { StoryAnswers, StoryPreset } from "@/lib/life-story";
import { completeOnboarding, currentAccount } from "@/store/auth-store";
import type { Account } from "@/types/auth";

// ---------------------------------------------------------------------------
// Fluxo de primeira entrada: monta a vida inicial de quem acabou de criar conta.
// Toda a escrita passa pelo `profile-service`, então funciona igual com Supabase
// configurado (tabelas SQL, isoladas por RLS) ou sem credenciais (local por conta).
// ---------------------------------------------------------------------------

export async function startLifeForAccount(
  account: Account,
  preset: StoryPreset,
  answers: StoryAnswers = EMPTY_ANSWERS,
): Promise<void> {
  const life = buildStarterLife(account, preset, answers);

  await updateProfile(life.profile);

  if (life.prologue.trim() !== "") await setLifePrologue(life.prologue);

  await upsertDailyLog(life.dailyLog);

  for (const focus of life.focus) {
    await createWeeklyFocus({
      title: focus.title,
      description: focus.description,
      week_number: focus.week_number,
      year: focus.year,
    });
  }
  for (const chapter of life.chapters) {
    const { id: _id, ...input } = chapter;
    await createCareerChapter(input);
  }
  for (const milestone of life.milestones) await createMilestone(milestone);
  for (const project of life.projects) await upsertProject(project);
}

/** Executa o onboarding do usuário logado e marca a conta como iniciada. */
export async function completeFirstRun(
  preset: StoryPreset,
  answers: StoryAnswers = EMPTY_ANSWERS,
): Promise<void> {
  const account = currentAccount();
  if (!account) throw new Error("Nenhuma conta logada para iniciar a história.");
  await startLifeForAccount(account, preset, answers);
  await completeOnboarding();
}
