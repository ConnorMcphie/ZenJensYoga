'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import bcrypt from 'bcryptjs';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot password states
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [resetEmail, setResetEmail] = useState('');

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Fetch user from Users table
            const { data: user, error: fetchError } = await supabase
                .from('Users')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (fetchError || !user) {
                setError('Invalid credentials. Please try again.');
                setLoading(false);
                return;
            }

            // Check if user is an admin
            if (!user.is_admin) {
                setError('Access denied. Admin privileges required.');
                setLoading(false);
                return;
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                setError('Invalid credentials. Please try again.');
                setLoading(false);
                return;
            }

            // Store admin user in localStorage for admin session
            localStorage.setItem('adminUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                is_admin: user.is_admin
            }));

            // Redirect to admin dashboard
            router.push('/admin/dashboard');

        } catch (err) {
            console.error('Admin login error:', err);
            setError('An unexpected error occurred. Please try again.');
        }

        setLoading(false);
    };

    const handleSendResetCode = async () => {
        setForgotPasswordLoading(true);
        setForgotPasswordError('');

        try {
            // First verify the email belongs to an admin
            const { data: user, error: fetchError } = await supabase
                .from('Users')
                .select('is_admin')
                .eq('email', resetEmail)
                .maybeSingle();

            if (fetchError || !user) {
                setForgotPasswordError('Admin account not found with this email.');
                setForgotPasswordLoading(false);
                return;
            }

            if (!user.is_admin) {
                setForgotPasswordError('This email is not associated with an admin account.');
                setForgotPasswordLoading(false);
                return;
            }

            // Send reset code using existing API
            const res = await fetch('/api/send-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });

            const data = await res.json();
            if (!res.ok) {
                setForgotPasswordError(data.message || 'Failed to send reset code');
                setForgotPasswordLoading(false);
                return;
            }

            setCodeSent(true);
        } catch (err) {
            console.error('Send Code Error:', err);
            setForgotPasswordError('Something went wrong.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handleVerifyResetCode = async () => {
        setForgotPasswordLoading(true);
        setForgotPasswordError('');

        try {
            const res = await fetch('/api/verify-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, code: resetCode }),
            });

            const data = await res.json();
            if (!res.ok) {
                setForgotPasswordError(data.message || 'Invalid code');
                setForgotPasswordLoading(false);
                return;
            }

            // Redirect to reset password page with admin flag
            router.push(`/reset-password?email=${encodeURIComponent(resetEmail)}&admin=true`);
        } catch (err) {
            console.error('Verify Code Error:', err);
            setForgotPasswordError('Something went wrong.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const resetForgotPasswordForm = () => {
        setShowForgotPassword(false);
        setCodeSent(false);
        setResetCode('');
        setResetEmail('');
        setForgotPasswordError('');
    };

    if (showForgotPassword) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
                <Navbar />
                <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#d1f0e5] to-white p-6">
                    <div className="bg-white shadow-lg p-8 rounded-lg w-full max-w-md border border-green-100">
                        <h2 className="text-2xl font-bold text-[#2e7d6f] text-center mb-6">
                            Admin Password Reset
                        </h2>

                        {!codeSent ? (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                                    <p className="text-blue-800 text-sm text-center">
                                        🔒 Admin password reset only
                                    </p>
                                </div>

                                <label className="block mb-4">
                                    <span className="text-sm text-gray-700 font-medium">Admin Email</span>
                                    <input
                                        type="email"
                                        placeholder="Enter your admin email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full mt-1 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                                    />
                                </label>

                                <button
                                    onClick={handleSendResetCode}
                                    disabled={forgotPasswordLoading || !resetEmail}
                                    className="w-full bg-[#81c784] text-white font-semibold py-3 rounded-md hover:bg-[#66bb6a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                                >
                                    {forgotPasswordLoading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                                    <p className="text-green-800 text-sm">
                                        A 6-digit reset code has been sent to <strong>{resetEmail}</strong>.
                                        Please enter it below.
                                    </p>
                                </div>

                                <label className="block mb-4">
                                    <span className="text-sm text-gray-700 font-medium">Reset Code</span>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        className="w-full mt-1 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                                    />
                                </label>

                                <button
                                    onClick={handleVerifyResetCode}
                                    disabled={forgotPasswordLoading || !resetCode}
                                    className="w-full bg-[#81c784] text-white font-semibold py-3 rounded-md hover:bg-[#66bb6a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                                >
                                    {forgotPasswordLoading ? 'Verifying...' : 'Verify Code'}
                                </button>

                                <button
                                    onClick={() => setCodeSent(false)}
                                    className="w-full text-gray-600 text-sm hover:text-gray-800 hover:underline mb-2"
                                >
                                    Resend Code
                                </button>
                            </>
                        )}

                        {forgotPasswordError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                                <p className="text-red-700 text-sm text-center">{forgotPasswordError}</p>
                            </div>
                        )}

                        <button
                            onClick={resetForgotPasswordForm}
                            className="w-full text-gray-600 text-sm hover:text-gray-800 hover:underline"
                        >
                            Back to Admin Login
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#d1f0e5] to-white p-6">
                <form
                    onSubmit={handleLogin}
                    className="bg-white shadow-lg p-8 rounded-lg space-y-4 w-full max-w-md border border-green-100"
                >
                    <h2 className="text-2xl font-bold text-[#2e7d6f] text-center">Admin Login</h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-blue-800 text-sm text-center">
                            🔒 Admin access only
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-700 text-sm text-center">{error}</p>
                        </div>
                    )}

                    <label className="block">
                        <span className="text-sm text-gray-700 font-medium">Email</span>
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-gray-700 font-medium">Password</span>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white font-semibold py-3 px-4 rounded-md transition-all ${
                            loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#81c784] hover:bg-[#66bb6a] focus:ring-2 focus:ring-green-300'
                        }`}
                    >
                        {loading ? 'Verifying Admin Access...' : 'Admin Login'}
                    </button>

                    <div className="text-center pt-2 space-y-2">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-[#2e7d6f] hover:text-[#1e5a4f] hover:underline block w-full"
                        >
                            Forgot Admin Password?
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/auth')}
                            className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                        >
                            Regular User Login
                        </button>
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
}