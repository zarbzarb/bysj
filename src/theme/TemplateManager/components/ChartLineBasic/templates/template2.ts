import { TemplateType } from '@/theme/TemplateManager/type';
import template from '../../../templates/template2';

export default {
  name: '虚线折线图',
  thumbnail: 'assets/templates/chartLineBasic_temp2.png',
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
        lineType: template.line.lineStyle.type, // 折线类型
        smooth: template.line.smooth, // 平滑曲线
        symbolType: template.line.symbol, // 拐点类型
        size: template.line.symbolSize, // 拐点大小
        symbolAbled: template.line.symbol !== 'none',
      },
      {
        lineType: template.line.lineStyle.type,
        smooth: template.line.smooth,
        symbolType: template.line.symbol,
        size: template.line.symbolSize,
        symbolAbled: template.line.symbol !== 'none',
      },
    ],
  },
} as const satisfies TemplateType;
