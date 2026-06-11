import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '堆叠条形图',
  thumbnail: 'assets/templates/ChartBarStack_default.png',
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
