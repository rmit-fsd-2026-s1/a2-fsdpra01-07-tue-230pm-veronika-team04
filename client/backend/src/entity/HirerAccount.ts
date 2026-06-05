import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Booking } from "./Booking";
import { Documents } from "./Documents";
import { User } from "./User";
import { VenuePreference } from "./VenuePreference";

@Entity({ name: "HirerAccount" })
export class HirerAccount {
  @PrimaryGeneratedColumn()
  hireAccountID: number;

  @Column({ type: "int", unique: true })
  userID: number;

  @Column({ type: "bit", default: true })
  isActive: boolean;

  @Column({ type: "float", default: 0 })
  reputation: number;

  @Column({ type: "int", default: 0 })
  complianceScore: number;

  @OneToOne(() => User, (user) => user.hirerAccount)
  @JoinColumn({ name: "userID", referencedColumnName: "userID" })
  user: User;

  @OneToOne(() => Documents, (documents) => documents.hirerAccount)
  documents?: Documents;

  @OneToMany(() => Booking, (booking) => booking.hirerAccount)
  bookings: Booking[];

  @OneToMany(
    () => VenuePreference,
    (venuePreference) => venuePreference.hirerAccount,
  )
  venuePreferences: VenuePreference[];
}
