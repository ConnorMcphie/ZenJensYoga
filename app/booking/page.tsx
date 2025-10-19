'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingPageHeader from "@/components/BoookingPageHeader";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import {useCallback} from "react";
import Value from "react-calendar";

type YogaClass = {
    id: number;
    title: string;
    date: string;
    time: string;
    capacity: number;
    price: number;
    description: string;
    duration: number;
    bookings_count: number;
    spaces_left: number;
};

export default function BookingPage() {
    const [classes, setClasses] = useState<YogaClass[]>([]);
    const [loading, setLoading] = useState(true);
    type User = {
        id: number;
        email: string;
    };    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [cart, setCart] = useState<YogaClass[]>([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [userBookings, setUserBookings] = useState<number[]>([]);


    const fetchUserBookings = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('Bookings')
            .select('classid')
            .eq('userid', user.id);
        if (error) {
            console.error('Error fetching user bookings:', error);
        } else {
            setUserBookings(data?.map(b => b.classid) || []);
        }
    }, [user]); // Add user dependency


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchClassesAndBookings();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserBookings();
        }
    }, [user, fetchUserBookings]); // Add fetchUserBookings here

    const fetchClassesAndBookings = async () => {
        setLoading(true);
        const { data: classesData, error: classesError } = await supabase
            .from('class_with_bookings')
            .select('*')
            .order('date', { ascending: true });

        if (classesError || !classesData) {
            console.error('Error loading classes:', classesError);
            setLoading(false);
            return;
        }

        setClasses(classesData.map(cls => ({
            ...cls,
            spaces_left: cls.capacity - (cls.bookings_count || 0),
        })));
        setLoading(false);
    };


    const isAlreadyBooked = (classId: number) => userBookings.includes(classId);

    const toggleCart = (cls: YogaClass) => {
        if (isAlreadyBooked(cls.id)) {
            toast.error('You have already booked this class.');
            return;
        }
        if (cart.find(c => c.id === cls.id)) {
            setCart(cart.filter(c => c.id !== cls.id));
            toast.success('Removed from cart.');
        } else {
            if ((cls.bookings_count || 0) >= cls.capacity) return;
            setCart([...cart, cls]);
            toast.success('Added to cart!');
        }
    };

    // --- UPDATED CHECKOUT LOGIC ---
    const handleCheckout = () => {
        if (!user) {
            toast.error('Please log in to checkout.');
            router.push('/auth');
            return;
        }
        if (cart.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        // 1. Save the cart to localStorage so the waiver page can access it.
        localStorage.setItem('cart', JSON.stringify(
            cart.map(cls => ({ id: cls.id, title: cls.title, price: cls.price }))
        ));

        // 2. Redirect to the new waiver page.
        router.push('/waiver');
    };

    const onDateChange = (value: typeof Value) => {
        const date = Array.isArray(value) ? value[0] : value;
        if (date) {
            setCalendarDate(date);
        }
    };
    const classesOnDate = classes.filter(
        cls => new Date(cls.date).toDateString() === calendarDate.toDateString()
    );

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month' && classes.some(cls => new Date(cls.date).toDateString() === date.toDateString())) {
            return <div className="dot" />;
        }
        return null;
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const ClassCard = ({ cls, isCalendarView = false }: { cls: YogaClass; isCalendarView?: boolean }) => {
        const isFull = (cls.bookings_count || 0) >= cls.capacity;
        const alreadyBooked = isAlreadyBooked(cls.id);
        const inCart = cart.some(c => c.id === cls.id);

        return (
            <div className={isCalendarView ? "bg-green-50 rounded-lg p-4 mb-4" : "bg-white shadow-lg rounded-xl p-6 flex flex-col"}>
                <h3 className="font-bold text-[#2e7d6f]">{cls.title}</h3>
                <p className="text-sm text-gray-500">{formatDate(cls.date)} at {cls.time}</p>
                <p className="text-gray-700 my-2 flex-grow">{cls.description}</p>
                <div className="flex justify-between items-center mt-auto">
                    <span className="font-semibold">£{cls.price?.toFixed(2)}</span>
                    {alreadyBooked ? (
                        <span className="text-green-700 font-semibold">✓ Booked</span>
                    ) : isFull ? (
                        <span className="text-red-500 font-semibold">Fully Booked</span>
                    ) : (
                        <button
                            onClick={() => toggleCart(cls)}
                            className={`px-4 py-2 rounded font-medium ${inCart ? 'bg-red-500 text-white' : 'bg-[#2e7d6f] text-white'}`}
                        >
                            {inCart ? 'Remove' : 'Add to Cart'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <main className="flex-1 px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <BookingPageHeader />
                    <div className="flex justify-between items-center">
                        <div>
                            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200'}`}>List</button>
                            <button onClick={() => setViewMode('calendar')} className={`ml-2 px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200'}`}>Calendar</button>
                        </div>
                        {cart.length > 0 && (
                            <button onClick={handleCheckout} className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md font-semibold">
                                Checkout ({cart.length}) – £{cart.reduce((sum, cls) => sum + cls.price, 0).toFixed(2)}
                            </button>
                        )}
                    </div>

                    {viewMode === 'list' ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
                        </div>
                    ) : (
                        <div className="mx-auto max-w-lg p-6 bg-white rounded-xl shadow-lg">
                            <Calendar onChange={onDateChange} value={calendarDate} tileContent={tileContent} />
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold mb-4">Classes on {calendarDate.toDateString()}</h3>
                                {classesOnDate.length > 0 ? (
                                    classesOnDate.map(cls => <ClassCard key={cls.id} cls={cls} isCalendarView />)
                                ) : (
                                    <p>No classes scheduled for this day.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

// Minimal styling for dot in calendar
const style = `
.dot { height: 8px; width: 8px; background-color: #2e7d6f; border-radius: 50%; margin: 2px auto 0; }
`;
const globalStyle = typeof window !== 'undefined' ? document.createElement('style') : null;
if (globalStyle) {
    globalStyle.innerHTML = style;
    document.head.appendChild(globalStyle);
}