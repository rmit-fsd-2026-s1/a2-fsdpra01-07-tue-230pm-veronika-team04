import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { app } from "./app";

dotenv.config();

const port = process.env.PORT || 3001;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");

    app.listen(Number(port), HOST, () => {
      const mode = process.env.NODE_ENV === "production" ? "Production" : "Local";
      console.log(`${mode} server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
