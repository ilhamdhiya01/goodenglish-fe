import { describe, expect, it } from "vitest";

import { lockScroll } from "../scroll-lock.helper";

describe("lockScroll", () => {
  it("unlocks only after the last lock, whatever the order", () => {
    document.body.style.overflow = "";
    const test = lockScroll(); // the full-screen test
    const dialog = lockScroll(); // "Keluar dari tes?" on top
    expect(document.body.style.overflow).toBe("hidden");
    test(); // the test closes first…
    expect(document.body.style.overflow).toBe("hidden");
    dialog(); // …then the dialog: the page scrolls again
    expect(document.body.style.overflow).toBe("");
  });

  it("ignores a second release of the same lock", () => {
    const a = lockScroll();
    const b = lockScroll();
    a();
    a();
    expect(document.body.style.overflow).toBe("hidden");
    b();
    expect(document.body.style.overflow).toBe("");
  });
});
