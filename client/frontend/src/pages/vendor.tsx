import { Badge, Button, HStack, Icon, Separator } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FaBuilding, FaChartBar, FaStar, FaUsers } from "react-icons/fa";

import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

const sampleApplicants = [
  {
    id: 1,
    hirerEmail: "alex@example.com",
    venueName: "Garden Terrace",
    eventName: "Engagement Party",
    guestCount: 80,
    eventDate: "2026-07-18",
    eventTime: "18:00",
    duration: "4 hours",
    status: "Pending",
    averageRating: 4.8,
  },
  {
    id: 2,
    hirerEmail: "morgan@example.com",
    venueName: "Harbour Room",
    eventName: "Corporate Mixer",
    guestCount: 120,
    eventDate: "2026-08-02",
    eventTime: "17:30",
    duration: "3 hours",
    status: "Accepted",
    averageRating: 4.2,
  },
];

const sampleVenues = [
  {
    id: 1,
    name: "Garden Terrace",
    location: "Sydney CBD",
    capacity: 100,
    status: "available",
  },
  {
    id: 2,
    name: "Harbour Room",
    location: "Circular Quay",
    capacity: 160,
    status: "unavailable",
  },
];

const summaryRows = [
  {
    section: "Most Chosen Applicant",
    hirerEmail: "morgan@example.com",
    chosenCount: 3,
    totalApplications: 5,
  },
  {
    section: "Least Chosen Applicant",
    hirerEmail: "alex@example.com",
    chosenCount: 1,
    totalApplications: 4,
  },
  {
    section: "Applicants Not Selected",
    hirerEmail: "casey@example.com",
    chosenCount: 0,
    totalApplications: 2,
  },
];

export default function VendorPage() {
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!currentUser || currentUser.role !== "vendor") {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  if (!isAuthReady || !currentUser || currentUser.role !== "vendor") {
    return null;
  }

  const displayName = currentUser.name || "Vendor";

  return (
    <Layout
      headerTitle="Venue Vendors"
      footerText="Student project footer"
      navItems={[
        { label: "Home", href: "/" },
        { label: "My Dashboard", href: "/vendor" },
      ]}
    >
      <section className="py-4">
        <p className="text-sm font-semibold uppercase text-zinc-500">
          Vendor Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">
          Welcome back, {displayName}
        </h1>
        <p className="mt-2 text-zinc-600">
          Review your venues and check the hirer applications that match them.
        </p>
      </section>

      <section className="space-y-8">
        <div className="flex flex-wrap gap-3">
          <Button colorPalette="green" variant="solid">
            <Icon as={FaUsers} />
            Applicants
          </Button>
          <Button colorPalette="gray" variant="outline">
            <Icon as={FaBuilding} />
            My Venues
          </Button>
          <Button colorPalette="gray" variant="outline">
            <Icon as={FaChartBar} />
            Visual Summary
          </Button>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">Applicants</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Static preview of booking applications for your venues.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="sm" colorPalette="green">Sort: High to Low</Button>
            <Button size="sm" colorPalette="gray" variant="outline">
              Sort: Low to High
            </Button>
          </div>

          <div className="grid gap-4">
            {sampleApplicants.map((application) => (
              <article
                key={application.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">
                      {application.eventName}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {application.venueName} - {application.hirerEmail}
                    </p>
                  </div>
                  <Badge
                    colorPalette={application.status === "Accepted" ? "green" : "yellow"}
                    variant="subtle"
                  >
                    {application.status}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-4">
                  <p>
                    <span className="block font-medium text-zinc-950">Guests</span>
                    {application.guestCount}
                  </p>
                  <p>
                    <span className="block font-medium text-zinc-950">Date</span>
                    {application.eventDate}
                  </p>
                  <p>
                    <span className="block font-medium text-zinc-950">Time</span>
                    {application.eventTime}
                  </p>
                  <p>
                    <span className="block font-medium text-zinc-950">Duration</span>
                    {application.duration}
                  </p>
                </div>

                <HStack gap={1} mt={4}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon
                      key={index}
                      as={FaStar}
                      color={index < Math.round(application.averageRating) ? "green.400" : "gray.300"}
                    />
                  ))}
                  <span className="ml-2 text-sm text-zinc-600">
                    {application.averageRating.toFixed(1)}
                  </span>
                </HStack>
              </article>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">My Venues</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Static venue cards ready for future status controls.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sampleVenues.map((venue) => (
              <article
                key={venue.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">
                      {venue.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">{venue.location}</p>
                  </div>
                  <Badge
                    colorPalette={venue.status === "available" ? "green" : "red"}
                    variant="subtle"
                  >
                    {venue.status}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-zinc-700">
                  Capacity: {venue.capacity} guests
                </p>
                <Button
                  mt={4}
                  size="sm"
                  colorPalette={venue.status === "available" ? "red" : "green"}
                  variant={venue.status === "available" ? "subtle" : "solid"}
                >
                  {venue.status === "available" ? "Block" : "Unblock"}
                </Button>
              </article>
            ))}
          </div>
        </section>

        <Separator />

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-950">Visual Summary</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-zinc-700">
              <thead className="border-b border-zinc-200 text-zinc-950">
                <tr>
                  <th className="pb-3 pr-4 font-semibold">Section</th>
                  <th className="pb-3 pr-4 font-semibold">Hirer Email</th>
                  <th className="pb-3 pr-4 font-semibold">Chosen Count</th>
                  <th className="pb-3 font-semibold">Total Applications</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.section} className="border-b border-zinc-100">
                    <td className="py-3 pr-4">{row.section}</td>
                    <td className="py-3 pr-4">{row.hirerEmail}</td>
                    <td className="py-3 pr-4">{row.chosenCount}</td>
                    <td className="py-3">{row.totalApplications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </Layout>
  );
}
