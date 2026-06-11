import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template1';

export default {
  name: '双向条形图-斜线',
  thumbnail: 'assets/templates/ChartBarStackTwoWay_temp1.png',
  from: 'datai',
  attr: {
    barStyle: { ...template.bar.barStyle },
  },
} as const satisfies TemplateType;
