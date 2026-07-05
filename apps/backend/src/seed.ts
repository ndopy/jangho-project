import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { ExperienceProgram } from './experiences/entities/experience-program.entity';
import { Accommodation } from './accommodations/entities/accommodation.entity';
import { Notice } from './notices/entities/notice.entity';

// 한국어촌어항공단 공식 사이트(cms.seantour.com/JB003)의 각 게시글 상세페이지에서 확인한 실제 정보.
// 옵션/시즌별 요금은 priceOptions에, 준비물·유의사항은 notes/houseRules에 구조화해서 넣음.
const experiences: Partial<ExperienceProgram>[] = [
  {
    name: '고창장호해변승마체험',
    description: '고창 해변에서 즐기는 해변외승과 솔밭 트레킹 승마 체험',
    price: 33000,
    priceOptions: [
      { label: '말먹이주기', price: 10000 },
      { label: '승마체험', price: 33000, durationMinutes: 10 },
      { label: '일반승마', price: 70000, durationMinutes: 45 },
      { label: '해변승마', price: 100000, durationMinutes: 120 },
      { label: '솔밭외승', price: 80000, durationMinutes: 90 },
    ],
    notes:
      '긴바지 착용 필수\n헬멧·안전조끼 무료 대여\n운영시간 09:00~18:00, 연중무휴',
    location: '전북특별자치도 고창군 상하면 명사십리로 282-7',
    contactPhone: '010-4030-7650',
  },
  {
    name: '조개 캐기 체험',
    description: '물때에 맞춰 갯벌에서 즐기는 조개 캐기 체험',
    price: 12000,
    priceOptions: [
      { label: '성인 (현금 결제 시 1,000원 할인)', price: 12000 },
      { label: '학생', price: 9000 },
      { label: '어린이 (5~7세)', price: 6000 },
    ],
    notes:
      '망·호미·장화 제공, 개인 채집도구 반입 불가\n소요시간 1시간~1시간 30분\n매년 4월~11월 운영, 하루 물때에 맞춰 1시간 단위로 진행',
    location: '전북 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '후릿그물 체험',
    description: '그물을 함께 끌어당겨 물고기를 잡는 전통 어업 체험',
    price: 500000,
    durationMinutes: 120,
    priceOptions: [{ label: '그룹 (최소 5인)', price: 500000 }],
    notes: '가이드 1명 동행\n매년 5월~9월 운영, 조수 시간표에 따라 시간 변동',
    location: '전북 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
];

const accommodations: Partial<Accommodation>[] = [
  {
    name: '스테이바다70 펜션',
    type: 'pension',
    description: '체험장 근처에 위치한 4~6인용 독채형 펜션',
    price: 150000,
    priceOptions: [
      { label: '비수기', price: 150000, priceMax: 180000 },
      { label: '성수기 (7/20~8/31)', price: 200000, priceMax: 240000 },
    ],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    amenities: 'Wi-Fi, 시스템 에어컨, TV, 인덕션',
    houseRules:
      '반려동물 출입 불가 (보조견 제외)\n실내 흡연 금지\n냄새 강한 음식 조리 금지\n22시(밤 11시) 이후 매너타임',
    capacityMin: 4,
    capacityMax: 6,
    location: '전북특별자치도 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '민박 (6~8인)',
    type: 'minbak',
    description: '체험장 바로 옆 민박, 넉넉한 인원이 묵기 좋은 곳',
    price: 120000,
    priceOptions: [
      { label: '비수기', price: 120000, priceMax: 140000 },
      { label: '성수기 (7/20~8/31)', price: 140000, priceMax: 160000 },
    ],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    amenities: '선풍기, 에어컨, TV, 침구류',
    houseRules:
      '화장실·샤워시설은 객실 외부(체험장 1층)에 위치\n반려동물 출입 불가 (보조견 제외)\n냄새 강한 음식 조리·실내 흡연 금지\n22시 이후 매너타임',
    capacityMin: 6,
    capacityMax: 8,
    location: '전북특별자치도 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '민박 (4인)',
    type: 'minbak',
    description: '체험장 바로 옆 민박, 소규모 인원에 적당한 곳',
    price: 80000,
    priceOptions: [
      { label: '비수기', price: 80000 },
      { label: '성수기 (7/20~8/31)', price: 100000 },
    ],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    amenities: '선풍기, 에어컨, TV, 침구류',
    houseRules:
      '화장실·샤워시설은 객실 외부(체험장 1층)에 위치\n반려동물 출입 불가 (보조견 제외)\n냄새 강한 음식 조리·실내 흡연 금지\n22시 이후 매너타임\n미성년자는 보호자 동반 필수',
    capacityMin: 4,
    capacityMax: 4,
    location: '전북특별자치도 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
];

// 공식 사이트의 실제 공지사항은 2023년 글이라 그대로 옮기지 않고,
// 화면 구성 확인용 데모 데이터임을 제목에 명시함.
const notices: Partial<Notice>[] = [
  {
    title: '[데모] 여름 체험 프로그램 운영시간 안내',
    content:
      '이 공지사항은 데모용 예시 데이터입니다. 실제 운영 정보가 등록되면 이 글은 교체·삭제될 예정입니다.',
  },
  {
    title: '[데모] 홈페이지 새 단장 안내',
    content:
      '장호어촌체험마을 홈페이지를 새로 준비하고 있습니다. 이 글은 화면 구성을 확인하기 위한 데모용 공지사항입니다.',
  },
];

async function seedExperiences(repo: Repository<ExperienceProgram>) {
  for (const item of experiences) {
    const existing = await repo.findOne({ where: { name: item.name } });
    if (existing) {
      await repo.save(repo.merge(existing, item));
      console.log(`~ 갱신: ${item.name}`);
      continue;
    }
    await repo.save(repo.create(item));
    console.log(`+ 생성: ${item.name}`);
  }
}

async function seedAccommodations(repo: Repository<Accommodation>) {
  for (const item of accommodations) {
    const existing = await repo.findOne({ where: { name: item.name } });
    if (existing) {
      await repo.save(repo.merge(existing, item));
      console.log(`~ 갱신: ${item.name}`);
      continue;
    }
    await repo.save(repo.create(item));
    console.log(`+ 생성: ${item.name}`);
  }
}

async function seedNotices(repo: Repository<Notice>) {
  for (const item of notices) {
    const exists = await repo.findOne({ where: { title: item.title } });
    if (exists) {
      console.log(`- 이미 있음, 건너뜀: ${item.title}`);
      continue;
    }
    await repo.save(repo.create(item));
    console.log(`+ 생성: ${item.title}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('체험 프로그램 시딩...');
    await seedExperiences(app.get(getRepositoryToken(ExperienceProgram)));

    console.log('숙박시설 시딩...');
    await seedAccommodations(app.get(getRepositoryToken(Accommodation)));

    console.log('공지사항 시딩...');
    await seedNotices(app.get(getRepositoryToken(Notice)));

    console.log('시딩 완료');
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
