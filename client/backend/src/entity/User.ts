import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { HirerAccount } from "./HirerAccount";
import { VendorAccount } from "./VendorAccount";

@Entity({ name: "User" })
export class User {
  @PrimaryGeneratedColumn()
  userID: number;

  @Column({ type: "nvarchar", length: 100 })
  firstName: string;

  @Column({ type: "nvarchar", length: 100 })
  lastName: string;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email: string;

  @Column({ type: "nvarchar", length: 255 })
  password: string;

  @Column({ type: "nvarchar", length: 30, nullable: true })
  phone: string | null;

  @Column({ type: "nvarchar", length: 20 })
  role: string;

  @CreateDateColumn({ type: "datetime2" })
  createdAt: Date;

  @OneToOne(() => HirerAccount, (hirerAccount) => hirerAccount.user)
  hirerAccount?: HirerAccount;

  @OneToOne(() => VendorAccount, (vendorAccount) => vendorAccount.user)
  vendorAccount?: VendorAccount;
}
