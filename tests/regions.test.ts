import { describe, expect, it } from "vitest";
import { accountCluster, findPlatform, parseRiotId, parseRiotIdSlug, riotIdSlug } from "@/lib/regions";

describe("Riot ID parsing", () => {
  it("splits Nome#TAG on the last #", () => {
    expect(parseRiotId("ego illusions#ego")).toEqual({ name: "ego illusions", tag: "ego" });
    expect(parseRiotId(" Jogador # BR1 ")).toEqual({ name: "Jogador", tag: "BR1" });
  });

  it("rejects input without a name or tag", () => {
    expect(parseRiotId("semtag")).toBeNull();
    expect(parseRiotId("#tag")).toBeNull();
    expect(parseRiotId("nome#")).toBeNull();
  });

  it("round-trips through the URL slug, even with hyphens in the name", () => {
    const slug = riotIdSlug("meu-nick legal", "BR1");
    expect(parseRiotIdSlug(slug)).toEqual({ name: "meu-nick legal", tag: "BR1" });
  });
});

describe("platform routing", () => {
  it("finds platforms case-insensitively", () => {
    expect(findPlatform("BR1")?.cluster).toBe("americas");
    expect(findPlatform("xx")).toBeUndefined();
  });

  it("sends SEA account lookups to asia", () => {
    expect(accountCluster(findPlatform("oc1")!)).toBe("asia");
    expect(accountCluster(findPlatform("euw1")!)).toBe("europe");
  });
});
