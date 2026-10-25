import { Admin } from "@/components/features/admin";

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <Admin.AdminShell>{children}</Admin.AdminShell>
);

export default AdminLayout;
