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
  KeyRound,
  Car,
  Sparkles,
  History,
} from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

const CarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
      <path d="M14 16.33a1 1 0 0 0 1.5.87l2.17-1.25a1 1 0 0 0 0-1.74l-2.17-1.25a1 1 0 0 0-1.5.87V16.33z" />
      <path d="M19.14 5.26a1 1 0 0 0-1.28.5L16.14 9.5a1 1 0 0 0 .5 1.28l2.72 1.57a1 1 0 0 0 1.28-.5l1.72-3.76a1 1 0 0 0-.5-1.28z" />
      <path d="M5 18H3.6a.6.6 0 0 1-.6-.6v-3.8a.6.6 0 0 1 .6-.6h1.8" />
      <path d="m2 12 1.4-1.4" />
      <path d="M12 18h-5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h7.65a3 3 0 0 1 2.85 2.1L19 12" />
      <path d="M9.5 12H16" />
      <path d="M18 18h-6" />
    </svg>
);


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.uid === 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2';

  const menuItems = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/vehicles", label: "Veículos", icon: Car },
    { href: "/services", label: "Serviços", icon: Sparkles },
    { href: "/renewals", label: "Renovações", icon: History },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  if (isAdmin) {
    menuItems.push({ href: "/admin/codes", label: "Gerar Códigos", icon: KeyRound });
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <CarIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">AutoEstética</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
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
