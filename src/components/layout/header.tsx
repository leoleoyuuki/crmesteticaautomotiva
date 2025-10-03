'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { Input } from "../ui/input";
import { useUser } from "@/firebase/auth/use-user";
import { auth } from "@/firebase/firebase";

const getTitle = (pathname: string) => {
  if (pathname.startsWith('/dashboard')) return 'Painel';
  if (pathname.startsWith('/clients')) return 'Gestão de Clientes';
  if (pathname.startsWith('/settings')) return 'Configurações';
  return 'CRM AutoEstética';
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const title = getTitle(pathname);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-card/50 px-4 backdrop-blur-md sm:h-16 sm:px-6">
        <SidebarTrigger className="md:hidden"/>
        <h1 className="hidden md:block text-lg font-headline font-semibold">{title}</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Procurar..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Avatar"} data-ai-hint="person face" />
                        <AvatarFallback>{getInitials(user?.displayName || user?.email)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.displayName || user?.email || 'Minha Conta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem>Suporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );
}
