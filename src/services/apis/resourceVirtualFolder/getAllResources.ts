import { get } from '@/services/xhr/fetch';
import { z } from 'zod';
import { timeZ } from './utils';

const url = '/api/page/resourceVirtualFolder/v1/resources';

export const resZ = z.object({
  code: z.literal('200').or(z.literal('0')),
  message: z.string(),
  success: z.boolean(),
  data: z.object({
    files: z
      .object({
        createTime: timeZ,
        dir: z.boolean(),
        etag: z.string().optional(),
        name: z.string(),
        size: z.number(),
        url: z.string(),
      })
      .array(),
    virtualFolders: z
      .object({
        name: z.string(),
        id: z.string(),
        createTime: timeZ,
        files: z
          .string()
          .transform((s) => JSON.parse(s))
          .pipe(z.string().array())
          .optional(),
      })
      .array(),
  }),
});

export default async (businessId: number, pathStr: string): Promise<z.infer<typeof resZ>> => {
  const res = await get(url, { businessId, pathStr });

  console.log(res);

  const parsedRes = resZ.safeParse(res);

  if (!parsedRes.success) throw parsedRes.error;

  return parsedRes.data;
};
