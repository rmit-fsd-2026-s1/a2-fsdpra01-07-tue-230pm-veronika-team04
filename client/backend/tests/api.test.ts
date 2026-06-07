import request from "supertest";
import { app } from "../src/app";
import { AppDataSource } from "../src/data-source";
import { Booking } from "../src/entity/Booking";
import { BlockedSlot } from "../src/entity/BlockedSlot";
import { HirerAccount } from "../src/entity/HirerAccount";
import { User } from "../src/entity/User";
import { VendorAccount } from "../src/entity/VendorAccount";
import { Venue } from "../src/entity/Venue";

jest.mock("../src/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    initialize: jest.fn(),
  },
}));

type MockRepository = Record<string, jest.Mock>;

function createRepository(overrides: Partial<MockRepository> = {}) {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
    createQueryBuilder: jest.fn(),
    ...overrides,
  } as MockRepository;
}

function createQueryBuilder(getMany: jest.Mock) {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany,
  };

  return queryBuilder;
}

function tomorrowDateText() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mockRepositories(repositories: Map<unknown, MockRepository>) {
  const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

  getRepositoryMock.mockImplementation((entity) => {
    const repository = repositories.get(entity);

    if (!repository) {
      throw new Error(`No mock repository for ${entity?.name ?? "unknown entity"}`);
    }

    return repository;
  });
}

