import { CompEvent } from '@/staticJson/PageEvent';

const CommonBan = [
  'mouseDrag',
  'blur',
  'enterHandler',
  'changeValue',
  'treeRowClick',
  'tableRowClick',
  'tableColumnClick',
  'tablePagination',
  'listPagination',
  'clickSeries',
  'clickLegend',
] as const satisfies CompEvent['eventType'][];

const CommonChartBan = [
  'mouseDrag',
  'blur',
  'enterHandler',
  'changeValue',
  'treeRowClick',
  'tableRowClick',
  'tableColumnClick',
  'tablePagination',
  'listPagination',
] as const satisfies CompEvent['eventType'][];

export default {
  '@yl/dataq-com-group-basic': new Set([
    'blur',
    'enterHandler',
    'changeValue',
    'treeRowClick',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
    'clickSeries',
    'clickLegend',
    'beforeDataChange',
    'afterDataChange',
  ] as const),

  '@yl/datai-com-chart-area-broken': new Set(CommonChartBan),

  '@yl/datai-com-chart-babel': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-area-map': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-basic': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-capsule': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-double-y-capsule': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-group': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-stack': new Set(CommonChartBan),

  '@yl/datai-com-chart-bar-stack-twoWay': new Set(CommonChartBan),

  '@yl/datai-com-chart-circular': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-basic': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-3d': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-stickers': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-capsule': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-contrast-histogram': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-cylinder': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-dot': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-largearea-histogram': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-rainbow': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-stack': new Set(CommonChartBan),

  '@yl/datai-com-chart-column-vertical-group': new Set(CommonChartBan),

  '@yl/datai-com-chart-d-gauge': new Set(CommonChartBan),

  '@yl/datai-com-chart-funnel': new Set(CommonChartBan),

  '@yl/datai-com-chart-gauge': new Set(CommonChartBan),

  '@yl/datai-com-chart-heatmap': new Set(CommonChartBan),

  '@yl/datai-com-chart-line-24h': new Set(CommonChartBan),

  '@yl/datai-com-chart-line-basic': new Set(CommonChartBan),

  '@yl/datai-com-chart-line-double-yaxis': new Set(CommonChartBan),

  '@yl/datai-com-chart-line-more-yaxis': new Set(CommonChartBan),

  '@yl/datai-com-chart-line-sector': new Set(CommonChartBan),

  '@yl/datai-com-chart-mixed-line-bar': new Set(CommonChartBan),

  '@yl/datai-com-chart-nestRing': new Set(CommonChartBan),

  '@yl/datai-com-chart-pictograph': new Set(CommonChartBan),

  '@yl/datai-com-chart-pie-chart': new Set(CommonChartBan),

  '@yl/datai-com-chart-polar': new Set(CommonChartBan),

  '@yl/datai-com-chart-radar': new Set(CommonChartBan),

  '@yl/datai-com-chart-ranking-list': new Set(CommonChartBan),

  '@yl/datai-com-chart-ring-bar': new Set(CommonChartBan),

  '@yl/datai-com-chart-ring-gauge': new Set(CommonChartBan),

  '@yl/datai-com-chart-rose-diagram': new Set(CommonChartBan),

  '@yl/datai-com-chart-scatter': new Set(CommonChartBan),

  '@yl/datai-com-chart-semicircle': new Set(CommonChartBan),

  '@yl/datai-com-chart-waterPol': new Set(CommonChartBan),

  '@yl/datai-chart-sankey': new Set(['clickLegend', ...CommonChartBan] as const),

  '@yl/datai-chart-treemap': new Set(['clickLegend', ...CommonChartBan] as const),

  '@yl/datai-com-drop-down': new Set(CommonBan),

  '@yl/datai-com-dynamic-wordcloud': new Set(CommonBan),

  '@yl/datai-com-flop-basic': new Set(CommonBan),

  '@yl/datai-com-group-basic': new Set(CommonBan),

  '@yl/datai-com-map-2d-point-polymerization': new Set(CommonBan),

  '@yl/datai-com-map-3D-base-point-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-base-polygon-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-base-polyline-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-basic-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-buiding-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-cim-visual-template': new Set(CommonBan),

  '@yl/datai-com-map-3D-circle-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-contour': new Set(CommonBan),

  '@yl/datai-com-map-3D-FoundationPlan': new Set(CommonBan),

  '@yl/datai-com-map-3D-geo-fencing': new Set(CommonBan),

  '@yl/datai-com-map-3D-gltf-model-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-heatMap-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-interpolation': new Set(CommonBan),

  '@yl/datai-com-map-3D-line-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-marker-layer': new Set(CommonBan),

  '@yl/datai-com-map-3d-point-polymerization': new Set(CommonBan),

  '@yl/datai-com-map-3D-polygon-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-text-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-threed-layer': new Set(CommonBan),

  '@yl/datai-com-map-3D-tileset-layer': new Set(CommonBan),

  '@yl/datai-com-map-background-layer': new Set(CommonBan),

  '@yl/datai-com-map-base-point-layer': new Set(CommonBan),

  '@yl/datai-com-map-base-polygon-layer': new Set(CommonBan),

  '@yl/datai-com-map-base-polyline-layer': new Set(CommonBan),

  '@yl/datai-com-map-breath-bubble-layer': new Set(CommonBan),

  '@yl/datai-com-map-contour': new Set(CommonBan),

  '@yl/datai-com-map-covering-layer': new Set(CommonBan),

  '@yl/datai-com-map-fly-list': new Set(CommonBan),

  '@yl/datai-com-map-foundationPlan': new Set(CommonBan),

  '@yl/datai-com-map-gaud-online': new Set(CommonBan),

  '@yl/datai-com-map-gl-base-polygon-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-basic-layer-new': new Set(CommonBan),

  '@yl/datai-com-map-gl-basic-point-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-basic-polyline-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-BubbleFlyLine': new Set(CommonBan),

  '@yl/datai-com-map-gl-buiding-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-circle': new Set(CommonBan),

  '@yl/datai-com-map-gl-cube-maps': new Set(CommonBan),

  '@yl/datai-com-map-gl-cylinder': new Set(CommonBan),

  '@yl/datai-com-map-gl-dynamics-point': new Set(CommonBan),

  '@yl/datai-com-map-gl-fly-line': new Set(CommonBan),

  '@yl/datai-com-map-gl-FoundationPlan': new Set(CommonBan),

  '@yl/datai-com-map-gl-geo-fencing': new Set(CommonBan),

  '@yl/datai-com-map-gl-heat-map': new Set(CommonBan),

  '@yl/datai-com-map-gl-info-window': new Set(CommonBan),

  '@yl/datai-com-map-gl-line-heat': new Set(CommonBan),

  '@yl/datai-com-map-gl-mask-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-path-planning': new Set(CommonBan),

  '@yl/datai-com-map-gl-plate-layer': new Set(CommonBan),

  '@yl/datai-com-map-gl-rainbow-line': new Set(CommonBan),

  '@yl/datai-com-map-gl-region-heat': new Set(CommonBan),

  '@yl/datai-com-map-gl-region-line': new Set(CommonBan),

  '@yl/datai-com-map-gl-region-mask': new Set(CommonBan),

  '@yl/datai-com-map-gl-region-plate': new Set(CommonBan),

  '@yl/datai-com-map-gl-scene-controller': new Set(CommonBan),

  '@yl/datai-com-map-gl-static-sign': new Set(CommonBan),

  '@yl/datai-com-map-hotmap': new Set(CommonBan),

  '@yl/datai-com-map-interpolation': new Set(CommonBan),

  '@yl/datai-com-map-leader-line': new Set(CommonBan),

  '@yl/datai-com-map-mask-layer': new Set(CommonBan),

  '@yl/datai-com-map-path-line': new Set(CommonBan),

  '@yl/datai-com-map-point-polymerization': new Set(CommonBan),

  '@yl/datai-com-map-regional-heating': new Set(CommonBan),

  '@yl/datai-com-map-sandian': new Set(CommonBan),

  '@yl/datai-com-media-background-block': new Set(CommonBan),

  '@yl/datai-com-media-background-block-with-border': new Set(CommonBan),

  '@yl/datai-com-media-background-border': new Set(CommonBan),

  '@yl/datai-com-media-decorate': new Set(CommonBan),

  '@yl/datai-com-media-image-basic': new Set(CommonBan),

  '@yl/datai-com-media-image-dynamic': new Set(CommonBan),

  '@yl/datai-com-media-mp4-player': new Set(CommonBan),

  '@yl/datai-com-progress-bar': new Set(CommonBan),

  '@yl/datai-com-text-basic': new Set(CommonBan),

  '@yl/datai-com-text-carouseltextlist': new Set(CommonBan),

  '@yl/datai-com-text-digital-panel': new Set(CommonBan),

  '@yl/datai-com-text-listturns': new Set(CommonBan),

  '@yl/datai-com-text-marquee': new Set(CommonBan),

  '@yl/datai-com-text-overflowscroll': new Set(CommonBan),

  '@yl/datai-com-text-pagination': new Set(CommonBan),

  '@yl/datai-com-text-score': new Set(CommonBan),

  '@yl/datai-com-text-search-group': new Set(CommonBan),

  '@yl/datai-com-text-tabs': new Set([
    'mouseDrag',
    'enterHandler',
    'changeValue',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  '@yl/datai-com-text-tabs-group': new Set(CommonBan),

  '@yl/datai-com-text-tabs-select': new Set([
    'mouseDrag',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  '@yl/datai-com-text-time': new Set(CommonBan),

  '@yl/datai-com-text-wordcloud': new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
    'clickSeries',
    'clickLegend',
  ]),

  '@yl/datai-com-time-line': new Set([
    'mouseDrag',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  '@yl/datai-com-time-picker': new Set(CommonBan),

  Text: new Set(CommonBan),

  Statistic: new Set(CommonBan),

  Calendar: new Set(CommonBan),

  Table: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'changeValue',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'listPagination',
  ] as const),

  Descriptions: new Set(CommonBan),

  List: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'changeValue',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
  ] as const),

  TreeList: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  CardTemplate: new Set(CommonBan),

  PanoramaMap: new Set(CommonBan),

  UniversalPlayer: new Set(CommonBan),

  JessiucaPlayer: new Set(CommonBan),

  VisualSwiper: new Set(CommonBan),

  Button: new Set(CommonBan),

  RadioTabs: new Set([
    'mouseenter',
    'mouseleave',
    'mouseDrag',
    'click',
    'doubleClick',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  NewInput: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  Input: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  CheckBox: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  DatePicker: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  Select: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  TreeSelect: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  Radio: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  ColorPicker: new Set([
    'mouseenter',
    'mouseleave',
    'click',
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  LayerSelect: new Set([
    'doubleClick',
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  IFrame: new Set(['mouseenter', 'mouseleave', ...CommonBan] as const),

  DynamicPanel: new Set(['mouseenter', 'mouseleave', 'click', 'doubleClick', ...CommonBan] as const),
  // v8.17 新增折叠面板
  CollapsePanel: new Set(CommonBan),

  CustomCell: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'changeValue',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  CustomList: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'changeValue',
    'treeRowClick',
    'clickSeries',
    'clickLegend',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
  ] as const),

  UnrealEngine: new Set(CommonBan),

  SceneFrame: new Set(CommonBan),

  PieChart3D: new Set(CommonChartBan),

  LayerSearch: new Set(CommonBan),

  MapToolScale: new Set(CommonBan),

  RegionSelect: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
    'clickSeries',
    'clickLegend',
  ]),

  LayerLegend: new Set(CommonBan),

  MapInfoWin: new Set(CommonBan),

  LayerTree: new Set([
    'mouseDrag',
    'blur',
    'enterHandler',
    'treeRowClick',
    'tableRowClick',
    'tableColumnClick',
    'tablePagination',
    'listPagination',
    'clickSeries',
    'clickLegend',
  ]),

  customComp: new Set(CommonBan),
} as const satisfies {
  [K: string]: Set<CompEvent['eventType']>;
};
