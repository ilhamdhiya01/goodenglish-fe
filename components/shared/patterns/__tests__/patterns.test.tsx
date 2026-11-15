import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AnswerOption from "../answer-option";
import Correction from "../correction";
import ListItem from "../list-item";
import WordTile from "../word-tile";

// Status must be readable without color: screen readers hear the words.
describe("Correction", () => {
  it("names the wrong and the right line for screen readers", () => {
    render(
      <Correction
        wrong="I am agree with you."
        right="I agree with you."
        why="Agree sudah kata kerja."
      />,
    );
    expect(screen.getByText("I am agree with you.").textContent).toBe(
      "Salah: I am agree with you.",
    );
    expect(screen.getByText("I agree with you.").textContent).toBe(
      "Benar: I agree with you.",
    );
    expect(screen.getByText("Agree sudah kata kerja.")).toBeInTheDocument();
  });

  it("shows only the right line when there is no wrong one", () => {
    render(<Correction right="She went home." />);
    expect(screen.queryByText(/Salah:/)).toBeNull();
    expect(screen.getByText(/Benar:/)).toBeInTheDocument();
  });
});

describe("AnswerOption", () => {
  it("spells out the result after answering", () => {
    render(
      <>
        <AnswerOption letter="A" state="wrong">
          I didn&apos;t went there.
        </AnswerOption>
        <AnswerOption letter="B" state="correct" note="Setelah did selalu V1.">
          I didn&apos;t go there.
        </AnswerOption>
        <AnswerOption letter="C" state="dimmed">
          I not go there.
        </AnswerOption>
      </>,
    );
    expect(screen.getByRole("button", { name: /Pilihanmu/ })).toHaveTextContent(
      "I didn't went there.",
    );
    expect(screen.getByRole("button", { name: /Benar/ })).toHaveTextContent(
      "Setelah did selalu V1.",
    );
    expect(
      screen.getByRole("button", { name: /I not go/ }),
    ).not.toHaveTextContent(/Benar|Pilihanmu/);
  });

  it("hides the note before answering", () => {
    render(
      <AnswerOption letter="A" note="alasan">
        opsi
      </AnswerOption>,
    );
    expect(screen.queryByText("alasan")).toBeNull();
  });
});

describe("ListItem", () => {
  it("marks the active row with aria-current", () => {
    render(
      <>
        <ListItem active trailing="86/214">
          3 · Rutinitas pagi
        </ListItem>
        <ListItem href="/grammar/tense">Memilih tense</ListItem>
      </>,
    );
    expect(
      screen.getByRole("button", { name: /Rutinitas pagi/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("link", { name: "Memilih tense" }),
    ).not.toHaveAttribute("aria-current");
  });
});

describe("WordTile", () => {
  it("is a button with the word as its name", () => {
    render(<WordTile cross>sink</WordTile>);
    expect(screen.getByRole("button", { name: "sink" })).toBeInTheDocument();
  });
});
