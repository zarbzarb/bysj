import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '堆叠柱线图',
  thumbnail: 'assets/templates/ChartColumnStack_temp2.png',
  from: 'datai',
  attr: {
    yalias: {
      splitOption: {
        abled: true,
        max: 1500,
        min: 0,
        minSplitType: 2,
        maxSplitType: 2,
        minAbled: true,
        maxAbled: true,
      },
    },
    seriesOnlyOnce: true,
    series: [
      {
        type: 'line',
        lineColor: 'rgba(42, 136, 233, 1)',
        width: 2,
        smooth: true,
        symbolAbled: true,
        symbolType: 'circle',
        symbolColor: 'rgba(244, 244, 244, 1)',
        size: 4,
      },
    ],
  },
} as const satisfies TemplateType;
