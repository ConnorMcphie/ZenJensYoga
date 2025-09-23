'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendCode = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/send-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Failed to send reset code');

            setCodeSent(true);
        } catch (err) {
            console.error('Send Code Error:', err);
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/verify-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Invalid code');

            router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err) {
            console.error('Verify Code Error:', err);
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />

            <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#d1f0e5] to-white px-4 py-8">
                <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border border-green-100">
                    <h2 className="text-3xl font-bold text-[#2e7d6f] mb-6 text-center">
                        Forgot Password
                    </h2>

                    {!codeSent ? (
                        <>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                            <button
                                onClick={handleSendCode}
                                disabled={loading}
                                className="w-full bg-green-500 text-white font-semibold py-3 rounded-md hover:bg-green-600 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                A 6-digit reset code has been sent to <strong>{email}</strong>.
                                Please enter it below.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                            <button
                                onClick={handleVerifyCode}
                                disabled={loading}
                                className="w-full bg-green-500 text-white font-semibold py-3 rounded-md hover:bg-green-600 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md mt-4">
                            {error}
                        </p>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
