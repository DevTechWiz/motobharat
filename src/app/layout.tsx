import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth-context";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://motobharat.co"),
  title: {
    default: "MotoBharat — Warangal Riders",
    template: "%s · MotoBharat",
  },
  description:
    "Different Roads. One Community. Warangal's riders community — safe rides, new routes and good people.",
  openGraph: {
    siteName: "MotoBharat — Warangal Riders",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/brand/logo-128.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${manrope.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ScrollProgress />
        <AuthProvider>
          <ToastProvider>
            <Topbar />
            <main className="flex-1 animate-fade-in">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
