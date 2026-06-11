import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '外部标签环形图',
  thumbnail: 'assets/templates/chartCircular_temp1.png',
  from: 'datai',
  attr: {
    position: {
      positionRateType: false,
      x: 210,
      y: 120,
    },
    distanceLabel: 8,
    legendVisible: true, // 图例是否可见 legend.show
    titleX: '49',
    titleY: '33',
    titleColor: '#FFFFFF',
    titleFontSize: '24',
    labelColorMain: '#95A0B8',
    lableVisible: true,
    labelStyleFixed: true,
    labelFontSize: '14',
    lineHeight: 20,
    labelFontWeight: '400',
    labelColor: '#95A0B8',
    numberFontSize: '14',
    isCustomerLableColor: true,
    labelLineColor: 'rgba(255,255,255,0.3)',
    draftLine: 8,
    draftLine2: 40,
    numberFontWeight: '400',
    trueValue: true,
    labelShow: true,
    outerRadius: 90, // 极轴-外半径 series[0].radius[1]
    innerRadius: 60, // 极轴-内半径 series[0].radius[0]
    textColor: '#95A0B8',
    spacingLeftRight: 18,
    textPosition: 'bottom-center',
    label: {
      // 标签
      categoryVisible: false,
      percentVisible: true,
      percentLineHeight: 20,
      percentDigits: 0,
      realFontSize: 14,
      realColor: '#fff',
      realFontWeight: '400',
    },
    legend: {
      // 图例
      shape: 'circle',
      iconWidth: 8,
      iconHeight: 8,
      orient: 'horizontal',
      offsetX: 0,
      offsetY: 0,
      alignment: 'gs',
      catePrefixVisible: false,
      catePrefixSpacing: 4,
      percentVisible: false,
    },
  },
} as const satisfies TemplateType;
