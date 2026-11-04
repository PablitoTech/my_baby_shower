import type { BabyShowerDto } from '@mbs/contracts';
import type { BabyShower } from '../generated/prisma/client.js';

export function toBabyShowerDto(b: BabyShower): BabyShowerDto {
  return {
    id: b.id,
    babyName: b.babyName,
    fatherName: b.fatherName,
    motherName: b.motherName,
    eventDate: b.eventDate.toISOString(),
    description: b.description,
    isPublished: b.isPublished,
    publicSlug: b.publicSlug,
    publishedAt: b.publishedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
