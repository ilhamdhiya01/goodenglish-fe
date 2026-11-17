import { Reading } from "@/components/features/reading";

const ReadingTextPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return <Reading.ReadingView id={id} />;
};

export default ReadingTextPage;
