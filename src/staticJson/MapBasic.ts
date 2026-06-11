// export const defaultLayerGl = [
//   {
//     label: 'GeoQ午夜蓝',
//     value: 'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
//   },
//   {
//     label: '高德卫星地图',
//     value: 'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&style=6&scl=2',
//   },
//   {
//     label: '高德电子地图',
//     value: 'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&style=7&scl=2',
//   },
// ];
// v8.5.0 GL底图修改
export const defaultLayerGl = [
  {
    label: '高德在线',
    value: 0,
  },
  {
    label: '天地电子图',
    value: 1,
  },
  {
    label: '天地影像图',
    value: 2,
  },
  {
    label: '天地地形图',
    value: 3,
  },
  // {
  //   label: '百度在线',
  //   value: 4,
  // },
  {
    label: '自定义底图',
    value: 5,
  },
];

export const defaultLayer3d = [
  {
    label: '天地图影像图',
    value: 'default_img',
  },
  {
    label: '天地图',
    value: 'tianditu',
  },
  {
    label: '天地图地形图',
    value: 'tianditu_dem',
  },
  {
    label: '高德地图',
    value: 'amap',
  },
  {
    label: '高德影像图',
    value: 'amap_img',
  },
  {
    label: '自定义底图',
    value: 'custom',
  },
];

export const defaultLayer2d = [
  {
    label: '高德在线',
    value: 0,
  },
  {
    label: '天地电子图',
    value: 1,
  },
  {
    label: '天地影像图',
    value: 2,
  },
  {
    label: '天地地形图',
    value: 3,
  },
  {
    label: '百度在线',
    value: 4,
  },
  {
    label: '自定义底图',
    value: 5,
  },
];

export const thirdStandardLayer = [
  { label: 'XYZ图层', value: 'xyz' },
  { label: 'ArcGIS图层', value: 'arcgis' },
  { label: 'WMS图层', value: 'wms' },
  { label: 'WMTS图层', value: 'wmts' },
];

