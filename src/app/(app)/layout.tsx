'use client';

import { AppLayout } from "@/components/layout/app-layout";
import { SearchProvider } from "@/context/search-provider";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthenticatedAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
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
