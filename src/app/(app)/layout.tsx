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

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        async function fetchProfile() {
            const userProfile = await getUserProfile(user!.uid);
            setProfile(userProfile);
            setProfileLoading(false);

            if (!userProfile) {
                // This can happen briefly after signup.
                // Redirecting to login might be too aggressive.
                // For now, let's just wait. A better solution might be needed.
                return;
            }
            
            const isActivated = userProfile.isActivated && userProfile.activatedUntil && isAfter(new Date(userProfile.activatedUntil), new Date());

            if (!isActivated && pathname !== '/activate' && user.uid !== 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2') {
                router.push('/activate');
            } else if (isActivated && pathname === '/activate') {
                router.push('/dashboard');
            }
        }

        fetchProfile();

    }, [user, loading, router, pathname]);

    if (loading || profileLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }
    
    // Admin user also needs to be activated unless they are on the admin page
    const isAdmin = user.uid === 'wtMBWT7OAoXHj9Hlb6alnfFqK3Q2';
    const isActivated = profile?.isActivated && profile.activatedUntil && isAfter(new Date(profile.activatedUntil), new Date());

    if (!isAdmin && !isActivated && pathname !== '/activate') {
       return <div className="flex h-screen items-center justify-center">Redirecionando para ativação...</div>;
    }
    
    if (isAdmin && !pathname.startsWith('/admin') && !isActivated) {
      if (pathname !== '/activate') {
        router.push('/activate');
        return <div className="flex h-screen items-center justify-center">Redirecionando para ativação...</div>;
      }
    }


    return (
        <SearchProvider>
            <AppLayout>
                {children}
            </AppLayout>
        </SearchProvider>
    );
}
