import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Video, CreditCard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarMenuContent } from "@/components/ui/sidebar-content";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="bg-background flex h-screen w-full">
        <AppSidebar />

        {/* Main content */}
        <div className="flex w-full flex-1 flex-col overflow-y-auto">
          <header className="border-border bg-sidebar sticky top-0 z-50 h-16 w-full border-b">
            <div className="flex w-full items-center justify-between p-4">
              <SidebarTrigger />
              <div className="flex items-center space-x-4">
                <div className="bg-accent/50 flex flex-row items-center rounded-full px-3 py-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span className="font-medium">100 Credits</span>
                </div>
              </div>
            </div>
          </header>

          <main className="relative w-full flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

async function AppSidebar() {
  const user = await currentUser();
  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 flex-row items-center border-b px-6">
        <Video className="text-primary h-6 w-6" />
        <span className="text-foreground ml-2 font-medium">
          Video Venture AI
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenuContent />
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center space-x-2">
          <UserButton />
          <div className="text-sm">
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
