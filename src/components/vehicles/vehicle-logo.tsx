'use client';

import Image from 'next/image';
import { Car } from 'lucide-react';
import { useState } from 'react';

interface VehicleLogoProps {
    make: string;
    className?: string;
}

export function VehicleLogo({ make, className }: VehicleLogoProps) {
    const [error, setError] = useState(false);

    const domain = make.toLowerCase().replace(/\s/g, '') + '.com';
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    if (error) {
        return (
            <div className="flex items-center justify-center bg-muted rounded-lg aspect-video">
                <Car className="w-16 h-16 text-muted-foreground" />
            </div>
        );
    }

    return (
        <Image
            src={logoUrl}
            alt={`${make} logo`}
            width={600}
            height={400}
            className="rounded-lg object-contain aspect-video p-4 bg-muted/50"
            onError={() => setError(true)}
        />
    );
}
