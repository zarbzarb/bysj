import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template1';

export default {
  name: '图案堆叠条形图',
  thumbnail: 'assets/templates/ChartBarStack_temp1.png',
  from: 'datai',
  attr: {
    barStyle: { ...template.bar.barStyle },
  },
} as const satisfies TemplateType;
