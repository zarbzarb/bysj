import CompatibleTool from '../../DataSource/Compatible';

/**
 * 兼容 datai 组件的 attr 属性
 * @param {object} attr 原始 attr
 * @returns 处理之后的 attr
 */
export const compatibleChartAttr = (attr) => {
  if (attr && attr.background && attr.background.url && attr.background.url.indexOf('ioc-screen/screen') == 0) {
    attr.background.url = `/iocoss/${attr.background.url}`;
  }
  return attr;
};

/**
 * 兼容 datai 组件的 config 配置（注意，次方法直接更改 instance.config 上面的属性，不会触发组件重新渲染）
 * @param {object} instance 组件示例
 * @param {string} englishName 组件 name
 * @returns
 */
export const compatibleChartConfig = (instance, englishName) => {
  const { config } = instance;
  if (!config._seriesType) {
    // 兼容历史，新增 _seriesType 字段，默认值为 2
    instance.config._seriesType = 2;
  }

  const mapField = {};
  config._api.forEach((v) => {
    mapField[v.field] = v.mapField;
  });

  // 兼容历史，_api 新增 row 和 name 字段
  if (config._api[0]?.row === undefined) {
    if (englishName === 'ChartBabel') {
      // 气泡图
      instance.config._api = [
        { name: 'x轴', field: 'x', mapField: mapField.x, row: [], state: true },
        { name: '系列', field: 's', mapField: mapField.s, row: [], state: true },
        { name: '值', field: 'y', mapField: mapField.y, row: [], state: true },
        { name: '半径', field: 'r', mapField: mapField.r || 'r', row: [], state: true },
      ];
    } else if (CompatibleTool.isXYSChart(config)) {
      instance.config._api = [
        { name: 'x轴', field: 'x', mapField: mapField.x, row: [], state: true },
        { name: '系列', field: 's', mapField: mapField.s, row: [], state: true },
        { name: '值', field: 'y', mapField: mapField.y, row: [], state: true },
      ];
    } else if (englishName === 'MediaImageDynamic') {
      instance.config._api = [
        { name: '图片地址', field: 'text', mapField: mapField.text, row: [], state: true },
        { name: '提示内容', field: 'value', mapField: mapField.value, row: [], state: true },
      ];
    } else if (englishName === 'MediaImageBasic') {
      instance.config._api = [
        { name: '提示内容', field: 'text', mapField: mapField.text, row: [], state: true },
        { name: '状态值', field: 'value', mapField: mapField.value, row: [], state: true },
      ];
    } else if (englishName === 'ChartGauge') {
      // 仪表盘
      instance.config._api = [
        { name: '标题', field: 'name', mapField: mapField.name, row: [], state: true },
        { name: '值', field: 'value', mapField: mapField.value, row: [], state: true },
        { name: '最小值', field: 'min', mapField: mapField.min, row: [], state: true },
        { name: '最大值', field: 'max', mapField: mapField.max, row: [], state: true },
      ];
    } else if (CompatibleTool.isNVChart(config)) {
      instance.config._api = [
        { name: '系列', field: 'name', mapField: mapField.name, row: [], state: true },
        { name: '值', field: 'value', mapField: mapField.value, row: [], state: true },
      ];
    } else if (CompatibleTool.isPolarChart(config)) {
      instance.config._api = [
        { name: 'x轴', field: 'angle', mapField: mapField.angle, row: [], state: true },
        { name: '系列', field: 's', mapField: mapField.s, row: [], state: true },
        { name: '值', field: 'r', mapField: mapField.r, row: [], state: true },
      ];
    } else if (englishName === 'ChartHeatmap') {
      // 热力图
      instance.config._api = [
        { name: 'x轴', field: 'x', mapField: mapField.x, row: [], state: true },
        { name: 'y轴', field: 'y', mapField: mapField.y, row: [], state: true },
        { name: '值', field: 'v', mapField: mapField.v, row: [], state: true },
      ];
    } else if (englishName === 'ChartRingGauge') {
      // 环形百分比饼图
      instance.config._api = [
        { name: '值', field: 'value', mapField: mapField.value, row: [], state: true },
        { name: '最小值', field: 'min', mapField: mapField.min, row: [], state: true },
        { name: '最大值', field: 'max', mapField: mapField.max, row: [], state: true },
      ];
    } else if (englishName === 'ChartSemicircle') {
      // 半圆形
      instance.config._api = [
        { name: '副标题', field: 'text', mapField: mapField.text, row: [], state: true },
        { name: '值', field: 'rate', mapField: mapField.rate, row: [], state: true },
      ];
    } else if (englishName === 'ChartBarDoubleYCapsule') {
      // 双Y轴条形图
      instance.config._api = [
        { name: 'x轴', field: 'x', mapField: mapField.x, row: [], state: true },
        { name: '左y轴', field: 'y', mapField: mapField.y, row: [], state: true },
        { name: '右y轴', field: 'y1', mapField: mapField.y1, row: [], state: true },
      ];
    } else if (englishName === 'ChartRankingList') {
      // 排行榜
      instance.config._api = [
        { name: '标题', field: 'title', mapField: mapField.title, row: [], state: true },
        { name: '副标题', field: 'subTitle', mapField: mapField.subTitle, row: [], state: true },
        { name: '值', field: 'value', mapField: mapField.value, row: [], state: true },
        { name: '次要值', field: 'subValue', mapField: mapField.subValue, row: [], state: true },
        { name: '后缀', field: 'suffix', mapField: mapField.suffix, row: [], state: true },
      ];
    } else if (englishName === 'ChartBarAreaMap') {
      // 条形面积图
      instance.config._api = [
        { name: '值', field: 'value', mapField: mapField.value, row: [], state: true },
        { name: '比例', field: 'rate', mapField: mapField.rate, row: [], state: true },
      ];
    } else if (englishName === 'TimeLine') {
      // 时间轴
      instance.config._api = [
        { name: '文本', field: 'label', mapField: mapField.label, row: [], state: true },
        { name: '文本值', field: 'value', mapField: mapField.value || 'value', row: [], state: true },
      ];
    } else if (englishName === 'TextListturns') {
      // 列表柱状图
      instance.config._api = [
        { name: '标题', field: 'title', mapField: mapField.title, row: [], state: true },
        { name: '数量', field: 'number', mapField: mapField.number, row: [], state: true },
      ];
    } else if (englishName === 'TextMarquee' || englishName === 'TextOverflowscroll') {
      // 跑马灯
      instance.config._api = [{ name: '文本', field: 'text', mapField: mapField.text, row: [], state: true }];
    } else if (englishName === 'ProgressBar') {
      // 进度条
      instance.config._api = [
        { name: '值文本', field: 'value', mapField: mapField.value, row: [], state: true },
        { name: '标题', field: 'title', mapField: mapField.title, row: [], state: true },
      ];
    } else if (englishName === 'TextScore') {
      // 评分组件
      instance.config._api = [{ name: '总数', field: 'total', mapField: mapField.total, row: [], state: true }];
    } else if (englishName === 'FlopBasic') {
      // 翻牌器
      instance.config._api = [
        { name: '数字', field: 'data', mapField: mapField.data, row: [], state: true },
        { name: '前缀', field: 'prefix', mapField: mapField.prefix, row: [], state: true },
        { name: '后缀', field: 'suffix', mapField: mapField.suffix, row: [], state: true },
      ];
    } else if (englishName === 'TextTabs') {
      // Tab列表
      instance.config._api = [
        { name: 'id', field: 'id', mapField: mapField.id, row: [], state: true },
        { name: '内容', field: 'content', mapField: mapField.content, row: [], state: true },
      ];
    }
  }

  // 为进度条历史组件，新增“最小值”和“最大值”属性映射字段
  if (englishName === 'ProgressBar' && !instance.config.dynamic.dataMap.some((v) => v.key === 'min')) {
    const newDataMap = [
      {
        key: 'min',
        name: '最小值',
      },
      {
        key: 'max',
        name: '最大值',
      },
    ];
    const newDdimensionMap = [
      {
        dataMapKey: 'min',
        col: 'min',
        row: [],
      },
      {
        dataMapKey: 'max',
        col: 'max',
        row: [],
      },
    ];
    instance.config.dynamic.dataMap = [...instance.config.dynamic.dataMap, ...newDataMap];
    instance.config.dynamic.dimensionMap = [...instance.config.dynamic.dimensionMap, ...newDdimensionMap];
    instance.config.indicator.dataMap = [...instance.config.indicator.dataMap, ...newDataMap];
    instance.config.indicator.dimensionMap = [...instance.config.indicator.dimensionMap, ...newDdimensionMap];

    if (instance.config.variableDataMap) {
      instance.config.variableDataMap = [
        ...instance.config.variableDataMap,
        {
          name: '最小值',
          field: 'min',
          mapField: 'min',
          row: [],
          state: true,
        },
        {
          name: '最大值',
          field: 'max',
          mapField: 'max',
          row: [],
          state: true,
        },
      ];
    }
  }

  // 变量数据源，属性映射使用 variableDataMap
  if (!config.variableDataMap) {
    config.variableDataMap = config._api.map((v) => ({ ...v, row: [] }));
  }
};
