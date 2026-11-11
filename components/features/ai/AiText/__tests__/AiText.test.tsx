import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AiText, { keepTypos } from "../AiText";

// A real gemini-3.6-flash answer (Nov 2026): "* " bullets, nested items and
// *italic* examples next to **bold**.
const GEMINI = `Perbedaannya ada pada **waktu** dan **frekuensi**:

* **Sometime** = **Suatu saat / kapan-kapan** (waktu yang tidak spesifik).
  * *Contoh:* Let's drink coffee **sometime**. *(Ayo minum kopi kapan-kapan.)*
* **Sometimes** = **Kadang-kadang / terkadang**.`;

describe("AiText", () => {
  it("renders Gemini's markdown without leaking asterisks", () => {
    const { container } = render(<AiText text={GEMINI} />);

    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(container.querySelector("i")?.textContent).toBe("Contoh:");
    expect(
      Array.from(container.querySelectorAll("b")).map((b) => b.textContent),
    ).toContain("sometime");
    expect(container.textContent).not.toContain("*");
  });

  it("highlights the typo notice the AI puts first", () => {
    const { container } = render(
      <AiText
        text={
          "Ejaan: *somtimes* → **sometimes**\n\nSometimes artinya kadang-kadang."
        }
      />,
    );
    const notice = container.querySelector("p");
    expect(notice?.textContent).toBe("SALAH KETIKsomtimes → sometimes");
    expect(notice?.querySelector("i")?.textContent).toBe("somtimes");
    expect(notice?.querySelector("b")?.textContent).toBe("sometimes");
  });

  it("drops typos that are not in the question it answers", () => {
    // Seen with flash-lite: "make"/"cuman" came from an earlier message, and
    // "somewhere → somewhere" is no typo at all.
    const q =
      'Cek kalimatku dengan kata "separate": I have to seprate this line';
    expect(
      keepTypos(
        "Ejaan: *make* → **make/take**, *seprate* → **separate**, *somewhere* → **somewhere**",
        q,
      ),
    ).toBe("*seprate* → **separate**");
    expect(keepTypos("Ejaan: *somewhere* → **somewhere**", q)).toBeNull();
    expect(
      keepTypos("Ejaan: *make* → **make/take**", "kalo cuman make start gmn"),
    ).toBeNull();
  });

  it("hides the typo notice when nothing real is left", () => {
    const { container } = render(
      <AiText
        text={"Ejaan: *cuman* → **cuma**\n\nKalimatmu sudah benar!"}
        question="I have to separate this line"
      />,
    );
    expect(container.textContent).not.toContain("SALAH KETIK");
    expect(container.textContent).toContain("Kalimatmu sudah benar!");
  });

  it("never turns model output into markup", () => {
    const { container } = render(
      <AiText text={'<img src=x onerror="alert(1)"> hi'} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
