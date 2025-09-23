'use client';

import { useEffect, useState } from 'react';

export default function BookingPageHeader() {
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error('Failed to parse user from localStorage:', err);
                setUser(null);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/auth';
    };

    return (
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-green-100 rounded-t-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800">Available Classes</h2>

            {!user ? (
                <button
                    onClick={() => window.location.href = '/auth'}
                    className="bg-white border border-green-500 text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-all"
                >
                    Log In / Sign Up
                </button>
            ) : (
                <div className="flex items-center space-x-3">
                    <div
                        className="w-8 h-8 rounded-full bg-green-300 text-white flex items-center justify-center font-bold">
                        {user.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-gray-700">Hi, {user.email}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-all text-sm"
                    >
                        Log Out
                    </button>
                </div>
            )}
            <button
                onClick={() => window.location.href = '/my-bookings'}
                className="bg-white border border-green-500 text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-all"
            >
                my bookings
            </button>
        </div>
    );
}
