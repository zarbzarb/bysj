import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template2';

export default {
  name: '栅格柱状图',
  thumbnail: 'assets/templates/ChartColumnBasic_temp2.png',
  from: 'datai',
  attr: {
    barStyle: { ...template.bar.barStyle },
  },
} as const satisfies TemplateType;
