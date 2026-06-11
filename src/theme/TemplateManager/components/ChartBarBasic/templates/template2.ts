import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template2';

export default {
  name: '栅格条形图',
  thumbnail: 'assets/templates/ChartBarBasic_temp2.png',
  from: 'datai',
  attr: {
    barStyle: { ...template.bar.barStyle },
  },
} as const satisfies TemplateType;
