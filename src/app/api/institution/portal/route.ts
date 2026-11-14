import { NextRequest, NextResponse } from 'next/server';
import { guardInstitutionAdmin } from '@/lib/auth/serverAuth';
import { getRepresentativeByUserId } from '@/services/admin/representatives';
import { getCollegeById } from '@/services/colleges';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logAdminAction } from '@/services/admin/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardInstitutionAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const user = auth.user!;

    const rep = await getRepresentativeByUserId(user.uid);
    const collegeId = rep?.collegeId || user.collegeId;

    if (!collegeId) {
      return NextResponse.json({ success: false, error: 'No approved institution associated with your representative account' }, { status: 404 });
    }

    const college = await getCollegeById(collegeId);
    if (!college) {
      return NextResponse.json({ success: false, error: 'Institution record not found' }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    let courses: unknown[] = [];
    let enquiries: unknown[] = [];
    let documents: unknown[] = [];

    if (supabase) {
      try {
        const [cRes, eRes, dRes] = await Promise.all([
          supabase.from('courses').select('*').eq('college_id', collegeId),
          supabase.from('student_enquiries').select('*, enquiry_messages(*)').eq('college_id', collegeId),
          supabase.from('college_documents').select('*').eq('college_id', collegeId),
        ]);
        courses = cRes.data || [];
        enquiries = eRes.data || [];
        documents = dRes.data || [];
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        representative: rep,
        college,
        courses,
        enquiries,
        documents,
      },
    });
  } catch (err: unknown) {
    console.error('API /api/institution/portal GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await guardInstitutionAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const user = auth.user!;

    const rep = await getRepresentativeByUserId(user.uid);
    const collegeId = rep?.collegeId || user.collegeId;

    if (!collegeId) {
      return NextResponse.json({ success: false, error: 'No approved institution associated with account' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.website) updateData.website = body.website;
    if (body.description) updateData.description = body.description;
    if (body.bannerUrl) updateData.banner_url = body.bannerUrl;
    if (body.logoUrl) updateData.logo_url = body.logoUrl;

    const supabase = getSupabaseAdmin();
    if (supabase && Object.keys(updateData).length > 0) {
      await supabase.from('colleges').update(updateData).eq('id', collegeId);
    }

    await logAdminAction({
      userId: user.uid,
      email: user.email,
      role: 'institution_admin',
      action: 'institution_profile_updated',
      targetEntity: 'college',
      targetId: collegeId,
      newState: updateData,
    });

    return NextResponse.json({ success: true, message: 'Institutional profile updated successfully' });
  } catch (err: unknown) {
    console.error('API /api/institution/portal PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
