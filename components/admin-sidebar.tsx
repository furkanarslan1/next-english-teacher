"use client";

import * as React from "react";
import {
  BookOpenIcon,
  FolderIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SquareStackIcon,
  ClipboardListIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { logoutAction } from "@/app/actions/auth";

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Seviyeler",
    url: "/admin/levels",
    icon: FolderIcon,
  },
  {
    title: "Kategoriler",
    url: "/admin/categories",
    icon: BookOpenIcon,
  },
  {
    title: "Kelime Kartları",
    url: "/admin/word-cards",
    icon: SquareStackIcon,
  },
  {
    title: "Testler",
    url: "/admin/quizzes",
    icon: ClipboardListIcon,
  },

];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpenIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">English Teacher</span>
                  <span className="text-xs text-muted-foreground">Admin Paneli</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logoutAction}>
              <SidebarMenuButton asChild>
                <button type="submit" className="w-full">
                  <LogOutIcon />
                  <span>Çıkış Yap</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}