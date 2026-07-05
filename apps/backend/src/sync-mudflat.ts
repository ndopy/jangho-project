import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MudflatForecastService } from './mudflat-forecast/mudflat-forecast.service';

/**
 * 국립해양조사원 "갯벌체험지수" API에서 예보를 받아와 MudflatForecast 테이블에 upsert함.
 *
 * 장호(고창)는 이 API가 지원하는 전국 18개 마을 목록에 없어서, 같은 곰소만을 사이에 둔
 * 가장 가까운 "만돌마을"(전북 부안군, 약 17km 거리) 데이터를 참고용으로 대신 씀.
 * MUDFLAT_REFERENCE_VILLAGE 환경변수로 지정하며, 나중에 장호가 지원 목록에 추가되면
 * 이 값만 바꿔서 재동기화하면 됨.
 */

const API_ENDPOINT =
  'https://apis.data.go.kr/1192136/fcstMudflatv2/GetFcstMudflatApiServicev2';

interface MudflatApiItem {
  mdftExpcnVlgNm: string;
  predcYmd: string;
  mdftExprnBgngTm: string;
  mdftExprnEndTm: string;
  minArtmp: string;
  maxArtmp: string;
  minWspd: string;
  maxWspd: string;
  weather: string;
  totalIndex: string;
}

interface MudflatApiResponse {
  header: { resultCode: string; resultMsg: string };
  body: { totalCount: number; items: { item: MudflatApiItem[] } };
}

async function fetchForecastItems(
  serviceKey: string,
): Promise<MudflatApiItem[]> {
  const url = new URL(API_ENDPOINT);
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '300');
  url.searchParams.set('type', 'json');

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`갯벌체험지수 API 요청 실패: ${res.status}`);
  }

  const data = (await res.json()) as MudflatApiResponse;

  if (data.header.resultCode !== '00') {
    throw new Error(`갯벌체험지수 API 오류: ${data.header.resultMsg}`);
  }

  return data.body.items.item;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const configService = app.get(ConfigService);
    const serviceKey = configService.getOrThrow<string>('MUDFLAT_API_KEY');
    const referenceVillage = configService.getOrThrow<string>(
      'MUDFLAT_REFERENCE_VILLAGE',
    );

    console.log(`갯벌체험지수 동기화 중... (기준 마을: ${referenceVillage})`);

    const items = await fetchForecastItems(serviceKey);
    const villageItems = items.filter(
      (item) => item.mdftExpcnVlgNm === referenceVillage,
    );

    if (villageItems.length === 0) {
      console.warn(
        `"${referenceVillage}" 데이터를 응답에서 찾지 못했습니다. 마을 이름을 확인해주세요.`,
      );
      return;
    }

    const mudflatForecastService = app.get(MudflatForecastService);

    for (const item of villageItems) {
      await mudflatForecastService.upsertByDate(item.predcYmd, {
        villageName: item.mdftExpcnVlgNm,
        experienceStartTime: item.mdftExprnBgngTm,
        experienceEndTime: item.mdftExprnEndTm,
        minTemperature: parseFloat(item.minArtmp),
        maxTemperature: parseFloat(item.maxArtmp),
        minWindSpeed: parseFloat(item.minWspd),
        maxWindSpeed: parseFloat(item.maxWspd),
        weather: item.weather,
        totalIndex: item.totalIndex,
      });
      console.log(`~ ${item.predcYmd} 저장 완료 (${item.totalIndex})`);
    }

    console.log(`동기화 완료: ${villageItems.length}건`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
