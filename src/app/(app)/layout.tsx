'use client';

import { AppLayout } from "@/components/layout/app-layout";
import { SearchProvider } from "@/context/search-provider";
import { useUser } from "@/firebase/auth/use-user";
import { getUserProfile } from "@/lib/data";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAfter } from 'date-fns';

export default function AuthenticatedAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (loading) return; // Aguarde a verificação inicial do usuário

        if (!user) {
            router.push('/login');
            return;
        }
        
        const isAdmin = user.uid === 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2';

        // Admin tem acesso irrestrito
        if (isAdmin) {
            setIsReady(true);
            return;
        }

        async function checkAuthorization() {
            const userProfile = await getUserProfile(user!.uid);

            // Se o perfil não existe (pode acontecer logo após o cadastro), espere.
            if (!userProfile) {
                 if (pathname !== '/activate') {
                    router.push('/activate');
                } else {
                    setIsReady(true);
                }
                return;
            }

            const isActivated = userProfile.isActivated && userProfile.activatedUntil && isAfter(new Date(userProfile.activatedUntil), new Date());
            
            // Usuários não-admin precisam de ativação
            if (!isActivated) {
                if (pathname !== '/activate') {
                    router.push('/activate');
                } else {
                    setIsReady(true); // Permite que a página de ativação seja renderizada
                }
                return;
            }

            // Se usuário está ativo, mas na página de ativação, redirecione para o dashboard
            if (isActivated && pathname === '/activate') {
                router.push('/dashboard');
                return;
            }
            
            // Se chegou até aqui, o usuário está autorizado a ver a página.
            setIsReady(true);
        }

        checkAuthorization();

    }, [user, loading, router, pathname]);

    if (!isReady) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    return (
        <SearchProvider>
            <AppLayout>
                {children}
            </AppLayout>
        </SearchProvider>
    );
}
