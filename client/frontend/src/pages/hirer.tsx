import { Button } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";

import PreferredVenueCard from "@/components/Hirer/PreferredVenueCard";
import VenueList from "@/components/Hirer/VenueList";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { venuePreferenceApi } from "@/services/venuePreferenceApi";
import { venueApi } from "@/services/venueApi";
import type { SuitabilityTag } from "@/services/venueApi";
import type { Venue } from "@/types/venue";
import type { PreferredVenue } from "@/types/venuePreference";

export default function HirerPage() {
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "browse" | "preferred" | "history"
  >("browse");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [suitability, setSuitability] = useState("");
  const [suitabilityTags, setSuitabilityTags] = useState<SuitabilityTag[]>([]);
  const [preferredVenues, setPreferredVenues] = useState<PreferredVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPreferredLoading, setIsPreferredLoading] = useState(false);
  const [isPreferenceUpdating, setIsPreferenceUpdating] = useState(false);
  const [preferredError, setPreferredError] = useState("");

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!currentUser || currentUser.role !== "hirer") {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  useEffect(() => {
    if (!isAuthReady || !currentUser || currentUser.role !== "hirer") {
      return;
    }

    loadAllVenues();
    loadSuitabilityTags();
    loadPreferredVenues(currentUser.accountID);
  }, [currentUser, isAuthReady]);

  async function loadAllVenues() {
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

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const response = await venueApi.searchVenues({
        name,
        location,
        capacity,
        suitability,
      });

      setVenues(response.data.venues);
    } catch {
      setError("Unable to load venues. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClearFilters() {
    setName("");
    setLocation("");
    setCapacity("");
    setSuitability("");
    await loadAllVenues();
  }

  async function loadSuitabilityTags() {
    try {
      const response = await venueApi.getSuitabilityTags();
      setSuitabilityTags(response.data.tags);
    } catch (error) {
      console.error("Unable to load suitability tags:", error);
      setSuitabilityTags([]);
    }
  }

  async function loadPreferredVenues(accountID: number | null | undefined) {
    if (!accountID) {
      setPreferredError("Unable to load preferred venues. Please try again later.");
      return;
    }

    try {
      setIsPreferredLoading(true);
      setPreferredError("");

      const response = await venuePreferenceApi.getHirerPreferredVenues(accountID);
      setPreferredVenues(response.data.preferredVenues);
    } catch {
      setPreferredError("Unable to load preferred venues. Please try again later.");
    } finally {
      setIsPreferredLoading(false);
    }
  }

  async function handleAddToPreferred(venueID: number) {
    if (!currentUser?.accountID) {
      setPreferredError("Unable to update preferred venues. Please try again later.");
      return;
    }

    try {
      setIsPreferenceUpdating(true);
      setPreferredError("");

      const response = await venuePreferenceApi.addVenuePreference({
        hireAccountID: currentUser.accountID,
        venueID,
      });

      setPreferredVenues(response.data.preferredVenues);
    } catch {
      setPreferredError("Unable to update preferred venues. Please try again later.");
    } finally {
      setIsPreferenceUpdating(false);
    }
  }

  async function handleMovePreferred(index: number, direction: -1 | 1) {
    if (!currentUser?.accountID) {
      setPreferredError("Unable to update preferred venues. Please try again later.");
      return;
    }

    const newOrder = [...sortedPreferredVenues];
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= newOrder.length) {
      return;
    }

    const currentVenue = newOrder[index];
    newOrder[index] = newOrder[nextIndex];
    newOrder[nextIndex] = currentVenue;

    try {
      setIsPreferenceUpdating(true);
      setPreferredError("");

      const response = await venuePreferenceApi.reorderVenuePreferences({
        hireAccountID: currentUser.accountID,
        venueIDs: newOrder.map((venue) => venue.id),
      });

      setPreferredVenues(response.data.preferredVenues);
    } catch {
      setPreferredError("Unable to update preferred venues. Please try again later.");
    } finally {
      setIsPreferenceUpdating(false);
    }
  }

  async function handleRemovePreferred(venueID: number) {
    if (!currentUser?.accountID) {
      setPreferredError("Unable to update preferred venues. Please try again later.");
      return;
    }

    try {
      setIsPreferenceUpdating(true);
      setPreferredError("");

      const response = await venuePreferenceApi.removeVenuePreference(
        currentUser.accountID,
        venueID,
      );

      setPreferredVenues(response.data.preferredVenues);
    } catch {
      setPreferredError("Unable to update preferred venues. Please try again later.");
    } finally {
      setIsPreferenceUpdating(false);
    }
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "My Dashboard", href: "/hirer" },
  ];

  function sectionButtonStyles(section: "browse" | "preferred" | "history") {
    const isActive = activeSection === section;

    return {
      bg: isActive ? "#095d44" : "white",
      color: isActive ? "white" : "gray.700",
      borderWidth: isActive ? "0" : "1px",
      borderColor: "gray.300",
      _hover: {
        bg: isActive ? "#074b37" : "gray.50",
      },
    };
  }

  const sortedPreferredVenues = [...preferredVenues].sort(
    (a, b) => a.preferenceRank - b.preferenceRank,
  );
  const preferredVenueIds = sortedPreferredVenues.map((venue) => venue.id);

  if (!isAuthReady) {
    return (
      <Layout
        headerTitle="Venue Vendors"
        footerText="Student project footer"
        navItems={navItems}
      >
        <p className="py-4 text-sm text-zinc-600">Loading...</p>
      </Layout>
    );
  }

  if (!currentUser || currentUser.role !== "hirer") {
    return null;
  }

  return (
    <Layout
      headerTitle="Venue Vendors"
      footerText="Student project footer"
      navItems={navItems}
    >
      <section className="space-y-3 py-4">
        <p className="text-sm font-semibold uppercase text-zinc-500">
          HIRER DASHBOARD
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950">
          Welcome back, {currentUser.name || "Hirer"}
        </h1>
        <p className="text-zinc-700">
          Review your dashboard and continue exploring venues from one place.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => setActiveSection("browse")}
            size="sm"
            borderRadius="md"
            {...sectionButtonStyles("browse")}
          >
            View Venues
          </Button>
          <Button
            type="button"
            onClick={() => setActiveSection("preferred")}
            size="sm"
            borderRadius="md"
            {...sectionButtonStyles("preferred")}
          >
            Preferred Venues
          </Button>
          <Button
            type="button"
            onClick={() => setActiveSection("history")}
            size="sm"
            borderRadius="md"
            {...sectionButtonStyles("history")}
          >
            Booking History
          </Button>
        </div>

        {activeSection === "browse" ? (
          <div className="space-y-4">
            <form
              className="rounded border border-zinc-300 bg-white p-4"
              onSubmit={handleSearch}
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-900" htmlFor="name">
                    Venue name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Harbour"
                    className="w-full rounded border border-zinc-500 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-900"
                    htmlFor="location"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Melbourne"
                    className="w-full rounded border border-zinc-500 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-900"
                    htmlFor="capacity"
                  >
                    Minimum capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="0"
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                    placeholder="100"
                    className="w-full rounded border border-zinc-500 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-900"
                    htmlFor="suitability"
                  >
                    Suitability
                  </label>
                  <select
                    id="suitability"
                    value={suitability}
                    onChange={(event) => setSuitability(event.target.value)}
                    className="w-full rounded border border-zinc-500 px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {suitabilityTags.map((tag) => (
                      <option key={tag.tagID} value={tag.recommendType}>
                        {tag.recommendType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="submit"
                  size="sm"
                  bg="#095d44"
                  color="white"
                  borderRadius="md"
                  _hover={{ bg: "#074b37" }}
                >
                  Search
                </Button>
                <Button
                  type="button"
                  onClick={handleClearFilters}
                  size="sm"
                  variant="outline"
                  borderRadius="md"
                >
                  Clear
                </Button>
              </div>
            </form>

            {preferredError ? (
              <p className="text-sm text-red-600">{preferredError}</p>
            ) : null}

            <VenueList
              venues={venues}
              isLoading={isLoading}
              error={error}
              preferredVenueIds={preferredVenueIds}
              onAddToPreferred={handleAddToPreferred}
              isAddingPreferred={isPreferenceUpdating}
            />
          </div>
        ) : activeSection === "preferred" ? (
          isPreferredLoading ? (
            <p className="text-sm text-zinc-600">Loading preferred venues...</p>
          ) : preferredError ? (
            <p className="text-sm text-red-600">{preferredError}</p>
          ) : sortedPreferredVenues.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No preferred venues selected yet.
            </p>
          ) : (
            <div className="grid gap-4">
              {sortedPreferredVenues.map((venue, index) => (
                <PreferredVenueCard
                  key={venue.id}
                  venue={venue}
                  rank={index + 1}
                  isFirst={index === 0}
                  isLast={index === sortedPreferredVenues.length - 1}
                  onMoveUp={() => handleMovePreferred(index, -1)}
                  onMoveDown={() => handleMovePreferred(index, 1)}
                  onRemove={() => handleRemovePreferred(venue.id)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Booking history
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Booking/application history will be restored here after booking
              storage or backend booking APIs are ready.
            </p>
            {/* TODO: Restore BookingHistoryList when booking flow is ready. */}
          </div>
        )}
      </section>
    </Layout>
  );
}
