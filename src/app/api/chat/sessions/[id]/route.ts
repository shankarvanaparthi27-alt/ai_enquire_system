import { NextRequest } from 'next/server';
import { GET as handleGet, PATCH as handlePatch, DELETE as handleDelete } from '@/app/api/ai/sessions/[id]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: any) {
  return handleGet(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: any) {
  return handlePatch(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: any) {
  return handleDelete(req, ctx);
}
