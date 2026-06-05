import { Request, Response } from "express";
import argon2 from "argon2";
import { AppDataSource } from "../data-source";
import { HirerAccount } from "../entity/HirerAccount";
import { User } from "../entity/User";
import { VendorAccount } from "../entity/VendorAccount";
import { validatePassword } from "../utils/passwordValidator";

// Signup only serve to hirer account
// vendor and admin accounts will be created by developers directly in the database for testing purposes
export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        message: "firstName, lastName, email, and password are required",
      });
      return;
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      res.status(400).json({ message: passwordValidation.message });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);

    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      res.status(409).json({ message: "Email is already registered" });
      return;
    }

    const hashedPassword = await argon2.hash(password);

    const user = userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "hirer",
    });

    const savedUser = await userRepository.save(user);

    const hirerAccount = hirerAccountRepository.create({
      userID: savedUser.userID,
      isActive: true,
      reputation: 0,
      complianceScore: 0,
    });

    const savedHirerAccount = await hirerAccountRepository.save(hirerAccount);

    res.status(201).json({
      message: "Signup successful",
      user: {
        userID: savedUser.userID,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        accountID: savedHirerAccount.hireAccountID,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    let accountID: number | null = null;

    if (user.role === "hirer") {
      const hirerAccountRepository = AppDataSource.getRepository(HirerAccount);
      const hirerAccount = await hirerAccountRepository.findOne({
        where: { userID: user.userID },
      });

      if (!hirerAccount) {
        res.status(404).json({ message: "Hirer account not found" });
        return;
      }

      accountID = hirerAccount.hireAccountID;
    }

    if (user.role === "vendor") {
      const vendorAccountRepository = AppDataSource.getRepository(VendorAccount);
      const vendorAccount = await vendorAccountRepository.findOne({
        where: { userID: user.userID },
      });

      if (!vendorAccount) {
        res.status(404).json({ message: "Vendor account not found" });
        return;
      }

      accountID = vendorAccount.vendorAccountID;
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountID,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }

}

export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}
