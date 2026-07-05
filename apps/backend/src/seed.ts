import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { ExperienceProgram } from './experiences/entities/experience-program.entity';
import { Accommodation } from './accommodations/entities/accommodation.entity';
import { Notice } from './notices/entities/notice.entity';

// 한국어촌어항공단 공식 사이트(cms.seantour.com/JB003)에서 확인한 실제 정보.
// 가격/정원/소요시간은 공식 사이트에도 게시되어 있지 않아 비워둠(null).
const experiences: Partial<ExperienceProgram>[] = [
  {
    name: '고창장호해변승마체험',
    location: '전북특별자치도 고창군 상하면 명사십리로 282-7',
    contactPhone: '010-4030-7650',
  },
  {
    name: '조개 캐기 체험',
    location: '전북 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '후릿그물 체험',
    location: '전북 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
];

const accommodations: Partial<Accommodation>[] = [
  {
    name: '스테이바다70 펜션',
    type: 'pension',
    capacityMin: 4,
    capacityMax: 6,
    location: '전북특별자치도 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '민박 (6~8인)',
    type: 'minbak',
    capacityMin: 6,
    capacityMax: 8,
    location: '전북특별자치도 고창군 상하면 명사십리로 282-42',
    contactPhone: '063-562-9390',
  },
  {
    name: '민박 (4인)',
    type: 'minbak',
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
    const exists = await repo.findOne({ where: { name: item.name } });
    if (exists) {
      console.log(`- 이미 있음, 건너뜀: ${item.name}`);
      continue;
    }
    await repo.save(repo.create(item));
    console.log(`+ 생성: ${item.name}`);
  }
}

async function seedAccommodations(repo: Repository<Accommodation>) {
  for (const item of accommodations) {
    const exists = await repo.findOne({ where: { name: item.name } });
    if (exists) {
      console.log(`- 이미 있음, 건너뜀: ${item.name}`);
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
