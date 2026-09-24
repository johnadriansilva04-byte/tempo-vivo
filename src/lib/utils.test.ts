import { describe, expect, it } from "vitest";
import { cn, plural } from "@/lib/utils";

describe("plural", () => {
  it("usa o singular para exatamente 1", () => {
    expect(plural(1, "Dia registrado", "Dias registrados")).toBe("Dia registrado");
  });

  it("usa o plural para 0 e para mais de 1", () => {
    expect(plural(0, "Marco preservado", "Marcos preservados")).toBe("Marcos preservados");
    expect(plural(3, "Marco preservado", "Marcos preservados")).toBe("Marcos preservados");
  });
});

describe("cn", () => {
  it("mescla classes condicionais", () => {
    const hidden = false;
    expect(cn("p-2", hidden && "hidden", "text-sm")).toBe("p-2 text-sm");
  });
});
