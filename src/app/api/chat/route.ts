import { NextRequest } from 'next/server';
import { POST as handleChat } from '@/app/api/ai/chat/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handleChat(req);
}
