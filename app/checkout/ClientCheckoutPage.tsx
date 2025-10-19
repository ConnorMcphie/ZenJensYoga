// File: app/checkout/ClientCheckoutPage.tsx
"use client"; // MUST have "use client" here

import { useEffect, useState } from "react"; // No Suspense import needed here
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

// This is the component that actually uses the hook
export default function ClientCheckoutPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'success' | 'canceled' | 'loading'>('loading');

    useEffect(() => {
        if (searchParams.get('success')) {
            localStorage.removeItem('cart');
            setStatus('success');
        } else if (searchParams.get('canceled')) {
            setStatus('canceled');
        } else {
            // Set loading explicitly if no params found initially
            // If params ARE expected, you might need a more robust check or timeout
            // For now, assume loading until useEffect runs
            setStatus('loading');
        }
    }, [searchParams]);

    // Loading state while useEffect figures things out
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
                <p className="ml-4 text-gray-600">Checking payment status...</p>
            </div>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white px-4">
                <div className="max-w-md w-full bg-white text-center border border-green-200 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for your booking! A confirmation email has been sent.
                    </p>
                    <Link href="/my-bookings">
                        <span className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                            View My Bookings
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    // Canceled state (implicitly if not success or loading after useEffect runs)
    if (status === 'canceled') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white px-4">
                <div className="max-w-md w-full bg-white text-center border border-red-200 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-red-700 mb-4">Payment Canceled</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment was not completed. Return to booking to try again.
                    </p>
                    <Link href="/booking">
                         <span className="inline-block bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                             Return to Booking
                         </span>
                    </Link>
                </div>
            </div>
        );
    }

    // Fallback if status is somehow not loading/success/canceled after check
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <p className="text-red-500">Could not determine checkout status.</p>
        </div>
    );
}