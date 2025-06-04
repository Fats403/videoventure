"use client";

import Link from "next/link";
import {
  Home,
  Settings,
  PlayCircle,
  FolderPlus,
  CreditCard,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function SidebarMenuItemWithClose({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={href} onClick={handleClick}>
          <Icon className="h-4 w-4" />
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarMenuContent() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItemWithClose href="/dashboard" icon={Home}>
              Dashboard
            </SidebarMenuItemWithClose>

            <SidebarMenuItemWithClose
              href="/dashboard/create"
              icon={FolderPlus}
            >
              Create Video
            </SidebarMenuItemWithClose>

            <SidebarMenuItemWithClose
              href="/dashboard/library"
              icon={PlayCircle}
            >
              My Videos
            </SidebarMenuItemWithClose>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Preferences</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItemWithClose
              href="/dashboard/billing"
              icon={CreditCard}
            >
              Billing
            </SidebarMenuItemWithClose>

            <SidebarMenuItemWithClose
              href="/dashboard/settings"
              icon={Settings}
            >
              Settings
            </SidebarMenuItemWithClose>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