// []数组结构，其添加为gis点线面数据，必须包含有layerCode字段
export const variablesText = {
  // eslint-disable-next-line quotes
  mapShowType: `对应需要显隐图层key,变量结构:[{"@com_9s6hjuHWFMt9hg5LJE4hjJ"}]`,
  comText:
    '变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value(2)data[0].data.value(3)[ {"id": 123,"text": data.value} ]',
  renderText:
    '将指定的数据以指定样式进行展示，其中必须包含layerCode/layerKey,dataId是对应图层默认配置指定key字段的数据,例：[{"layerCode":"xxx","dataId":["337","83"]}],注:（1）将图层重置为标准样式，且过滤标注不生效，配置如[{"layerCode":"xxx","dataId":[]}]（2）如果数据为空时，将图层数据置空，过滤效果有效，配置如[{"layerCode":"xxx","dataId":[""]}]',
  mapDrawLine: '0表示清除，将该绑定变量值设为0，则表示清除绑定该变量的所有线',
  mapSetPoint: '0表示清除，将该绑定变量值设为0，则表示清除绑定该变量的所有点',
  mapFlyAnimate: '定位方式为默认中心点时，经度、纬度参数设置不生效',
  // eslint-disable-next-line quotes
  labelTipMsg: `如数据驱动，参数里启用标识为0时标识启用，其他所有值表示不启用`,
  // eslint-disable-next-line quotes
  queryTipMsg: "格式：sql语句，如模糊查询：name like '%水%'或 name = '北京市' and value > '1'",
  // eslint-disable-next-line quotes
  mapEsTipMsg: `关联的图层如果layerCode相同将会自动过滤掉,格式：["default_edit_layer_point"]`,
  circleLayersTipMsg: '格式：地图子图层key,例["@com_9s6hjuHWFMt9hg5LJE4hjJ"]',
  circlePointTipMsg: '格式：经纬度，例[116, 39]',
  circleRadiusTipMsg: '格式：例“5”，单位米',
  // eslint-disable-next-line quotes
  spaceTipMsg: `格式：地图子图层key,例["@com_9s6hjuHWFMt9hg5LJE4hjJ"]`,
  // eslint-disable-next-line quotes
  spacePolygonTipMsg: `圆形区格式:{coordinates: [116.40474273971459, 39.88957851877437, 1000],radius:500,type:"circle"}; 矩形和多边形区域格式：{coordinates: [[116.41657434303343, 39.93337515133109, 1000],[116.40474273971459, 39.88957851877437, 1000],[116.35350885391898, 39.90924839972355,1000],[116.34027332784443, 39.93254757913646,1000]], type:"polygon"}`,
  // eslint-disable-next-line quotes
  renderTipMsg: `将指定的数据以指定样式进行展示，其中必须包含layerCode/layerKey,dataId是对应图层默认配置指定key字段的数据,例：[{"layerCode":"xxx","dataId":["337","83"]}],注:（1）将图层重置为标准样式，且过滤标注不生效，配置如[{"layerCode":"xxx","dataId":[]}]（2）如果数据为空时，将图层数据置空，过滤效果有效，配置如[{"layerCode":"xxx","dataId":[""]}]`,
  // eslint-disable-next-line quotes
  clickTipMsg: `gis提供的数据，其中必须包含layerKey,dataId是对应图层默认配置指定key字段的数据,例：{"layerKey":"platform_375bb5b0_default","dataId":"337"}`,
  showTipMsg: '格式：地图子图层key,例["@com_9s6hjuHWFMt9hg5LJE4hjJ"]',
  // eslint-disable-next-line quotes
  mapDataType: `复杂类型数值格式: 组件格式，交互传入值:'{'type':'circle','coordinates':[100,39],'radius':200000}',   手动数据:{'type':'circle','coordinates':[100,39],'radius':200000}  变量:{type:'circle','coordinates':[100,39],'radius':200000}`,
  drawTipType: '格式：区域类型(圆形区域,矩形区域, 多边形区域)，例：圆形区域',
  drawTipBorderColor: '格式：边框颜色，例：rgba(0,255,255,1)',
  drawTipBorderWidth: '格式：边框线宽，例：5',
  drawTiBackground: '格式：区域颜色，例：rgba(0,255,255,1)',
  routePathTip: `例[
    [
      [116.3884131, 39.9068394],
      [116.3892487, 39.9068682],
      [116.3895836, 39.9068629],
      [116.3898012, 39.9068393],
      [116.3902089, 39.9068064],
      [116.3906166, 39.9067776],
      [116.3907265, 39.9067735],
      [116.3916144, 39.9067879],
      [116.3918727, 39.9068157],
      [116.3922796, 39.906864],
      [116.3926846, 39.9069196],
      [116.393177, 39.9069818],
      [116.3940825, 39.9070069]
    ]
  ]`,
  heatLineTip: `使用此功能需要启用图层默认配置中“指定key字段”;数据结构为：
  [
    {key:'线id',count:100},
    {key:'线id',count:200}
  ]
  其中key为对应线数据的唯一值，count为热力数据`,
  trackMsgTip: `在现有地图上添加指定的图层，只支持GIS内置的瓦片图层；变量结构：
  [{
    'layerCode':'tianditu',
    'zIndex': 2
    },
    {
    'layerCode':'tianditu_img',
    'zIndex': 3
  }]
  zIndex为图层的排序值，可以不填写，新增图层默认顺序为放置在底图之上，放在其他图层下面。`,
  swipMsgTip: `二维引擎只支持GIS内置的瓦片图层左右放置，三维引擎支持瓦片和倾斜摄影图层（设置layerKey），矢量图层即使设置了左右也无效；变量结构：
  [{
    'layerCode':'tianditu', 
    'zIndex':2
    },   
    {   
    'layerCode':'tianditu_img',   
    'zIndex': 5   
  }]
  zIndex为图层的排序值，可以不填写，新增图层默认顺序为放置在底图之上，放在其他图层下面；已经存在的图层使用现有排序`,
  // eslint-disable-next-line quotes
  setPointTipMsg: `数据结构：{lng:"116",lat:"39",name: "北京"}`,
  pitchTipMsg: '取值范围：-90～0',
  rotationTipMsg: '取值范围：0～360',
  zoomTipMsg: '取值范围：0～22',
};

export const tableValue = [
  {
    defaultValue: '1',
    description: '分页当前页',
    example: '1',
    id: 1,
    name: 'pageNo',
    required: false,
    status: false,
  },
  {
    defaultValue: '5',
    description: '分页大小',
    example: '5',
    id: 2,
    name: 'pageSize',
    required: false,
    status: false,
    type: 'number',
  },
];

