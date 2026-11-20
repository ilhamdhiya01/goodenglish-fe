import { Suspense } from "react";

import { Scenario } from "@/components/features/scenario";

// ScenarioPage reads ?s and ?jawab, which needs a Suspense boundary.
const Page = () => (
  <Suspense>
    <Scenario.ScenarioPage />
  </Suspense>
);

export default Page;
