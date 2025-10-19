'use client';

import React, { useEffect, useMemo, useState, MouseEvent } from 'react';
// FIX: Correctly import the 'Value' type using 'import type' on a separate line
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Value } from "react-calendar";

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

            if (classErr) throw classErr;

            const mappedData: ClassItem[] = classesData.map((c) => ({
                ...c,
                capacity: Number(c.capacity ?? 0),
                price: c.price != null ? Number(c.price) : null,
                duration: c.duration != null ? Number(c.duration) : null,
                currentBookings: Number(c.bookings_count ?? 0),
                spaces_left: Number(c.capacity ?? 0) - Number(c.bookings_count ?? 0),
            }));
            setClasses(mappedData);
        } catch (e) {
            console.error('Error fetching classes:', e);
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
            if (error) throw error;
            alert('Class cancelled and participants notified.');
            fetchClasses();
        } catch (err) {
            console.error(err);
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

    const classesOnDate = useMemo(
        () => (d: Date) => classes.filter((c) => new Date(c.date).toDateString() === d.toDateString()),
        [classes]
    );

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null;
        const has = classes.some((c) => new Date(c.date).toDateString() === date.toDateString());
        return has ? <div className="h-2 w-2 rounded-full bg-[#2e7d6f] mt-1 mx-auto" /> : null;
    };

    const handleCalendarChange = (value: Value, event: MouseEvent<HTMLButtonElement>) => {
        const newDate = Array.isArray(value) ? value[0] : value;
        if (newDate) {
            setCalendarDate(newDate);
        }
        // You don't have to use the 'event' argument if you don't need it
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

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white">
                <Navbar />
                <main className="flex-1 px-4 py-10 sm:px-6 lg:px-12"><p>Loading...</p></main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#d1f0e5] to-white">
            <Navbar />
            <main className="flex-1 px-4 py-10 sm:px-6 lg:px-12">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
                        {user && <span className="text-gray-600 font-medium">Welcome, {user.name}!</span>}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200'}`}>List View</button>
                            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-[#2e7d6f] text-white' : 'bg-gray-200'}`}>Calendar View</button>
                            <button onClick={handleLogout} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Log out</button>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl border border-green-100 p-6 space-y-6">
                        <h2 className="text-xl font-semibold text-green-700">Add New Class</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input name="title" value={formData.title} onChange={handleFormChange} placeholder="Title" className="p-3 border border-gray-300 rounded-xl" />
                            <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="p-3 border border-gray-300 rounded-xl" />
                            <input type="time" name="time" value={formData.time} onChange={handleFormChange} className="p-3 border border-gray-300 rounded-xl" />
                            <input type="number" name="capacity" value={formData.capacity} onChange={handleFormChange} placeholder="Capacity" className="p-3 border border-gray-300 rounded-xl" />
                            <input type="number" name="duration" value={formData.duration} onChange={handleFormChange} placeholder="Duration (minutes)" className="p-3 border border-gray-300 rounded-xl" />
                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleFormChange} placeholder="Price (£)" className="p-3 border border-gray-300 rounded-xl" />
                        </div>
                        <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Description" className="w-full p-3 border border-gray-300 rounded-xl" />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={repeatWeekly} onChange={() => setRepeatWeekly(!repeatWeekly)} />
                                Repeat weekly
                            </label>
                            {repeatWeekly && <input type="number" min={1} max={20} value={repeatCount} onChange={(e) => setRepeatCount(Number(e.target.value))} className="p-2 border border-gray-300 rounded-xl w-40" placeholder="Weeks" />}
                        </div>
                        <div>
                            <button onClick={createClass} className="bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-800 transition">Add Class</button>
                        </div>
                    </div>
                    {viewMode === 'list' ? (
                        <div className="grid gap-6">
                            {classes.map((cls) => (
                                <section key={cls.id} className="bg-white rounded-2xl shadow-md border border-green-100 p-6 transition-all duration-500">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className={`${openRegisterId === cls.id ? 'lg:w-1/2' : 'w-full'}`}>
                                            {editingId === cls.id ? (
                                                <>
                                                    <input type="text" name="title" value={editFormData.title || ''} onChange={handleEditChange} className="w-full p-3 border rounded-xl mb-3" />
                                                    <input type="date" name="date" value={editFormData.date || ''} onChange={handleEditChange} className="w-full p-3 border rounded-xl mb-3" />
                                                    <textarea name="description" value={editFormData.description || ''} onChange={handleEditChange} className="w-full p-3 border rounded-xl mb-3" />
                                                    <button onClick={() => updateClass(cls.id)} className="text-green-700 hover:underline">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline ml-4">Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <h2 className="text-xl font-semibold text-green-800">{cls.title}</h2>
                                                    <p className="text-sm text-gray-600 italic">{cls.date} {cls.time ? `at ${cls.time}` : ''}</p>
                                                    <p className="text-gray-700 mt-2">{cls.description}</p>
                                                    <div className="flex gap-4 pt-2">
                                                        <button onClick={() => startEdit(cls)} className="text-blue-600 hover:underline">Edit</button>
                                                        <button onClick={() => deleteClass(cls.id)} className="text-red-600 hover:underline">Delete</button>
                                                        <button onClick={() => fetchRegister(cls.id)} className="px-3 py-2 border border-green-500 rounded-xl text-green-700">{openRegisterId === cls.id ? 'Hide Register' : 'View Register'}</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openRegisterId === cls.id ? 'opacity-100 lg:w-1/2 max-h-[500px]' : 'opacity-0 w-0 max-h-0'}`}>
                                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-inner overflow-y-auto h-full">
                                                <h3 className="font-semibold text-gray-700 mb-3">Registered Participants:</h3>
                                                {registrations[cls.id]?.length > 0 ? (
                                                    <ul className="space-y-3">{registrations[cls.id].map(reg => <li key={reg.bookingId} className="p-3 rounded-lg bg-white border"><span className="block font-medium">{reg.name}</span><span className="text-xs text-gray-500">{reg.email}</span></li>)}</ul>
                                                ) : <p className="text-sm text-gray-500 italic">No participants yet.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="mx-auto max-w-3xl p-6 bg-white rounded-xl shadow-lg border border-green-200">
                            <Calendar onChange={handleCalendarChange} value={calendarDate} tileContent={tileContent} className="rounded-lg" />                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-[#2e7d6f] mb-4">Classes on {calendarDate.toDateString()}</h3>
                                {classesOnDate(calendarDate).length === 0 ? <p className="text-gray-500">No classes scheduled.</p> : classesOnDate(calendarDate).map(cls => (
                                    <div key={cls.id} className="bg-green-50 rounded-lg p-4 mb-2 border">
                                        <h4 className="font-semibold">{cls.title}</h4>
                                        <button onClick={() => deleteClass(cls.id)} className="text-sm bg-red-200 px-3 py-1 rounded">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <style jsx global>{`
                .react-calendar { width: 100% !important; border: none; font-family: Inter, system-ui; }
                .react-calendar__navigation button { color: #2e7d6f; font-weight: 600; }
                .react-calendar__tile { border-radius: 0.5rem; }
                .react-calendar__tile:hover { background-color: #d1f0e5; }
                .react-calendar__tile--active { background-color: #2e7d6f !important; color: white !important; }
            `}</style>
        </div>
    );
}