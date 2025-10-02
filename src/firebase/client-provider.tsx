'use client';

import { FirebaseProvider } from './firebase-provider';
import { UserProvider } from './auth/use-user';
import React from 'react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
      <UserProvider>{children}</UserProvider>
    </FirebaseProvider>
  );
}
