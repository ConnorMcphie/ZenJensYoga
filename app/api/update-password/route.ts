// UPDATE-PASSWORD

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const { email, password } = await req.json();

    const hashed = await bcrypt.hash(password, 10);

    const { error } = await supabase
        .from('Users')
        .update({ password: hashed })
        .eq('email', email);

    if (error) {
        return NextResponse.json({ message: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated' });
}
