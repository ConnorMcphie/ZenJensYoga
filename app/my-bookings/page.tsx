"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "../../lib/supabaseClient";

type User = {
    id: number;
    email: string;
    name: string;
    phone: string;
};

type Class = {
    id: number;
    title: string;
    description: string;
    date: string;   // 'YYYY-MM-DD'
    time: string;   // 'HH:MM:SS'
    duration: number;
    price: number;  // numeric in DB (may arrive as string -> cast)
    capacity: number;
};

type Booking = {
    id: number;
    created_at: string;
    users: User;
    classes: Class;
};

export default function MyBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // load current user from localStorage (your existing pattern)
    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) {
                router.push("/auth");
                return;
            }
            const parsed = JSON.parse(raw);
            // keep only fields we use
            setUser({
                id: parsed.id,
                email: parsed.email,
                name: parsed.name,
                phone: parsed.phone,
            });
        } catch {
            router.push("/auth");
        }
    }, [router]);

    // fetch bookings for this user
    useEffect(() => {
        const fetchBookings = async () => {
            if (!user?.id) return;
            setLoading(true);
            setMessage(null);

            const { data, error } = await supabase
                .from("Bookings")
                .select(
                    `
          id,
          created_at,
          users:userid ( id, email, name, phone ),
          classes:classid ( id, title, description, date, time, duration, price, capacity )
        `
                )
                .eq("userid", user.id)
                .order("date", { foreignTable: "classes", ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error);
                setMessage("There was a problem loading your bookings.");
                setBookings([]);
            } else {
                setBookings((data || []) as unknown as Booking[]);
            }

            setLoading(false);
        };

        fetchBookings();
    }, [user]);

    const upcoming = useMemo(
        () =>
            bookings.filter((b) => {
                const dt = new Date(`${b.classes.date}T${b.classes.time}`);
                return dt.getTime() > Date.now();
            }),
        [bookings]
    );

    const past = useMemo(
        () =>
            bookings.filter((b) => {
                const dt = new Date(`${b.classes.date}T${b.classes.time}`);
                return dt.getTime() <= Date.now();
            }),
        [bookings]
    );

    const formatDateLong = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    const formatBookedOn = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    const generateCalendarLink = (booking: Booking) => {
        const { classes } = booking;
        const start = new Date(`${classes.date}T${classes.time}`);
        const end = new Date(start.getTime() + classes.duration * 60000);

        const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

        const details = `Join us for ${classes.title}. More info: ${window.location.origin}/booking`;
        const location = "59 Kew Gardens, Uddingston, G71 6LT";

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            classes.title
        )}&dates=${formatGoogleDate(start)}/${formatGoogleDate(
            end
        )}&details=${encodeURIComponent(
            details
        )}&location=${encodeURIComponent(location)}&ctz=Europe/London`;
    };

    const cancelBooking = async (booking: Booking) => {
        const { classes, id: bookingId } = booking;
        const classTime = new Date(`${classes.date}T${classes.time}`).getTime();
        const twentyFourHoursBefore = classTime - 24 * 60 * 60 * 1000;

        if (Date.now() > twentyFourHoursBefore) {
            alert("Cancellations are not permitted within 24 hours of the class start time.");
            return;
        }

        if (!confirm(`Are you sure you want to cancel your booking for "${classes.title}"?`)) return;

        const { error } = await supabase.from("Bookings").delete().eq("id", bookingId);

        if (error) {
            console.error(error);
            setMessage("Failed to cancel booking. Please try again.");
            return;
        }

        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setMessage("Booking cancelled successfully.");
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-green-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-bold text-[#2e7d6f]">My Bookings</h1>
                                <p className="text-gray-600">
                                    {user ? (
                                        <>
                                            Bookings for: <span className="font-semibold">{user.email}</span>
                                        </>
                                    ) : (
                                        "Loading profile…"
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push("/booking")}
                                    className="px-4 py-2 bg-[#2e7d6f] text-white rounded-md hover:bg-[#1f5c51] transition"
                                >
                                    Book a Class
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("user");
                                        router.push("/auth");
                                    }}
                                    className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-600 hover:text-white transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {message && (
                            <div
                                className={`mt-4 text-center py-3 rounded-lg ${
                                    message.includes("success")
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                }`}
                            >
                                {message}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7d6f] mx-auto mb-4" />
                            <p className="text-[#2e7d6f] font-medium">Loading your bookings…</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
                                <p className="text-gray-600 mb-4">You don’t have any bookings yet.</p>
                                <button
                                    onClick={() => router.push("/booking")}
                                    className="bg-[#2e7d6f] text-white px-6 py-3 rounded-md hover:bg-[#1f5c51] transition"
                                >
                                    Find a Class
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Upcoming */}
                            {upcoming.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-semibold text-[#2e7d6f] mb-4">
                                        Upcoming Classes ({upcoming.length})
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {upcoming.map((b) => (
                                            <div
                                                key={b.id}
                                                className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition p-6 flex flex-col"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-[#2e7d6f]">
                                                        {b.classes.title}
                                                    </h3>
                                                    <span
                                                        className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Upcoming
                          </span>
                                                </div>

                                                <p className="text-sm text-gray-500">
                                                    {formatDateLong(b.classes.date)} at {b.classes.time}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Duration: {b.classes.duration} minutes
                                                </p>

                                                <p className="text-gray-700 mt-3 text-sm line-clamp-3">
                                                    {b.classes.description}
                                                </p>

                                                <div className="mt-4 space-y-1 text-sm text-gray-700">
                                                    <p>Booked on: {formatBookedOn(b.created_at)}</p>
                                                    <p>Price: £{Number(b.classes.price ?? 0).toFixed(2)}</p>
                                                </div>
                                                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col space-y-2">
                                                <a
                                                    href={generateCalendarLink(b)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full text-center text-green-700 hover:bg-green-50 py-2 px-4 rounded-md border border-green-200 transition text-sm block"
                                                >
                                                    Add to Google Calendar
                                                </a>


                                                    <button
                                                        onClick={() => cancelBooking(b)}
                                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-4 rounded-md border border-red-200 transition text-sm"
                                                    >
                                                        Cancel Booking
                                                    </button>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Past */}
                            {past.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                                        Past Classes ({past.length})
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {past.map((b) => (
                                            <div
                                                key={b.id}
                                                className="bg-gray-50 rounded-2xl shadow-md border border-gray-200 p-6 opacity-90"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-gray-700">
                                                        {b.classes.title}
                                                    </h3>
                                                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                            Completed
                          </span>
                                                </div>

                                                <p className="text-sm text-gray-600">
                                                    {formatDateLong(b.classes.date)} at {b.classes.time}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Duration: {b.classes.duration} minutes
                                                </p>

                                                <p className="text-gray-600 mt-3 text-sm line-clamp-3">
                                                    {b.classes.description}
                                                </p>

                                                <div className="mt-4 text-sm text-gray-700">
                                                    <p>Price: £{Number(b.classes.price ?? 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}