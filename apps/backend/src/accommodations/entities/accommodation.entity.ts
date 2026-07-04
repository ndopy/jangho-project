import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('accommodations')
export class Accommodation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'int', nullable: true })
  capacityMin: number;

  @Column({ type: 'int', nullable: true })
  capacityMax: number;

  @Column({ type: 'int', nullable: true })
  price: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
