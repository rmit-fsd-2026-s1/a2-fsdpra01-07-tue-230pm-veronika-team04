import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/authRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import profileRoutes from "./routes/profileRoutes";
import venuePreferenceRoutes from "./routes/venuePreferenceRoutes";
import venueRoutes from "./routes/venueRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import blockedSlotRoutes from "./routes/blockedSlotRoutes";
import documentRoutes from "./routes/documentRoutes";
import visualDataRoutes from "./routes/visualDataRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const port = process.env.PORT || 3001;

app.get("/", (_req, res) => {
  res.send("Venue Vendor backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/venue-preferences", venuePreferenceRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/blocked-slots", blockedSlotRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reports", visualDataRoutes);


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
