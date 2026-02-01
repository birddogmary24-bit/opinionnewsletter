import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;

        if (!id) {
            return NextResponse.json({ error: 'Missing subscriber ID' }, { status: 400 });
        }

        await db.collection('subscribers').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const body = await request.json();
        const { is_test } = body;

        await db.collection('subscribers').doc(id).update({
            is_test: is_test === true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating subscriber:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
