import { Suspense } from "react";

import { Roleplay } from "@/components/features/roleplay";

// "Main peran" for one scenario. Unknown ids show a "not found" message.
// RoleplayPage reads ?mode, which needs a Suspense boundary.
const RoleplayRoute = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return (
    <Suspense>
      <Roleplay.RoleplayPage scenarioId={id} />
    </Suspense>
  );
};

export default RoleplayRoute;
