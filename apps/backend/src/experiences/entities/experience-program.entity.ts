import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PriceOption } from '../../common/types/price-option.type';

@Entity('experience_programs')
export class ExperienceProgram {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  price: number;

  // 옵션별로 가격/소요시간이 나뉘는 프로그램의 상세 요금표 (예: 승마체험)
  @Column({ type: 'simple-json', nullable: true })
  priceOptions: PriceOption[] | null;

  // 준비물/주의사항 등을 줄바꿈으로 구분한 목록
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
