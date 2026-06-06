import { Button, Input } from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";

import BookingHistoryList from "@/components/Hirer/BookingHistoryList";
import PreferredVenueCard from "@/components/Hirer/PreferredVenueCard";
import VenueList from "@/components/Hirer/VenueList";
import Layout from "@/components/layout/Layout";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { bookingApi } from "@/services/bookingApi";
import { venuePreferenceApi } from "@/services/venuePreferenceApi";
import { venueApi } from "@/services/venueApi";
import type { SuitabilityTag } from "@/services/venueApi";
import type { BookingApplication } from "@/types/booking";
import type { Venue } from "@/types/venue";
import type { PreferredVenue } from "@/types/venuePreference";

type ApplicationFormValues = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  guestCount: string;
  duration: string;
};

type ApplicationFormErrors = {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: string;
  duration?: string;
  form?: string;
};

const emptyApplicationForm: ApplicationFormValues = {
  eventName: "",
  eventDate: "",
  eventTime: "",
  guestCount: "",
  duration: "",
};

function requiredLabel(label: string) {
  return (
    <>
      {label} <span className="text-red-600">*</span>
    </>
  );
}

function formatDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return formatDateText(tomorrow);
}

function isTimeText(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

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
  const [selectedVenueForApply, setSelectedVenueForApply] = useState<Venue | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationFormErrors, setApplicationFormErrors] =
    useState<ApplicationFormErrors>({});
  const [applicationForm, setApplicationForm] =
    useState<ApplicationFormValues>(emptyApplicationForm);
  const [bookingHistory, setBookingHistory] = useState<BookingApplication[]>([]);
  const [isBookingHistoryLoading, setIsBookingHistoryLoading] = useState(false);
  const [bookingHistoryError, setBookingHistoryError] = useState("");
  const [hasLoadedBookingHistory, setHasLoadedBookingHistory] = useState(false);

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

  async function loadBookingHistory() {
    if (!currentUser?.accountID) {
      setBookingHistoryError("Unable to load booking history. Please try again later.");
      return;
    }

    try {
      setIsBookingHistoryLoading(true);
      setBookingHistoryError("");

      const response = await bookingApi.getHirerBookingHistory(currentUser.accountID);
      setBookingHistory(response.data.bookings);
      setHasLoadedBookingHistory(true);
    } catch {
      setBookingHistoryError("Unable to load booking history. Please try again later.");
    } finally {
      setIsBookingHistoryLoading(false);
    }
  }

  function handleShowHistory() {
    setActiveSection("history");

    if (!hasLoadedBookingHistory) {
      void loadBookingHistory();
    }
  }

  function openApplyDialog(venue: Venue) {
    setSelectedVenueForApply(venue);
    setApplicationForm(emptyApplicationForm);
    setApplicationFormErrors({});
    setIsApplyDialogOpen(true);
  }

  function closeApplyDialog() {
    setIsApplyDialogOpen(false);
    setSelectedVenueForApply(null);
    setApplicationForm(emptyApplicationForm);
    setApplicationFormErrors({});
    setIsSubmittingApplication(false);
  }

  function updateApplicationForm(field: keyof ApplicationFormValues, value: string) {
    setApplicationForm((current) => ({ ...current, [field]: value }));
    setApplicationFormErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function validateApplicationForm() {
    const nextErrors: ApplicationFormErrors = {};
    const guestCount = Number(applicationForm.guestCount);
    const duration = Number(applicationForm.duration);
    const tomorrowDate = getTomorrowDateString();

    if (!selectedVenueForApply) {
      nextErrors.form = "Unable to submit booking request. Please try again later.";
      return nextErrors;
    }

    if (!applicationForm.eventName.trim()) {
      nextErrors.eventName = "Event name is required.";
    }

    if (!applicationForm.eventDate) {
      nextErrors.eventDate = "Event date is required.";
    } else if (applicationForm.eventDate < tomorrowDate) {
      nextErrors.eventDate = "Event date must be at least tomorrow.";
    }

    if (!applicationForm.eventTime) {
      nextErrors.eventTime = "Event time is required.";
    } else if (!isTimeText(applicationForm.eventTime)) {
      nextErrors.eventTime = "Please enter a valid event time.";
    }

    if (!applicationForm.guestCount) {
      nextErrors.guestCount = "Guest count is required.";
    } else if (!Number.isInteger(guestCount) || guestCount <= 0) {
      nextErrors.guestCount = "Guest count must be a positive whole number.";
    } else if (guestCount > selectedVenueForApply.capacity) {
      nextErrors.guestCount = "Guest count cannot exceed venue capacity.";
    }

    if (!applicationForm.duration) {
      nextErrors.duration = "Duration is required.";
    } else if (!Number.isFinite(duration) || duration <= 0) {
      nextErrors.duration = "Duration must be a positive number.";
    }


    return nextErrors;
  }

  function getBookingApiErrors(error: unknown): ApplicationFormErrors {
    const fallbackMessage = "Unable to submit booking request. Please try again later.";

    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string } | undefined;
      const status = error.response?.status;

      if (data?.message) {
        const message = data.message;
        const lowerMessage = message.toLowerCase();

        if (status && status >= 500) {
          return { form: fallbackMessage };
        }

        if (
          lowerMessage.includes("existing booking") ||
          lowerMessage.includes("blocked slot")
        ) {
          return { eventTime: message };
        }

        if (lowerMessage.includes("capacity")) {
          return { guestCount: message };
        }

        if (lowerMessage.includes("date")) {
          return { eventDate: message };
        }

        if (lowerMessage.includes("time")) {
          return { eventTime: message };
        }

        return { form: message };
      }
    }

    return { form: fallbackMessage };
  }

  async function handleSubmitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser?.accountID || !selectedVenueForApply) {
      setApplicationFormErrors({
        form: "Unable to submit booking request. Please try again later.",
      });
      return;
    }

    const validationErrors = validateApplicationForm();

    if (Object.values(validationErrors).some(Boolean)) {
      setApplicationFormErrors(validationErrors);
      return;
    }

    try {
      setIsSubmittingApplication(true);
      setApplicationFormErrors({});

      await bookingApi.createBooking({
        hireAccountID: currentUser.accountID,
        venueID: selectedVenueForApply.id,
        eventName: applicationForm.eventName.trim(),
        eventDate: applicationForm.eventDate,
        eventTime: applicationForm.eventTime,
        guestCount: Number(applicationForm.guestCount),
        duration: Number(applicationForm.duration),
      });

      toaster.create({
        title: "Booking request submitted",
        description: "Your request has been sent to the vendor.",
        type: "success",
        duration: 3000,
        closable: true,
      });

      void loadBookingHistory();
      closeApplyDialog();
    } catch (error) {
      setApplicationFormErrors(getBookingApiErrors(error));
    } finally {
      setIsSubmittingApplication(false);
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
  const tomorrowDate = getTomorrowDateString();

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
            onClick={handleShowHistory}
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
                    placeholder="eg. Harbour"
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
                    placeholder="eg. Melbourne"
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
                    placeholder="eg. 100"
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
              onApply={openApplyDialog}
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
                  onApply={() => openApplyDialog(venue)}
                />
              ))}
            </div>
          )
        ) : (
          <BookingHistoryList
            bookings={bookingHistory}
            isLoading={isBookingHistoryLoading}
            error={bookingHistoryError}
          />
        )}
      </section>

      <DialogRoot
        open={isApplyDialogOpen && selectedVenueForApply !== null}
        onOpenChange={(details) => {
          if (!details.open) {
            closeApplyDialog();
          } else {
            setIsApplyDialogOpen(true);
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleSubmitApplication}>
            <DialogHeader>
              <DialogTitle color="black">Apply for Venue</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody className="space-y-4">
              {selectedVenueForApply ? (
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-950">
                    {selectedVenueForApply.name}
                  </p>
                  <p>{selectedVenueForApply.location}</p>
                  <p>Capacity: {selectedVenueForApply.capacity}</p>
                </div>
              ) : null}

              {applicationFormErrors.form ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {applicationFormErrors.form}
                </p>
              ) : null}

              <Field label={requiredLabel("Event name")} color="black">
                <Input
                  value={applicationForm.eventName}
                  onChange={(event) =>
                    updateApplicationForm("eventName", event.target.value)
                  }
                  placeholder="Birthday Party"
                />
                {applicationFormErrors.eventName ? (
                  <p className="mt-1 text-sm text-red-600">
                    {applicationFormErrors.eventName}
                  </p>
                ) : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={requiredLabel("Event date")} color="black">
                  <Input
                    min={tomorrowDate}
                    type="date"
                    value={applicationForm.eventDate}
                    onChange={(event) =>
                      updateApplicationForm("eventDate", event.target.value)
                    }
                  />
                  {applicationFormErrors.eventDate ? (
                    <p className="mt-1 text-sm text-red-600">
                      {applicationFormErrors.eventDate}
                    </p>
                  ) : null}
                </Field>
                <Field label={requiredLabel("Event time")} color="black">
                  <Input
                    type="time"
                    value={applicationForm.eventTime}
                    onChange={(event) =>
                      updateApplicationForm("eventTime", event.target.value)
                    }
                  />
                  {applicationFormErrors.eventTime ? (
                    <p className="mt-1 text-sm text-red-600">
                      {applicationFormErrors.eventTime}
                    </p>
                  ) : null}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={requiredLabel("Guest count")} color="black">
                  <Input
                    min={1}
                    type="number"
                    value={applicationForm.guestCount}
                    onChange={(event) =>
                      updateApplicationForm("guestCount", event.target.value)
                    }
                    placeholder="80"
                  />
                  {applicationFormErrors.guestCount ? (
                    <p className="mt-1 text-sm text-red-600">
                      {applicationFormErrors.guestCount}
                    </p>
                  ) : null}
                </Field>
                <Field label={requiredLabel("Duration")} color="black">
                  <Input
                    min={1}
                    type="number"
                    value={applicationForm.duration}
                    onChange={(event) =>
                      updateApplicationForm("duration", event.target.value)
                    }
                    placeholder="4"
                  />
                  {applicationFormErrors.duration ? (
                    <p className="mt-1 text-sm text-red-600">
                      {applicationFormErrors.duration}
                    </p>
                  ) : null}
                </Field>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeApplyDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                bg="#095d44"
                color="white"
                loading={isSubmittingApplication}
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>
    </Layout>
  );
}
