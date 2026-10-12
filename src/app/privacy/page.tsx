import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/ui/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections: LegalSection[] = [
  {
    title: "Who we are",
    body: [
      "MotoBharat is a riding community based in Warangal, Telangana, run by volunteer admins. This policy covers motobharat.in — the site where we publish rides, announcements and ride photos. The quickest way to reach us is Instagram: @motobharat_warangal.",
    ],
  },
  {
    title: "What we collect",
    items: [
      "Google sign-in: your name, profile photo and email address. We show your name and photo on your public profile; your email is used only for signing in and stays inside the authentication system.",
      "Profile: display name and city — both public.",
      "Rider KYC (only after you complete registration): age, gender, phone, blood group, emergency contact name and phone, and bike model. Never public.",
      "Ride participation: which rides you join or leave.",
      "Photos: ride galleries uploaded by admins may feature you.",
    ],
  },
  {
    title: "What's public and what isn't",
    body: [
      "Public to anyone: display name, profile photo, city, and which rides you've joined. Private — visible only to you and community admins: everything in Rider KYC, including your phone number and emergency contact. We never publish blood groups or emergency contacts; admins see them only to respond to an incident on a ride.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "We use one kind of cookie: the session cookie that keeps you signed in. No advertising cookies, no tracking pixels, no analytics scripts.",
    ],
  },
  {
    title: "Who else receives your data",
    items: [
      "Google — sign-in (name, photo, email).",
      "Supabase — database and authentication (all app data).",
      "Cloudflare — site hosting and the storage serving ride photos.",
      "Unsplash — background photos on public pages are served from Unsplash's CDN.",
    ],
    body: [
      "We do not sell or rent your data to anyone. Instagram links open Instagram's own service, governed by their policies.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Until you ask us to delete it. Deleting your account removes your profile, your KYC details and your ride joins. Message us on Instagram and an admin will take care of it.",
    ],
  },
  {
    title: "Photos of you",
    body: [
      "Ride galleries exist to capture community memories. If you appear in a photo you want removed, message us on Instagram — admins will delete it.",
    ],
  },
  {
    title: "Age limit",
    body: ["The community is 18+. We don't knowingly collect data from anyone under 18."],
  },
  {
    title: "Changes to this policy",
    body: ["When this policy changes, the updated version appears here with a new effective date."],
  },
  {
    title: "Contact",
    body: ["Instagram: @motobharat_warangal (DM)."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lede="What we collect, why we collect it, and who can see it. Written for humans, not lawyers."
      effective="10 October 2026"
      sections={sections}
    />
  );
}
