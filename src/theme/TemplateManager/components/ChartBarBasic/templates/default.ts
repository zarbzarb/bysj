import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '基础条形图',
  thumbnail: 'assets/templates/ChartBarBasic_default.png',
  from: 'datai',
  attr: {
    barStyle: {
      barFillType: 'SolidColor',
    },
  },
} as const satisfies TemplateType;
