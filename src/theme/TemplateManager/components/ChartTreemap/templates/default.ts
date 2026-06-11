import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '矩形树图',
  thumbnail: 'assets/templates/chartTreemap_default.png',
  from: 'datai',
  attr: {
    ariaStyle: {
      barFillType: 'SolidColor',
    },
    borderStyle: {
      show: false,
    },
  },
} as const satisfies TemplateType;
