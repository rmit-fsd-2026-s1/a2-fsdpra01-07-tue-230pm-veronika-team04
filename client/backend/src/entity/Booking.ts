import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { HirerAccount } from "./HirerAccount";
import { Venue } from "./Venue";

@Entity({ name: "Booking" })
export class Booking {
  @PrimaryGeneratedColumn()
  bookingID: number;

  @Column({ type: "int" })
  venueID: number;

  @Column({ type: "int" })
  accountID: number;

  @Column({ type: "nvarchar", length: 150 })
  eventName: string;

  @Column({ type: "date" })
  eventDate: Date;

  @Column({ type: "datetime2" })
  eventTime: Date;

  @Column({ type: "int" })
  guestCount: number;

  @Column({ type: "int" })
  duration: number;

  @Column({ type: "nvarchar", length: 50, default: "Pending" })
  status: string;

  @Column({ type: "datetime2", default: () => "GETDATE()" })
  createdAt: Date;

  @Column({ type: "nvarchar", length: 500, nullable: true, default: null })
  vendorComments: string | null;

  @Column({ type: "float", nullable: true, default: null })
  rating: number | null;

  @Column({ type: "nvarchar", length: 500, nullable: true, default: null })
  vendorComment: string | null;

  @ManyToOne(() => Venue, (venue) => venue.bookings)
  @JoinColumn({ name: "venueID", referencedColumnName: "venueID" })
  venue: Venue;

  @ManyToOne(() => HirerAccount, (hirerAccount) => hirerAccount.bookings)
  @JoinColumn({
    name: "accountID",
    referencedColumnName: "hireAccountID",
  })
  hirerAccount: HirerAccount;
}
