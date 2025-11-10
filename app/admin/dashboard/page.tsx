'use client';

import React, { useEffect, useMemo, useState, MouseEvent } from 'react';
import Calendar from 'react-calendar';
type CalendarValue = Date | [Date | null, Date | null] | null;

import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// --- TYPE DEFINITIONS ---
type AdminUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
};

type ClassItem = {
    id: number;
    title: string;
    description?: string | null;
    date: string;
    time?: string | null;
    capacity: number;
    price?: number | null;
    duration?: number | null;
    currentBookings?: number;
    spaces_left?: number;
};

type ClassFormData = {
    title: string;
    description: string;
    date: string;
    time: string;
    capacity: number;
    price: number;
    duration: number;
};

type RegisterRow = {
    bookingId: number;
    userid: number;
    name: string;
    email: string;
    phone: string;
    created_at?: string | null;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        capacity: '',
        price: '',
        duration: '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ClassFormData>>({});
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [repeatCount, setRepeatCount] = useState<number>(5);
    const [registrations, setRegistrations] = useState<Record<number, RegisterRow[]>>({});
    const [openRegisterId, setOpenRegisterId] = useState<number | null>(null);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const { data: classesData, error: classErr } = await supabase
                .from('class_with_bookings')
                .select('*')
                .order('date', { ascending: true });

            if (classErr) {
                console.error('Error fetching classes:', classErr);
            } else {
                const mappedData: ClassItem[] = classesData.map((c) => ({
                    ...c,
                    capacity: Number(c.capacity ?? 0),
                    price: c.price != null ? Number(c.price) : null,
                    duration: c.duration != null ? Number(c.duration) : null,
                    currentBookings: Number(c.bookings_count ?? 0),
                    spaces_left: Number(c.capacity ?? 0) - Number(c.bookings_count ?? 0),
                }));
                setClasses(mappedData);
            }
        } catch (e) {
            console.error('Error processing class data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAdmin = async () => {
            const adminStr = localStorage.getItem('adminUser');
            if (!adminStr) {
                router.push('/admin');
                return;
            }
            try {
                const adminUser = JSON.parse(adminStr) as AdminUser;
                const { data: u, error } = await supabase
                    .from('Users')
                    .select('id, name, email, is_admin')
                    .eq('id', adminUser.id)
                    .single();
                if (error || !u || !u.is_admin) {
                    localStorage.removeItem('adminUser');
                    router.push('/admin');
                } else {
                    setUser(u);
                    await fetchClasses();
                }
            } catch (e) {
                console.error('Admin check error:', e);
                localStorage.removeItem('adminUser');
                router.push('/admin');
            }
        };
        checkAdmin();
    }, [router]);

    // *** CHANGES: 'now' is moved INSIDE the useMemo hooks ***
    const upcomingClasses = useMemo(
        () => {
            const now = new Date(); // <-- 'now' is defined inside
            return classes.filter(c => {
                const classDateTime = new Date(`${c.date}T${c.time || '00:00:00'}`);
                return classDateTime >= now;
            });
        },
        [classes] // <-- Dependency array only contains 'classes'
    );
    const pastClasses = useMemo(
        () => {
            const now = new Date(); // <-- 'now' is defined inside
            return classes.filter(c => {
                const classDateTime = new Date(`${c.date}T${c.time || '00:00:00'}`);
                return classDateTime < now;
            }).reverse(); // Show most recent past classes first
        },
        [classes] // <-- Dependency array only contains 'classes'
    );
    // *** END CHANGES ***

    const createClass = async () => {
        if (!formData.title || !formData.date || !formData.time) {
            alert('Please fill title, date and time.');
            return;
        }
        const selectedDate = new Date(formData.date);
        const today = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert("You cannot create a class in the past.");
            return;
        }
        if (Number(formData.capacity) < 0 || Number(formData.price) < 0 || Number(formData.duration) < 0) {
            alert("Capacity, price, and duration cannot be negative.");
            return;
        }
        const baseDate = new Date(formData.date);
        const toInsert = repeatWeekly
            ? Array.from({ length: repeatCount }, (_, i) => {
                const newDate = new Date(baseDate);
                newDate.setDate(baseDate.getDate() + i * 7);
                return {
                    ...formData,
                    date: newDate.toISOString().split('T')[0],
                    capacity: Number(formData.capacity || 0),
                    price: Number(formData.price || 0),
                    duration: Number(formData.duration || 0),
                };
            })
            : [{
                ...formData,
                capacity: Number(formData.capacity || 0),
                price: Number(formData.price || 0),
                duration: Number(formData.duration || 0),
            }];

        const { error } = await supabase.from('classes').insert(toInsert);
        if (error) {
            alert('Error creating class: ' + error.message);
        } else {
            setFormData({ title: '', description: '', date: '', time: '', capacity: '', price: '', duration: '' });
            setRepeatWeekly(false);
            setRepeatCount(5);
            await fetchClasses();
        }
    };

    const startEdit = (cls: ClassItem) => {
        setEditingId(cls.id);
        setEditFormData({
            title: cls.title ?? '',
            description: cls.description ?? '',
            date: cls.date ?? '',
            time: cls.time ?? '',
            capacity: cls.capacity ?? 0,
            price: cls.price ?? 0,
            duration: cls.duration ?? 0,
        });
    };

    const updateClass = async (id: number) => {
        const payload = {
            ...editFormData,
            capacity: Number(editFormData.capacity || 0),
            price: Number(editFormData.price || 0),
            duration: Number(editFormData.duration || 0),
        };
        const { error } = await supabase.from('classes').update(payload).eq('id', id);
        if (error) {
            alert('Error updating class: ' + error.message);
        } else {
            setEditingId(null);
            setEditFormData({});
            await fetchClasses();
        }
    };

    const deleteClass = async (classId: number) => {
        if (!confirm('Are you sure you want to cancel this class and notify participants?')) return;

        try {
            await fetch('/api/notify-cancellation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId }),
            });
            const { error } = await supabase.from('classes').delete().eq('id', classId);

            if (error) {
                console.error(error);
                alert('Failed to cancel class: ' + error.message);
            } else {
                alert('Class cancelled and participants notified.');
                fetchClasses();
            }
        } catch (err) {
            console.error('Error during cancellation process:', err);
            alert('Failed to cancel class or send notifications.');
        }
    };

    const fetchRegister = async (classId: number) => {
        if (openRegisterId === classId) {
            setOpenRegisterId(null);
            return;
        }

        if (!registrations[classId]) {
            const { data: bookingRows, error: bErr } = await supabase
                .from('Bookings').select('id, userid').eq('classid', classId).order('id', { ascending: true });
            if (bErr) {
                alert('Failed to fetch bookings: ' + bErr.message);
                return;
            }

            const userIds = Array.from(new Set(bookingRows.map((b) => b.userid).filter(Boolean)));
            if (userIds.length === 0) {
                setRegistrations((prev) => ({ ...prev, [classId]: [] }));
                setOpenRegisterId(classId);
                return;
            }

            const { data: users, error: uErr } = await supabase.from('Users').select('id, name, email, phone').in('id', userIds);
            if (uErr) {
                alert('Failed to fetch users: ' + uErr.message);
                return;
            }

            const userMap = new Map(users.map(u => [u.id, u]));
            const merged: RegisterRow[] = bookingRows.map((b) => {
                const u = userMap.get(b.userid);
                return {
                    bookingId: b.id,
                    userid: b.userid,
                    name: u?.name || 'Unknown',
                    email: u?.email || 'No email',
                    phone: u?.phone || 'No phone',
                };
            });
            setRegistrations((prev) => ({ ...prev, [classId]: merged }));
        }
        setOpenRegisterId(classId);
    };

    // This uses ALL classes, which is correct for the admin calendar view
    const classesOnDate = useMemo(
        () => (d: Date) => classes.filter((c) => new Date(c.date).toDateString() === d.toDateString()),
        [classes]
    );

    // This uses ALL classes, which is correct for the admin calendar view
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null;
        const has = classes.some((c) => new Date(c.date).toDateString() === date.toDateString());
        return has ? <div className="h-2 w-2 rounded-full bg-[#2e7d6f] mt-1 mx-auto" /> : null;
    };

    // FIX: Update function signature with correct types
    const handleCalendarChange = (value: CalendarValue, _event: MouseEvent<HTMLButtonElement>) => { // Added underscore
        const newDate = Array.isArray(value) ? value[0] : value;
        if (newDate instanceof Date) { // Check if it's a valid Date object
            setCalendarDate(newDate);
        } else if (newDate === null) {
            // Optionally handle the case where the date selection is cleared
            // For example, reset to today: setCalendarDate(new Date());
        }
        // event parameter is now accepted but not used
    };


    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        router.push('/admin');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    if (loading && !user) { // Show loading only if user data hasn't loaded yet
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white">
                <Navbar />
                <main className="flex-1 px-4 py-10 sm:px-6 lg:px-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7d6f]"></div>
                </main>
                <Footer />
            </div>
        );
    }

    // *** CHANGE: Reusable card component for class list ***
    const ClassListCard = ({ cls, isHistory = false }: { cls: ClassItem; isHistory?: boolean }) => (
        <section key={cls.id} className={`bg-white rounded-xl shadow-md border ${isHistory ? 'border-gray-200 opacity-80' : 'border-green-100'} p-4 sm:p-6 transition-all duration-300 ease-in-out`}>
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Class Details / Edit Form */}
                <div className={`${openRegisterId === cls.id ? 'lg:w-2/3' : 'w-full'} space-y-3`}>
                    {editingId === cls.id ? (
                        // Edit Form
                        <div className='space-y-3'>
                            <h3 className="text-lg font-semibold text-gray-700">Editing Class</h3>
                            <input type="text" name="title" placeholder='Title *' value={editFormData.title || ''} onChange={handleEditChange} required className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <textarea name="description" placeholder='Description' value={editFormData.description || ''} onChange={handleEditChange} rows={3} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <div className='grid grid-cols-2 gap-3'>
                                <input type="date" name="date" value={editFormData.date || ''} onChange={handleEditChange} required className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                                <input type="time" name="time" value={editFormData.time || ''} onChange={handleEditChange} required className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                                <input type="number" name="capacity" placeholder='Capacity' value={editFormData.capacity ?? ''} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                                <input type="number" name="duration" placeholder='Duration (mins)' value={editFormData.duration ?? ''} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                                <input type="number" step="0.01" name="price" placeholder='Price (£)' value={editFormData.price ?? ''} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 col-span-2" />
                            </div>
                            <div className='flex gap-3'>
                                <button onClick={() => updateClass(cls.id)} className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">Save Changes</button>
                                <button onClick={() => setEditingId(null)} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        // Display Class Details
                        <div>
                            <h2 className={`text-xl font-semibold ${isHistory ? 'text-gray-600' : 'text-green-800'}`}>{cls.title}</h2>
                            <p className="text-sm text-gray-600 italic mb-2">{new Date(cls.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {cls.time ? `at ${cls.time}` : ''}</p>
                            <p className="text-gray-700 mt-1 text-sm">{cls.description}</p>
                            <div className="text-sm mt-2 space-x-4">
                                <span>Capacity: {cls.capacity}</span>
                                <span>Duration: {cls.duration} mins</span>
                                <span>Price: £{cls.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-4 pt-3 mt-3 border-t border-gray-100">
                                {/* Hide Edit/Delete for history, or keep them? Keeping them for now. */}
                                <button onClick={() => startEdit(cls)} className="text-sm text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => deleteClass(cls.id)} className="text-sm text-red-600 hover:underline">Delete Class</button>
                                <button onClick={() => fetchRegister(cls.id)} className={`px-3 py-1.5 border rounded-md hover:bg-green-50 text-xs font-medium ${isHistory ? 'border-gray-400 text-gray-700' : 'border-green-500 text-green-700'}`}>
                                    {openRegisterId === cls.id ? 'Hide Register' : `View Register (${cls.currentBookings}/${cls.capacity})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Register View (Conditional) */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openRegisterId === cls.id ? 'opacity-100 lg:w-1/3 max-h-[400px] lg:max-h-full mt-4 lg:mt-0' : 'opacity-0 w-0 max-h-0'}`}>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-inner overflow-y-auto h-full max-h-[400px]">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Registered ({registrations[cls.id]?.length || 0}):</h3>
                        {registrations[cls.id]?.length > 0 ? (
                            <ul className="space-y-2">{registrations[cls.id].map(reg => (
                                <li key={reg.bookingId} className="p-2 rounded-md bg-white border border-gray-200 text-xs">
                                    <span className="block font-medium text-gray-800">{reg.name}</span>
                                    <span className="text-gray-500 block">{reg.email}</span>
                                    <span className="text-gray-500 block">{reg.phone}</span>
                                </li>
                            ))}</ul>
                        ) : <p className="text-xs text-gray-500 italic">No participants registered yet.</p>}
                    </div>
                </div>
            </div>
        </section>
    );
    // *** END CARD COMPONENT ***


    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white">
            <Navbar />
            <main className="flex-1 px-4 py-10 sm:px-6 lg:px-12">
                <div className="max-w-6xl mx-auto space-y-10">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-100">
                        <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Admin Dashboard</h1>
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            {user && <span className="text-gray-600 font-medium text-sm sm:text-base">Welcome, {user.name}!</span>}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-sm ${viewMode === 'list' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>List</button>
                                <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded text-sm ${viewMode === 'calendar' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Calendar</button>
                            </div>
                            <button onClick={handleLogout} className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200">Log out</button>
                        </div>
                    </div>

                    {/* Add Class Form */}
                    <div className="bg-white shadow-lg rounded-2xl border border-green-100 p-6 space-y-6">
                        <h2 className="text-xl font-semibold text-green-700">Add New Class</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input name="title" value={formData.title} onChange={handleFormChange} placeholder="Title *" required className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <input type="date" name="date" value={formData.date} onChange={handleFormChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <input type="time" name="time" value={formData.time} onChange={handleFormChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <input type="number" name="capacity" value={formData.capacity} onChange={handleFormChange} placeholder="Capacity (e.g., 10)" className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <input type="number" name="duration" value={formData.duration} onChange={handleFormChange} placeholder="Duration (mins, e.g., 60)" className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleFormChange} placeholder="Price (£, e.g., 10.00)" className="p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Description (Optional)" rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={repeatWeekly} onChange={() => setRepeatWeekly(!repeatWeekly)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                                <span className="text-sm text-gray-700">Repeat weekly</span>
                            </label>
                            {repeatWeekly && (
                                <div className='flex items-center gap-2'>
                                    <span className="text-sm text-gray-700">for the next</span>
                                    <input type="number" min={1} max={20} value={repeatCount} onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))} className="p-2 border border-gray-300 rounded-lg w-20 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                                    <span className="text-sm text-gray-700">weeks</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <button onClick={createClass} className="bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-800 transition shadow">Add Class</button>
                        </div>
                    </div>

                    {/* Class List or Calendar View */}
                    {viewMode === 'list' ? (
                        <div className="space-y-10">
                            {/* *** CHANGE: Upcoming Classes Section *** */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold text-green-800 border-b pb-2">Manage Upcoming Classes</h2>
                                {loading ? (
                                    <p className="text-center text-gray-500">Loading classes...</p>
                                ) : upcomingClasses.length === 0 ? (
                                    <p className="text-center text-gray-500 italic">No upcoming classes found.</p>
                                ) : (
                                    upcomingClasses.map((cls) => (
                                        <ClassListCard key={cls.id} cls={cls} isHistory={false} />
                                    ))
                                )}
                            </section>

                            {/* *** CHANGE: Past Classes (History) Section *** */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Class History</h2>
                                {loading ? (
                                    <p className="text-center text-gray-500">Loading history...</p>
                                ) : pastClasses.length === 0 ? (
                                    <p className="text-center text-gray-500 italic">No past classes found.</p>
                                ) : (
                                    pastClasses.map((cls) => (
                                        <ClassListCard key={cls.id} cls={cls} isHistory={true} />
                                    ))
                                )}
                            </section>
                        </div>
                    ) : (
                        // Calendar View
                        <div className="mx-auto max-w-3xl p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-green-100">
                            <Calendar
                                onChange={handleCalendarChange}
                                value={calendarDate}
                                tileContent={tileContent}
                                className="border-0 rounded-lg" // Remove default border
                            />
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-[#2e7d6f] mb-4 border-b pb-2">
                                    Classes on {calendarDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                {/* This correctly maps ALL classes for the selected date */}
                                {classesOnDate(calendarDate).length === 0 ? (
                                    <p className="text-gray-500 text-sm italic">No classes scheduled.</p>
                                ) : (
                                    classesOnDate(calendarDate).map(cls => (
                                        <div key={cls.id} className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-sm text-green-800">{cls.title}</h4>
                                                <p className="text-xs text-gray-600">{cls.time} ({cls.duration} mins) - {cls.currentBookings}/{cls.capacity} booked</p>
                                            </div>
                                            <div className='flex gap-2'>
                                                <button onClick={() => startEdit(cls)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Edit</button>
                                                <button onClick={() => deleteClass(cls.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Delete</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            {/* Global styles specific to this page */}
            <style jsx global>{`
                /* Calendar specific styles */
                .react-calendar { width: 100% !important; border: none; font-family: inherit; }
                .react-calendar__navigation button { color: #2e7d6f; font-weight: 600; border-radius: 0.375rem; }
                .react-calendar__navigation button:hover { background-color: #e6f4f1; }
                .react-calendar__month-view__weekdays__weekday { font-size: 0.75rem; font-weight: 500; text-transform: uppercase; color: #555; }
                .react-calendar__tile { border-radius: 0.375rem; padding: 0.75em 0.5em; /* Adjust padding if needed */ }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus { background-color: #d1f0e5; }
                .react-calendar__tile--now { background: #e6f4f1; }
                .react-calendar__tile--now:enabled:hover,
                .react-calendar__tile--now:enabled:focus { background: #c1e8dc; }
                .react-calendar__tile--active { background-color: #2e7d6f !important; color: white !important; }
                .react-calendar__tile--hasActive { background-color: #a6d9cf !important; } /* Range selection color */
            `}</style>
        </div>
    );
}