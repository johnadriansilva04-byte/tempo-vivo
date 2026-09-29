import { describe, expect, it, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Fluxo público de agendamento (modo local).
//
// O visitante abre o link /u/:slug, vê apenas os horários abertos para reunião e
// envia um pedido. Nada da rotina privada do dono (compromissos, folgas) pode
// aparecer. Este teste cobre o caminho completo: perfil público → horários
// livres → pedido pendente.
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  enableRealtime: () => {},
  checkSupabaseHealth: async () => ({ ok: true }),
}));

const STORAGE_KEY = "perfil-vivo:db:v4";

function seedDb(overrides: Record<string, unknown> = {}) {
  const db = {
    version: 4,
    profile: {
      id: "local-profile",
      name: "Teste Vivo",
      role: "Fotógrafo",
      location: "São Paulo",
      presentation: "",
      initials: "TV",
      birth_date: "",
      avatar_url: null,
      cover_url: null,
      slug: "teste-vivo",
      phone: "11999990000",
      is_public: true,
      show_schedule: true,
      meetings_enabled: true,
      meeting_duration_min: 30,
      meeting_buffer_min: 15,
      meeting_max_per_day: 2,
      meeting_requires_approval: true,
      meeting_requirements: "",
    },
    recurring_commitments: [],
    commitment_exceptions: [],
    one_off_events: [],
    availability_rules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      is_available: true,
      start_time: "08:00",
      end_time: "20:00",
    })),
    meeting_requests: [],
    ...overrides,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
});

describe("fluxo público de agendamento", () => {
  it("mostra os horários livres do perfil público", async () => {
    seedDb();
    const service = await import("@/services/profile-service");

    const bundle = await service.getPublicProfileBySlug("teste-vivo");
    expect(bundle?.profile.slug).toBe("teste-vivo");

    const days = await service.getUpcomingMeetingSlots(7);
    const comHorario = days.filter((d) => d.slices.length > 0);
    expect(comHorario.length).toBeGreaterThan(0);
    // A agenda abre das 08h às 20h com reuniões de 30 min + 15 de intervalo:
    // 2 por dia (meeting_max_per_day), nunca além do limite.
    for (const dia of comHorario) {
      expect(dia.slices.length).toBeLessThanOrEqual(2);
      expect(dia.slices.length).toBeGreaterThan(0);
    }
  });

  it("aceita um pedido num horário livre e o deixa pendente", async () => {
    seedDb();
    const service = await import("@/services/profile-service");

    const days = await service.getUpcomingMeetingSlots(7);
    const dia = days.find((d) => d.slices.length > 0);
    expect(dia).toBeDefined();
    const slot = dia!.slices[0]!;

    await service.createMeetingRequest({
      event_date: dia!.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      requester_name: "Visitante",
      requester_contact: "visitante@exemplo.com",
      reason: "Quero conversar sobre um projeto.",
    });

    const pedidos = await service.getMeetingRequests();
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.status).toBe("PENDING");
    expect(pedidos[0]?.requester_name).toBe("Visitante");
  });

  it("recusa um pedido fora de qualquer horário livre", async () => {
    seedDb();
    const service = await import("@/services/profile-service");

    await expect(
      service.createMeetingRequest({
        event_date: "2030-01-01",
        start_time: "03:00",
        end_time: "04:00",
        requester_name: "Visitante",
        requester_contact: "x@y.com",
        reason: "madrugada",
      }),
    ).rejects.toThrow(/horário|ocupado|livre/i);
  });

  it("não expõe a rotina privada no bundle público", async () => {
    seedDb({
      recurring_commitments: [
        {
          id: "c1",
          title: "Segredo interno",
          category: "Trabalho",
          weekday: 1,
          start_time: "09:00",
          end_time: "10:00",
          is_active: true,
        },
      ],
    });
    const service = await import("@/services/profile-service");

    const bundle = await service.getPublicProfileBySlug("teste-vivo");
    expect(JSON.stringify(bundle)).not.toContain("Segredo interno");
  });

  it("aperfeiçoa: slug errado ou perfil privado não vaza nada", async () => {
    seedDb();
    const service = await import("@/services/profile-service");

    expect(await service.getPublicProfileBySlug("nao-existe")).toBeNull();

    seedDb({
      profile: {
        id: "local-profile",
        name: "Teste Vivo",
        role: "",
        location: "",
        presentation: "",
        initials: "TV",
        birth_date: "",
        avatar_url: null,
        cover_url: null,
        slug: "teste-vivo",
        phone: "",
        is_public: false,
        show_schedule: true,
        meetings_enabled: true,
        meeting_duration_min: 30,
        meeting_buffer_min: 15,
        meeting_max_per_day: 2,
        meeting_requires_approval: true,
        meeting_requirements: "",
      },
    });
    expect(await service.getPublicProfileBySlug("teste-vivo")).toBeNull();
  });
});
