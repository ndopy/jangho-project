import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PriceOption } from '../../common/types/price-option.type';

@Entity('accommodations')
export class Accommodation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // 비수기/성수기 등 시즌별 요금
  @Column({ type: 'simple-json', nullable: true })
  priceOptions: PriceOption[] | null;

  @Column({ nullable: true })
  checkInTime: string;

  @Column({ nullable: true })
  checkOutTime: string;

  // 편의시설을 쉼표로 구분한 목록 (예: "Wi-Fi, 에어컨, TV")
  @Column({ type: 'text', nullable: true })
  amenities: string;

  // 유의사항을 줄바꿈으로 구분한 목록
  @Column({ type: 'text', nullable: true })
  houseRules: string;

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
