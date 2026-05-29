import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tides')
export class Tide {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ type: 'time', nullable: true })
  lowTide1Time: string;

  @Column({ type: 'int', nullable: true })
  lowTide1Level: number;

  @Column({ type: 'time', nullable: true })
  lowTide2Time: string;

  @Column({ type: 'int', nullable: true })
  lowTide2Level: number;

  @Column({ type: 'time', nullable: true })
  highTide1Time: string;

  @Column({ type: 'int', nullable: true })
  highTide1Level: number;

  @Column({ type: 'time', nullable: true })
  highTide2Time: string;

  @Column({ type: 'int', nullable: true })
  highTide2Level: number;

  @CreateDateColumn()
  createdAt: Date;
}
