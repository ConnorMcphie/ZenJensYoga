"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'success' | 'canceled' | 'loading'>('loading');

    useEffect(() => {
        if (searchParams.get('success')) {
            setStatus('success');
        } else if (searchParams.get('canceled')) {
            setStatus('canceled');
        }
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
            {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for your booking. A confirmation has been sent to your email. You can view your upcoming classes in your bookings area.
                    </p>
                    <Link href="/my-bookings">
                        <span className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                            View My Bookings
                        </span>
                    </Link>
                </div>
            )}

            {status === 'canceled' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-red-700 mb-4">Payment Canceled</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment was not completed. Your cart has been saved, and you can try again whenever you are ready.
                    </p>
                    <Link href="/booking">
                        <span className="inline-block bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                            Return to Booking
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}