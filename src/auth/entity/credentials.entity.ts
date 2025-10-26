import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Credentials {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  confirmationToken?: string;

  @CreateDateColumn()
  date_created: Date;
}
