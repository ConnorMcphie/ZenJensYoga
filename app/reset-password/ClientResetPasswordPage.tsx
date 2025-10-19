// File: app/reset-password/ClientResetPasswordPage.tsx
'use client'; // Make sure this is the very first line

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientResetPasswordPage() { // Renamed component
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const [isAdminReset, setIsAdminReset] = useState(false); // To handle admin redirect

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const adminParam = searchParams.get('admin'); // Check for admin flag

        if (emailParam) {
            setEmail(emailParam);
        } else {
            // Redirect or show error if email is missing
            setError('Missing email parameter. Cannot reset password.');
            // Optionally redirect after a delay
            // setTimeout(() => router.push('/auth'), 3000);
        }
        if (adminParam === 'true') {
            setIsAdminReset(true);
        }
    }, [searchParams]); // Correct dependency

    const handlePasswordUpdate = async () => {
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        // Prevent update if email is missing (e.g., direct navigation)
        if (!email) {
            return setError('Cannot update password without a valid email link.');
        }

        setLoading(true);

        try {
            const response = await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password.');
            }

            setSuccess(true);
        } catch (err: unknown) { // Use unknown for better type safety
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Determine where to redirect after success
    const loginRedirectPath = isAdminReset ? '/admin' : '/auth';

    return (
        // Keep original layout structure
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar/>
            <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#d1f0e5] to-white px-4 py-8">
                <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border border-green-100">
                    {success ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-green-600 mb-4">Password Updated</h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been successfully reset. You can now log in.
                            </p>
                            <button
                                onClick={() => router.push(loginRedirectPath)} // Use dynamic redirect path
                                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-all"
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-[#2e7d6f] mb-6 text-center">
                                Set New Password
                            </h2>

                            {/* Show warning if email is missing */}
                            {!email && !loading && (
                                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">{error || 'Invalid or expired link.'}</p>
                            )}

                            {/* Only show form if email is present */}
                            {email && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 text-center">
                                        Setting password for: <strong>{email}</strong>
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="New Password (min 6 characters)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-300"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-300"
                                    />

                                    {error && (
                                        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</p>
                                    )}

                                    <button
                                        onClick={handlePasswordUpdate}
                                        disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
                                        className="w-full bg-green-500 text-white font-semibold py-3 rounded-md hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            )}

                            <p className="text-sm text-gray-600 text-center mt-6">
                            <span
                                onClick={() => router.push(loginRedirectPath)} // Use dynamic redirect path
                                className="text-green-600 hover:underline cursor-pointer"
                            >
                                Back to Login
                            </span>
                            </p>
                        </>
                    )}
                </div>
            </main>
            <Footer/>
        </div>
    );
}