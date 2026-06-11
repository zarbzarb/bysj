import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '基础环形图',
  thumbnail: 'assets/templates/chartCircular_default.png',
  from: 'datai',
  attr: {
    position: {
      positionRateType: false,
      x: 130,
      y: 140,
    },
    ariaStyle: {
      barFillType: 'SolidColor',
    },
    shadow: {
      isShadow: false,
      isBorder: false,
    },

    legendVisible: true,
    titleVisible: true,

    titleX: '30',
    titleY: '40',
    titleColor: '#FFFFFF',
    titleFontSize: '28',

    lableVisible: false,

    labelShow: false,
    outerRadius: 90,
    innerRadius: 60,

    spacingLeftRight: 12,

    textPosition: 'top-right',

    legend: {
      shape: 'rect',

      iconWidth: 6,
      iconHeight: 4,

      orient: 'vertical',
      offsetX: -40,
      offsetY: 81,
      alignment: 'dq',

      catePrefixVisible: true,

      catePrefixSpacing: 0,

      percentVisible: true,
    },
  },
} as const satisfies TemplateType;
