import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template1';

export default {
  name: '图案柱状图',
  thumbnail: 'assets/templates/ChartColumnBasic_temp1.png',
  from: 'datai',
  attr: {
    barStyle: { ...template.bar.barStyle },
  },
} as const satisfies TemplateType;
