import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// 예약 "신청서" 수준의 기능. 날짜별 정원/중복예약 체크 같은 재고 관리는 하지 않고,
// 마을에서 신청 내용을 보고 전화로 확정하는 방식(관리자 화면은 아직 없음 — DB 직접 조회).
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  itemType: 'experience' | 'accommodation';

  @Column()
  itemId: number;

  // 이후 체험/숙박 이름이 바뀌거나 삭제되어도 신청 당시 이름을 그대로 보여주기 위한 스냅샷
  @Column()
  itemName: string;

  @Column({ type: 'date' })
  desiredDate: string;

  @Column()
  peopleCount: number;

  @Column()
  applicantName: string;

  @Column()
  applicantPhone: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'confirmed' | 'hold';

  @CreateDateColumn()
  createdAt: Date;
}
