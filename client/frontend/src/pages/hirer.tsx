import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";

import VenueList from "@/components/Hirer/VenueList";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { venueApi } from "@/services/venueApi";
import type { Venue } from "@/types/venue";

export default function HirerPage() {
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [suitability, setSuitability] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  if (!isAuthReady || !currentUser || currentUser.role !== "hirer") {
    return null;
  }

  return (
    <Layout
      headerTitle="Venue Vendors"
      footerText="Student project footer"
      navItems={[
        { label: "Home", href: "/" },
        { label: "My Dashboard", href: "/hirer" },
      ]}
    >
      <section className="space-y-3 py-4">
        <p className="text-sm font-semibold uppercase text-zinc-500">
          HIRER DASHBOARD
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950">
          Welcome back, {currentUser.name || "Hirer"}
        </h1>
        <p className="text-zinc-700">
          Browse venues and search for a suitable place for your event.
        </p>
      </section>

      <section className="space-y-4">
        <form className="rounded border border-zinc-300 bg-white p-4" onSubmit={handleSearch}>
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
              <label className="mb-1 block text-sm text-zinc-900" htmlFor="location">
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
              <label className="mb-1 block text-sm text-zinc-900" htmlFor="capacity">
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
              <input
                id="suitability"
                type="text"
                value={suitability}
                onChange={(event) => setSuitability(event.target.value)}
                placeholder="wedding"
                className="w-full rounded border border-zinc-500 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded bg-[#095d44] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Clear
            </button>
          </div>
        </form>

        <VenueList venues={venues} isLoading={isLoading} error={error} />

        {/* TODO: Restore preferred venue list after browse/search works. */}
        {/* TODO: Restore apply flow after booking backend is ready. */}
      </section>
    </Layout>
  );
}
