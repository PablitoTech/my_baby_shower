import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CategoryDto, CreateGiftRequest, GiftDto, GiftStatus, UpdateGiftRequest } from '@mbs/contracts';
import { API } from './api';

@Injectable({ providedIn: 'root' })
export class GiftsApi {
  private readonly http = inject(HttpClient);

  categories() {
    return this.http.get<CategoryDto[]>(`${API}/categories`);
  }
  list(filters: { categoryId?: string; status?: GiftStatus } = {}) {
    let params = new HttpParams();
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<GiftDto[]>(`${API}/gifts`, { params });
  }
  create(body: CreateGiftRequest) {
    return this.http.post<GiftDto>(`${API}/gifts`, body);
  }
  update(id: string, body: UpdateGiftRequest) {
    return this.http.patch<GiftDto>(`${API}/gifts/${id}`, body);
  }
  remove(id: string) {
    return this.http.delete<void>(`${API}/gifts/${id}`);
  }
  uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<GiftDto>(`${API}/gifts/${id}/image`, form);
  }
  removeImage(id: string) {
    return this.http.delete<GiftDto>(`${API}/gifts/${id}/image`);
  }
}
