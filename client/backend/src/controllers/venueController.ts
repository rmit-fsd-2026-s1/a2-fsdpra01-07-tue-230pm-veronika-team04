import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/Venue";

async function getVenuesFromDatabase() {
  const venueRepository = AppDataSource.getRepository(Venue);

  // Get venues with the related vendor user and suitability tags.
  // This return vendorEmail and recommendedSuitability to the frontend.
  return venueRepository.find({
    relations: {
      vendorAccount: {
        user: true,
      },
      recommendedSuitabilities: {
        suitabilityTag: true,
      },
    },
  });
}

function sortVenues(venues: Venue[]) {
  // Featured venues should show first, then sort by venue name.
  return venues.sort((a, b) => {
    if (a.isFeature && !b.isFeature) {
      return -1;
    }

    if (!a.isFeature && b.isFeature) {
      return 1;
    }

    return a.venueName.localeCompare(b.venueName);
  });
}

function mapVenue(venue: Venue) {
  // Convert the suitability tag relation into one comma-separated string.
  const tags = venue.recommendedSuitabilities || [];

  const recommendedSuitability = tags
    .map((item) => item.suitabilityTag?.recommendType)
    .filter((tag) => tag)
    .join(", ");

  // Return the same shape the A1 frontend already expects.
  // Do not return the raw database entity.
  return {
    id: venue.venueID,
    vendorEmail: venue.vendorAccount?.user?.email || "",
    name: venue.venueName,
    location: venue.location,
    capacity: venue.capacity,
    price: Number(venue.price),
    recommendedSuitability,
    description: venue.description || "",
    image: venue.imageUrl || "",
    status: venue.status,
  };
}

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getAllVenues(_req: Request, res: Response,): Promise<void> {
  try {
    // Fetch every venue, then map them for the frontend format.
    const venues = await getVenuesFromDatabase();
    const sortedVenues = sortVenues(venues);

    res.status(200).json({
      message: "Venues retrieved successfully",
      venues: sortedVenues.map(mapVenue),
    });
  } catch (error) {
    console.error("Get venues failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function createVenue(req: Request, res: Response): Promise<void> {
  try {
    const vendorAccountID = Number(req.body.vendorAccountID);
    const venueName = getRequiredString(req.body.name || req.body.venueName);
    const location = getRequiredString(req.body.location);
    const description = getRequiredString(req.body.description);
    const imageUrl = getRequiredString(req.body.image || req.body.imageUrl);
    const capacity = Number(req.body.capacity);
    const price = Number(req.body.price);

    if (!Number.isInteger(vendorAccountID) || vendorAccountID <= 0) {
      res.status(400).json({ message: "Invalid vendor account ID" });
      return;
    }

    if (!venueName) {
      res.status(400).json({ message: "Venue name is required" });
      return;
    }

    if (!location) {
      res.status(400).json({ message: "Location is required" });
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      res.status(400).json({ message: "Capacity must be a positive whole number" });
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      res.status(400).json({ message: "Price must be zero or greater" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = venueRepository.create({
      vendorAccountID,
      venueName,
      location,
      capacity,
      price: price.toFixed(2),
      description: description || null,
      imageUrl: imageUrl || null,
      status: "available",
    });
    const savedVenue = await venueRepository.save(venue);
    const venueWithRelations = await venueRepository.findOne({
      where: { venueID: savedVenue.venueID },
      relations: {
        vendorAccount: {
          user: true,
        },
        recommendedSuitabilities: {
          suitabilityTag: true,
        },
      },
    });

    res.status(201).json({
      message: "Venue created successfully",
      venue: mapVenue(venueWithRelations || savedVenue),
    });
  } catch (error) {
    console.error("Create venue failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function updateVenue(req: Request, res: Response): Promise<void> {
  try {
    const venueID = Number(req.params.venueID);

    if (!Number.isInteger(venueID) || venueID <= 0) {
      res.status(400).json({ message: "Invalid venue ID" });
      return;
    }

    const vendorAccountID = Number(req.body.vendorAccountID);
    const venueName = getRequiredString(req.body.name || req.body.venueName);
    const location = getRequiredString(req.body.location);
    const description = getRequiredString(req.body.description);
    const imageUrl = getRequiredString(req.body.image || req.body.imageUrl);
    const capacity = Number(req.body.capacity);
    const price = Number(req.body.price);

    if (!Number.isInteger(vendorAccountID) || vendorAccountID <= 0) {
      res.status(400).json({ message: "Invalid vendor account ID" });
      return;
    }
    if (!venueName) {
      res.status(400).json({ message: "Venue name is required" });
      return;
    }
    if (!location) {
      res.status(400).json({ message: "Location is required" });
      return;
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      res.status(400).json({ message: "Capacity must be a positive whole number" });
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      res.status(400).json({ message: "Price must be zero or greater" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);

    const existingVenue = await venueRepository.findOneBy({ venueID });
    if (!existingVenue) {
      res.status(404).json({ message: "Venue not found" });
      return;
    }

    existingVenue.vendorAccountID = vendorAccountID;
    existingVenue.venueName = venueName;
    existingVenue.location = location;
    existingVenue.capacity = capacity;
    existingVenue.price = price.toFixed(2);
    existingVenue.description = description || null;
    existingVenue.imageUrl = imageUrl || null;

    const updatedVenue = await venueRepository.save(existingVenue);

    const venueWithRelations = await venueRepository.findOne({
      where: { venueID: updatedVenue.venueID },
      relations: {
        vendorAccount: { user: true },
        recommendedSuitabilities: { suitabilityTag: true },
      },
    });

    res.status(200).json({
      message: "Venue updated successfully",
      venue: mapVenue(venueWithRelations || updatedVenue),
    });
  } catch (error) {
    console.error("Update venue failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

export async function deleteVenue(req: Request, res: Response): Promise<void> {
  try {
    const venueID = Number(req.params.venueID);

    if (!Number.isInteger(venueID) || venueID <= 0) {
      res.status(400).json({ message: "Invalid venue ID" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);

    const existingVenue = await venueRepository.findOneBy({ venueID });
    if (!existingVenue) {
      res.status(404).json({ message: "Venue not found" });
      return;
    }

    await venueRepository.remove(existingVenue);

    res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Delete venue failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// Maybe not need this function, as the frontend doesn't have a venue details page. 
// The frontend only uses the searchVenues function which returns all the details needed for the homepage.
// export async function getVenueByID(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const venueID = Number(req.params.venueID);

//     // Route params are strings, so check it is a valid positive number first.
//     if (!Number.isInteger(venueID) || venueID <= 0) {
//       res.status(400).json({ message: "Invalid venueID" });
//       return;
//     }

//     const venueRepository = AppDataSource.getRepository(Venue);

//     const venue = await venueRepository.findOne({
//       where: { venueID },
//       relations: {
//         vendorAccount: {
//           user: true,
//         },
//         recommendedSuitabilities: {
//           suitabilityTag: true,
//         },
//       },
//     });

//     if (!venue) {
//       res.status(404).json({ message: "Venue not found" });
//       return;
//     }

//     res.status(200).json({
//       message: "Venue retrieved successfully",
//       venue: mapVenue(venue),
//     });
//   } catch (error) {
//     console.error("Get venue failed:", error);
//     res.status(500).json({
//       message: "Something went wrong. Please try again later.",
//     });
//   }
// }

export async function searchVenues(req: Request,res: Response,): Promise<void> {
  try {
    const name = typeof req.query.name === "string" ? req.query.name : "";
    const location =
      typeof req.query.location === "string" ? req.query.location : "";
    const capacityText =
      typeof req.query.capacity === "string" ? req.query.capacity : "";
    const suitability =
      typeof req.query.suitability === "string" ? req.query.suitability : "";

    // Capacity must be a number because we compare it with venue.capacity.
    if (capacityText && Number.isNaN(Number(capacityText))) {
      res.status(400).json({ message: "Invalid capacity" });
      return;
    }

    let venues = await getVenuesFromDatabase();

    // Filter in TypeScript to keep the first version easy to read.
    if (name) {
      venues = venues.filter((venue) =>
        venue.venueName.toLowerCase().includes(name.toLowerCase()),
      );
    }

    if (location) {
      venues = venues.filter((venue) =>
        venue.location.toLowerCase().includes(location.toLowerCase()),
      );
    }

    if (capacityText) {
      const capacity = Number(capacityText);
      venues = venues.filter((venue) => venue.capacity >= capacity);
    }

    if (suitability) {
      venues = venues.filter((venue) =>
        mapVenue(venue)
          .recommendedSuitability.toLowerCase()
          .includes(suitability.toLowerCase()),
      );
    }

    const sortedVenues = sortVenues(venues);

    res.status(200).json({
      message: "Venue search completed successfully",
      venues: sortedVenues.map(mapVenue),
    });
  } catch (error) {
    console.error("Venue search failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

// TODO Get venues by vendor ID, used for vendor to manage their venues in the future.
export async function getVenueByVendorId(req: Request, res: Response,): Promise<void> {
  try {
    const vendorAccountID = Number(req.params.id);

    if (!Number.isInteger(vendorAccountID) || vendorAccountID <= 0) {
      res.status(400).json({ message: "Invalid vendor account ID" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);
    const venues = await venueRepository.find({
      where: { vendorAccountID },
      relations: {
        vendorAccount: {
          user: true,
        },
        recommendedSuitabilities: {
          suitabilityTag: true,
        },
      },
    });
    const sortedVenues = sortVenues(venues);

    res.status(200).json({
      message: "Vendor venues retrieved successfully",
      venues: sortedVenues.map(mapVenue),
    });
  } catch (error) {
    console.error("Get vendor venues failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}
