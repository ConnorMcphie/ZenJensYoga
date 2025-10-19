// File: app/reset-password/page.tsx
// NO "use client" directive here

import { Suspense } from 'react';
import ClientResetPasswordPage from './ClientResetPasswordPage'; // Import the component you just renamed

// Define a simple loading component
function LoadingFallback() {
    // You can customize this further if needed
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400"></div>
            <p className="ml-4 text-gray-600">Loading Page...</p>
        </div>
    );
}

// This is the default export for the /reset-password route
export default function ResetPasswordPageWrapper() {
    return (
        // Wrap the client component (that uses useSearchParams) in Suspense
        <Suspense fallback={<LoadingFallback />}>
            <ClientResetPasswordPage />
        </Suspense>
    );
}