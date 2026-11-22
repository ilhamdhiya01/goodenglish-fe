import { describe, expect, it } from "vitest";

import { CHEAT_SECTIONS } from "@/const/cheatsheet.constant";
import {
  categoryOf,
  ERROR_GROUP_CATEGORY,
  learnHref,
} from "@/const/mistake-categories.constant";

// "Lihat aturannya" opens the Cheat sheet section of a mistake's category,
// so that section has to be where the rule actually is.
const sectionText = (id: string) =>
  JSON.stringify(CHEAT_SECTIONS.find((s) => s.id === id) ?? null);

describe("mistake categories → Cheat sheet", () => {
  it("every category's Cheat sheet section exists", () => {
    for (const cat of Object.values(ERROR_GROUP_CATEGORY)) {
      const cheat = categoryOf(cat).cheat;
      if (cheat) expect(sectionText(cheat)).not.toBe("null");
    }
  });

  it("a forgotten -s for he/she/it leads to the section that teaches it", () => {
    const cat = ERROR_GROUP_CATEGORY["Lupa -s untuk he/she/it"];
    expect(learnHref(cat)).toBe("/cheatsheet#tense");
    expect(sectionText(categoryOf(cat).cheat!)).toContain("+s untuk he/she/it");
    // "Lima aturan dasar" doesn't cover it (the old, wrong target).
    expect(sectionText("aturan-dasar")).not.toContain("he/she/it");
  });
});
