export type UserRole = "rider" | "admin";
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
  age: number | null;
  gender: string | null;
  phone: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bike_model: string | null;
  registered: boolean;
  updated_at: string;
}

export interface Ride {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  starts_at: string;
  meeting_point: string;
  distance_km: number | null;
  difficulty: RideDifficulty | null;
  cover_url: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
}

export interface RideMember {
  event_id: string;
  user_id: string;
  created_at: string;
  profile?: Pick<Profile, "id" | "display_name" | "avatar_url">;
  details?: Pick<
    RiderDetails,
    "blood_group" | "emergency_contact_name" | "emergency_contact_phone" | "bike_model"
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
