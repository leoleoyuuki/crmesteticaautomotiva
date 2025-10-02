'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
} from "lucide-react";

const CarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L2 12v9c0 .6.4 1 1 1h2" />
      <path d="M14 17H9" />
      <path d="M5 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C4.7 10.6 2 10 2 10" />
      <path d="m5 6 1-1" />
      <path d="m19 6-1-1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Painel", icon: LayoutDashboard },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <CarIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold text-primary-foreground group-data-[collapsible=icon]:hidden">AutoEstética</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