describe("Venue Vendors backend API unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // This test confirms that weak passwords are rejected by the backend before a user account is created.
  // This matters because public signup must stay protected even if frontend validation is bypassed.
  test("signup rejects weak password", async () => {
    // Arrange
    const userRepository = createRepository();
    const hirerRepository = createRepository();
    mockRepositories(
      new Map<unknown, MockRepository>([
        [User, userRepository],
        [HirerAccount, hirerRepository],
      ]),
    );

    // Act
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        firstName: "Callum",
        lastName: "Shen",
        email: "callum@example.com",
        password: "abc",
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Password");
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  // This test checks that invalid login attempts are rejected and sensitive password data is not returned.
  // This matters because users must authenticate through the backend before entering role dashboards.
  test("login rejects invalid credentials", async () => {
    // Arrange
    const userRepository = createRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });
    mockRepositories(new Map<unknown, MockRepository>([[User, userRepository]]));

    // Act
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "missing@example.com",
        password: "Password@123",
      });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.user).toBeUndefined();
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
  });

  // This test verifies that a hirer cannot submit a booking request that exceeds the selected venue capacity.
  // This matters because the backend must enforce venue capacity even if the Apply Dialog validation is skipped.
  test("booking request rejects guest count above venue capacity", async () => {
    // Arrange
    const bookingRepository = createRepository();
    const hirerRepository = createRepository({
      findOneBy: jest.fn().mockResolvedValue({ hireAccountID: 1 }),
    });
    const venueRepository = createRepository({
      findOneBy: jest.fn().mockResolvedValue({
        venueID: 3,
        capacity: 40,
        status: "available",
      }),
    });
    const blockedSlotRepository = createRepository();
    mockRepositories(
      new Map<unknown, MockRepository>([
        [Booking, bookingRepository],
        [HirerAccount, hirerRepository],
        [Venue, venueRepository],
        [BlockedSlot, blockedSlotRepository],
      ]),
    );

    // Act
    const response = await request(app)
      .post("/api/bookings")
      .send({
        hireAccountID: 1,
        venueID: 3,
        eventName: "Graduation Party",
        eventDate: tomorrowDateText(),
        eventTime: "18:00",
        guestCount: 80,
        duration: 3,
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Guest count cannot exceed venue capacity");
    expect(bookingRepository.save).not.toHaveBeenCalled();
  });

  // This test confirms that the venue browsing API returns database-backed venue data required by hirers to browse available venues.
  // This matters because the hirer page depends on this API instead of hardcoded/localStorage venue data.
  test("hirer can retrieve all venues successfully", async () => {
    // Arrange
    const venueRepository = createRepository({
      find: jest.fn().mockResolvedValue([
        {
          venueID: 1,
          vendorAccountID: 10,
          venueName: "Lantern Garden Hall",
          location: "Carlton, Melbourne",
          capacity: 120,
          price: "2500.00",
          description: "Warm garden venue for birthdays and ceremonies.",
          imageUrl: "/uploads/venues/venue_1.jpg",
          status: "available",
          isFeature: true,
          vendorAccount: {
            user: {
              email: "vendor1@example.com",
            },
          },
          recommendedSuitabilities: [
            {
              suitabilityTag: {
                recommendType: "Birthday",
              },
            },
            {
              suitabilityTag: {
                recommendType: "Wedding",
              },
            },
          ],
        },
        {
          venueID: 2,
          vendorAccountID: 11,
          venueName: "Skyline Room",
          location: "Melbourne CBD",
          capacity: 80,
          price: "1800.00",
          description: "City-view venue for small corporate events.",
          imageUrl: "/uploads/venues/venue_2.jpg",
          status: "available",
          isFeature: false,
          vendorAccount: {
            user: {
              email: "vendor2@example.com",
            },
          },
          recommendedSuitabilities: [
            {
              suitabilityTag: {
                recommendType: "Corporate",
              },
            },
          ],
        },
      ]),
    });
    mockRepositories(
      new Map<unknown, MockRepository>([
        [Venue, venueRepository],
      ]),
    );

    // Act
    const response = await request(app).get("/api/venues");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Venues retrieved successfully");
    expect(venueRepository.find).toHaveBeenCalledWith({
      relations: {
        vendorAccount: {
          user: true,
        },
        recommendedSuitabilities: {
          suitabilityTag: true,
        },
      },
    });
    expect(response.body.venues).toHaveLength(2);
    expect(response.body.venues[0]).toMatchObject({
      id: 1,
      vendorEmail: "vendor1@example.com",
      name: "Lantern Garden Hall",
      location: "Carlton, Melbourne",
      capacity: 120,
      price: 2500,
      recommendedSuitability: "Birthday, Wedding",
      description: "Warm garden venue for birthdays and ceremonies.",
      image: "/uploads/venues/venue_1.jpg",
      status: "available",
    });
    expect(response.body.venues[1]).toMatchObject({
      id: 2,
      vendorEmail: "vendor2@example.com",
      name: "Skyline Room",
      location: "Melbourne CBD",
      capacity: 80,
      price: 1800,
      recommendedSuitability: "Corporate",
      description: "City-view venue for small corporate events.",
      image: "/uploads/venues/venue_2.jpg",
      status: "available",
    });
  });

  // This test checks that a vendor can update the details of a venue they own,
  // which supports the vendor CRUD requirement for venue management.
  test("vendor can modify venue's details", async () => {
    // Arrange
    const existingVenue = {
      venueID: 1,
      vendorAccountID: 10,
      venueName: "Old Venue Name",
      location: "Old Location",
      capacity: 100,
      price: "1000.00",
      description: "Old description",
      imageUrl: "/uploads/venues/old.jpg",
      status: "available",
      recommendedSuitabilities: [],
    };
    const venueRepository = createRepository({
      findOneBy: jest.fn().mockResolvedValue(existingVenue),
      save: jest.fn().mockImplementation(async (venue) => venue),
      findOne: jest.fn().mockImplementation(async ({ where }) => ({
        ...existingVenue,
        venueID: where.venueID,
        vendorAccount: {
          user: {
            email: "vendor@example.com",
          },
        },
        recommendedSuitabilities: [],
      })),
    });
    mockRepositories(
      new Map<unknown, MockRepository>([
        [Venue, venueRepository],
      ]),
    );

    // Act
    const response = await request(app)
      .put("/api/venues/1")
      .send({
        vendorAccountID: 10,
        name: "Updated Venue Name",
        location: "Melbourne CBD",
        capacity: 180,
        price: 2500,
        description: "Updated venue description",
        image: "/uploads/venues/new.jpg",
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Venue updated successfully");
    expect(venueRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        venueID: 1,
        vendorAccountID: 10,
        venueName: "Updated Venue Name",
        location: "Melbourne CBD",
        capacity: 180,
        price: "2500.00",
        description: "Updated venue description",
        imageUrl: "/uploads/venues/new.jpg",
      }),
    );
    expect(response.body.venue.id).toBe(1);
    expect(response.body.venue.name).toBe("Updated Venue Name");
    expect(response.body.venue.location).toBe("Melbourne CBD");
    expect(response.body.venue.capacity).toBe(180);
    expect(response.body.venue.price).toBe(2500);
    expect(response.body.venue.description).toBe("Updated venue description");
  });

  // This test verifies that report chart data follows the DI rule that tally means accepted bookings only.
  // This matters because vendor visual summaries should not count pending or rejected applications.
  test("vendor summary report only counts Accepted bookings", async () => {
    // Arrange
    const allBookings = [
      {
        bookingID: 1,
        venueID: 10,
        accountID: 2,
        status: "Accepted",
        venue: { venueID: 10, venueName: "Lantern Garden Hall" },
        hirerAccount: {
          user: { firstName: "Ava", lastName: "Wong", email: "ava@example.com" },
        },
      },
      {
        bookingID: 2,
        venueID: 10,
        accountID: 2,
        status: "Accepted",
        venue: { venueID: 10, venueName: "Lantern Garden Hall" },
        hirerAccount: {
          user: { firstName: "Ava", lastName: "Wong", email: "ava@example.com" },
        },
      },
      {
        bookingID: 3,
        venueID: 10,
        accountID: 3,
        status: "Pending",
        venue: { venueID: 10, venueName: "Lantern Garden Hall" },
        hirerAccount: {
          user: { firstName: "Ben", lastName: "Ray", email: "ben@example.com" },
        },
      },
      {
        bookingID: 4,
        venueID: 11,
        accountID: 5,
        status: "Rejected",
        venue: { venueID: 11, venueName: "Skyline Room" },
        hirerAccount: {
          user: { firstName: "Cara", lastName: "Lee", email: "cara@example.com" },
        },
      },
    ];
    const queryBuilder = createQueryBuilder(
      jest.fn(async () =>
        allBookings.filter((booking) => booking.status === "Accepted"),
      ),
    );
    const vendorRepository = createRepository({
      findOneBy: jest.fn().mockResolvedValue({ vendorAccountID: 7 }),
    });
    const venueRepository = createRepository({
      findBy: jest.fn().mockResolvedValue([
        { venueID: 10, vendorAccountID: 7 },
        { venueID: 11, vendorAccountID: 7 },
      ]),
    });
    const bookingRepository = createRepository({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    });
    mockRepositories(
      new Map<unknown, MockRepository>([
        [VendorAccount, vendorRepository],
        [Venue, venueRepository],
        [Booking, bookingRepository],
      ]),
    );

    // Act
    const response = await request(app).get("/api/reports/vendor/7/summary");

    // Assert
    expect(response.status).toBe(200);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "booking.status = :status",
      { status: "Accepted" },
    );
    expect(response.body.report.talliesByVenue).toEqual([
      {
        venueID: 10,
        venueName: "Lantern Garden Hall",
        hirerName: "Ava Wong",
        tally: 2,
      },
    ]);
    expect(response.body.report.activeHirers).toEqual([
      { hirerName: "Ava Wong", tally: 2 },
    ]);
    expect(JSON.stringify(response.body.report)).not.toContain("Ben Ray");
    expect(JSON.stringify(response.body.report)).not.toContain("Cara Lee");
  });
});
