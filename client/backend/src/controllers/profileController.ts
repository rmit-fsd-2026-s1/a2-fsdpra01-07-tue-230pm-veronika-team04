import { Request, Response } from "express";
import argon2 from "argon2";
import { AppDataSource } from "../data-source";
import { HirerAccount } from "../entity/HirerAccount";
import { User } from "../entity/User";
import { VendorAccount } from "../entity/VendorAccount";
import { validatePassword } from "../utils/passwordValidator";

function parseUserID(userIDParam: string | string[]): number | null {
  if (Array.isArray(userIDParam)) {
    return null;
  }

  const userID = Number(userIDParam);

  if (!Number.isInteger(userID) || userID <= 0) {
    return null;
  }

  return userID;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userID = parseUserID(req.params.userID);

    if (userID === null) {
      res.status(400).json({ message: "Invalid userID" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);
    const vendorAccountRepository = AppDataSource.getRepository(VendorAccount);

    const user = await userRepository.findOne({ where: { userID } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let accountID: number | null = null;
    let reputation: number | null = null;
    let complianceScore: number | null = null;

    if (user.role === "hirer") {
      const hirerAccount = await hirerAccountRepository.findOne({
        where: { userID },
      });

      if (hirerAccount) {
        accountID = hirerAccount.hireAccountID;
        reputation = hirerAccount.reputation;
        complianceScore = hirerAccount.complianceScore;
      }
    }

    if (user.role === "vendor") {
      const vendorAccount = await vendorAccountRepository.findOne({
        where: { userID },
      });

      if (vendorAccount) {
        accountID = vendorAccount.vendorAccountID;
      }
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      profile: {
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        accountID,
        reputation,
        complianceScore,
      },
    });
  } catch (error) {
    console.error("Get profile failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userID = parseUserID(req.params.userID);
    const { firstName, lastName, phone } = req.body;

    if (userID === null) {
      res.status(400).json({ message: "Invalid userID" });
      return;
    }

    if (!firstName || !lastName) {
      res.status(400).json({ message: "firstName and lastName are required" });
      return;
    }

    if (phone !== undefined && phone === "") {
      res.status(400).json({ message: "phone cannot be empty" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { userID } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone ?? null;

    const savedUser = await userRepository.save(user);

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        userID: savedUser.userID,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

export async function updateEmail(req: Request, res: Response): Promise<void> {
  try {
    const userID = parseUserID(req.params.userID);
    const { email } = req.body;

    if (userID === null) {
      res.status(400).json({ message: "Invalid userID" });
      return;
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if email is already taken by another user
    const existing = await userRepository.findOne({ where: { email: email.trim() } });
    if (existing && existing.userID !== userID) {
      res.status(409).json({ message: "Email is already in use" });
      return;
    }

    const user = await userRepository.findOne({ where: { userID } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.email = email.trim();
    const savedUser = await userRepository.save(user);

    res.status(200).json({
      message: "Email updated successfully",
      profile: {
        userID: savedUser.userID,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update email failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

export async function updatePassword(req: Request, res: Response): Promise<void> {
  try {
    const userID = parseUserID(req.params.userID);
    const { currentPassword, newPassword } = req.body;

    if (userID === null) {
      res.status(400).json({ message: "Invalid userID" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: "currentPassword and newPassword are required",
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { userID } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isCurrentPasswordValid = await argon2.verify(
      user.password,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      res.status(400).json({ message: passwordValidation.message });
      return;
    }

    user.password = await argon2.hash(newPassword);

    await userRepository.save(user);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}
