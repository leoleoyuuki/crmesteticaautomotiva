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
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L2 12v9c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
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
        <div className="flex items-center gap-2 p-2 group/logo">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-transparent border text-foreground/80 group-hover/logo:text-white group-hover/logo:bg-gradient-to-br from-purple-500 to-blue-500 transition-all duration-300">
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
