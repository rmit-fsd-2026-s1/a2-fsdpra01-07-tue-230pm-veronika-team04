import "reflect-metadata";
import { DataSource } from "typeorm";

const dbConfig = {
  host: "santha26.cn2ems8y2mfe.ap-southeast-2.rds.amazonaws.com",
  port: 1433,
  username: "s4060865",
  password: "Sht20050212@",
  database: "s4060865",
};

// Debug only: do not print the real password
console.log("DB_HOST:", dbConfig.host);
console.log("DB_PORT:", dbConfig.port);
console.log("DB_USERNAME:", dbConfig.username);
console.log("DB_DATABASE:", dbConfig.database);
console.log("HAS_PASSWORD:", !!dbConfig.password);

export const AppDataSource = new DataSource({
  type: "mssql",

  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,

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