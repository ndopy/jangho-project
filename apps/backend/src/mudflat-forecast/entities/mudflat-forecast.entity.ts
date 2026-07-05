import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 국립해양조사원 "갯벌체험지수" API(GetFcstMudflatApiServicev2) 응답을 저장하는 테이블.
 *
 * 장호(고창)는 이 API가 지원하는 전국 18개 체험마을 목록에 없어서,
 * 같은 곰소만을 사이에 둔 가장 가까운 마을인 "만돌마을"(전북 부안군, 약 17km 거리)
 * 데이터를 참고용으로 대신 쓰고 있음. villageName 컬럼에 실제 API가 응답한
 * 마을명이 그대로 들어가므로, 나중에 장호가 지원 목록에 추가되면 이 값만
 * 바꿔서 재동기화하면 됨 (src/sync-mudflat.ts의 REFERENCE_VILLAGE_NAME 참고).
 */
@Entity('mudflat_forecasts')
export class MudflatForecast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  // API가 실제로 응답한 기준 마을명 (예: "만돌마을") — 장호 자체 데이터가 아님을 추적하기 위해 저장
  @Column()
  villageName: string;

  @Column({ type: 'time', nullable: true })
  experienceStartTime: string;

  @Column({ type: 'time', nullable: true })
  experienceEndTime: string;

  @Column({ type: 'float', nullable: true })
  minTemperature: number;

  @Column({ type: 'float', nullable: true })
  maxTemperature: number;

  @Column({ type: 'float', nullable: true })
  minWindSpeed: number;

  @Column({ type: 'float', nullable: true })
  maxWindSpeed: number;

  @Column({ nullable: true })
  weather: string;

  // 매우나쁨/나쁨/보통/좋음/매우좋음/체험불가 중 하나
  @Column()
  totalIndex: string;

  @CreateDateColumn()
  createdAt: Date;
}
