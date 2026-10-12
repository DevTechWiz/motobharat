import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/ui/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

const sections: LegalSection[] = [
  {
    title: "Acceptance",
    body: [
      "By using motobharat.in or joining a MotoBharat ride, you agree to these terms and our Privacy Policy. If you don't agree, please don't use the service.",
    ],
  },
  {
    title: "Who can join",
    items: [
      "You are 18 years or older.",
      "You hold a valid driving licence and ride a roadworthy motorcycle.",
      "You have completed rider registration (KYC) before joining any ride.",
    ],
  },
  {
    title: "The service",
    body: [
      "MotoBharat is a free community noticeboard: admins publish rides and notices, riders join and leave. There are no fees, payments or memberships. Rides are announced by the community, for the community — no ride is guaranteed.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You are responsible for the information you enter. Keep your KYC accurate — it exists so admins can reach you or your emergency contact if something happens on a ride. One person per account; admins may suspend accounts that break these terms.",
    ],
  },
  {
    title: "Rides are voluntary",
    body: [
      "Rides are organised by volunteers — they are not operated as a transport service. Joining a ride means you ride at your own pace and your own risk, follow the Safety Code and the ride lead's instructions, and obey traffic laws at all times. No racing, no stunts, no alcohol or substances before a ride.",
    ],
  },
  {
    title: "Safety and liability",
    body: [
      "Motorcycling is inherently risky. To the fullest extent permitted by law, MotoBharat and its admins are not responsible for injury, death, damage or loss arising from your participation in a ride or your use of this site. Nothing in these terms limits liability that cannot be limited by law. You confirm that you carry your own licence, insurance and protective gear.",
    ],
  },
  {
    title: "Respect, or ride solo",
    body: [
      "Harassment, abuse, dangerous riding or repeated rule-breaking means removal from the ride — and from the community. Admins decide, and their decisions stand. Questions go to us on Instagram.",
    ],
  },
  {
    title: "Your content and photos",
    body: [
      "You keep ownership of your profile information. Ride photos uploaded by admins may show you participating in community rides; they are published to celebrate the community. Don't post private information about other riders.",
    ],
  },
  {
    title: "External links",
    body: [
      "The site links out to Instagram and other places. Those aren't controlled by us — their own terms and policies apply.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms; changes appear here with a new effective date. Continuing to use the site after a change means you accept it.",
    ],
  },
  {
    title: "Contact",
    body: ["Instagram: @motobharat_warangal (DM)."],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lede="The ground rules for using this site and riding with MotoBharat."
      effective="10 October 2026"
      sections={sections}
    />
  );
}
