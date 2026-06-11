import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template1';

export default {
  name: '圆点折线区域图',
  thumbnail: 'assets/templates/chartAreaBroken_temp1.png',
  from: 'datai',
  attr: {
    xgrid: {
      labelsGridlines: template.categoryAxis.splitLine.show,
    },
    legend: {
      spacingLocation: '2', // 图例水平居中
      legendVisible: true, // 显示图例
      iconShow: template.legend.show, // 显示图标
      textFontSize: template.legend.textStyle.fontSize,
      ...template.legend,
    },
    xalias: {
      splitLine: {
        abled: template.categoryAxis.splitLine.show,
      },
    },
    dataSeries: [
      {
        brokenLineStyle: template.line.lineStyle.type,
        brokenLineApproximate: template.line.smooth,
        dotVisible: template.line.symbol !== 'none',
        dotRadius: template.line.symbolSize,
      },
      {
        brokenLineStyle: template.line.lineStyle.type,
        brokenLineApproximate: template.line.smooth,
        dotVisible: template.line.symbol !== 'none',
        dotRadius: template.line.symbolSize,
      },
      {
        brokenLineStyle: template.line.lineStyle.type,
        brokenLineApproximate: template.line.smooth,
        dotVisible: template.line.symbol !== 'none',
        dotRadius: template.line.symbolSize,
      },
    ],
  },
} as const satisfies TemplateType;
