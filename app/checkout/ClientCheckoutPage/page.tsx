"use client"; // Keep this directive here

import { useEffect, useState } from "react"; // Import Suspense here if needed for nested components, though not strictly needed for the hook itself
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

export default function ClientCheckoutPage() { // Renamed component
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'success' | 'canceled' | 'loading'>('loading');

    useEffect(() => {
        // Your existing useEffect logic remains the same
        if (searchParams.get('success')) {
            localStorage.removeItem('cart');
            setStatus('success');
        } else if (searchParams.get('canceled')) {
            setStatus('canceled');
        } else {

            setStatus('loading');
        }
    }, [searchParams]); // Dependency array is correct

    // Render loading state while waiting for useEffect to determine status
    if (status === 'loading') {
        // You might want a slightly more robust loading check or initial state
        // This relies on useEffect running quickly after mount.
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
                <p className="ml-4 text-gray-600">Checking payment status...</p>
            </div>
        );
    }

    // Your existing success/canceled JSX remains the same
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white px-4">
            {status === 'success' && (
                <div className="max-w-md w-full bg-white text-center border border-green-200 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for your booking! A confirmation email with all your class details has been sent to your inbox.
                    </p>
                    <Link href="/my-bookings">
                        <span className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                            View My Bookings
                        </span>
                    </Link>
                </div>
            )}

            {status === 'canceled' && (
                <div className="max-w-md w-full bg-white text-center border border-red-200 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-red-700 mb-4">Payment Canceled</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment was not completed. Your items are still in your cart if you wish to try again. Please return to the booking page.
                    </p>
                    <Link href="/booking">
                        <span className="inline-block bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                            Return to Booking
                        </span>
                    </Link>
                </div>
            )}
            {/* Optional: Add a state for when neither success nor canceled is found */}
            {(status !== 'success' && status !== 'canceled' && status !== 'loading') && (
                <div className="max-w-md w-full bg-white text-center border border-gray-200 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-700 mb-4">Status Unknown</h1>
                    <p className="text-gray-600 mb-6">
                        Could not determine payment status from the URL.
                    </p>
                    <Link href="/booking">
                         <span className="inline-block bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors">
                             Return to Booking
                         </span>
                    </Link>
                </div>
            )}
        </div>
    );
}