import { post } from '@/services/xhr/fetch';
import { z } from 'zod';

const url = '/api/page/resourceVirtualFolder/v1/delete';

export const payloadBodyZ = z.object({
  id: z.string(),
});

export default async (
  data: z.infer<typeof payloadBodyZ>,
): Promise<{
  code: string;
  data: boolean;
  message: string;
  success: boolean;
}> => {
  const parsed = payloadBodyZ.safeParse(data);

  if (!parsed.success) throw parsed.error;

  return post(url, parsed.data);
};
