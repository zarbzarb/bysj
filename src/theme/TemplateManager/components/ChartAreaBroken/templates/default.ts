import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '区域折线图',
  thumbnail: 'assets/templates/chartAreaBroken_default.png',
  from: 'datai',
  attr: {
    xgrid: {
      labelsGridlines: false,
    },
    legend: {
      spacingLocation: '2', // 图例水平居中
      legendVisible: true, // 显示图例
      iconShow: true, // 显示图标
      icon: 'rect', // 图标形状
      itemWidth: 8,
      itemHeight: 4,
      textFontSize: 14,
    },
    xalias: {
      splitLine: {
        abled: false,
      },
    },
    dataSeries: [
      {
        brokenLineStyle: 'solid',
        brokenLineApproximate: true,
        dotVisible: false,
        labelsShow: false,
      },
      {
        brokenLineStyle: 'solid',
        brokenLineApproximate: true,
        dotVisible: false,
        labelsShow: false,
      },
      {
        brokenLineStyle: 'solid',
        brokenLineApproximate: true,
        dotVisible: false,
        labelsShow: false,
      },
    ],
  },
} as const satisfies TemplateType;
