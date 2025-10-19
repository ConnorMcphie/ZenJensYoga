// File: app/checkout/page.tsx
import { Suspense } from 'react';
import ClientCheckoutPage from './ClientCheckoutPage/page'; // Import the component we just created

// Define a simple loading component to show while Suspense is waiting
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400"></div>
            <p className="ml-4 text-gray-600">Loading...</p>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        // Wrap the client component that uses useSearchParams in Suspense
        <Suspense fallback={<LoadingFallback />}>
            <ClientCheckoutPage />
        </Suspense>
    );
}