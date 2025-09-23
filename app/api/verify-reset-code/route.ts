import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        console.log('Verifying code for email:', email, 'code:', code);

        if (!email || !code) {
            return NextResponse.json({ message: 'Email and code are required' }, { status: 400 });
        }

        // Make sure table name matches the one used in send-reset-code
        const { data, error } = await supabase
            .from('password_reset_codes') // Changed from 'PasswordResetCodes'
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .order('expires_at', { ascending: false })
            .limit(1);

        console.log('Database query result:', { data, error });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ message: 'Database error' }, { status: 500 });
        }

        if (!data || data.length === 0) {
            console.log('No matching code found for email:', email);
            return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
        }

        const resetRecord = data[0];
        const now = new Date();
        const expiresAt = new Date(resetRecord.expires_at);

        console.log('Code comparison:', {
            now: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            isExpired: now > expiresAt
        });

        if (now > expiresAt) {
            console.log('Code has expired');
            return NextResponse.json({ message: 'Code expired' }, { status: 400 });
        }

        // Optional: Mark as used (only if 'used' column exists)
        // First check if the 'used' column exists, if not, delete the record instead
        try {
            const { error: updateError } = await supabase
                .from('password_reset_codes')
                .update({ used: true })
                .eq('id', resetRecord.id);

            if (updateError) {
                console.log('Used column might not exist, deleting record instead');
                // If 'used' column doesn't exist, delete the record to prevent reuse
                await supabase
                    .from('password_reset_codes')
                    .delete()
                    .eq('id', resetRecord.id);
            }
        } catch (err) {
            console.log('Marking as used failed, deleting record:', err);
            // Delete the record to prevent reuse
            await supabase
                .from('password_reset_codes')
                .delete()
                .eq('id', resetRecord.id);
        }

        console.log('Code verified successfully for email:', email);
        return NextResponse.json({
            message: 'Code verified',
            success: true
        });

    } catch (error) {
        console.error('[VERIFY RESET CODE ERROR]', error);
        return NextResponse.json({
            message: 'Internal server error'
        }, { status: 500 });
    }
}