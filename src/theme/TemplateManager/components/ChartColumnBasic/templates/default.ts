import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '基础柱状图',
  thumbnail: 'assets/templates/ChartColumnBasic_default.png',
  from: 'datai',
  attr: {
    barStyle: {
      barFillType: 'SolidColor',
    },
  },
} as const satisfies TemplateType;
