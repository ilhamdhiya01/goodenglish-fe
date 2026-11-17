import { Roleplay } from "@/components/features/roleplay";

// "Main peran" for one scenario. Unknown ids show a "not found" message.
const RoleplayRoute = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return <Roleplay.RoleplayPage scenarioId={id} />;
};

export default RoleplayRoute;
