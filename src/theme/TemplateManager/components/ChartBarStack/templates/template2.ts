import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '堆叠条线图',
  thumbnail: 'assets/templates/ChartBarStack_temp2.png',
  from: 'datai',
  attr: {
    seriesOnlyOnce: true,
    series: [
      {
        type: 'line',
        lineColor: 'rgba(42, 136, 233, 1)',
        width: 2,
        smooth: true,
        symbolAbled: true,
        symbolType: 'circle',
        symbolColor: 'rgba(255, 255, 255, 1)',
        size: 4,
      },
    ],
  },
} as const satisfies TemplateType;
