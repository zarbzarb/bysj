import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template1';

export default {
  name: '圆点折线图',
  thumbnail: 'assets/templates/chartLineBasic_temp1.png',
  from: 'datai',
  attr: {
    legend: {
      abled: true,
      iconShow: true,
      ...template.legend,
    },
    xalias: {
      splitLine: {
        abled: template.categoryAxis.splitLine.show,
      },
    },
    series: [
      {
        lineType: template.line.lineStyle.type,
        smooth: template.line.smooth,
        symbolType: template.line.symbol,
        size: template.line.symbolSize,
        symbolAbled: template.line.symbol !== 'none',
      },
      {
        width: template.line.lineStyle.width,
        lineType: template.line.lineStyle.type,
        smooth: template.line.smooth,
        symbolType: template.line.symbol,
        size: template.line.symbolSize,
        symbolAbled: template.line.symbol !== 'none',
      },
    ],
  },
} as const satisfies TemplateType;
