export type UserRole = "rider" | "admin";
export type MemberType = "rider" | "pillion";
export type EventStatus = "draft" | "published" | "completed" | "cancelled";
export type RideDifficulty = "easy" | "moderate" | "hard";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  role: UserRole;
  created_at: string;
}

export interface RiderDetails {
  user_id: string;
  member_type?: MemberType;
  age: number | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  permanent_address: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_2_phone: string | null;
  bike_model: string | null;
  bike_reg_no: string | null;
  driving_licence: string | null;
  experience_level: "beginner" | "intermediate" | "experienced" | null;
  gear_level: "helmet_only" | "basic" | "full_armored" | null;
  vehicle_insurance_status: "valid_insured" | "expired" | "none" | null;
  medical_conditions: string | null;
  personal_health_insurance: boolean;
  has_rsa: boolean;
  rides_with_pillion: boolean;
  instagram_handle: string | null;
  occupation: string | null;
  referral_source: string | null;
  suggestions: string | null;
  declaration_confirmed: boolean;
  digital_signature: string | null;
  registered: boolean;
  dl_image_url: string | null;
  kyc_submitted_at: string | null;
  kyc_rejected: boolean;
  rejection_reason: string | null;
  updated_at: string;
}

export interface ItineraryItem {
  title: string;
  description?: string;
  activity?: string;
}

export interface Ride {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  starts_at: string;
  meeting_point: string;
  destination?: string | null;
  itinerary?: ItineraryItem[] | null;
  activities?: string[] | null;
  distance_km: number | null;
  max_riders: number | null;
  joining_paused: boolean;
  difficulty: RideDifficulty | null;
  cover_url: string | null;
  whatsapp_group_url?: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
}

export interface RideMember {
  event_id: string;
  user_id: string;
  rider_user_id?: string | null;
  pillion_user_id?: string | null;
  created_at: string;
  profile?: Pick<Profile, "id" | "display_name" | "avatar_url">;
  details?: Pick<
    RiderDetails,
    | "member_type"
    | "blood_group"
    | "emergency_contact_name"
    | "emergency_contact_phone"
    | "emergency_contact_relation"
    | "bike_model"
    | "bike_reg_no"
    | "gear_level"
    | "experience_level"
  > | null;
}

export interface Announcement {
  id: string;
  slug: string | null;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  event_id: string;
  url: string;
  thumb_url: string;
  mime: string;
  width: number | null;
  height: number | null;
  alt: string;
  created_at: string;
}

export type StoryCategory = "achievement" | "milestone" | "tour_story" | "spotlight";

export interface StoryStat {
  label: string;
  value: string;
}

export interface StoryPhoto {
  url: string;
  thumb?: string;
  caption?: string;
}

export interface Story {
  id: string;
  slug: string | null;
  title: string;
  subtitle?: string | null;
  category: StoryCategory;
  cover_url?: string | null;
  content: string;
  rider_name?: string | null;
  rider_bike?: string | null;
  rider_id?: string | null;
  author?: string | null;
  tags?: string[] | null;
  stats?: StoryStat[] | null;
  photos?: StoryPhoto[] | null;
  created_by?: string | null;
  created_at: string;
}
