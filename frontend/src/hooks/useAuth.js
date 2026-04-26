"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to protect routes that require authentication
 * Redirects to login if not authenticated
 */
export function useProtectedRoute() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is browser environment
    if (typeof window === 'undefined') return;

    const user = localStorage.getItem('user');
    if (!user) {
      router.replace('/'); // Use replace to prevent back button access
    }
  }, []);
}

/**
 * Hook to redirect logged-in users away from login page
 * Redirects to dashboard if already authenticated
 */
export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is browser environment
    if (typeof window === 'undefined') return;

    const user = localStorage.getItem('user');
    if (user) {
      router.replace('/dashboard'); // Use replace to prevent back button access
    }
  }, [router]);
}
