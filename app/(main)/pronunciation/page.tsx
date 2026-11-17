import { Pronunciation } from "@/components/features/pronunciation";

// ?bagian=<section id> opens that section (e.g. from Menyimak › Bunyi mirip).
const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ bagian?: string | string[] }>;
}) => {
  const { bagian } = await searchParams;
  return (
    <Pronunciation.PronPage
      initialSection={typeof bagian === "string" ? bagian : undefined}
    />
  );
};

export default Page;
