import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ReservationDto, ReservationFilters, ReservationStatus } from '@mbs/contracts';
import { API } from './api';

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);

  list(filters: ReservationFilters = {}) {
    let params = new HttpParams();
    if (filters.giftId) params = params.set('giftId', filters.giftId);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ReservationDto[]>(`${API}/reservations`, { params });
  }
  updateStatus(id: string, status: ReservationStatus) {
    return this.http.patch<ReservationDto>(`${API}/reservations/${id}/status`, { status });
  }
}
