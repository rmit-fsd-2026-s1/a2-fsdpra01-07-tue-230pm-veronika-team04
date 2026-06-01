import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

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

  entities: [],

  migrations: [],
  subscribers: [],

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
});