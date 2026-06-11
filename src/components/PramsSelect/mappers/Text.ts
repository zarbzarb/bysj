import _ from 'lodash';
import { fmtNumLikeVal2StrEndWithPx, textShadowParser } from '@/utils/dataFmtUtils';
import { Mapper } from '.';

export default {
  selectable: (comp) => [
    { title: '字体颜色', key: 'fontColor' },
    { title: '字体大小', key: 'fontSize' },
    { title: '字体行高', key: 'lineHeight' },
    {
      title: '文本阴影设置',
      key: 'textShadows',
      checkable: false,
      disabled: !comp?.props?.style?.textShadow,
      children: comp?.props?.style?.textShadow
        ? textShadowParser(comp?.props?.style?.textShadow ?? '').map((_item, idx) => ({
            title: `文本阴影${idx + 1}`,
            key: idx,
            children: [
              { title: '水平位移', key: 0 },
              { title: '垂直位移', key: 1 },
              { title: '模糊半径', key: 2 },
              { title: '阴影颜色', key: 3 },
            ],
          }))
        : undefined,
    },
  ],
  parser: (path, data, comp) => {
    if (path[0] === 'fontColor') {
      comp.props.style.color.color = data;
      return;
    }

    if (path[0] === 'fontSize') {
      comp.props.style.fontSize = fmtNumLikeVal2StrEndWithPx(data);
      return;
    }

    if (path[0] === 'lineHeight') {
      comp.props.style.lineHeight = fmtNumLikeVal2StrEndWithPx(data);
      return;
    }

    if (path[0] !== 'textShadows') return;

    const structuredShadow = textShadowParser(comp.props.style.textShadow);

    structuredShadow[path[1]][path[2]] = path[2] === 3 ? data : fmtNumLikeVal2StrEndWithPx(data);

    comp.props.style.textShadow = structuredShadow.map((val) => `${val.map((v) => `${v}`).join(' ')}`).join(',');
  },
} satisfies Mapper;
