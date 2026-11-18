import { Errors } from "@/components/features/errors";

// ?bagian=punyaku opens "Punyaku" (Buku kesalahanku).
const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ bagian?: string | string[] }>;
}) => {
  const { bagian } = await searchParams;
  return (
    <Errors.ErrorsPage initialMode={bagian === "punyaku" ? "mine" : "read"} />
  );
};

export default Page;