export const defaultLayerCode = [
  {
    layerName: '预置点图层',
    layerCode: 'default_edit_layer_point',
  },
  {
    layerName: '预置线图层',
    layerCode: 'default_edit_layer_linestring',
  },
  {
    layerName: '预置面图层',
    layerCode: 'default_edit_layer',
  },
];
export const renderStyleList = [
  {
    label: '基础样式',
    value: 'baseStyle',
  },
  {
    label: '悬浮样式',
    value: 'hoverStyle',
  },
  {
    label: '点击样式',
    value: 'clickStyle',
  },
  {
    label: '选中样式',
    value: 'selectStyle',
  },
];

export const zoomMapList = [
  '1:295829355',
  '1:147914677',
  '1:73957338',
  '1:36978669',
  '1:18489334',
  '1:9244667',
  '1:4622333',
  '1:2311166',
  '1:1155583',
  '1:577791',
  '1:288895',
  '1:144447',
  '1:72223',
  '1:36111',
  '1:18055',
  '1:9027',
  '1:4513',
  '1:2256',
  '1:1128',
  '1:564',
];

export const mapBaseLayer2dType = [
  '@yl/datai-com-map-base-point-layer',
  '@yl/datai-com-map-base-polyline-layer',
  '@yl/datai-com-map-base-polygon-layer',
  '@yl/datai-com-map-2d-point-polymerization',
  '@yl/datai-com-map-3d-point-polymerization',
  '@yl/datai-com-map-3D-base-point-layer',
  '@yl/datai-com-map-3D-base-polyline-layer',
  '@yl/datai-com-map-3D-base-polygon-layer',
  '@yl/datai-com-map-gl-basic-point-layer',
  '@yl/datai-com-map-gl-basic-polyline-layer',
  '@yl/datai-com-map-gl-base-polygon-layer',
  '@yl/datai-com-map-gl-plate-layer',
  '@yl/datai-com-map-3d-gif-layer',
  '@yl/datai-com-map-2d-gif-layer',
];
export const mapBaseLayerTypes = [
  '@yl/datai-com-map-base-point-layer',
  '@yl/datai-com-map-base-polyline-layer',
  '@yl/datai-com-map-base-polygon-layer',
  '@yl/datai-com-map-3D-base-point-layer',
  '@yl/datai-com-map-3D-base-polyline-layer',
  '@yl/datai-com-map-3D-base-polygon-layer',
];
export const mapBaseLayer3dType = [
  '@yl/datai-com-map-3D-base-point-layer',
  '@yl/datai-com-map-3D-base-polyline-layer',
  '@yl/datai-com-map-3D-base-polygon-layer',
];

export const mapBaseLayerType = [
  '@yl/datai-com-map-base-point-layer', // 2d基础点图层
  '@yl/datai-com-map-base-polyline-layer', // 2d基础线图层
  '@yl/datai-com-map-base-polygon-layer', // 2d基础面图层
  '@yl/datai-com-map-3D-base-point-layer', // 3d基础点图层
  '@yl/datai-com-map-3D-base-polyline-layer', // 3d基础线图层
  '@yl/datai-com-map-3D-base-polygon-layer', // 3d基础面图层
  '@yl/datai-com-map-gl-basic-point-layer', // gl基础点图层
  '@yl/datai-com-map-gl-basic-polyline-layer', // gl基础线图层
  '@yl/datai-com-map-gl-base-polygon-layer', // gl基础面图层
  '@yl/datai-com-map-gl-plate-layer', // gl板块图层
  '@yl/datai-com-map-3d-gif-layer',
  '@yl/datai-com-map-2d-gif-layer',
];

export const mapBaseLayerTypeRelation = [
  '@yl/datai-com-map-base-point-layer', // 2d基础点图层
  '@yl/datai-com-map-base-polyline-layer', // 2d基础线图层
  '@yl/datai-com-map-base-polygon-layer', // 2d基础面图层
  '@yl/datai-com-map-3D-base-point-layer', // 3d基础点图层
  '@yl/datai-com-map-3D-base-polyline-layer', // 3d基础线图层
  '@yl/datai-com-map-3D-base-polygon-layer', // 3d基础面图层
  '@yl/datai-com-map-gl-basic-point-layer', // gl基础点图层
  '@yl/datai-com-map-gl-basic-polyline-layer', // gl基础线图层
  '@yl/datai-com-map-gl-base-polygon-layer', // gl基础面图层
  '@yl/datai-com-map-gl-plate-layer', // gl板块图层
  '@yl/datai-com-map-gaud-online', // 在线地图
  '@yl/datai-com-map-gl-basic-layer-new',
  '@yl/datai-com-map-3D-basic-layer',
  '@yl/datai-com-map-gl-geo-fencing-new', // 地理围栏
  '@yl/datai-com-map-3D-geo-fencing',
  '@yl/datai-com-map-gl-buiding-layer',
  '@yl/datai-com-map-gl-buiding-layer-new', // 白膜
  '@yl/datai-com-map-3D-buiding-layer',
  '@yl/datai-com-map-3d-gif-layer',
  '@yl/datai-com-map-mask-layer', // v8.12 二维蒙层
];

