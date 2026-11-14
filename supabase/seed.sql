-- ==============================================================================
-- PART 1: AI Chatbot for College Enquiry System
-- Seed Data: Verified Institutional Profiles, Courses, Fees & Contacts
-- ==============================================================================

-- 1. Insert Verified Colleges
INSERT INTO colleges (id, name, slug, code, college_type, category, state, city, website, established_year, accreditation, nirf_ranking, rating, review_count, logo_url, banner_url, description, features, min_fee_per_year, max_fee_per_year, is_verified)
VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'Indian Institute of Technology Bombay',
  'iit-bombay',
  'IITB',
  'Engineering & Technology',
  'Government',
  'Maharashtra',
  'Mumbai',
  'https://www.iitb.ac.in',
  1958,
  'Institute of National Importance',
  3,
  4.95,
  3840,
  'https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop',
  'IIT Bombay is recognized globally as an institution of top-tier academic excellence in engineering, science, and technology research, fostering innovation and industry leadership.',
  ARRAY['World-class Labs', '550-Acre Campus', 'Top Research Centers', 'Incubation Hub', '100% Placement Record'],
  220000,
  310000,
  TRUE
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Indian Institute of Technology Madras',
  'iit-madras',
  'IITM',
  'Engineering & Technology',
  'Government',
  'Tamil Nadu',
  'Chennai',
  'https://www.iitm.ac.in',
  1959,
  'Institute of National Importance',
  1,
  4.98,
  4210,
  'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop',
  'Ranked #1 overall in India by NIRF for several consecutive years, IIT Madras is celebrated for its cutting-edge IITM Research Park and deep technological innovation.',
  ARRAY['IITM Research Park', '630-Acre Campus', 'NIRF Overall Rank #1', 'Pravartak Technologies', 'International Faculty'],
  215000,
  295000,
  TRUE
),
(
  'c3333333-3333-3333-3333-333333333333',
  'International Institute of Information Technology Hyderabad',
  'iiit-hyderabad',
  'IIITH',
  'Engineering & Technology',
  'Autonomous',
  'Telangana',
  'Hyderabad',
  'https://www.iiit.ac.in',
  1998,
  'NAAC A++',
  55,
  4.90,
  1950,
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop',
  'IIIT Hyderabad is an autonomous research university renowned for pioneering computer vision, robotics, NLP, and software systems in India.',
  ARRAY['Kohli Center on Intelligent Systems', 'Highest Median CS Package', 'World-Class Coding Culture', 'UGEE & JEE Admissions'],
  360000,
  420000,
  TRUE
),
(
  'c4444444-4444-4444-4444-444444444444',
  'Birla Institute of Technology and Science Pilani',
  'bits-pilani',
  'BITS',
  'Engineering & Technology',
  'Deemed University',
  'Rajasthan',
  'Pilani',
  'https://www.bits-pilani.ac.in',
  1964,
  'Institute of Eminence (IoE)',
  20,
  4.88,
  3120,
  'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=120&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1200&auto=format&fit=crop',
  'An Institute of Eminence with zero reservation and a merit-based admission policy via BITSAT, offering industry-integrated Practice School programs.',
  ARRAY['Institute of Eminence', 'Practice School System', 'Zero Attendance Policy', 'Global Alumni Network'],
  540000,
  610000,
  TRUE
),
(
  'c5555555-5555-5555-5555-555555555555',
  'All India Institute of Medical Sciences New Delhi',
  'aiims-new-delhi',
  'AIIMS',
  'Medical & Health Sciences',
  'Government',
  'Delhi',
  'New Delhi',
  'https://www.aiims.edu',
  1956,
  'Institute of National Importance',
  1,
  4.99,
  4890,
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&auto=format&fit=crop',
  'AIIMS New Delhi is the apex healthcare and medical research institution in India, consistently ranked #1 Medical Institution in the country.',
  ARRAY['Apex Medical Research', 'Super-Specialty Hospital', 'Highly Subsidized Fees', 'State-of-the-Art Trauma Care'],
  1628,
  5000,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Contacts
INSERT INTO college_contacts (college_id, email, phone, admission_helpline, address, city, state, pincode)
VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'admissions@iitb.ac.in',
  '+91-22-2572-2545',
  '1800-22-4488',
  'Main Gate Road, Powai',
  'Mumbai',
  'Maharashtra',
  '400076'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'admissions@iitm.ac.in',
  '+91-44-2257-8000',
  '1800-44-9900',
  'Sardar Patel Road, Guindy',
  'Chennai',
  'Tamil Nadu',
  '600036'
),
(
  'c3333333-3333-3333-3333-333333333333',
  'ugadmissions@iiit.ac.in',
  '+91-40-6653-1000',
  '+91-40-6653-1250',
  'Prof. C R Rao Road, Gachibowli',
  'Hyderabad',
  'Telangana',
  '500032'
)
ON CONFLICT (college_id) DO NOTHING;
