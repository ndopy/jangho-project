const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export type Tide = {
  id: number;
  date: string;
  lowTide1Time: string | null;
  lowTide1Level: number | null;
  lowTide2Time: string | null;
  lowTide2Level: number | null;
  highTide1Time: string | null;
  highTide1Level: number | null;
  highTide2Time: string | null;
  highTide2Level: number | null;
  createdAt: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiGetOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function getExperiences() {
  return apiGet<ExperienceProgram[]>("/experiences");
}

export function getExperienceById(id: number) {
  return apiGetOrNull<ExperienceProgram>(`/experiences/${id}`);
}

export function getAccommodations() {
  return apiGet<Accommodation[]>("/accommodations");
}

export function getAccommodationById(id: number) {
  return apiGetOrNull<Accommodation>(`/accommodations/${id}`);
}

export function getNotices() {
  return apiGet<Notice[]>("/notices");
}

export function getTides() {
  return apiGet<Tide[]>("/tides");
}

export function getTideByDate(date: string) {
  return apiGetOrNull<Tide>(`/tides/${date}`);
}
