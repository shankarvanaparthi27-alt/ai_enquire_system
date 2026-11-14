import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  EnquiryCategory,
  EnquiryMessage,
  EnquiryPriority,
  EnquiryStatus,
  StudentEnquiry,
  SupportedLanguage,
} from '@/types';
import { mapDatabaseCollege, getCollegeById } from '@/services/colleges';
import { logStudentActivity } from '@/services/activityLogs';

// In-memory fallback
const inMemoryEnquiries = new Map<string, StudentEnquiry[]>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseEnquiry(row: any): StudentEnquiry {
  const messages: EnquiryMessage[] = Array.isArray(row.enquiry_messages)
    ? row.enquiry_messages.map((m: any) => ({
        id: m.id,
        enquiryId: m.enquiry_id,
        senderType: m.sender_type,
        senderId: m.sender_id,
        senderName: m.sender_name,
        message: m.message,
        createdAt: m.created_at,
      }))
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    collegeId: row.college_id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    category: row.category as EnquiryCategory,
    language: (row.language as SupportedLanguage) || 'en',
    status: row.status as EnquiryStatus,
    priority: row.priority as EnquiryPriority,
    initialMessage: row.initial_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    college: row.colleges ? mapDatabaseCollege(row.colleges) : undefined,
    messages,
  };
}

export interface CreateEnquiryInput {
  userId: string;
  collegeId: string;
  subject: string;
  category: EnquiryCategory;
  initialMessage: string;
  priority?: EnquiryPriority;
  language?: SupportedLanguage;
  senderName: string;
}

export async function createStudentEnquiry(input: CreateEnquiryInput): Promise<StudentEnquiry> {
  const college = await getCollegeById(input.collegeId);
  const now = new Date().toISOString();
  const ticketNumber = `ENQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newEnquiry: StudentEnquiry = {
    id: `enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: input.userId,
    collegeId: input.collegeId,
    ticketNumber,
    subject: input.subject,
    category: input.category,
    language: input.language || 'en',
    status: 'open',
    priority: input.priority || 'medium',
    initialMessage: input.initialMessage,
    createdAt: now,
    updatedAt: now,
    college: college || undefined,
    messages: [
      {
        id: `msg_${Date.now()}_1`,
        enquiryId: '',
        senderType: 'student',
        senderId: input.userId,
        senderName: input.senderName,
        message: input.initialMessage,
        createdAt: now,
      },
    ],
  };

  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('student_enquiries')
        .insert({
          user_id: input.userId,
          college_id: input.collegeId,
          ticket_number: ticketNumber,
          subject: input.subject,
          category: input.category,
          language: input.language || 'en',
          status: 'open',
          priority: input.priority || 'medium',
          initial_message: input.initialMessage,
        })
        .select()
        .single();

      if (!dbError && dbData) {
        newEnquiry.id = dbData.id;

        // Insert first message
        await supabase.from('enquiry_messages').insert({
          enquiry_id: dbData.id,
          sender_type: 'student',
          sender_id: input.userId,
          sender_name: input.senderName,
          message: input.initialMessage,
        });

        newEnquiry.messages![0].enquiryId = dbData.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  // Update in-memory cache
  const userEnquiries = inMemoryEnquiries.get(input.userId) || [];
  userEnquiries.unshift(newEnquiry);
  inMemoryEnquiries.set(input.userId, userEnquiries);

  // Log activity
  await logStudentActivity({
    userId: input.userId,
    activityType: 'enquiry_created',
    title: 'Submitted Admission Enquiry',
    description: `Ticket #${ticketNumber}: "${input.subject}" to ${college?.name || 'Institution'}.`,
    metadata: {
      enquiryId: newEnquiry.id,
      ticketNumber,
      collegeId: input.collegeId,
      category: input.category,
    },
  });

  return newEnquiry;
}

export async function getStudentEnquiries(userId: string): Promise<StudentEnquiry[]> {
  const supabase = getSupabaseAdmin() || getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_enquiries')
        .select('*, colleges(*), enquiry_messages(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDatabaseEnquiry);
      }
    } catch {
      // Fallback
    }
  }

  return inMemoryEnquiries.get(userId) || [];
}

export async function addEnquiryReply(
  enquiryId: string,
  userId: string,
  senderName: string,
  message: string,
  senderType: 'student' | 'institution' | 'counselor' = 'student'
): Promise<EnquiryMessage | null> {
  const enquiries = await getStudentEnquiries(userId);
  const enquiry = enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return null;

  const now = new Date().toISOString();
  const reply: EnquiryMessage = {
    id: `msg_${Date.now()}`,
    enquiryId,
    senderType,
    senderId: userId,
    senderName,
    message,
    createdAt: now,
  };

  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('enquiry_messages').insert({
        enquiry_id: enquiryId,
        sender_type: senderType,
        sender_id: userId,
        sender_name: senderName,
        message,
      });

      await supabase
        .from('student_enquiries')
        .update({ updated_at: now })
        .eq('id', enquiryId)
        .eq('user_id', userId);
    } catch {
      // Fallback
    }
  }

  // Update in-memory
  enquiry.messages = enquiry.messages || [];
  enquiry.messages.push(reply);
  enquiry.updatedAt = now;

  // Log activity
  await logStudentActivity({
    userId,
    activityType: 'enquiry_replied',
    title: 'Sent Enquiry Message',
    description: `Replied to Ticket #${enquiry.ticketNumber}.`,
    metadata: { enquiryId, ticketNumber: enquiry.ticketNumber },
  });

  return reply;
}
