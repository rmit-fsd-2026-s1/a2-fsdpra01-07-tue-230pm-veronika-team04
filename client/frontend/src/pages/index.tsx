import Link from "next/link";
import Layout from "@/components/layout/Layout";
import HomeCarousel from "@/components/HomeCarousel";
import VenueCard from "@/components/VenueCard";
import { useAuth } from "@/context/AuthContext";
import type { Venue } from "@/types/venue";

export default function Home() {
  const { currentUser } = useAuth();

  const venues: Venue[] = [
    {
      id: 1,
      vendorEmail: "",
      name: "Grand Ballroom",
      location: "Downtown",
      capacity: 300,
      price: 5000,
      recommendedSuitability: "Weddings, Conferences",
      description:
        "A spacious and elegant ballroom perfect for large events and celebrations.",
      status: "available",
      image: "/venue1.jpg",
    }
  ];
  const dashboardHref =
    currentUser?.role === "vendor"
      ? "/vendor"
      : currentUser?.role === "admin"
        ? "/admin"
        : "/hirer";

  const navItems = currentUser
      ? [
          { label: "Home", href: "/" },
          {
            label: "My Dashboard",
            href: dashboardHref,
          },
        ]


      : [
          { label: "Log In", href: "/login" },
          { label: "Sign Up", href: "/sign_up" },
        ];

  return (
    <Layout
      headerTitle="Venue Vendors"
      footerText="Student project footer"
      navItems={navItems}
    >
      <div className="space-y-10">
        <HomeCarousel />

        <section>
          <div className="grid gap-6 lg:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} variant="summary" />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="inline-flex rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "#095d44" }}
            >
              See more
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
