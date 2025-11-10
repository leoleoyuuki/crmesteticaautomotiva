'use client';

import { AppLayout } from "@/components/layout/app-layout";
import { SearchProvider } from "@/context/search-provider";
import { useUser } from "@/firebase/auth/use-user";
import { getUserProfile } from "@/lib/data";
import { UserProfile } from "@/lib/types";
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        async function checkAuthorization() {
            const userProfile = await getUserProfile(user!.uid);
            setProfile(userProfile);
            setProfileLoading(false);

            if (!userProfile) {
                // This can happen briefly after signup. Let's wait.
                // A better solution might be a dedicated loading/profile creation state.
                return;
            }

            const isAdmin = user.uid === 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2';
            const isActivated = userProfile.isActivated && userProfile.activatedUntil && isAfter(new Date(userProfile.activatedUntil), new Date());

            // Non-admin users must be activated
            if (!isAdmin && !isActivated) {
                if (pathname !== '/activate') {
                    router.push('/activate');
                } else {
                    setIsAuthorized(true); // Allow rendering the activate page
                }
                return;
            }

            // Admin users can access admin pages without activation,
            // but need activation for regular app pages.
            if (isAdmin) {
                if(pathname.startsWith('/admin')) {
                    setIsAuthorized(true);
                    return;
                }
                if (!isActivated) {
                    if (pathname !== '/activate') {
                        router.push('/activate');
                    } else {
                        setIsAuthorized(true); // Allow rendering the activate page
                    }
                    return;
                }
            }
            
            // If user is activated but on the activate page, redirect them away.
            if (isActivated && pathname === '/activate') {
                router.push('/dashboard');
                return;
            }
            
            // If we've reached here, the user is authorized to see the page.
            setIsAuthorized(true);
        }

        checkAuthorization();

    }, [user, loading, router, pathname]);

    if (loading || profileLoading || !isAuthorized) {
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
