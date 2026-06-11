import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '边框环形图',
  thumbnail: 'assets/templates/chartCircular_temp3.png',
  from: 'datai',
  attr: {
    shadow: {
      isBorder: true,
      borderWidth: 1,
      shadowBlur: 10,
      isShadow: true,
      borderColor: 'rgba(255, 255, 255, 0.6)',
      shadowColor: 'rgba( 0, 0 , 0 , 0.2 )',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  },
} as const satisfies TemplateType;
