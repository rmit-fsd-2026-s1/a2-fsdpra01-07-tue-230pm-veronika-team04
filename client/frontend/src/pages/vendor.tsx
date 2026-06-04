import { Badge, Button, HStack, Icon, Input } from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { FaBuilding, FaChartBar, FaStar, FaUsers, FaTrash, FaEdit, FaBan} from "react-icons/fa";

import {DialogBody, DialogCloseTrigger, DialogContent, DialogFooter,
  DialogHeader, DialogRoot, DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { venueApi } from "@/services/venueApi";
import type { Venue } from "@/types/venue";

// TODO: DELETE LATER Sample hard-coded data
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
// TODO: DELETE LATER Sample hard-coded data

const emptyVenueForm = {
  name: "",
  location: "",
  capacity: "",
  price: "",
  description: "",
  image: "",
};

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

  // Will validate user login and if they're a vendor role
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!currentUser || currentUser.role !== "vendor") {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  // Default fallback
  if (!isAuthReady || !currentUser || currentUser.role !== "vendor") {
    return null;
  }
  const displayName = currentUser.name || "Vendor";
  const venueMessage = !vendorAccountID ? "No vendor account is linked to this user." : venueError;

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


  // Triggers after submittingor updating a new venue
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
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">Applicants</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Static preview of booking applications for your venues.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm" bg="#095d44">Sort: High to Low</Button>
              <Button size="sm" bg="white" variant="outline">
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
        )}
        {/* Applicants Tab */}



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
                      colorPalette={venue.status === "available" ? "red" : "green"}
                      variant={venue.status === "available" ? "subtle" : "solid"}
                    >
                      <Icon as={FaBan}/>
                      {venue.status === "available" ? "Block" : "Unblock"}
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



        {/* Visual Summary */}
        {activeSection === "visualSummary" && (
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
        )}
        {/* Visual Summary */}



      </section>
    </Layout>
  );
}
