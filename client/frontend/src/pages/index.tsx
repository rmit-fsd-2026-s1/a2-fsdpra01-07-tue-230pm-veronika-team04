import Link from "next/link";
import { useEffect, useState } from "react";

import Layout from "@/components/layout/Layout";
import HomeCarousel from "@/components/HomeCarousel";
import VenueCard from "@/components/VenueCard";
import { useAuth } from "@/context/AuthContext";
import { venueApi } from "@/services/venueApi";
import type { Venue } from "@/types/venue";

export default function Home() {
  const { currentUser } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVenues() {
    try {
      setIsLoading(true);
      setError("");

      const response = await venueApi.getAllVenues();
      setVenues(response.data.venues);
    } catch {
      setError("Unable to load venues. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Load the venue preview once when the home page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVenues();
  }, []);

  const dashboardHref =
    currentUser?.role === "vendor"
      ? "/vendor"
      : currentUser?.role === "admin"
        ? "/admin"
        : "/hirer";
  const summaryVenues = venues.slice(0, 3);

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
          {isLoading ? (
            <p className="text-sm text-zinc-600">Loading venues...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : summaryVenues.length === 0 ? (
            <p className="text-sm text-zinc-600">No venues available</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {summaryVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} variant="summary" />
              ))}
            </div>
          )}

          {!currentUser && (
            <div className="mt-10 flex justify-center">
              <Link
                href="/login"
                className="inline-flex rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#095d44" }}
              >
                See more
              </Link>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
