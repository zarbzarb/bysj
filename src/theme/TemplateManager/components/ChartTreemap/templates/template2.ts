import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '图案矩形树图',
  thumbnail: 'assets/templates/chartTreemap_temp2.png',
  from: 'datai',
  attr: {
    ariaStyle: {
      barFillType: 'Pattern',
      patternType: 'DiagonalLine',
      dashX: 3,
      dashY: 3,
      patternColor: 'rgba(255, 255, 255, 0.2)',
      rotation: -30,
    },
  },
} as const satisfies TemplateType;
