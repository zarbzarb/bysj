import { post } from '@/services/xhr/fetch';
import { z } from 'zod';

const url = '/api/page/resourceVirtualFolder/v1/createOrUpdate';

export enum BusinessType {
  Page = 1,
  Layer = 2,
  Card = 3,
}

export const payloadBodyZ = z.object({
  businessId: z.string(),
  businessType: z.nativeEnum(BusinessType),
  id: z.string().optional(),
  name: z.string(),
  resourceCatalog: z.union([z.literal('images'), z.literal('media'), z.literal('other')]),
});

export default async (
  data: z.infer<typeof payloadBodyZ>,
): Promise<{
  code: string;
  data: string;
  message: string;
  success: boolean;
}> => {
  const parsed = payloadBodyZ.safeParse(data);

  if (!parsed.success) throw parsed.error;

  return post(url, parsed.data);
};
