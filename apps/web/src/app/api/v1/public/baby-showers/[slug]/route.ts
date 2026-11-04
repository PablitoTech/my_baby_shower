import { json, route } from '@/server/http/handler';
import { getPublicBabyShower } from '@/server/services/public.service';
import { publicId } from '../../_params';

export const GET = route<{ slug: string }>(async (_req, { slug }) => json(await getPublicBabyShower(publicId(slug))));
