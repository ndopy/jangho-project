const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type PriceOption = {
  label: string;
  price: number;
  priceMax?: number;
  durationMinutes?: number;
};

export type ExperienceProgram = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  priceOptions: PriceOption[] | null;
  notes: string | null;
  capacity: number | null;
  durationMinutes: number | null;
  location: string | null;
  contactPhone: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type Accommodation = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  priceOptions: PriceOption[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  amenities: string | null;
  houseRules: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  price: number | null;
  location: string | null;
  contactPhone: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type Notice = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

// 국립해양조사원 갯벌체험지수 API 기반. 장호(고창)는 이 API의 지원 마을 목록에 없어서
// 같은 곰소만 인근의 "만돌마을"(전북 부안군) 데이터를 참고용으로 대신 쓰고 있음 —
// villageName이 항상 "만돌마을"로 나오는 게 정상이며 버그가 아님.
export type MudflatForecast = {
  id: number;
  date: string;
  villageName: string;
  experienceStartTime: string | null;
  experienceEndTime: string | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  minWindSpeed: number | null;
  maxWindSpeed: number | null;
  weather: string | null;
  totalIndex: string;
  createdAt: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiGetOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function getExperiences() {
  return apiGet<ExperienceProgram[]>('/experiences');
}

export function getExperienceById(id: number) {
  return apiGetOrNull<ExperienceProgram>(`/experiences/${id}`);
}

export function getAccommodations() {
  return apiGet<Accommodation[]>('/accommodations');
}

export function getAccommodationById(id: number) {
  return apiGetOrNull<Accommodation>(`/accommodations/${id}`);
}

export function getNotices() {
  return apiGet<Notice[]>('/notices');
}

export function getNoticeById(id: number) {
  return apiGetOrNull<Notice>(`/notices/${id}`);
}

export function getMudflatForecasts() {
  return apiGet<MudflatForecast[]>('/mudflat-forecast');
}

export function getMudflatForecastByDate(date: string) {
  return apiGetOrNull<MudflatForecast>(`/mudflat-forecast/${date}`);
}
