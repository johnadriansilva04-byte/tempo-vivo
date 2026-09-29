// ---------------------------------------------------------------------------
// Aviso sonoro de novo pedido de reunião.
//
// Quando alguém pede uma reunião pelo link público, o dono precisa PERCEBER —
// o app pode estar aberto em outra aba. Toca um bipe curto via Web Audio (sem
// arquivo de áudio para baixar) e dispara um toast. O navegador exige um gesto
// do usuário antes de liberar o áudio; por isso o contexto é criado e o
// "desbloqueio" acontece no primeiro clique/toque e fica ativo dali em diante.
// ---------------------------------------------------------------------------

const SOUND_KEY = "perfil-vivo:notify-sound";
const PRIMED_KEY = "perfil-vivo:notify-primed";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor =
    window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/** Lê se o dono quer som. Ativado por padrão — o pedido precisa ser notado. */
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // storage indisponível — mantém em memória durante a sessão
  }
}

/**
 * Cria/retoma o contexto dentro de um gesto do usuário. Idempotente: pode ser
 * chamado em todo clique sem custo perceptível.
 */
export function primeNotificationSound(): void {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  if (!soundEnabled()) return;
  // Bipe quase inaudível só para destravar o áudio no navegador.
  try {
    window.localStorage.setItem(PRIMED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Toca o alerta: duas notas curtas (um "tilim" de campainha). Falha em silêncio
 * se o navegador ainda não liberou o áudio — o toast continua aparecendo.
 */
export function playMeetingAlert(): void {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  // Ataque rápido e queda suave: som presente, sem assustar.
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

  const notes = [
    { freq: 880, start: 0, dur: 0.18 },
    { freq: 1318.5, start: 0.2, dur: 0.32 },
  ] as const;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    gain.gain.value = 1;
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.dur);
  }

  // Libera os nós depois que o som termina.
  window.setTimeout(() => {
    try {
      master.disconnect();
    } catch {
      /* ignore */
    }
  }, 1200);
}
