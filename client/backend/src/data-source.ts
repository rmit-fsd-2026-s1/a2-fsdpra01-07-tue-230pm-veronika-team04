import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { BlockedSlot } from "./entity/BlockedSlot";
import { Booking } from "./entity/Booking";
import { Documents } from "./entity/Documents";
import { HirerAccount } from "./entity/HirerAccount";
import { RecommendedSuitability } from "./entity/RecommendedSuitability";
import { SuitabilityTag } from "./entity/SuitabilityTag";
import { User } from "./entity/User";
import { VendorAccount } from "./entity/VendorAccount";
import { Venue } from "./entity/Venue";
import { VenuePreference } from "./entity/VenuePreference";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  synchronize: false,
  logging: true,

  entities: [
    User,
    HirerAccount,
    VendorAccount,
    Documents,
    SuitabilityTag,
    Venue,
    VenuePreference,
    Booking,
    BlockedSlot,
    RecommendedSuitability,
  ],

  migrations: [],
  subscribers: [],

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
});
