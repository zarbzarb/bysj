import mappers from '@/components/PramsSelect/mappers';
import { getComp } from './config';

export default (paramPath: (string | number)[], data: any, comp: any) => {
  if (!(paramPath && comp)) return;

  const parser = mappers?.[comp.type?.replace('@yl/', '')].parser;

  if (!parser) return;

  if (!comp?.isCustomListChild) {
    parser(paramPath, data, comp);
    return;
  }

  getComp(comp.parentKey)
    ?.customListInsArr?.filter(({ key }) => key.includes(comp.key))
    ?.forEach?.((c) => parser(paramPath, data, c));
};
