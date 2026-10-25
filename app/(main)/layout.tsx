import { Layout } from "@/components/shared/layout";

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <Layout.AppShell>{children}</Layout.AppShell>
);

export default MainLayout;
