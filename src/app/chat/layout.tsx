// app/chat/layout.tsx
import { Navbar } from "@/components/layout/navbar";
import { MainLayout } from "@/components/layout/main-layout";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <Navbar />
          <MainLayout>{children}</MainLayout>
        </div>
      </div>
    </SidebarProvider>
  );
}
