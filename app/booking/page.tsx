'use client';

import { useState, useEffect, useCallback, MouseEvent } from 'react'; // Added useCallback
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingPageHeader from "@/components/BoookingPageHeader";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';

// Define YogaClass type
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

// Add this type alias
type CalendarValue = Date | [Date | null, Date | null] | null;

// Define User type
type User = {
    id: number;
    email: string;
    // Add other relevant user fields if available and needed (e.g., name, phone)
};


export default function BookingPage() {
    const [classes, setClasses] = useState<YogaClass[]>([]);
    const [loading, setLoading] = useState(true);
    // Use the defined User type instead of any
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [cart, setCart] = useState<YogaClass[]>([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [userBookings, setUserBookings] = useState<number[]>([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                // Parse and set user, assuming storedUser matches User type structure
                setUser(JSON.parse(storedUser) as User);
            } catch (e) {
                console.error("Failed to parse user from localStorage:", e);
                localStorage.removeItem('user'); // Clear invalid data
                setUser(null);
            }
        }
        fetchClassesAndBookings();
    }, []); // Keep fetchClassesAndBookings outside initial user load useEffect

    // Wrap fetchUserBookings in useCallback
    const fetchUserBookings = useCallback(async () => {
        if (!user) return;
        setLoading(true); // Indicate loading while fetching bookings
        try {
            const { data, error } = await supabase
                .from('Bookings')
                .select('classid')
                .eq('userid', user.id);

            if (error) {
                console.error('Error fetching user bookings:', error);
                toast.error('Could not load your existing bookings.');
            } else {
                setUserBookings(data?.map(b => b.classid) || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching user bookings:', err);
            toast.error('An error occurred while loading your bookings.');
        } finally {
            setLoading(false); // Stop loading indicator
        }
    }, [user]); // Dependency is user

    // useEffect to fetch bookings when user changes
    useEffect(() => {
        if (user) {
            fetchUserBookings();
        } else {
            // Clear bookings if user logs out
            setUserBookings([]);
        }
    }, [user, fetchUserBookings]); // Added fetchUserBookings to dependency array

    const fetchClassesAndBookings = async () => {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase
                .from('class_with_bookings')
                .select('*')
                .order('date', { ascending: true });

            if (classesError || !classesData) {
                console.error('Error loading classes:', classesError);
                toast.error('Failed to load available classes.');
                setClasses([]); // Set empty array on error
                return; // Stop execution
            }

            setClasses(classesData.map(cls => ({
                ...cls,
                // Ensure spaces_left is calculated correctly even if bookings_count is null/undefined
                spaces_left: cls.capacity - (cls.bookings_count || 0),
            })));
        } catch (err) {
            console.error('Unexpected error fetching classes:', err);
            toast.error('An error occurred while loading classes.');
            setClasses([]);
        } finally {
            setLoading(false);
        }
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
            // Check spaces_left which is pre-calculated
            if (cls.spaces_left <= 0) {
                toast.error('Sorry, this class is now full.');
                return;
            }
            setCart([...cart, cls]);
            toast.success('Added to cart!');
        }
    };

    const handleCheckout = () => {
        if (!user) {
            toast.error('Please log in or sign up to checkout.');
            // Save cart before redirecting? Optional, depends on desired UX
            // localStorage.setItem('pendingCart', JSON.stringify(cart));
            router.push('/auth');
            return;
        }
        if (cart.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        localStorage.setItem('cart', JSON.stringify(
            cart.map(cls => ({ id: cls.id, title: cls.title, price: cls.price })) // Store only necessary info
        ));
        router.push('/waiver');
    };

    // Correctly type the function parameter using the imported Value type
    const onDateChange = (value: CalendarValue, _event: MouseEvent<HTMLButtonElement>) => {
        const date = Array.isArray(value) ? value[0] : value; // This variable holds the actual selected value
        // Check if the VARIABLE 'date' is an instance of the TYPE 'Date'
        if (date instanceof Date) { // CORRECT: Use the variable 'date' here
            setCalendarDate(date);   // CORRECT: Set state using the variable 'date'
        } else if (date === null) {  // CORRECT: Check if the variable 'date' is null
            // Handle null case if needed
            console.log("Date selection cleared or invalid range");
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
        // Use spaces_left for checking if full
        const isFull = cls.spaces_left <= 0;
        const alreadyBooked = isAlreadyBooked(cls.id);
        const inCart = cart.some(c => c.id === cls.id);

        return (
            <div className={isCalendarView ? "bg-green-50 rounded-lg p-4 mb-4 border border-green-100" : "bg-white shadow-lg rounded-xl p-6 flex flex-col border border-gray-100"}>
                <h3 className="font-bold text-lg text-[#2e7d6f]">{cls.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{formatDate(cls.date)} at {cls.time}</p>
                <p className="text-gray-700 my-2 text-sm flex-grow">{cls.description}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">£{cls.price?.toFixed(2)}</span>
                        <span className={`text-xs ${cls.spaces_left > 0 ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
                             {cls.spaces_left > 0 ? `${cls.spaces_left} spaces left` : 'Fully Booked'}
                         </span>
                    </div>

                    {alreadyBooked ? (
                        <span className="text-green-600 font-semibold px-4 py-2 bg-green-50 rounded-md text-sm">✓ Booked</span>
                    ) : isFull ? (
                        <span className="text-red-600 font-semibold px-4 py-2 bg-red-50 rounded-md text-sm">Fully Booked</span>
                    ) : (
                        <button
                            onClick={() => toggleCart(cls)}
                            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                                inCart
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-[#2e7d6f] text-white hover:bg-[#1f5c51]'
                            }`}
                        >
                            {inCart ? 'Remove' : 'Add to Cart'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading && classes.length === 0) return ( // Show loading only on initial load
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7d6f] mx-auto mb-4" />
                <p className="text-[#2e7d6f] font-medium">Loading classes…</p>
            </div>
            <Footer />
        </div>
    );


    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />
            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-8"> {/* Increased max-width for wider layout */}
                    <BookingPageHeader />
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div>
                            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>List View</button>
                            <button onClick={() => setViewMode('calendar')} className={`ml-2 px-4 py-2 rounded text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Calendar View</button>
                        </div>
                        {cart.length > 0 && (
                            <button onClick={handleCheckout} className="bg-green-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-green-700 font-semibold text-sm transition-colors">
                                Checkout ({cart.length}) – £{cart.reduce((sum, cls) => sum + cls.price, 0).toFixed(2)}
                            </button>
                        )}
                    </div>

                    {viewMode === 'list' ? (
                        <>
                            {classes.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-100">
                                    <p className="text-gray-500">No classes available at the moment.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mx-auto max-w-xl p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <Calendar
                                onChange={onDateChange}
                                value={calendarDate}
                                tileContent={tileContent}
                                className="border-0" // Remove default calendar border
                            />
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4 text-[#1f5c51]">
                                    Classes on {calendarDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h3>
                                {classesOnDate.length > 0 ? (
                                    classesOnDate.map(cls => <ClassCard key={cls.id} cls={cls} isCalendarView />)
                                ) : (
                                    <p className="text-sm text-gray-500">No classes scheduled for this day.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            {/* Inject global styles for calendar dot and tile hover */}
            <style jsx global>{`
                .dot {
                    height: 6px;
                    width: 6px;
                    background-color: #34d399; /* Adjust color as needed */
                    border-radius: 50%;
                    margin: 2px auto 0;
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                    background-color: #d1f0e5; /* Softer green hover */
                    border-radius: 0.375rem; /* Match other rounded corners */
                }
                .react-calendar__tile--active {
                    background-color: #2e7d6f !important; /* Main green for active */
                    color: white !important;
                     border-radius: 0.375rem;
                }
                 .react-calendar__tile--now {
                    background: #e6f4f1; /* Lighter green for today */
                     border-radius: 0.375rem;
                }
                 .react-calendar__tile--now:enabled:hover,
                 .react-calendar__tile--now:enabled:focus {
                     background: #c1e8dc;
                 }
            `}</style>
        </div>
    );
}