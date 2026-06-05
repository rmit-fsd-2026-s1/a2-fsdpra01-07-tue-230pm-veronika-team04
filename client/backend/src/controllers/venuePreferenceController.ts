import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { HirerAccount } from "../entity/HirerAccount";
import { Venue } from "../entity/Venue";
import { VenuePreference } from "../entity/VenuePreference";

function toPositiveInt(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

async function findHirer(hireAccountID: number) {
  const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);

  return hirerAccountRepository.findOneBy({ hireAccountID });
}

function mapPreference(preference: VenuePreference) {
  const venue = preference.venue;
  const tags = venue.recommendedSuitabilities || [];

  // Convert DB relations into the simple venue shape used by the frontend.
  const recommendedSuitability = tags
    .map((item) => item.suitabilityTag?.recommendType)
    .filter((tag) => tag)
    .join(", ");

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
    preferenceRank: preference.preferenceRank,
  };
}

async function loadPreferredVenues(hireAccountID: number) {
  const preferenceRepository = AppDataSource.getRepository(VenuePreference);

  const preferences = await preferenceRepository.find({
    where: { hireAccountID },
    relations: {
      venue: {
        vendorAccount: {
          user: true,
        },
        recommendedSuitabilities: {
          suitabilityTag: true,
        },
      },
    },
    order: {
      preferenceRank: "ASC",
    },
  });

  return preferences.map(mapPreference);
}

async function rerankPreferences(hireAccountID: number) {
  const preferenceRepository = AppDataSource.getRepository(VenuePreference);

  const preferences = await preferenceRepository.find({
    where: { hireAccountID },
    order: {
      preferenceRank: "ASC",
    },
  });

  // Keep ranks continuous after one venue is removed.
  preferences.forEach((preference, index) => {
    preference.preferenceRank = index + 1;
  });

  await preferenceRepository.save(preferences);
}

export async function getPreferredVenues(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    const hirerAccount = await findHirer(hireAccountID);

    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const preferredVenues = await loadPreferredVenues(hireAccountID);

    res.status(200).json({
      message: "Preferred venues retrieved successfully",
      preferredVenues,
    });
  } catch (error) {
    console.error("Get preferred venues failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function addPreference(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.body.hireAccountID);
    const venueID = toPositiveInt(req.body.venueID);

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!venueID) {
      res.status(400).json({ message: "Invalid venueID" });
      return;
    }

    const hirerAccount = await findHirer(hireAccountID);

    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = await venueRepository.findOneBy({ venueID });

    if (!venue) {
      res.status(404).json({ message: "Venue not found" });
      return;
    }

    const preferenceRepository = AppDataSource.getRepository(VenuePreference);
    const existingPreference = await preferenceRepository.findOneBy({
      hireAccountID,
      venueID,
    });

    if (existingPreference) {
      res.status(409).json({ message: "Venue is already in preferred list" });
      return;
    }

    // New venues are added to the end of this hirer's list.
    const lastPreference = await preferenceRepository.findOne({
      where: { hireAccountID },
      order: { preferenceRank: "DESC" },
    });
    const preferenceRank = (lastPreference?.preferenceRank || 0) + 1;

    const preference = preferenceRepository.create({
      hireAccountID,
      venueID,
      preferenceRank,
    });

    await preferenceRepository.save(preference);

    const preferredVenues = await loadPreferredVenues(hireAccountID);

    res.status(201).json({
      message: "Venue added to preferences successfully",
      preferredVenues,
    });
  } catch (error) {
    console.error("Add preferred venue failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function reorderPreferences(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.body.hireAccountID);
    const venueIDs = req.body.venueIDs;

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (
      !Array.isArray(venueIDs) ||
      venueIDs.length === 0 ||
      venueIDs.some((venueID) => !toPositiveInt(venueID))
    ) {
      res.status(400).json({ message: "Invalid preferred venue order" });
      return;
    }

    const uniqueVenueIDs = new Set(venueIDs);

    if (uniqueVenueIDs.size !== venueIDs.length) {
      res.status(400).json({ message: "Invalid preferred venue order" });
      return;
    }

    const hirerAccount = await findHirer(hireAccountID);

    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const preferenceRepository = AppDataSource.getRepository(VenuePreference);
    const preferences = await preferenceRepository.find({
      where: { hireAccountID },
    });

    // Reorder only the preferences this hirer already owns.
    const preferenceByVenueID = new Map(
      preferences.map((preference) => [preference.venueID, preference]),
    );

    if (
      preferences.length !== venueIDs.length ||
      venueIDs.some((venueID) => !preferenceByVenueID.has(Number(venueID)))
    ) {
      res.status(400).json({ message: "Invalid preferred venue order" });
      return;
    }

    venueIDs.forEach((venueID, index) => {
      const preference = preferenceByVenueID.get(Number(venueID));

      if (preference) {
        preference.preferenceRank = index + 1;
      }
    });

    await preferenceRepository.save(preferences);

    const preferredVenues = await loadPreferredVenues(hireAccountID);

    res.status(200).json({
      message: "Preferred venues reordered successfully",
      preferredVenues,
    });
  } catch (error) {
    console.error("Reorder preferred venues failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}

export async function removePreference(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    const venueID = toPositiveInt(req.params.venueID);

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!venueID) {
      res.status(400).json({ message: "Invalid venueID" });
      return;
    }

    const preferenceRepository = AppDataSource.getRepository(VenuePreference);
    const preference = await preferenceRepository.findOneBy({
      hireAccountID,
      venueID,
    });

    if (!preference) {
      res.status(404).json({ message: "Preferred venue not found" });
      return;
    }

    await preferenceRepository.remove(preference);
    await rerankPreferences(hireAccountID);

    const preferredVenues = await loadPreferredVenues(hireAccountID);

    res.status(200).json({
      message: "Venue removed from preferences successfully",
      preferredVenues,
    });
  } catch (error) {
    console.error("Remove preferred venue failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
}
