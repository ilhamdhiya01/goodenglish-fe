import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AiText from "../AiText";

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

  it("never turns model output into markup", () => {
    const { container } = render(
      <AiText text={'<img src=x onerror="alert(1)"> hi'} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
