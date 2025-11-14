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

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 20"
      width="50"
      height="20"
      {...props}
    >
      <path
        d="M5 10 C15 4, 28 4, 38 10 L45 10 C48 10, 48 8, 45 8 L40 8 C38 6, 35 6, 32 8 L25 8"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 15 C10 12, 35 12, 48 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
        <div className="flex items-center gap-2 p-3">
            <LogoIcon className="text-sidebar-foreground" />
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
