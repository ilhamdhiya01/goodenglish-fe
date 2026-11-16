import { test as base } from "@playwright/test";

import {
  installMockApi,
  type MockApi,
  type MockOptions,
  seedRandom,
  spyOnSpeech,
} from "./mock-api";

interface Fixtures {
  /** Per-test backend state; override with test.use({ mock: {...} }). */
  mock: MockOptions;
  api: MockApi;
}

export const test = base.extend<Fixtures>({
  mock: [{}, { option: true }],
  api: [
    async ({ context, page, baseURL, mock }, use) => {
      await seedRandom(page);
      await spyOnSpeech(page);
      await use(await installMockApi(context, baseURL!, mock));
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
