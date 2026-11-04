import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { BabyShowerDto, DashboardSummary, PublicBabyShower, ReservationConfirmation, CreateReservationRequest, UpdateBabyShowerRequest } from '@mbs/contracts';
import { API } from './api';

@Injectable({ providedIn: 'root' })
export class BabyShowerApi {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<BabyShowerDto>(`${API}/baby-shower`);
  }
  update(body: UpdateBabyShowerRequest) {
    return this.http.patch<BabyShowerDto>(`${API}/baby-shower`, body);
  }
  dashboard() {
    return this.http.get<DashboardSummary>(`${API}/baby-shower/dashboard`);
  }
  publish() {
    return this.http.post<BabyShowerDto>(`${API}/baby-shower/publish`, {});
  }
  unpublish() {
    return this.http.post<BabyShowerDto>(`${API}/baby-shower/unpublish`, {});
  }

  // ---- Público (sin autenticación) ----
  getPublic(slug: string) {
    return this.http.get<PublicBabyShower>(`${API}/public/baby-showers/${encodeURIComponent(slug)}`);
  }
  reserve(slug: string, giftPublicId: string, body: CreateReservationRequest) {
    return this.http.post<ReservationConfirmation>(
      `${API}/public/baby-showers/${encodeURIComponent(slug)}/gifts/${encodeURIComponent(giftPublicId)}/reservations`,
      body,
    );
  }
}
