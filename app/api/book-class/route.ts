// app/api/book-class/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const { userId, classId } = await req.json();

        if (!userId || !classId) {
            return NextResponse.json({ message: 'Missing data' }, { status: 400 });
        }

        // Check if class exists & capacity
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            return NextResponse.json({ message: 'Class not found' }, { status: 404 });
        }

        // Count current bookings
        const { count: bookingCount, error: bookingError } = await supabase
            .from('Bookings')
            .select('*', { count: 'exact', head: true })
            .eq('classid', classId);

        if (bookingError) {
            return NextResponse.json({ message: 'Error checking bookings' }, { status: 500 });
        }

        if (bookingCount == classData.capacity) {
            return NextResponse.json({ message: 'Class is full' }, { status: 400 });
        }

        // Prevent duplicate booking
        const { count: userAlreadyBooked } = await supabase
            .from('Bookings')
            .select('*', { count: 'exact', head: true })
            .eq('classid', classId)
            .eq('userid', userId);

        if (userAlreadyBooked && userAlreadyBooked > 0) {
            return NextResponse.json({ message: 'Already booked' }, { status: 400 });
        }

        // Insert booking
        const { error: insertError } = await supabase
            .from('Bookings')
            .insert({ userid: userId, classid: classId });

        if (insertError) {
            return NextResponse.json({ message: 'Failed to book' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Booking successful' }, { status: 200 });
    } catch (err) {
        console.error('Booking error:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
