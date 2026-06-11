import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '双向条形图',
  thumbnail: 'assets/templates/ChartBarStackTwoWay_default.png',
  from: 'datai',
  attr: {
    barStyle: {
      barFillType: 'SolidColor',
    },
  },
} as const satisfies TemplateType;
