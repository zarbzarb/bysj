export type templateThumbnailListType = {
  id: string;
  name: string;
  thumbnail: string;
}[];

// 有组件模板功能的图表列表
const __chartCompTemplatesMap__ = {
  ChartLineBasic: {
    type: '@yl/datai-com-chart-line-basic',
    title: '基础折线图',
  },
  ChartAreaBroken: {
    type: '@yl/datai-com-chart-area-broken',
    title: '区域折线图',
  },
  ChartBarBasic: {
    type: '@yl/datai-com-chart-bar-basic',
    title: '基础条形图',
  },
  ChartBarStackTwoWay: {
    type: '@yl/datai-com-chart-bar-stack-twoWay',
    title: '双向条形图',
  },
  ChartBarStack: {
    type: '@yl/datai-com-chart-bar-stack',
    title: '堆叠条形图',
  },
  ChartColumnBasic: {
    type: '@yl/datai-com-chart-column-basic',
    title: '基础柱状图',
  },
  ChartColumnStack: {
    type: '@yl/datai-com-chart-column-stack',
    title: '堆叠柱状图',
  },
  ChartPieChart: {
    type: '@yl/datai-com-chart-pie-chart',
    title: '饼形图',
  },
  ChartCircular: {
    type: '@yl/datai-com-chart-circular',
    title: '环形图',
  },
  ChartColumnStickers: {
    type: '@yl/datai-com-chart-column-stickers',
    title: '贴图柱状图',
  },
  ChartTreemap: {
    type: '@yl/datai-chart-treemap',
    title: '矩形树图',
  },
  PieChart3D: {
    type: 'PieChart3D',
    title: '3D饼图',
  },
} as const satisfies Record<
  string,
  {
    type: string;
    title: string;
  }
>;

export const chartCompTemplatesMap = Object.fromEntries(
  Object.entries(__chartCompTemplatesMap__ as Record<string, any>).map(([k, i]) => [k, { ...i, isActive: false }]),
) as {
  [K in keyof typeof __chartCompTemplatesMap__]: (typeof __chartCompTemplatesMap__)[K] & { isActive: boolean };
};
