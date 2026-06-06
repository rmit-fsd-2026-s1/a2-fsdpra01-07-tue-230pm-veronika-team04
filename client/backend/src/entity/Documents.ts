import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { HirerAccount } from "./HirerAccount";

@Entity({ name: "Documents" })
export class Documents {
  @PrimaryColumn({ type: "int" })
  accountID: number;

  @Column({ type: "varbinary", length: "MAX", nullable: true })
  driverLicenceData: Buffer | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  driverLicenceName: string | null;

  @Column({ type: "varbinary", length: "MAX", nullable: true })
  insuranceCertData: Buffer | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  insuranceCertName: string | null;

  @Column({ type: "varbinary", length: "MAX", nullable: true })
  businessRegCertData: Buffer | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  businessRegCertName: string | null;

  @Column({ type: "nvarchar", length: 20, nullable: true })
  abnNo: string | null;

  @Column({ type: "bit", default: false })
  isApplyAsBusiness: boolean;

  @OneToOne(() => HirerAccount, (hirerAccount) => hirerAccount.documents)
  @JoinColumn({ name: "accountID", referencedColumnName: "hireAccountID" })
  hirerAccount: HirerAccount;
}