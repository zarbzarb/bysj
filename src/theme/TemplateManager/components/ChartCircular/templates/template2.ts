import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '图案环形图',
  thumbnail: 'assets/templates/chartCircular_temp2.png',
  from: 'datai',
  attr: {
    ariaStyle: {
      barFillType: 'Pattern',
      patternType: 'DiagonalLine',
      dashX: 3,
      dashY: 3,
      patternColor: 'rgba(255, 255, 255, 0.6)',
      rotation: -60,
    },
  },
} as const satisfies TemplateType;
