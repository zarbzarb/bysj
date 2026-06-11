import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '堆叠柱状图',
  thumbnail: 'assets/templates/ChartColumnStack_default.png',
  from: 'datai',
  attr: {
    barStyle: {
      barFillType: 'SolidColor',
    },
    series: [
      {
        type: 'bar',
      },
    ],
  },
} as const satisfies TemplateType;
