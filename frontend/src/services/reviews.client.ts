// src/services/reviews.client.ts
import { api } from '../utils/api';

export type ReviewSort = 'recent' | 'best' | 'worst';
export type ReviewRatingFilter = 0 | 1 | 2 | 3 | 4 | 5;

export type ProfessionalReviewItem = {
  id: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  createdAt: string; // ISO
  rating: number; // 1..5
  comment?: string | null;
};

export type ListReviewsResponse = {
  results: ProfessionalReviewItem[];
  nextOffset: number | null;
  total?: number;
};

export async function listProfessionalReviews(
  profesionalId: string,
  params?: {
    sort?: ReviewSort;
    rating?: ReviewRatingFilter; // 0 = todas
    limit?: number;
    offset?: number;
  },
) {
  const sort = params?.sort ?? 'recent';
  const rating = params?.rating ?? 0;
  const limit = params?.limit ?? 10;
  const offset = params?.offset ?? 0;

  // ✅ endpoint recomendado:
  // GET /public/professionals/:id/reviews?sort=recent|best|worst&rating=0..5&limit=10&offset=0
  const r = await api.get<ListReviewsResponse>(
    `/private/professionals/${profesionalId}/reviews?sort=${sort}&rating=${rating}&limit=${limit}&offset=${offset}`,
  );

  return {
    results: r?.results ?? [],
    nextOffset: typeof r?.nextOffset === 'number' ? r.nextOffset : null,
    total: typeof (r as any)?.total === 'number' ? (r as any).total : undefined,
  };
}
