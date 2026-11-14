import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { getStudentProfile, updateStudentProfile } from '@/services/profiles';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyFirebaseToken(token);
    if (!verified) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 403 });
    }

    const profile = await getStudentProfile(verified.uid);
    return NextResponse.json({ success: true, data: profile });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('API profile GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyFirebaseToken(token);
    if (!verified) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateStudentProfile(verified.uid, body);
    return NextResponse.json({ success: true, data: updated });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('API profile POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
