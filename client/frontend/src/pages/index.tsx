import Link from "next/link";
import Layout from "@/components/layout/Layout";
import HomeCarousel from "@/components/HomeCarousel";
import VenueCard from "@/components/VenueCard";

export default function Home() {

  // Simulated current venue (replace with actual authentication logic)
  // Simulated current venue (replace with actual authentication logic)
  // Simulated current venue (replace with actual authentication logic)
  interface Venue {
    id: number;
    name: string;
    location: string;
    capacity: number;
    price: number;
    recommendedSuitability: string;
    description: string;
    status: "available" | "booked" | "unavailable";
    image: "/venue1.jpg"; // URL or path to the venue image
  }

  const venues: Venue[] = [
    {
      id: 1,
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
  // Simulated current venue (replace with actual authentication logic)
  // Simulated current venue (replace with actual authentication logic)
  // Simulated current venue (replace with actual authentication logic)

  // Simulated current user (replace with actual authentication logic)
  // Simulated current user (replace with actual authentication logic)
  // Simulated current user (replace with actual authentication logic)
  interface User {
    id: number;
    name: string;
    role: "hirer" | "vendor";
  }

  const currentUser: User | null = {
    id: 1,
    name: "Alice",
    role: "hirer",
  };
  // Simulated current user (replace with actual authentication logic)
  // Simulated current user (replace with actual authentication logic)
  // Simulated current user (replace with actual authentication logic)


  const navItems = currentUser
      ? [
          { label: "Home", href: "/" },
          {
            label: "My Dashboard",
            href: currentUser.role === "hirer" ? "/hirer" : "/vendor",
          },
          { label: "Log In", href: "/sign_in" },
          { label: "Sign Up", href: "/sign_up" },
        ]


      : [
          { label: "Log In", href: "/sign_in" },
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
              href="/sign_in"
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
