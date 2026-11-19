import { Admin } from "@/components/features/admin";

const AdminReadingPage = () => (
  <div className="flex flex-col gap-6">
    <Admin.ReadingManager />
    <Admin.WordMeaningManager />
  </div>
);

export default AdminReadingPage;
