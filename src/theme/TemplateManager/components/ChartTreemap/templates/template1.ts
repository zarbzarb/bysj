import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '边框矩形树图',
  thumbnail: 'assets/templates/chartTreemap_temp1.png',
  from: 'datai',
  attr: {
    borderStyle: {
      show: true,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 0,
    },
  },
} as const satisfies TemplateType;
