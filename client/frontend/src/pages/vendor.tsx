import { Badge, Button, HStack, Icon, Input } from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { FaBuilding, FaChartBar, FaStar, FaUsers, FaTrash, FaEdit, FaBan} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {DialogBody, DialogCloseTrigger, DialogContent, DialogFooter,
  DialogHeader, DialogRoot, DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Rating } from "@/components/ui/rating";
import { toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { bookingApi } from "@/services/bookingApi";
import { venueApi } from "@/services/venueApi";
import type { Venue } from "@/types/venue";

import { applicationApi } from "@/services/applicationApi";
import type { BookingApplication } from "@/types/booking";
import { blockedSlotApi } from "@/services/blockedSlotApi";
import type { BlockedSlot } from "@/services/blockedSlotApi";
import { reportApi } from "@/services/reportApi";
import type { ReportPeriod, VendorReport } from "@/types/report";

const reportPeriodOptions: { label: string; value: ReportPeriod }[] = [
  { label: "This week", value: "thisWeek" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "All time", value: "allTime" },
];

const emptyVenueForm = {
  name: "",
  location: "",
  capacity: "",
  price: "",
  description: "",
  image: "",
};

function getHirerDisplayName(application: BookingApplication) {
  return application.hirerName?.trim() || application.hirerEmail || "Unknown hirer";
}

function formatReputation(reputation: number | null | undefined) {
  if (typeof reputation === "number" && reputation > 0) {
    return `${reputation} / 5`;
  }

  return "Not rated yet";
}

function getApplicationStatusColor(status: BookingApplication["status"]) {
  if (status === "Accepted") {
    return "green";
  }

  if (status === "Rejected") {
    return "red";
  }

  return "yellow";
}

function isReportPeriod(value: string): value is ReportPeriod {
  return reportPeriodOptions.some((option) => option.value === value);
}

export default function VendorPage() {
  
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();
  const vendorAccountID = currentUser?.accountID;
  const currentUserRole = currentUser?.role;

  // useState for switching tabs
  const [activeSection, setActiveSection] = useState<"applicants" | "venues" | "visualSummary">("applicants");

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [venueError, setVenueError] = useState("");

  // useState for creation form
  const [isCreateVenueOpen, setIsCreateVenueOpen] = useState(false);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [venueForm, setVenueForm] = useState(emptyVenueForm);
  const [venueFormError, setVenueFormError] = useState("");

  // useState for editing form
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isUpdatingVenue, setIsUpdatingVenue] = useState(false);
  const [editVenueForm, setEditVenueForm] = useState(emptyVenueForm);
  const [editVenueFormError, setEditVenueFormError] = useState("");

  // useState for deleting a venue
  const [isDeletingVenue, setIsDeletingVenue] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  // Applications shown in the vendor Applicants tab.
  const [applications, setApplications] = useState<BookingApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  // Review dialog edits status, rating, and comment together.
  const [reviewingApplication, setReviewingApplication] = useState<BookingApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"Accepted" | "Rejected">("Accepted");
  const [ratingValue, setRatingValue] = useState(0);
  const [vendorComment, setVendorComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewHistory, setReviewHistory] = useState<BookingApplication[]>([]);
  const [isReviewHistoryLoading, setIsReviewHistoryLoading] = useState(false);
  const [reviewHistoryError, setReviewHistoryError] = useState("");

  // useState for blocked slots
  const [blockingVenue, setBlockingVenue] = useState<Venue | null>(null);
  const [venueBlockedSlots, setVenueBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [blockFormError, setBlockFormError] = useState("");

  const [applicationSortOrder, setApplicationSortOrder] = useState<"highToLow" | "lowToHigh" | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("thisMonth");
  const [reportData, setReportData] = useState<VendorReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Will validate user login and if they're a vendor role
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!currentUser || currentUser.role !== "vendor") {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);
  
  // Will validate vendor role, then fetch the account's associated vendors
  useEffect(() => {
    if (!isAuthReady || currentUserRole !== "vendor") {
      return;
    }

    if (!vendorAccountID) {
      return;
    }

    let isMounted = true;

    const accountID = vendorAccountID;

    async function fetchVenues() {
      setIsLoadingVenues(true);
      setVenueError("");

      try {
        const response = await venueApi.getVenueByVendorId(accountID);
        if (isMounted) {
          setVenues(response.data.venues);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);

        if (isMounted) {
          setVenueError("Unable to load your venues right now.");
          setVenues([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVenues(false);
        }
      }
    }

    fetchVenues();

    return () => {
      isMounted = false;
    };
  }, [currentUserRole, isAuthReady, vendorAccountID]);

  useEffect(() => {
    if (!isAuthReady || currentUserRole !== "vendor" || !vendorAccountID) return;

    let isMounted = true;
    const accountID = vendorAccountID;

    async function fetchApplications() {
      setIsLoadingApplications(true);
      setApplicationError("");
      try {
        const response = await applicationApi.getAllBookingApplications(accountID);
        if (isMounted) setApplications(response.data.bookings);
      } catch (error) {
        console.error("Error fetching applications:", error);
        if (isMounted) setApplicationError("Unable to load applications right now.");
      } finally {
        if (isMounted) setIsLoadingApplications(false);
      }
    }

    fetchApplications();
    return () => { isMounted = false; };
  }, [currentUserRole, isAuthReady, vendorAccountID]);

  useEffect(() => {
    if (
      !isAuthReady ||
      currentUserRole !== "vendor" ||
      !vendorAccountID ||
      activeSection !== "visualSummary"
    ) {
      return;
    }

    let isMounted = true;
    const accountID = vendorAccountID;

    async function fetchReport() {
      setIsReportLoading(true);
      setReportError("");

      try {
        const response = await reportApi.getVendorReport(accountID, reportPeriod);

        if (isMounted) {
          setReportData(response.data.report);
        }
      } catch (error) {
        console.error("Error fetching visual summary:", error);

        if (isMounted) {
          setReportData(null);
          setReportError("Unable to load visual summary.");
        }
      } finally {
        if (isMounted) {
          setIsReportLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    currentUserRole,
    isAuthReady,
    reportPeriod,
    vendorAccountID,
  ]);
  
  // Default fallback
  if (!isAuthReady || !currentUser || currentUser.role !== "vendor") {
    return null;
  }
  const displayName = currentUser.name || "Vendor";
  const venueMessage = !vendorAccountID ? "No vendor account is linked to this user." : venueError;
  const talliesByVenueChartData =
    reportData?.talliesByVenue.map((item) => ({
      label: `${item.venueName} - ${item.hirerName}`,
      tally: item.tally,
    })) ?? [];

  function handleReportPeriodChange(value: string) {
    if (!isReportPeriod(value)) {
      return;
    }

    setReportPeriod(value);
  }

  // Refresh the vendor's venue list after create, update, or delete.
  async function refreshVendorVenues(accountID: number) {
    const response = await venueApi.getVenueByVendorId(accountID);
    setVenues(response.data.venues);
  }

  function updateVenueForm(field: keyof typeof emptyVenueForm, value: string) {
    setVenueForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  // Handler for submitting new venues
  async function handleCreateVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!vendorAccountID) {
      setVenueFormError("No vendor account is linked to this user.");
      return;
    }

    const validationMessage = validateVenueForm(venueForm);

    if (validationMessage) {
      setVenueFormError(validationMessage);
      return;
    }

    setIsCreatingVenue(true);
    setVenueFormError("");

    try {
      await venueApi.createVenue({
        vendorAccountID,
        name: venueForm.name.trim(),
        location: venueForm.location.trim(),
        capacity: Number(venueForm.capacity),
        price: Number(venueForm.price),
        description: venueForm.description.trim() || undefined,
        image: venueForm.image.trim() || undefined,
      });
      await refreshVendorVenues(vendorAccountID);
      setVenueForm(emptyVenueForm);
      setIsCreateVenueOpen(false);
      toaster.create({
        title: "Venue created",
        description: "Your venue has been added.",
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch (error) {
      console.error("Error creating venue:", error);
      setVenueFormError("Unable to create venue right now.");
    } finally {
      setIsCreatingVenue(false);
    }
  }


  function updateEditVenueForm(field: keyof typeof emptyVenueForm, value: string) {
    setEditVenueForm((current) => ({ ...current, [field]: value }));
  }

  // When the user clicks 'Edit' the form is pre-populated with the respective venue data
  function openEditVenue(venue: Venue) {
    setEditingVenue(venue);
    setEditVenueForm({
      name: venue.name,
      location: venue.location,
      capacity: String(venue.capacity),
      price: String(venue.price),
      description: venue.description ?? "",
      image: venue.image ?? "",
    });
    setEditVenueFormError("");
    setIsEditVenueOpen(true);
  }

  async function handleUpdateVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingVenue || !vendorAccountID) return;

    const validationMessage = validateVenueForm(editVenueForm); // reuse existing validation
    if (validationMessage) {
      setEditVenueFormError(validationMessage);
      return;
    }

    setIsUpdatingVenue(true);
    setEditVenueFormError("");

    try {
      await venueApi.updateVenue(editingVenue.id, {
        vendorAccountID,
        name: editVenueForm.name.trim(),
        location: editVenueForm.location.trim(),
        capacity: Number(editVenueForm.capacity),
        price: Number(editVenueForm.price),
        description: editVenueForm.description.trim() || undefined,
        image: editVenueForm.image.trim() || undefined,
      });
      await refreshVendorVenues(vendorAccountID);
      setIsEditVenueOpen(false);
      setEditingVenue(null);
      toaster.create({
        title: "Venue updated",
        description: "Your venue has been updated.",
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch (error) {
      console.error("Error updating venue:", error);
      setEditVenueFormError("Unable to update venue right now.");
    } finally {
      setIsUpdatingVenue(false);
    }
  }

  // Both CREATE and UPDATE functions use the same validation function
  function validateVenueForm(form: typeof emptyVenueForm) {
    const capacity = Number(form.capacity);
    const price = Number(form.price);

    if (!form.name.trim())     return "Venue name is required.";
    if (!form.location.trim()) return "Location is required.";
    if (!Number.isInteger(capacity) || capacity <= 0)
      return "Capacity must be a positive whole number.";
    if (Number.isNaN(price) || price < 0)
      return "Price must be zero or greater.";
    return "";
  }

  async function handleDeleteVenue() {
  if (!venueToDelete || !vendorAccountID) return;

  setIsDeletingVenue(true);
    try {
      // TODO: wire up API call
      console.log("Delete venue:", venueToDelete.id);
      await venueApi.deleteVenue(venueToDelete.id);

      await refreshVendorVenues(vendorAccountID);
      toaster.create({
        title: "Venue deleted",
        description: `${venueToDelete.name} has been removed.`,
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch (error) {
      console.error("Error deleting venue:", error);
      toaster.create({
        title: "Delete failed",
        description: "Unable to delete venue right now.",
        type: "error",
        duration: 3000,
        closable: true,
      });
    } finally {
      setIsDeletingVenue(false);
      setVenueToDelete(null);
    }
  }

  function openReviewApplication(application: BookingApplication) {
    // Prefill the dialog so vendors can update an existing review later.
    setReviewingApplication(application);
    setReviewStatus(application.status === "Rejected" ? "Rejected" : "Accepted");
    setRatingValue(application.rating ?? 0);
    setVendorComment(application.vendorComment ?? "");
    setReviewError("");
    void loadReviewHistory(application.hirerAccountID ?? application.hireAccountID);
  }

  function closeReviewDialog() {
    setReviewingApplication(null);
    setReviewError("");
    setReviewHistory([]);
    setReviewHistoryError("");
    setIsReviewHistoryLoading(false);
  }

  async function loadReviewHistory(hireAccountID: number) {
    setReviewHistory([]);
    setReviewHistoryError("");
    setIsReviewHistoryLoading(true);

    try {
      const response = await bookingApi.getHirerBookingHistory(hireAccountID);
      setReviewHistory(response.data.bookings);
    } catch (error) {
      console.error("Error loading hirer history:", error);
      setReviewHistoryError("Unable to load historical hire list.");
    } finally {
      setIsReviewHistoryLoading(false);
    }
  }

  async function handleReviewSubmit() {
    if (!reviewingApplication || !vendorAccountID) return;

    if (ratingValue < 0 || ratingValue > 5) {
      setReviewError("Rating must be between 0 and 5.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      // One request updates status, rating, and comment on the booking.
      const response = await applicationApi.updateBookingApplication(
        reviewingApplication.bookingID,
        {
          vendorAccountID,
          status: reviewStatus,
          rating: ratingValue,
          vendorComment: vendorComment.trim(),
        },
      );
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.bookingID === reviewingApplication.bookingID
            ? response.data.booking
            : application,
        ),
      );
      closeReviewDialog();
      toaster.create({
        title: "Review updated",
        description: `${reviewingApplication.eventName} review has been saved.`,
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewError("Unable to save review right now.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function openBlockVenue(venue: Venue) {
    setBlockingVenue(venue);
    setBlockForm({ date: "", startTime: "", endTime: "", reason: "" });
    setBlockFormError("");
    setIsLoadingSlots(true);
    setVenueBlockedSlots([]);
    try {
      const response = await blockedSlotApi.getBlockedSlotsByVenue(venue.id);
      setVenueBlockedSlots(response.data.blockedSlots);
    } catch {
      // non-fatal, slots list just won't show
    } finally {
      setIsLoadingSlots(false);
    }
  }

  function closeBlockDialog() {
    setBlockingVenue(null);
    setVenueBlockedSlots([]);
    setBlockFormError("");
  }

async function handleCreateBlockedSlot(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if (!blockingVenue) return;

  setBlockFormError("");

  if (!blockForm.date) {
    setBlockFormError("Date is required.");
    return;
  }
  if (!blockForm.startTime) {
    setBlockFormError("Start time is required.");
    return;
  }
  if (!blockForm.endTime) {
    setBlockFormError("End time is required.");
    return;
  }
  if (blockForm.endTime <= blockForm.startTime) {
    setBlockFormError("End time must be after start time.");
    return;
  }

  setIsSubmittingBlock(true);
    try {
      const response = await blockedSlotApi.createBlockedSlot({
        venueID: blockingVenue.id,
        date: blockForm.date,
        startTime: blockForm.startTime,
        endTime: blockForm.endTime,
        reason: blockForm.reason.trim() || undefined,
      });
      setVenueBlockedSlots((current) => [response.data.blockedSlot, ...current]);
      setBlockForm({ date: "", startTime: "", endTime: "", reason: "" });
      toaster.create({
        title: "Slot blocked",
        description: "The time slot has been blocked successfully.",
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch {
      setBlockFormError("Unable to block this slot right now.");
    } finally {
      setIsSubmittingBlock(false);
    }
  }

  async function handleDeactivateSlot(blockedSlotID: number) {
    try {
      const response = await blockedSlotApi.deactivateBlockedSlot(blockedSlotID);
      setVenueBlockedSlots((current) =>
        current.map((slot) =>
          slot.blockedSlotID === blockedSlotID ? response.data.blockedSlot : slot,
        ),
      );
      toaster.create({
        title: "Slot unblocked",
        type: "success",
        duration: 3000,
        closable: true,
      });
    } catch {
      toaster.create({
        title: "Unable to unblock slot right now.",
        type: "error",
        duration: 3000,
        closable: true,
      });
    }
  }

  const sortedApplications = [...applications].sort((a, b) => {
    if (applicationSortOrder === null) return 0;
    const aRep = a.hirerReputation ?? 0;
    const bRep = b.hirerReputation ?? 0;
    return applicationSortOrder === "highToLow" ? bRep - aRep : aRep - bRep;
  });
















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

      {/* Tabs */}
      <section className="space-y-8">
        <div className="flex flex-wrap gap-3">
          <Button
            bg={activeSection === "applicants" ? "#095d44" : "white"}
            variant={activeSection === "applicants" ? "solid" : "outline"}
            onClick={() => setActiveSection("applicants")}
          >
            <Icon as={FaUsers} />
            Applicants
          </Button>
          <Button
            bg={activeSection === "venues" ? "#095d44" : "white"}
            variant={activeSection === "venues" ? "solid" : "outline"}
            onClick={() => setActiveSection("venues")}
          >
            <Icon as={FaBuilding} />
            My Venues
          </Button>
          <Button
            bg={activeSection === "visualSummary" ? "#095d44" : "white"}
            variant={activeSection === "visualSummary" ? "solid" : "outline"}
            onClick={() => setActiveSection("visualSummary")}
          >
            <Icon as={FaChartBar} />
            Visual Summary
          </Button>
        </div>



        {/* Applicants Tab */}
        {activeSection === "applicants" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Applicants</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Booking applications for your venues.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  bg={applicationSortOrder === "highToLow" ? "#095d44" : "white"}
                  color={applicationSortOrder === "highToLow" ? "white" : "black"}
                  variant={applicationSortOrder === "highToLow" ? "solid" : "outline"}
                  onClick={() =>
                    setApplicationSortOrder((current) =>
                      current === "highToLow" ? null : "highToLow"
                    )
                  }
                >
                  Reputation: High → Low
                </Button>
                <Button
                  size="sm"
                  bg={applicationSortOrder === "lowToHigh" ? "#095d44" : "white"}
                  color={applicationSortOrder === "lowToHigh" ? "white" : "black"}
                  variant={applicationSortOrder === "lowToHigh" ? "solid" : "outline"}
                  onClick={() =>
                    setApplicationSortOrder((current) =>
                      current === "lowToHigh" ? null : "lowToHigh"
                    )
                  }
                >
                  Reputation: Low → High
                </Button>
              </div>
            </div>

            {isLoadingApplications ? (
              <p className="text-sm text-zinc-600">Loading applications...</p>
            ) : applicationError ? (
              <p className="text-sm text-red-600">{applicationError}</p>
            ) : sortedApplications.length === 0 ? (
              <p className="text-sm text-zinc-600">No applications yet.</p>
            ) : (
              <div className="grid gap-4">
                {sortedApplications.map((application) => (
                  <article
                    key={application.bookingID}
                    className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-950">
                          {application.eventName}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {application.venueName} — {application.venueLocation}
                        </p>
                      </div>
                      <Badge
                        colorPalette={getApplicationStatusColor(application.status)}
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
                        {application.duration}h
                      </p>
                    </div>

                    {application.vendorComment && (
                      <p
                        className="mt-3 max-w-full whitespace-pre-wrap break-words text-sm text-zinc-600"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        <span className="font-medium text-zinc-950">Vendor comment: </span>
                        {application.vendorComment}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <Button
                        size="sm"
                        bg={application.status === "Pending" ? "#095d44" : "white"}
                        borderColor={application.status === "Pending" ? "#095d44" : "#a1a1aa"}
                        borderWidth={application.status === "Pending" ? "1px" : "1.5px"}
                        color={application.status === "Pending" ? "white" : "black"}
                        variant={application.status === "Pending" ? "solid" : "outline"}
                        _hover={{
                          bg: application.status === "Pending" ? "#074b37" : "#f4f4f5",
                          borderColor: application.status === "Pending" ? "#074b37" : "#3f3f46",
                        }}
                        onClick={() => openReviewApplication(application)}
                      >
                        {application.status === "Pending" ? "Review" : "Update Review"}
                      </Button>

                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <HStack gap={2} align="center">
                          <span className="text-sm font-medium text-zinc-950">
                            Rating
                          </span>
                          <Rating
                            readOnly
                            size="sm"
                            value={application.rating ?? 0}
                            icon={<FaStar />}
                          />
                          <span className="text-sm text-zinc-600">
                            {application.rating == null
                              ? "Not rated yet"
                              : `${application.rating} / 5`}
                          </span>
                        </HStack>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {/* Applicants Tab */}

        {/* Review Application Dialog */}
        <DialogRoot
          open={reviewingApplication !== null}
          onOpenChange={(details) => { if (!details.open) closeReviewDialog(); }}
        >
          <DialogContent width="fit-content" maxW="calc(100vw - 2rem)">
            <DialogHeader>
              <DialogTitle color="black">Review Application</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody className="space-y-4">
              {reviewError && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {reviewError}
                </p>
              )}

              {/* Venue details */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-950">Venue</h3>
                <p className="text-sm text-zinc-700">{reviewingApplication?.venueName}</p>
                <p className="text-sm text-zinc-600">{reviewingApplication?.venueLocation}</p>
              </div>

              {/* Hirer details */}
              {reviewingApplication && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-950">Hirer Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-700">
                    <p>
                      <span className="font-medium text-zinc-950">Hirer</span>
                      <br />
                      {getHirerDisplayName(reviewingApplication)}
                    </p>
                    <p>
                      <span className="font-medium text-zinc-950">Email</span>
                      <br />
                      {reviewingApplication.hirerEmail || "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-zinc-950">Reputation</span>
                      <br />
                      {formatReputation(reviewingApplication.hirerReputation)}
                    </p>
                    <p>
                      <span className="font-medium text-zinc-950">Compliance score</span>
                      <br />
                      {reviewingApplication.complianceScore ?? 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Booking details */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-950">Booking Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-zinc-700">
                  <p><span className="font-medium text-zinc-950">Event</span><br />{reviewingApplication?.eventName}</p>
                  <p><span className="font-medium text-zinc-950">Guests</span><br />{reviewingApplication?.guestCount}</p>
                  <p><span className="font-medium text-zinc-950">Date</span><br />{reviewingApplication?.eventDate}</p>
                  <p><span className="font-medium text-zinc-950">Time</span><br />{reviewingApplication?.eventTime}</p>
                  <p><span className="font-medium text-zinc-950">Duration</span><br />{reviewingApplication?.duration}h</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-950">
                  Historical Hire List
                </h3>

                {isReviewHistoryLoading ? (
                  <p className="text-sm text-zinc-600">
                    Loading historical hire list...
                  </p>
                ) : reviewHistoryError ? (
                  <p className="text-sm text-red-600">
                    Unable to load historical hire list.
                  </p>
                ) : reviewHistory.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    No previous hire history found.
                  </p>
                ) : (
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-auto rounded border border-zinc-200 text-left text-sm text-zinc-700">
                      <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-950">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Venue name</th>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Location</th>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Event name</th>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Date of hire</th>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
                          <th className="whitespace-nowrap px-3 py-2 font-semibold">Star rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewHistory.map((booking) => (
                          <tr
                            key={booking.bookingID}
                            className="border-b border-zinc-100 last:border-b-0"
                          >
                            <td className="whitespace-nowrap px-3 py-2">{booking.venueName}</td>
                            <td className="whitespace-nowrap px-3 py-2">{booking.venueLocation}</td>
                            <td className="whitespace-nowrap px-3 py-2">{booking.eventName}</td>
                            <td className="whitespace-nowrap px-3 py-2">{booking.eventDate}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <Badge
                                colorPalette={getApplicationStatusColor(booking.status)}
                                variant="subtle"
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {booking.rating == null
                                ? "Not rated yet"
                                : `${booking.rating}/5`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-950">Decision status</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    bg={reviewStatus === "Accepted" ? "#095d44" : "white"}
                    color={reviewStatus === "Accepted" ? "white" : "black"}
                    variant={reviewStatus === "Accepted" ? "solid" : "outline"}
                    onClick={() => setReviewStatus("Accepted")}
                  >
                    Accepted
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    colorPalette="red"
                    variant={reviewStatus === "Rejected" ? "solid" : "outline"}
                    onClick={() => setReviewStatus("Rejected")}
                  >
                    Rejected
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-950">Rating</p>
                <Rating
                  colorPalette="yellow"
                  value={ratingValue}
                  icon={<FaStar />}
                  onValueChange={(details) => setRatingValue(details.value)}
                />
                <p className="text-sm text-zinc-600">{ratingValue} / 5</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">
                  Vendor comment
                </label>
                <textarea
                  className="min-h-24 w-full max-w-full resize-y rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#095d44]"
                  value={vendorComment}
                  onChange={(e) => setVendorComment(e.target.value)}
                  placeholder="Optional comments for the hirer..."
                />
              </div>
            </DialogBody>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeReviewDialog}
              >
                Cancel
              </Button>
              <Button
                bg="#095d44"
                color="white"
                loading={isSubmittingReview}
                onClick={handleReviewSubmit}
              >
                Save Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
        {/* Review Application Dialog */}



        {/* Venues Tab */}
        {activeSection === "venues" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">My Venues</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Venues linked to your vendor account.
                </p>
              </div>
              <Button
                bg="#095d44"
                color="white"
                disabled={!vendorAccountID}
                onClick={() => {
                  setVenueFormError("");
                  setIsCreateVenueOpen(true);
                }}
              >
                Add Venue
              </Button>
            </div>

            {isLoadingVenues ? (
              <p className="text-sm text-zinc-600">Loading venues...</p>
            ) : venueMessage ? (
              <p className="text-sm text-red-600">{venueMessage}</p>
            ) : venues.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No venues are assigned to this vendor account yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
              {venues.map((venue) => (
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
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditVenue(venue)}
                    >
                      <Icon as={FaEdit}/>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="orange"
                      variant="subtle"
                      onClick={() => openBlockVenue(venue)}
                    >
                      <Icon as={FaBan}/>
                      Block
                    </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVenueToDelete(venue)}
                      colorPalette="red"
                    >
                      <Icon as={FaTrash}/>
                    </Button>
                  </div>
                </article>
              ))}
              </div>
            )}
          </section>
        )}
        {/* Venues Tab */}



        {/* Create Venue Form */}
        <DialogRoot
          open={isCreateVenueOpen}
          onOpenChange={(details) => setIsCreateVenueOpen(details.open)}
        >
          <DialogContent>
            <form onSubmit={handleCreateVenue}>
              <DialogHeader>
                <DialogTitle color="black">Create Venue</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody className="space-y-4">
                {venueFormError ? (
                  <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {venueFormError}
                  </p>
                ) : null}

                <Field label="Venue name" color="black">
                  <Input
                    value={venueForm.name}
                    onChange={(e) => updateVenueForm("name", e.target.value)}
                    placeholder="Garden Terrace"
                  />
                </Field>

                <Field label="Location" color="black">
                  <Input
                    value={venueForm.location}
                    onChange={(e) => updateVenueForm("location", e.target.value)}
                    placeholder="Sydney CBD"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Capacity" color="black">
                    <Input
                      min={1}
                      type="number"
                      value={venueForm.capacity}
                      onChange={(e) => updateVenueForm("capacity", e.target.value)}
                      placeholder="100"
                    />
                  </Field>
                  <Field label="Price" color="black">
                    <Input
                      min={0}
                      step="0.01"
                      type="number"
                      value={venueForm.price}
                      onChange={(e) => updateVenueForm("price", e.target.value)}
                      placeholder="2500"
                    />
                  </Field>
                </div>

                <Field label="Description" color="black">
                  <textarea
                    className="min-h-24 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#095d44]"
                    value={venueForm.description}
                    onChange={(e) => updateVenueForm("description", e.target.value)}
                    placeholder="Short description of the venue"
                  />
                </Field>

                <Field label="Image URL" color="black">
                  <Input
                    value={venueForm.image}
                    onChange={(e) => updateVenueForm("image", e.target.value)}
                    placeholder="https://example.com/venue.jpg"
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateVenueOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg="#095d44"
                  color="white"
                  loading={isCreatingVenue}
                >
                  Create Venue
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogRoot>
        {/* Create Venue Form */}


        {/* Edit Venue Form */}
        <DialogRoot
          open={isEditVenueOpen}
          onOpenChange={(details) => setIsEditVenueOpen(details.open)}
        >
          <DialogContent>
            <form onSubmit={handleUpdateVenue}>
              <DialogHeader>
                <DialogTitle color="black">Edit Venue</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody className="space-y-4">
                {editVenueFormError && (
                  <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editVenueFormError}
                  </p>
                )}

                <Field label="Venue name" color="black">
                  <Input
                    value={editVenueForm.name}
                    onChange={(e) => updateEditVenueForm("name", e.target.value)}
                    placeholder="Garden Terrace"
                  />
                </Field>

                <Field label="Location" color="black">
                  <Input
                    value={editVenueForm.location}
                    onChange={(e) => updateEditVenueForm("location", e.target.value)}
                    placeholder="Sydney CBD"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Capacity" color="black">
                    <Input
                      min={1}
                      type="number"
                      value={editVenueForm.capacity}
                      onChange={(e) => updateEditVenueForm("capacity", e.target.value)}
                      placeholder="100"
                    />
                  </Field>
                  <Field label="Price" color="black">
                    <Input
                      min={0}
                      step="0.01"
                      type="number"
                      value={editVenueForm.price}
                      onChange={(e) => updateEditVenueForm("price", e.target.value)}
                      placeholder="2500"
                    />
                  </Field>
                </div>

                <Field label="Description" color="black">
                  <textarea
                    className="min-h-24 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#095d44]"
                    value={editVenueForm.description}
                    onChange={(e) => updateEditVenueForm("description", e.target.value)}
                    placeholder="Short description of the venue"
                  />
                </Field>

                <Field label="Image URL" color="black">
                  <Input
                    value={editVenueForm.image}
                    onChange={(e) => updateEditVenueForm("image", e.target.value)}
                    placeholder="https://example.com/venue.jpg"
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditVenueOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg="#095d44"
                  color="white"
                  loading={isUpdatingVenue}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogRoot>
        {/* Edit Venue Form */}

        {/* Delete Venue Confirmation */}
        <DialogRoot
          open={venueToDelete !== null}
          onOpenChange={(details) => { if (!details.open) setVenueToDelete(null); }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle color="black">Delete Venue</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <p className="text-sm text-zinc-700">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-950">{venueToDelete?.name}</span>?
                This action cannot be undone.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setVenueToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                colorPalette="red"
                loading={isDeletingVenue}
                onClick={handleDeleteVenue}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
        {/* Delete Venue Confirmation */}


        {/* Block Venue Dialog */}
        <DialogRoot
          open={blockingVenue !== null}
          onOpenChange={(details) => { if (!details.open) closeBlockDialog(); }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle color="black">
                Manage Blocked Slots — {blockingVenue?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody className="space-y-5">

              {/* Create new block form */}
              <form onSubmit={handleCreateBlockedSlot} className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-950">Block a Time Slot</h3>

                {blockFormError && (
                  <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {blockFormError}
                  </p>
                )}

                <Field label="Date" color="black">
                  <Input
                    type="date"
                    value={blockForm.date}
                    onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Start time" color="black">
                    <Input
                      type="time"
                      value={blockForm.startTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, startTime: e.target.value }))}
                    />
                  </Field>
                  <Field label="End time" color="black">
                    <Input
                      type="time"
                      value={blockForm.endTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, endTime: e.target.value }))}
                    />
                  </Field>
                </div>

                <Field label="Reason (optional)" color="black">
                  <textarea
                    className="min-h-16 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#095d44]"
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. Private event, maintenance..."
                  />
                </Field>

                <Button
                  type="submit"
                  bg="#095d44"
                  color="white"
                  size="sm"
                  loading={isSubmittingBlock}
                >
                  Block Slot
                </Button>
              </form>

              {/* Existing blocked slots list */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-950">Existing Blocked Slots</h3>

                {isLoadingSlots ? (
                  <p className="text-sm text-zinc-600">Loading...</p>
                ) : venueBlockedSlots.length === 0 ? (
                  <p className="text-sm text-zinc-600">No blocked slots for this venue.</p>
                ) : (
                  <div className="space-y-2">
                    {venueBlockedSlots.map((slot) => {
                      const start = new Date(slot.startDateTime);
                      const end = new Date(slot.endDateTime);
                      const dateStr = start.toLocaleDateString();
                      const startStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div
                          key={slot.blockedSlotID}
                          className={`rounded-lg border p-3 text-sm ${
                            slot.isActive
                              ? "border-red-200 bg-red-50"
                              : "border-zinc-200 bg-zinc-50 opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="font-medium text-zinc-950">
                                {dateStr} · {startStr} – {endStr}
                              </p>
                              {slot.reason && (
                                <p className="text-zinc-600">{slot.reason}</p>
                              )}
                              <p className={`text-xs font-medium ${slot.isActive ? "text-red-600" : "text-zinc-500"}`}>
                                {slot.isActive ? "Active" : "Inactive"}
                              </p>
                            </div>
                            {slot.isActive && (
                              <Button
                                size="xs"
                                colorPalette="green"
                                variant="subtle"
                                onClick={() => handleDeactivateSlot(slot.blockedSlotID)}
                              >
                                Unblock
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={closeBlockDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
        {/* Block Venue Dialog */}



        {/* Visual Summary */}
        {activeSection === "visualSummary" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Visual Summary
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Accepted booking tallies for hirers across your venues.
                </p>
              </div>

              <select
                value={reportPeriod}
                onChange={(event) => handleReportPeriodChange(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#095d44]"
              >
                {reportPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-950">
                Hirer tallies by venue
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Counts accepted bookings only.
              </p>

              <div className="mt-5">
                {isReportLoading ? (
                  <p className="text-sm text-zinc-600">
                    Loading visual summary...
                  </p>
                ) : reportError ? (
                  <p className="text-sm text-red-600">
                    {reportError}
                  </p>
                ) : talliesByVenueChartData.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    No report data available for this period.
                  </p>
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={talliesByVenueChartData}
                        layout="vertical"
                        margin={{ left: 16, right: 24 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={180}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="tally" fill="#095d44" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {/* Visual Summary */}



      </section>
    </Layout>
  );
}
