import { post } from '@/services/xhr/fetch';
import { z } from 'zod';

const url = '/api/page/resourceVirtualFolder/v1/dragFiles';

export enum DragType {
  MoveIn = 1,
  Free = 2,
}

export const payloadBodyZ = z.object({
  dragType: z.nativeEnum(DragType),
  fileNames: z.string().array(),
  folderId: z.string().optional(),
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
