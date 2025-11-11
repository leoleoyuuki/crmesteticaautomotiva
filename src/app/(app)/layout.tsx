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
            if (!userProfile || !userProfile.isActivated) {
                 if (pathname !== '/activate') {
                    router.push('/activate');
                } else {
                    setIsReady(true);
                }
                return;
            }

            // Perfil existe e já foi ativado uma vez.
            const isStillActive = userProfile.activatedUntil && isAfter(new Date(userProfile.activatedUntil), new Date());
            
            // Usuário está com a ativação expirada.
            if (!isStillActive) {
                if (pathname !== '/activate') {
                    // Redireciona para a página de ativação com um marcador de expiração
                    router.push('/activate?expired=true');
                } else {
                    setIsReady(true); // Permite que a página de ativação seja renderizada com o parâmetro
                }
                return;
            }

            // Se usuário está ativo e na página de ativação, redirecione para o dashboard
            if (isStillActive && pathname === '/activate') {
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
