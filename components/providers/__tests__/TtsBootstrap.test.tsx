import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadKokoro = vi.fn(() => Promise.resolve());
const modelCached = vi.fn(() => Promise.resolve(false));
vi.mock("@/lib/tts/kokoro", () => ({
  loadKokoro,
  modelCached,
  loadingDevice: () => "wasm",
}));

const { useTtsStore } = await import("@/stores/useTtsStore");
const { default: TtsBootstrap } = await import("../TtsBootstrap");

beforeEach(() => {
  loadKokoro.mockClear();
  modelCached.mockReset();
  modelCached.mockResolvedValue(false);
  useTtsStore.setState({ status: "idle", progress: 0 });
});

const flush = () => act(() => Promise.resolve());

describe("TtsBootstrap", () => {
  it("starts the download after login and shows it the whole time", async () => {
    render(<TtsBootstrap />);
    expect(loadKokoro).toHaveBeenCalledTimes(1);
    act(() => useTtsStore.setState({ status: "loading", progress: 0 }));
    await flush();
    act(() => useTtsStore.setState({ progress: 42 }));
    expect(screen.getByText(/Mengunduh suara AI…/).textContent).toContain(
      "42%",
    );
    expect(
      screen.getByRole("progressbar", { name: "Unduhan suara AI" }),
    ).toBeTruthy();
    expect(modelCached).toHaveBeenCalledWith("wasm");
    act(() => useTtsStore.setState({ status: "ready", progress: 100 }));
    expect(screen.getByText("Suara AI siap dipakai.")).toBeTruthy();
  });

  it("stays quiet when the model is already in the browser's cache", async () => {
    modelCached.mockResolvedValue(true);
    render(<TtsBootstrap />);
    act(() => useTtsStore.setState({ status: "loading", progress: 0 }));
    await flush();
    expect(screen.queryByText(/Mengunduh suara AI/)).toBeNull();
    act(() => useTtsStore.setState({ status: "ready", progress: 100 }));
    expect(screen.queryByText("Suara AI siap dipakai.")).toBeNull();
  });

  it("offers a retry when the download fails", () => {
    render(<TtsBootstrap />);
    act(() => useTtsStore.setState({ status: "error" }));
    act(() => screen.getByRole("button", { name: "Coba lagi" }).click());
    expect(loadKokoro).toHaveBeenCalledTimes(2);
  });
});
