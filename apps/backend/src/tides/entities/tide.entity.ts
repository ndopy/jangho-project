import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 2026-07-05 기준 미사용(dormant) 상태.
 * 원래 간조/만조 원시 시각·수위를 저장하려 했으나, 이 값을 받아올 수 있는
 * 무료 공공데이터 API를 아직 확보하지 못해 실제로 채워진 데이터가 없음.
 * 대신 실제로 연동한 것은 국립해양조사원 "갯벌체험지수" API이며,
 * 그 데이터는 `MudflatForecast` 엔티티(src/mudflat-forecast)에 저장됨.
 * 나중에 정확한 조위 예측 API를 찾으면 이 엔티티를 다시 쓸 수 있어서
 * 삭제하지 않고 남겨둠. 모듈/엔드포인트(GET /tides 등)는 그대로 존재하지만
 * 실제로 채워지는 데이터는 없다.
 */
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
