import { Request, Response } from "express";
import argon2 from "argon2";
import { AppDataSource } from "../data-source";
import { HirerAccount } from "../entity/HirerAccount";
import { User } from "../entity/User";
import { validatePassword } from "../utils/passwordValidator";

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
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}
