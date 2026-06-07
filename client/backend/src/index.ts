import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { app } from "./app";

dotenv.config();

const port = process.env.PORT || 3001;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
