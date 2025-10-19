'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AuthPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });

            const user = await res.json();

            if (!res.ok) {
                setError(user.message || 'Invalid email or password');
                return;
            }

            localStorage.setItem('user', JSON.stringify(user));
            router.push(user.is_admin ? '/admin/dashboard' : '/booking');

        } catch (error: unknown) { // Changed to unknown
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError('');

        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupForm),
            });

            const newUser = await res.json();

            if (!res.ok) {
                setError(newUser.message || 'Account creation failed');
                return;
            }

            localStorage.setItem('user', JSON.stringify(newUser));
            router.push('/booking');

        } catch (error: unknown) { // Changed to unknown
            console.error('Signup error:', error);
            const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#d1f0e5] to-white px-4 py-8">
                <div className="w-full max-w-md bg-white shadow-lg rounded-xl border border-green-100 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-4 px-6 text-center font-semibold ${
                                activeTab === 'login'
                                    ? 'bg-green-50 text-[#2e7d6f] border-b-2 border-green-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`flex-1 py-4 px-6 text-center font-semibold ${
                                activeTab === 'signup'
                                    ? 'bg-green-50 text-[#2e7d6f] border-b-2 border-green-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'login' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#2e7d6f] text-center">Welcome Back</h2>
                                <div className="space-y-4">
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        value={loginForm.email}
                                        onChange={handleLoginChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        value={loginForm.password}
                                        onChange={handleLoginChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <div className="text-right">
                                        <button
                                            onClick={() => router.push('/forgot_password')}
                                            className="text-sm text-green-600 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <button
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className="w-full bg-green-500 text-white font-semibold py-3 rounded-md"
                                    >
                                        {loading ? 'Logging in...' : 'Log In'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'signup' && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#2e7d6f] text-center">Create Account</h2>
                                <div className="space-y-4">
                                    <input
                                        name="fullName"
                                        type="text"
                                        placeholder="Full Name"
                                        value={signupForm.fullName}
                                        onChange={handleSignupChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <input
                                        name="phone"
                                        type="tel"
                                        placeholder="Phone Number"
                                        value={signupForm.phone}
                                        onChange={handleSignupChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        value={signupForm.email}
                                        onChange={handleSignupChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        value={signupForm.password}
                                        onChange={handleSignupChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={signupForm.confirmPassword}
                                        onChange={handleSignupChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-3"
                                    />
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <button
                                        onClick={handleSignUp}
                                        disabled={loading}
                                        className="w-full bg-green-500 text-white font-semibold py-3 rounded-md"
                                    >
                                        {loading ? 'Signing up...' : 'Sign Up'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}