import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/use-profile";

export type LifetimeStats = {
  hasBirthDate: boolean;
  age: number;
  ageDecimal: number;
  target: number;
  cycleIndex: number; // 0..3
  cycleLabel: string;
  cycleName: string;
  pctConsumed: number; // 0..100
  daysLived: number;
  yearsRemaining: number;
  daysRemaining: number;
  isRecordBreaker: boolean;
  isFinalCycle: boolean;
};

const CYCLE_NAMES = [
  "Aprendizado & Base",
  "Construção & Legado",
  "Consolidação & Mentoria",
  "Plenitude & Sabedoria",
];

export function computeLifetime(
  birthDate: string,
  target: number,
  now: Date = new Date(),
): LifetimeStats {
  const birth = new Date(`${birthDate}T00:00:00`);
  const valid =
    birthDate !== "" && !Number.isNaN(birth.getTime()) && birth.getTime() <= now.getTime();
  if (!valid) {
    return {
      hasBirthDate: false,
      age: 0,
      ageDecimal: 0,
      target,
      cycleIndex: 0,
      cycleLabel: "—",
      cycleName: "Defina sua data",
      pctConsumed: 0,
      daysLived: 0,
      yearsRemaining: target,
      daysRemaining: Math.round(target * 365.2425),
      isRecordBreaker: false,
      isFinalCycle: false,
    };
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLived = Math.floor((now.getTime() - birth.getTime()) / msPerDay);
  const ageDecimal = daysLived / 365.2425;
  const age = Math.floor(ageDecimal);
  const targetDays = Math.round(target * 365.2425);
  const pct = Math.min(100, (daysLived / targetDays) * 100);
  const cycleIndex = Math.min(Math.floor(age / 25), 3);

  return {
    hasBirthDate: true,
    age,
    ageDecimal,
    target,
    cycleIndex,
    cycleLabel: `${cycleIndex * 25}–${(cycleIndex + 1) * 25}`,
    cycleName: CYCLE_NAMES[cycleIndex] ?? "",
    pctConsumed: pct,
    daysLived,
    yearsRemaining: Math.max(0, target - ageDecimal),
    daysRemaining: Math.max(0, targetDays - daysLived),
    isRecordBreaker: age >= target,
    isFinalCycle: cycleIndex === 3,
  };
}

/** Cronômetro vivo: recalcula a cada minuto (o tempo passa enquanto a página está aberta). */
export function useLifetime() {
  const { profile } = useProfile();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return computeLifetime(profile?.birth_date ?? "", profile?.target_lifespan ?? 100, now);
}
