import { Storage } from './store';
import { normText } from '../data/localPictos';

export interface ArasaacItem {
  id: number;
  word: string;
  url: string;
}

export async function searchArasaac(word: string): Promise<ArasaacItem[]> {
  const clean = word.trim();
  if (!clean) return [];

  const urls = [
    `https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(clean)}`,
    `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(clean)}`,
    `https://api.arasaac.org/api/search?locale=es&text=${encodeURIComponent(clean)}`,
  ];

  let rawList: unknown[] | null = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (Array.isArray(data)) {
        rawList = data;
        break;
      }
      if (data && Array.isArray((data as { symbol?: unknown[] }).symbol)) {
        rawList = (data as { symbol: unknown[] }).symbol;
        break;
      }
      if (data && Array.isArray((data as { data?: unknown[] }).data)) {
        rawList = (data as { data: unknown[] }).data;
        break;
      }
    } catch {
      // Continue to next URL
    }
  }

  if (!rawList) return [];

  return (rawList as Array<{ _id?: number; id?: number; idPictogram?: number }>)
    .map((item) => {
      const id = item._id || item.id || item.idPictogram;
      if (!id) return null;
      return {
        id,
        word: clean,
        url: `https://static.arasaac.org/pictograms/${id}/${id}_300.png`,
      };
    })
    .filter((x): x is ArasaacItem => x !== null);
}

export async function savePictoFromUrl(word: string, url: string): Promise<boolean> {
  const key = normText(word);
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    await Storage.putPicto(key, `<img src="${dataUrl}" alt="${word}" class="w-full h-full object-contain" />`);
    return true;
  } catch {
    // If CORS or offline, save URL directly
    await Storage.putPicto(key, `<img src="${url}" alt="${word}" class="w-full h-full object-contain" />`);
    return false;
  }
}
