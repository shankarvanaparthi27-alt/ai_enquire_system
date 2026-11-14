export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'pa';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type CollegeType =
  | 'Engineering & Technology'
  | 'Medical & Health Sciences'
  | 'Management & Business'
  | 'Arts & Science'
  | 'Law'
  | 'Design & Architecture'
  | 'Agriculture & Allied Sciences';

export type CollegeCategory = 'Government' | 'Private' | 'Autonomous' | 'Deemed University';

export interface Course {
  id: string;
  collegeId: string;
  name: string;
  degreeLevel: 'Diploma' | 'Undergraduate' | 'Postgraduate' | 'Doctoral';
  department: string;
  durationYears: number;
  eligibility: string;
  seats: number;
  tuitionFeePerYear: number;
  currency: string;
}

export interface CollegeContact {
  id: string;
  collegeId: string;
  email: string;
  phone: string;
  admissionHelpline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface College {
  id: string;
  name: string;
  slug: string;
  code: string;
  collegeType: CollegeType;
  category: CollegeCategory;
  state: string;
  city: string;
  website: string;
  establishedYear: number;
  accreditation: string;
  nirfRanking?: number;
  rating: number;
  reviewCount: number;
  logoUrl?: string;
  bannerUrl?: string;
  description: string;
  features: string[];
  contacts?: CollegeContact;
  courses?: Course[];
  placements?: CollegePlacement;
  cutoffs?: CutoffRank[];
  minFeePerYear?: number;
  maxFeePerYear?: number;
  isVerified: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  city?: string;
  state?: string;
  preferredLanguage: SupportedLanguage;
  preferredTheme: ThemeMode;
  targetDegree?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferredLocations: string[];
  preferredCourses: string[];
  preferredCollegeTypes: CollegeType[];
  budgetMin: number;
  budgetMax: number;
  updatedAt: string;
}

export interface FavouriteCollege {
  id: string;
  userId: string;
  collegeId: string;
  createdAt: string;
  college?: College;
}

export interface RecentlyViewedCollege {
  id: string;
  userId: string;
  collegeId: string;
  viewedAt: string;
  college?: College;
}

export interface CollegeSearchParams {
  query?: string;
  location?: string;
  courseCategory?: string;
  collegeType?: string;
  category?: string;
  maxFee?: number;
  minRating?: number;
  sortBy?: 'rating' | 'fee-asc' | 'fee-desc' | 'name-asc' | 'nirf';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserRole = 'super_admin' | 'admin' | 'institution_admin' | 'student';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: UserRole;
  collegeId?: string;
  claims?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// PART 2: Types Matching Verified Supabase Schema & Predictor Engine
// ============================================================================

export type CutoffType = 'rank' | 'percentile' | 'score';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface CutoffRank {
  id: string;
  collegeId: string;
  courseId?: string;
  examName: string;
  cutoffType: CutoffType;
  category: string;
  quota: string;
  openingRank?: number;
  closingRank?: number;
  minPercentile?: number;
  minScore?: number;
  maxScore?: number;
  round: number;
  academicYear: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  sourceAuthority: string;
  sourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  college?: College;
  course?: Course;
}

export interface CollegePlacement {
  id: string;
  collegeId: string;
  academicYear: string;
  highestPackageLpa?: number;
  averagePackageLpa?: number;
  medianPackageLpa?: number;
  placementPercentage?: number;
  totalOffers?: number;
  topRecruiters: string[];
  createdAt?: string;
  college?: College;
}

export interface CollegeDocument {
  id: string;
  collegeId?: string;
  title: string;
  fileUrl: string;
  fileSizeBytes: number;
  fileType: string;
  academicYear: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  chunkCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  college?: College;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  collegeId?: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface ChunkMatchResult {
  id: string;
  documentId: string;
  collegeId?: string;
  content: string;
  pageNumber?: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  language: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface CitationSource {
  documentId?: string;
  documentTitle?: string;
  collegeId?: string;
  collegeName?: string;
  pageNumber?: number;
  fileUrl?: string;
  snippet?: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
  base64?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  content: string;
  language: SupportedLanguage;
  citations?: CitationSource[];
  attachments?: ChatAttachment[];
  createdAt: string;
}

export interface ChatFeedback {
  id: string;
  messageId: string;
  userId: string;
  rating: 1 | -1;
  comment?: string;
  createdAt: string;
}

export type AdmissionChance = 'High' | 'Moderate' | 'Low' | 'Ineligible' | 'Insufficient data';

export interface PredictionItem {
  collegeId: string;
  collegeName: string;
  collegeSlug: string;
  courseId?: string;
  courseName: string;
  degreeLevel: string;
  chance: AdmissionChance;
  cutoffType: CutoffType;
  closingRank?: number;
  minPercentile?: number;
  minScore?: number;
  rankDifference?: number;
  academicYear: string;
  category: string;
  quota: string;
  tuitionFeePerYear?: number;
  explanation: string;
}

export interface PredictorResult {
  id: string;
  userId: string;
  examName: string;
  scoreOrRank: number;
  category: string;
  quota: string;
  targetDegree: string;
  targetStream?: string;
  class12Percentage?: number;
  predictions: PredictionItem[];
  createdAt: string;
}

export interface PredictorInput {
  examName: string;
  scoreOrRank: number;
  category: string;
  quota: string;
  targetDegree: string;
  targetStream?: string;
  class12Percentage?: number;
  preferredState?: string;
}

// ============================================================================
// PART 3: Types for Applications, Document Locker, Deadlines & Helpdesk
// ============================================================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'admitted'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationTimelineEvent {
  id: string;
  applicationId: string;
  status: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface CollegeApplication {
  id: string;
  userId: string;
  collegeId: string;
  courseId?: string;
  applicationNumber: string;
  status: ApplicationStatus;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  category: string;
  quota: string;
  examName?: string;
  scoreOrRank?: number;
  academicYear: string;
  statementOfPurpose?: string;
  notes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  college?: College;
  course?: Course;
  timeline?: ApplicationTimelineEvent[];
}

export type DeadlineEventType =
  | 'application_deadline'
  | 'exam_date'
  | 'result_announcement'
  | 'counseling_round'
  | 'document_verification'
  | 'seat_acceptance';

export interface AdmissionDeadline {
  id: string;
  collegeId?: string;
  examName?: string;
  title: string;
  eventType: DeadlineEventType;
  degreeLevel?: string;
  deadlineDate: string;
  description?: string;
  officialUrl?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  college?: College;
}

export type StudentDocType =
  | 'class_10_marksheet'
  | 'class_12_marksheet'
  | 'degree_certificate'
  | 'rank_card'
  | 'category_certificate'
  | 'identity_proof'
  | 'transfer_certificate'
  | 'other';

export type DocVerificationStatus = 'uploaded' | 'verified' | 'rejected' | 'requires_reupload';

export interface StudentDocument {
  id: string;
  userId: string;
  docType: StudentDocType;
  title: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  verificationStatus: DocVerificationStatus;
  rejectionReason?: string;
  academicYear: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EnquiryCategory =
  | 'admissions'
  | 'fees_scholarship'
  | 'hostel_campus'
  | 'eligibility_cutoffs'
  | 'placements'
  | 'general';

export type EnquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type EnquiryPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EnquiryMessage {
  id: string;
  enquiryId: string;
  senderType: 'student' | 'institution' | 'counselor';
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface StudentEnquiry {
  id: string;
  userId: string;
  collegeId: string;
  ticketNumber: string;
  subject: string;
  category: EnquiryCategory;
  language: SupportedLanguage;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  initialMessage: string;
  createdAt: string;
  updatedAt: string;
  college?: College;
  messages?: EnquiryMessage[];
}

export type StudentActivityType =
  | 'application_created'
  | 'application_submitted'
  | 'application_withdrawn'
  | 'document_uploaded'
  | 'document_deleted'
  | 'enquiry_created'
  | 'enquiry_replied'
  | 'prediction_run'
  | 'college_favourited'
  | 'profile_updated';

export interface StudentActivityLog {
  id: string;
  userId: string;
  activityType: StudentActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface EligibilityScorecard {
  generatedAt: string;
  student: {
    fullName: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    targetDegree?: string;
  };
  academicProfile: {
    examName?: string;
    scoreOrRank?: number;
    category?: string;
    quota?: string;
    class12Percentage?: number;
  };
  summary: {
    totalEvaluated: number;
    highChanceCount: number;
    moderateChanceCount: number;
    lowChanceCount: number;
  };
  predictions: PredictionItem[];
  shortlistedColleges: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    nirfRanking?: number;
    category: string;
  }>;
  activeApplications: Array<{
    applicationNumber: string;
    collegeName: string;
    courseName?: string;
    status: ApplicationStatus;
    appliedAt?: string;
  }>;
}

// ============================================================================
// PART 4: Types for Institutions & Administration Management
// ============================================================================

export type InstitutionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface InstitutionApplication {
  id: string;
  name: string;
  code: string;
  collegeType: string;
  category: string;
  affiliation?: string;
  establishedYear?: number;
  state: string;
  city: string;
  address?: string;
  website?: string;
  email: string;
  phone: string;
  description?: string;
  accreditation?: string;
  nirfRanking?: number;
  logoUrl?: string;
  bannerUrl?: string;
  documents?: Array<{
    title: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  coursesOffered?: Array<{
    name: string;
    degreeLevel: string;
    department?: string;
    durationYears?: number;
    tuitionFeePerYear?: number;
    seats?: number;
  }>;
  status: InstitutionApplicationStatus;
  submittedBy: string;
  reviewNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  collegeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type InstitutionRepStatus = 'pending' | 'active' | 'suspended' | 'revoked';

export interface InstitutionRepresentative {
  id: string;
  userId: string;
  collegeId: string;
  applicationId?: string;
  fullName: string;
  email: string;
  phone?: string;
  designation: string;
  status: InstitutionRepStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  college?: College;
}

export interface AdminRoleRecord {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  collegeId?: string;
  assignedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: UserRole;
  collegeId?: string;
  invitationToken: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  email?: string;
  role: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalStudents: number;
  totalColleges: number;
  totalApprovedInstitutions: number;
  pendingApplications: number;
  rejectedApplications: number;
  suspendedInstitutions: number;
  totalRepresentatives: number;
  totalEnquiries: number;
  openEnquiries: number;
  resolvedEnquiries: number;
  totalDocuments: number;
  recentActivities: AdminAuditLog[];
  recentApplications: InstitutionApplication[];
}

export interface PlatformSettings {
  approvalWorkflow: {
    autoAssignReviewers: boolean;
    requireTwoApprovals: boolean;
    allowCorrectionRequests: boolean;
  };
  representativePermissions: {
    allowFeeUpdates: boolean;
    allowCourseCreation: boolean;
    requireApprovalForBrochures: boolean;
  };
  systemStatus: {
    maintenanceMode: boolean;
    registrationsOpen: boolean;
    enquiryRoutingEnabled: boolean;
  };
}