export const mapEnglishNameArr = [
  'BasePointLayer',
  'BasePolylineLayer',
  'BasePolygonLayer',
  'BasePointLayer3D',
  'BasePolylineLayer3D',
  'BasePolygonLayer3D',
];

export const layerTreeLoadLayerType = [
  '@yl/datai-com-map-base-point-layer', // 2d基础点图层
  '@yl/datai-com-map-base-polyline-layer', // 2d基础线图层
  '@yl/datai-com-map-base-polygon-layer', // 2d基础面图层
  '@yl/datai-com-map-3D-base-point-layer', // 3d基础点图层
  '@yl/datai-com-map-3D-base-polyline-layer', // 3d基础线图层
  '@yl/datai-com-map-3D-base-polygon-layer', // 3d基础面图层
  '@yl/datai-com-map-interpolation', // 插值图
  '@yl/datai-com-map-3D-interpolation',
  '@yl/datai-com-map-hotmap', // 热力图
  '@yl/datai-com-map-3D-heatMap-layer',
  '@yl/datai-com-map-contour', // 等值线面图
  '@yl/datai-com-map-3D-contour',
  '@yl/datai-com-map-2d-point-polymerization',
  '@yl/datai-com-map-3d-point-polymerization', // 点聚合
  '@yl/datai-com-map-gl-basic-point-layer', // gl基础点图层
  '@yl/datai-com-map-gl-basic-polyline-layer', // gl基础线图层
  '@yl/datai-com-map-gl-base-polygon-layer', // gl基础面图层
];

export const layerSplitRenderType = [
  '@yl/datai-com-map-base-point-layer', // 2d基础点图层
  '@yl/datai-com-map-base-polyline-layer', // 2d基础线图层
  '@yl/datai-com-map-base-polygon-layer', // 2d基础面图层
  '@yl/datai-com-map-3D-base-point-layer', // 3d基础点图层
  '@yl/datai-com-map-3D-base-polyline-layer', // 3d基础线图层
  '@yl/datai-com-map-3D-base-polygon-layer', // 3d基础面图层
  '@yl/datai-com-map-hotmap', // 热力图
  '@yl/datai-com-map-3D-heatMap-layer',
  '@yl/datai-com-map-2d-point-polymerization',
  '@yl/datai-com-map-3d-point-polymerization', // 点聚合
];

export const mapBasePlanType = [
  '@yl/datai-com-map-foundationPlan',
  '@yl/datai-com-map-3D-FoundationPlan',
  '@yl/datai-com-map-gl-FoundationPlan',
];

export const measureType2D = [
  {
    type: 'LineString',
    label: '空间距离测量',
  },
  {
    type: 'Polygon',
    label: '空间面积测量',
  },
];

export const measureType3D = [
  {
    type: 'length-s',
    label: '空间距离测量',
  },
  {
    type: 'area-s',
    label: '空间面积测量',
  },
  {
    type: 'length',
    label: '地表距离测量',
  },
  {
    type: 'area',
    label: '地表面积测量',
  },
  {
    type: 'height',
    label: '高度差测量',
  },
  {
    type: 'angle',
    label: '角度测量',
  },
];

export const infoWinPosition = [
  {
    label: '左上',
    value: 'left-top',
  },
  {
    label: '中上',
    value: 'center-top',
  },
  {
    label: '右上',
    value: 'right-top',
  },
  {
    label: '左居中',
    value: 'left-center',
  },
  {
    label: '居中',
    value: 'center',
  },
  {
    label: '右居中',
    value: 'right-center',
  },
  {
    label: '左下',
    value: 'left-bottom',
  },
  {
    label: '中下',
    value: 'center-bottom',
  },
  {
    label: '右下',
    value: 'right-bottom',
  },
];
