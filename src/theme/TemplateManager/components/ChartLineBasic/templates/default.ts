import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '基础折线图',
  thumbnail: 'assets/templates/chartLineBasic_default.png',
  from: 'datai',
  attr: {
    legend: {
      abled: true,
      iconShow: true,
      icon: 'rect',
      itemWidth: 8,
      itemHeight: 4,
    },
    xalias: {
      splitLine: {
        abled: false,
      },
    },
    series: [
      {
        width: 2,
        lineType: 'solid',
        smooth: true,
        symbolType: 'circle',
        symbolAbled: false,
      },
      {
        width: 2,
        lineType: 'solid',
        smooth: true,
        symbolType: 'circle',
        symbolAbled: false,
      },
    ],
  },
} as const satisfies TemplateType;
