'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Define a type for the class items stored in the cart
type CartItem = {
    id: number;
    title: string;
    price: number;
};

// Define a type for the user object
type User = {
    id: number;
    name: string;
    email: string;
    phone: string;
};

export default function WaiverPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State for the form answers
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [parqAnswers, setParqAnswers] = useState({
        heartCondition: '',
        chestPainActivity: '',
        chestPainMonth: '',
        loseBalance: '',
        boneProblem: '',
        prescribedDrugs: '',
        otherReason: '',
    });

    useEffect(() => {
        // On page load, get the user and cart from localStorage
        const storedUser = localStorage.getItem('user');
        const storedCart = localStorage.getItem('cart');

        if (!storedUser || !storedCart) {
            // If there's no user or cart, they shouldn't be here. Redirect them.
            router.push('/booking');
            return;
        }

        setUser(JSON.parse(storedUser));
        setCart(JSON.parse(storedCart));
    }, [router]);

    const handleParqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParqAnswers(prev => ({ ...prev, [name]: value }));
    };

    // Check if any PAR-Q answer is "Yes"
    const hasParqYes = Object.values(parqAnswers).includes('Yes');

    // Check if all PAR-Q questions have been answered
    const allParqAnswered = Object.values(parqAnswers).every(answer => answer !== '');

    // The payment button is enabled only when all conditions are met
    const isFormComplete = agreedToPolicy && agreedToTerms && allParqAnswered;

    const handleProceedToPayment = async () => {
        if (!isFormComplete) {
            setError('You must agree to all terms and answer all health questions to proceed.');
            return;
        }

        if (hasParqYes) {
            alert("Based on your answers, we strongly recommend you consult with your doctor before participating in any physical activity. By proceeding, you acknowledge this recommendation and accept full responsibility for your participation.");
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    userId: user?.id,
                }),
            });

            const data = await res.json();

            if (data.url) {
                // Clear the cart from localStorage after successfully creating a session
                localStorage.removeItem('cart');
                window.location.href = data.url; // Redirect to Stripe
            } else {
                setError('Failed to create a payment session. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user || cart.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md border border-green-100">
                    <h1 className="text-3xl font-bold text-[#2e7d6f] mb-4">Waiver & Consent</h1>
                    <p className="text-gray-600 mb-6">
                        Please review the following policies and answer the health questions before proceeding to payment.
                    </p>

                    {/* Booking Policy */}
                    <section className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Booking & Reschedule Policy</h2>
                        <p className="text-sm text-gray-700">
                            Please note that all bookings are non-refundable. If you’re unable to attend your class, you may reschedule your session up to <strong>24 hours</strong> before the class start time, subject to availability. Unfortunately, reschedules cannot be made within 24 hours of the class, and missed sessions are not transferable. This policy helps ensure fairness for all clients. Thank you for your understanding!
                        </p>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" checked={agreedToPolicy} onChange={() => setAgreedToPolicy(!agreedToPolicy)} className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                            <span className="font-medium text-gray-700">I confirm that I have read and agree to the booking policy.*</span>
                        </label>
                    </section>

                    {/* PAR-Q */}
                    <section className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Physical Activity Readiness Questionnaire (PAR-Q)</h2>
                        <p className="text-xs text-gray-600">Common sense is your best guide. Please read carefully and answer each question honestly.</p>

                        {Object.entries({
                            heartCondition: 'Has your doctor ever said that you have a heart condition and should only do physical activity recommended by a doctor?',
                            chestPainActivity: 'Do you feel pain in your chest when you do physical activity?',
                            chestPainMonth: 'In the past month, have you had chest pain when you were not doing physical activity?',
                            loseBalance: 'Do you lose your balance because of dizziness or do you ever lose consciousness?',
                            boneProblem: 'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
                            prescribedDrugs: 'Is your doctor currently prescribing drugs for your blood pressure or heart condition?',
                            otherReason: 'Do you know of any other reason why you should not do physical activity?'
                        }).map(([key, question]) => (
                            <div key={key} className="py-2 border-b border-gray-200 last:border-b-0">
                                <p className="font-medium text-gray-800">{question}*</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <label><input type="radio" name={key} value="No" onChange={handleParqChange} className="mr-1" /> No</label>
                                    <label><input type="radio" name={key} value="Yes" onChange={handleParqChange} className="mr-1" /> Yes</label>
                                </div>
                            </div>
                        ))}
                        {hasParqYes && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                <strong>Important:</strong> As you answered "Yes" to one or more questions, we strongly advise consulting with your doctor before participating.
                            </div>
                        )}
                    </section>

                    {/* Terms & Consent */}
                    <section className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Informed Consent</h2>
                        <p className="text-sm text-gray-700">
                            I understand that my participation is voluntary and I may withdraw at any time. I understand that exercise involves an inherent but unlikely risk of injury. By checking the box below, I confirm that I have answered the health questions honestly and release the instructor from any liability with respect to any injury I may suffer whilst exercising.
                        </p>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                            <span className="font-medium text-gray-700">I have read and agree to the terms above.*</span>
                        </label>
                    </section>

                    {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md my-4">{error}</p>}

                    <button
                        onClick={handleProceedToPayment}
                        disabled={!isFormComplete || loading}
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Continue to Payment (£${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)})`}
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}