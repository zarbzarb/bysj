/**
 * 公共方法
 */

import CompatibleTool from '@/pages/Platform/DataSource/Compatible';
import { compChartList } from '@/staticJson/DataICompList';
import { getComponent } from '@/utils/componentUtils';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { babelTransform2 } from '@/utils/utils';
import DataICompKit from '@/utils/dataiUtils';
import { SingleObjectArrayCompType } from './constant';

import DataI from './global-api';

// v8.6.0 传选中值的组件12个
export const passCurrentValueComps = new Set([
  '@yl/datai-com-time-line',
  '@yl/datai-com-dynamic-wordcloud',
  '@yl/datai-com-text-tabs-group',
  '@yl/datai-com-text-tabs-select',
  // 'Button',
  'RadioTabs',
  // 'Input',
  // 'NewInput',
  'CheckBox',
  'Radio',
  'DatePicker',
  'Select',
  'TreeSelect',
  'TreeList',
  'ColorPicker',
]);

// 通过映射字段无法归为统一类型处理的组件,分别为  图片组件、URL图片
export const dataiComps = new Set(['MediaImageBasic', 'MediaImageDynamic']);

/**
 * 对象数组去重
 * @param {原数组} array
 * @param {数组中对象的唯一标识} key
 * @returns 去重后的新数组
 */
export const unique = (array, key) => {
  const hash = {};
  return array.reduce((item, next) => {
    !hash[next[key]] && (hash[next[key]] = true && item.push(next));
    return item;
  }, []);
};
/**
 * 根据组件使用的数据类型返回组件的数据项
 * @param {组件key} compKey
 * @returns 组件的数据项
 */
export const compDataOptions = (compKey, field = 'field') => {
  let options = [];
  try {
    const comp = DataI.getComponentByKey(compKey);

    // datai 类型组件
    switch (comp.classType) {
      case 'com': {
        // 兼容在子页面选择主页组件时，主页组件没有渲染时instance不存在的情况
        const config = comp.instance ? comp.instance.config : comp.preAttr._config;
        const dataType = config._source;
        // 判断数据源类型
        switch (dataType) {
          case 'dynamic': {
            // 判断是否使用系列转换
            if (config.dynamic.seriesType === 1) {
              // x s1 s2
              options = config.dynamic.dataMap.map((v) => ({ value: v.key, label: v.name }));
            } else if (config.dynamic.seriesType === 2) {
              // x y s
              options = config.dynamic.dataMap2.map((v) => ({ value: v.key, label: v.name }));
            } else {
              options = config.dynamic.dataMap.map((v) => ({ value: v.key, label: v.name }));
            }

            break;
          }
          case 'indicator': {
            // 判断是否使用系列转换
            if (config.indicator.seriesType === 1) {
              // x s1 s2
              options = config.indicator.dataMap.map((v) => ({ value: v.key, label: v.name }));
            } else if (config.indicator.seriesType === 2) {
              // x y s
              options = config.indicator.dataMap2.map((v) => ({ value: v.key, label: v.name }));
            } else {
              options = config.indicator.dataMap.map((v) => ({ value: v.key, label: v.name }));
            }

            break;
          }
          case 'json': {
            // 判断是否使用系列转换
            options =
              config._seriesType === 1
                ? config._dataMap.map((v) => ({ value: v[field], label: v.name }))
                : config._api.map((v) => ({ value: v[field], label: v.name }));

            break;
          }
          case 'variableRef': {
            options =
              config._seriesType === 1
                ? config._dataMap.map((v) => ({ value: v[field], label: v.name }))
                : config.variableDataMap.map((v) => ({ value: v[field], label: v.name }));
            break;
          }

          default: {
            break;
          }
        }

        break;
      }
      case 'antd': {
        // antd 类型组件
        const config = comp.type === 'LayerLegend' ? comp.props.dataSourceSet : comp.dataset;
        const dataType = config?.category;

        switch (dataType) {
          case 'dynamic': {
            options = config.dynamic.dataMap.map((v) => ({ value: v.key, label: v.name }));
            break;
          }
          case 'indicator': {
            options = config.indicator.dataMap.map((v) => ({ value: v.key, label: v.name }));
            break;
          }
          case 'json': {
            options =
              comp.type === 'Table'
                ? comp.props.columns.map((v) => ({ value: v.dataIndex, label: v.title }))
                : config._api.map((v) => ({ value: v[field], label: v.name }));

            break;
          }
          case 'variableRef': {
            options =
              comp.type === 'Table'
                ? comp.props.columns.map((v) => ({ value: v.dataIndex, label: v.title }))
                : config.variableDataMap.map((v) => ({ value: v[field], label: v.name }));
            break;
          }

          default: {
            break;
          }
        }

        // 多行列表没有 category 属性, 只支持静态属性的数据项
        if (comp.type === 'List' && !config.isVariable) {
          options = comp.props.columns.map((v) => ({ value: v.code, label: v.title }));
        }

        break;
      }
      case 'customComp': {
        // 自定义组件
        const config = comp.dataset;
        const dataType = config?.category;

        switch (dataType) {
          case 'dynamic': {
            options = config.dynamic.dataMap.map((v) => ({ value: v.key, label: v.name }));
            break;
          }
          case 'indicator': {
            options = config.indicator.dataMap.map((v) => ({ value: v.key, label: v.name }));
            break;
          }
          case 'json': {
            options = config._api.map((v) => ({ value: v[field], label: v.name }));

            break;
          }
          case 'variableRef': {
            options = config.variableDataMap.map((v) => ({ value: v[field], label: v.name }));
            break;
          }

          default: {
            options = [];
            break;
          }
        }

        break;
      }
      // No default
    }

    // 数据项的数据类型(只考虑数组类型和字符串类型，数值类型转为字符串类型使用)
    const comTypes = new Set(SingleObjectArrayCompType.map((obj) => obj.comType));
    const sourceType = comTypes.has(comp.type) || comTypes.has(comp.englishName) ? 'string' : 'array';
    options = options.map((opt) => ({ ...opt, sourceType }));
  } catch (error) {
    console.error(error);
  }

  return options;
};

/**
 * 获取xys类型图表组件 不同映射字段的值
 * @param {图表组件数据源} datas
 * @returns
 */
const parseXYSData = (datas) => {
  const dataMap = {};
  const dims = {};
  datas.forEach((item) => {
    dims[item.s] = item.s;
    if (dataMap[item.x]) {
      dataMap[item.x][item.s] = item.y;
    } else {
      dataMap[item.x] = {
        x: `${item.x}`,
        [item.s]: `${item.y}`,
      };
    }
  });
  return {
    x: Object.keys(dataMap),
    y: datas.map((d) => d.y).map((v) => `${v}`),
    s: Object.keys(dims),
    values: Object.values(dataMap),
  };
};

export const getDataiBasicChartType = (opts = {}) => {
  const { englishName } = opts;
  const { lineChartList, barChartList, columnChartList, circleChartList, otherChartList } = compChartList;
  // 折线图
  const matchLineChartKeys = lineChartList.map((item) => item.englishName);
  // 条形图
  const matchBarChartKeys = barChartList.map((item) => item.englishName);
  // 柱状图
  const matchColumnChartKeys = columnChartList.map((item) => item.englishName);
  // 饼图
  const matchPieChartKeys = circleChartList.map((item) => item.englishName);

  const isLineChart = matchLineChartKeys.includes(englishName);
  const isBarChart = matchBarChartKeys.includes(englishName);
  const isColoumnChart = matchColumnChartKeys.includes(englishName);
  const isPieChart = matchPieChartKeys.includes(englishName);
  const isBasicChart = isLineChart || isBarChart || isColoumnChart || isPieChart;

  return { isLineChart, isBarChart, isColoumnChart, isPieChart, isBasicChart };
};

const getComp = (key) => {
  return window.comList && key ? window.comList.get(key) : getComponent(key, window.layerList);
};

export const getDataset = (comp) => {
  let dataset;
  switch (comp.classType) {
    case 'antd': {
      dataset = comp.type === 'LayerLegend' ? comp.props.dataSourceSet : comp.dataset;

      break;
    }
    case 'com': {
      dataset = DataICompKit.getConfig(comp);

      break;
    }
    case 'customComp': {
      dataset = comp.dataset;

      break;
    }
    default: {
      break;
    }
  }

  return dataset;
};

export const getCategory = (dataset, classType) => {
  let category;
  if (!dataset) return;
  switch (classType) {
    case 'antd': {
      if (dataset?.category) {
        category = dataset.category;
      } else {
        category = dataset.isVariable ? 'variableRef' : 'json';
      }

      break;
    }
    case 'com': {
      category = dataset._source;

      break;
    }
    case 'customComp': {
      category = dataset.category;

      break;
    }
    // No default
  }
  return category;
};

// 获取预览态组件的当前数据
export const getCompPureData = (comp) => {
  if (comp.type === 'RadioTabs') {
    return comp.props.tabData || [];
  }
  const dataset = getDataset(comp);
  if (!dataset) return;
  let data = dataset._data || dataset.defaultValue || dataset._mockData || [];
  // 【特殊处理】下拉选择器，需要过滤掉没有 label 的记录
  if (comp.type === 'Select') {
    data = data.filter((row) => !!row.label);
  }
  return data;
};

/**
 * 获取接口原始数据
 * @param {object} comp 组件实例
 * @returns 数组
 */
export const getOriginalData = (comp) => {
  const { classType } = comp;
  const dataset = getDataset(comp);
  const category = getCategory(dataset, classType);
  const isDynamic = category === 'dynamic' || category === 'indicator';
  let originalData = [];
  // v8.6.0处理无dataset组件
  if (dataset && dataset._originalData && isDynamic) {
    originalData = dataset._originalData;
    // 【特殊处理】下拉选择器，需要过滤掉没有 label 的记录
    if (comp.type === 'Select') {
      dataset._data.forEach((item, index) => {
        if (!item.label) originalData.splice(index, 1);
      });
    }
  }
  return originalData;
};

/**
 * 查找某个属性的映射字段
 * @param {object} comp 组件实例
 * @param {string} field 要查找的属性
 * @param {number} seriesType 2 为开启“系列动态生成”，1 为不开启
 * @returns
 */
export const getMapField = (comp, field, seriesType = 1) => {
  const { classType } = comp;
  const dataset = getDataset(comp);
  const category = getCategory(dataset, classType);
  const isDynamic = category === 'dynamic' || category === 'indicator';
  if (isDynamic) {
    const dynamic = dataset[category];
    const dimensionMap = seriesType === 2 ? 'dimensionMap2' : 'dimensionMap';
    const record = dynamic[dimensionMap].find((v) => v.dataMapKey === field);
    if (record) return record.col;
  }
  return '';
};

export const getNVChartObj = (arr = []) => {
  const obj = arr.reduce(
    (pre, cur) => {
      pre.name.push(cur.name);
      pre.value.push(cur.value);
      return pre;
    },
    { name: [], value: [] },
  );
  return obj;
};

// 多系列图表数据转成参数数据
export const chartToParams = (pureData = [], x, y, s) => {
  const obj = pureData.reduce((pre, cur) => {
    if (pre[x]) {
      if (pre[cur[s]]) {
        if (!pre[x].includes(cur[x])) {
          pre[x].push(cur[x]);
        }
        pre[cur[s]].push(cur[y]);
      } else {
        pre[cur[s]] = [cur[y]];
        pre[x].push(cur[x]);
      }
    } else {
      pre[cur[s]] = [cur[y]];
      pre[x] = [cur[x]];
    }
    return pre;
  }, {});
  return obj;
};

export const getChartSeriesKey = (compDataItem, dataMap, series, name) => {
  const seriekeys = dataMap.filter((val) => val.name.startsWith('系列'));
  const i = seriekeys.findIndex((s) => s.key === compDataItem);
  let key = compDataItem;
  if (i > -1) {
    key = series[i][name];
  }
  return key;
};

/**
 * 获取选中值（组件数据和交互传入值）
 */
export const getChangeValue = (comp, updateType, dataItemKey, action) => {
  let val;
  let selectedIndex;
  let curEvent;
  let curActionGroup;
  const pureData = getCompPureData(comp);
  const isOriginal = dataItemKey.startsWith('#'); // 是否选择了“接口数据”的字段
  const originalField = dataItemKey.slice(1);
  const originalData = getOriginalData(comp); // 接口原始数据
  if (updateType === 2) {
    // v8.5.1 选中值组件读取选中值,优先选中值变量/其次选中值/最次初始值
    // 初始值
    if (comp.type === 'RadioTabs') {
      // 无选中值，取默认项
      val = comp.props.defaultTab;
    } else if (comp.classType === 'com' && comp?.instance?.compAttr) {
      const { compAttr } = comp.instance;
      switch (comp.type) {
        case '@yl/datai-com-text-tabs-group': {
          // 无选中值，取激活项
          selectedIndex = Number.parseInt(compAttr?.itemAttr?.activeIndex || 0);

          break;
        }
        case '@yl/datai-com-text-tabs-select': {
          // 无选中值，取激活项
          let activeIndexArr = compAttr?.series.map((um) => um.activeIndex);
          if (compAttr?.global?.isSupportMultiple === false) {
            // 单选
            activeIndexArr = activeIndexArr.length > 0 ? [activeIndexArr[0]] : [];
          }
          selectedIndex = activeIndexArr;

          break;
        }
        case '@yl/datai-com-time-line': {
          // 无选中值，取默认项
          selectedIndex = 0;

          break;
        }
        // No default
      }
    }
    // 选中值
    if (comp.selectedValue !== undefined) {
      val = comp.selectedValue;
      selectedIndex = comp.selectedIndex;
    }
    // 选中值变量
    curEvent = comp.eventSetings && comp.eventSetings.find((event) => event.eventType === 'changeValue');
    // 查找当前action的动作组
    curActionGroup = curEvent?.groups?.find((ag) => ag.actions?.some((act) => act.actionKey === action?.actionKey));
    if (curActionGroup?.variable) {
      val = getDataByKey(curActionGroup.variable);
    }
  } else if (updateType === 4 && Array.isArray(comp.eventSetings)) {
    // 交互传入值
    // 点击表格行、单击系列、单击图例、选中值等能存变量的事件有交互值可传
    curEvent =
      comp.eventSetings &&
      comp.eventSetings.find((event) => {
        return event.actions?.some((a) => a.actionKey === action.actionKey);
      });

    val = curEvent?.singleValue || comp.selectedValue; // 回车事件等无变量的事件从 selectedValue 取选中值
    selectedIndex = curEvent?.selectedIndex;
  }
  // if (curEvent?.variable) {
  //   val = getDataByKey(curEvent.variable);
  // }

  switch (comp.type) {
    case 'RadioTabs': {
      // 多按钮
      const tab = comp.props.tabData.find((t) => t.value === val);
      val = tab ? tab[dataItemKey] : undefined;

      break;
    }
    case 'DatePicker': {
      // 时间选择器
      if (comp.props.isRangePicker) {
        val = dataItemKey === 'startTime' ? val[0] : val[1];
      }

      break;
    }
    case 'Button': {
      if (isOriginal) {
        val = originalData[0][originalField];
      } else if (Array.isArray(pureData) && pureData.length > 0) {
        val = pureData[0].text;
      } else if (typeof pureData === 'string') {
        val = pureData;
      }

      break;
    }
    case 'Radio':
    case 'Select': {
      // 单选框、下拉框等，可选择 label
      const index = pureData.findIndex((i) => String(i.value) === String(val));
      if (index >= 0) {
        val = isOriginal ? originalData[index][originalField] : pureData[index][dataItemKey];
      }

      break;
    }
    default: {
      if (comp.type === 'CheckBox' && Array.isArray(val)) {
        // 复选框，选中值是数组
        if (isOriginal) {
          const rowIndexs = val.map((v) => pureData.findIndex((p) => String(p.value) === String(v)));
          val = rowIndexs.map((i) => originalData[i]?.[originalField]);
        } else {
          const labels = val.map((v) => {
            const a = pureData.find((p) => String(p.value) === String(v));
            return a ? a.label : '';
          });
          val = dataItemKey === 'value' ? val : labels;
        }
      } else if (comp.isCustomListChild) {
        // 自定义列表的子组件
        val = isOriginal ? originalData[0][originalField] : pureData[0][dataItemKey];
      } else if (comp.type === '@yl/datai-com-text-tabs-select') {
        if (val === undefined && selectedIndex && Array.isArray(selectedIndex)) {
          val = pureData.filter((v, index) => selectedIndex.includes(index));
        }
        if (val && Array.isArray(val)) {
          val = val.map((v) => {
            return v[dataItemKey];
          });
          if (comp?.instance?.compAttr?.global?.isSupportMultiple === false) {
            val = val.length > 0 ? val[0] : undefined;
          }
        }
      } else {
        console.log('comp.classType', comp.classType, 'typeof val', typeof val);
        // 图表，表格等
        // eslint-disable-next-line no-lonely-if
        if (comp.classType === 'com') {
          if (val && typeof val === 'object') {
            const config = getDataset(comp);
            const { compAttr } = comp.instance;
            if (CompatibleTool.isXYSChart(config)) {
              // x/y/s兼容格式数据
              if (isOriginal) {
                const xMapField = getMapField(comp, 'x');
                const rowData = originalData.find((row) => row[xMapField] === val.x);
                if (rowData) val = rowData[originalField];
              } else {
                const seriekeys = config.dynamic.dataMap.filter((v) => v.key.startsWith('series'));
                let key;
                const i = seriekeys.findIndex((s) => s.key === dataItemKey);
                if (getDataiBasicChartType({ englishName: comp.englishName }).isBarChart) {
                  // 条形图表组件单击系列保存的是数组
                  key = i + 1;
                } else if (i > -1) {
                  key = compAttr.series[i].serieName;
                } else {
                  key = dataItemKey;
                }
                val = val[key];
              }
            } else if (CompatibleTool.isXYY1Chart(config)) {
              // x,y,y1兼容格式数据
              if (isOriginal) {
                const yMapField = getMapField(comp, 'y');
                const rowData = originalData.find((row) => row[yMapField] === val.y);
                if (rowData) val = rowData[originalField];
              } else {
                val = val[dataItemKey];
              }
            } else if (CompatibleTool.isNVChart(config)) {
              // name/value兼容格式数据
              if (isOriginal && curActionGroup?.rowIndex >= 0) {
                val = originalData[curActionGroup?.rowIndex][originalField];
              } else {
                const key = dataItemKey === 'x' ? 'name' : 'value';
                val = val[key];
              }
            } else if (
              config._data.every((it) => Array.isArray(it)) // 二维数组
            ) {
              // 嵌套环形图
              const key = dataItemKey.startsWith('series') ? 'value' : 'name';
              val = val[key];
            } else if (CompatibleTool.isPolarChart(config)) {
              // 极坐标（无交互传入值事件，不需要处理）
            } else if (CompatibleTool.isRadarChart(config)) {
              // 雷达图（无交互传入值事件，不需要处理）
            } else {
              // 数组对象类型(ArrayObject): 新旧数据结构一致、映射字段一致
              val = val[dataItemKey];
            }
          } else if (val === undefined) {
            // eslint-disable-next-line unicorn/no-lonely-if
            if (Array.isArray(pureData) && Number.isInteger(selectedIndex) && pureData.length > selectedIndex) {
              val = pureData[selectedIndex][dataItemKey];
            }
          }
        } else if (Object.prototype.toString.call(val) === '[object Object]') {
          // 单击表格行等
          // eslint-disable-next-line unicorn/prefer-ternary
          if (isOriginal && curActionGroup?.rowIndex >= 0) {
            val = originalData[curActionGroup?.rowIndex][originalField];
          } else {
            val = val[dataItemKey];
          }
        }
      }
    }
  }
  return val;
};

export const parseCode = (expression, data) => {
  if (!expression.includes('return')) {
    expression = `return ${expression}`;
  }
  try {
    const result = babelTransform2(expression, data);
    return result;
  } catch (error) {
    console.info('语法错误', error);
  }
};

/**
 * 返回组件数据项对应的值(取值时注意所有数值类型需要转换为字符串处理，兼容匹配关系中出现的 [1,2,3,4,5].includes('1'))
 * @param {组件key} compKey
 * @param {数据项字段} compDataItem
 */
export const compDataOptionValue = (compKey, compDataItem, item, dataSwitch = 0, dataSwitchContent) => {
  let value = null;
  let field = compDataItem;
  const isOriginal = compDataItem.startsWith('#'); // 是否选择了“接口数据”的字段
  try {
    const comp = DataI.getComponentByKey(compKey);
    const dataset = getDataset(comp);
    const dataType = getCategory(dataset, comp.classType);
    let curData = getCompPureData(comp);
    const originalData = getOriginalData(comp);
    if (comp.isCustomListChild && dataType === 'dynamic' && item) {
      // 如果选择的组件是自定义列表的子组件，并且数据源是“父组件数据”，它的数据应该取 dataFromParent
      const { dataFromParent } = getDataset(item).dynamic;
      const { dimensionMap } = dataset.dynamic;
      console.log({ dataFromParent }, { dimensionMap });
      curData = CompatibleTool.dataFieldMapArrayObject(dimensionMap, dataFromParent);
    }
    if (comp.classType === 'com') {
      if (isOriginal) {
        // v8.6 支持“接口数据”
        field = compDataItem.slice(1);
        value = originalData.map((val) => `${val[field]}`);
      } else if (CompatibleTool.isXYSChart(dataset)) {
        // xys 类型的图表组件
        // x/y/s兼容格式数据
        const { _seriesType = 2, _source, dynamic, indicator } = comp.instance?.config;
        // if里面是赋值给系列的，所以从对应的系列取值，else是把x，y，s中的某一项全部覆盖
        if (
          (_source === 'dynamic' && dynamic.seriesType === 1) ||
          (_source === 'indicator' && indicator.seriesType === 1) ||
          (_source === 'json' && _seriesType !== 2) ||
          comp.englishName === 'ChartBabel'
        ) {
          // x/y/s兼容格式数据
          const obj = chartToParams(curData, 'x', 'y', 's');
          // console.log(obj, 'obj', field);
          if (obj[field] === undefined) {
            return console.warn(`请检查组件${comp.name}-key:${comp.key}的映射中是否有${field}字段`);
          }
          value = Array.isArray(obj[field]) ? [...new Set(obj[field])] : obj[field];
          if (['ChartScatter', 'ChartAreaBroken'].includes(comp.englishName)) {
            // 区域折线图
            value = obj[field];
          }
        } else {
          value = curData.map((temp) => temp[field]);
        }
      } else if (CompatibleTool.isNVChart(dataset) && !dataiComps.has(comp.englishName)) {
        // name/value兼容格式数据
        const obj = getNVChartObj(curData);
        const key = field === 'x' || field === 'name' ? 'name' : 'value';
        value = obj[key];
      } else if (
        dataset._data?.[0] &&
        dataset._data?.every((it) => Array.isArray(it)) // 二维数组
      ) {
        // 嵌套环形图
        const ringObj = getNVChartObj(curData[0]);
        const pieObj = getNVChartObj(curData[1]);
        const obj = {
          ringName: ringObj.name,
          pieName: pieObj.name,
          series0: pieObj.value,
          series1: ringObj.value,
        };
        value = obj[field];
      } else if (CompatibleTool.isPolarChart(dataset)) {
        // 极坐标
        const obj = chartToParams(curData, 'angle', 'r', 's');
        if (field === 'x') {
          value = obj.angle;
        } else if (dataType === 'dynamic' || dataType === 'indicator') {
          value = obj[field];
        } else {
          const keys = [...new Set(curData.map((temp) => temp.s))];
          const seriekeys = dataset.dynamic.dataMap.filter((temp) => temp.name.startsWith('系列'));
          const i = seriekeys.findIndex((s) => s.key === field);
          value = obj[keys[i]];
        }
      } else if (CompatibleTool.isRadarChart(dataset)) {
        // 雷达图
        const obj = chartToParams(curData, 'field', 'rate', 's');
        if (field === 'x') {
          value = obj.field;
        } else if (dataType === 'dynamic' || dataType === 'indicator') {
          value = obj[field];
        } else {
          const key = getChartSeriesKey(field, dataset.dynamic.dataMap, comp.instance.compAttr.series, 'field');
          value = obj[key];
        }
      } else {
        // 数组对象类型(ArrayObject): 新旧数据结构一致、映射字段一致
        value = curData.map((temp) => temp[field]);
      }
    } else if (comp.classType === 'antd' || comp.classType === 'customComp') {
      // 多行列表没有 category 属性, 只支持静态属性的数据项
      if (isOriginal) {
        // v8.6 支持“接口数据”
        field = compDataItem.slice(1);
        value = originalData.map((val) => `${val[field]}`);
      } else {
        switch (comp.type) {
          case 'List': {
            value = dataset.defaultValue.map((val) => `${val[field]}`);

            break;
          }
          case 'RadioTabs': {
            // 多按钮没有 dataset属性，直接取props.tabData
            value = comp.props.tabData.map((val) => `${val[field]}`);

            break;
          }
          case 'Input':
          case 'NewInput':
          case 'TreeList':
          case 'TreeSelect': {
            // 使用选中值事件，默认取整个节点
            value = curData;

            break;
          }
          case 'DatePicker': {
            // 时间选择器单个直接取值，两个，分开始时间和结束时间
            value = curData;
            if (comp.props.isRangePicker) {
              value = field === 'startTime' ? value[0] : value[1];
            }

            break;
          }
          default: {
            // console.log('comp.type', comp.type);
            if (Array.isArray(curData)) {
              // 数组取映射字段数组
              value = curData.map((val) => `${val[field]}`);
            } else if (dataSwitch > 0) {
              // 数据格式转换
              const result = parseCode(dataSwitchContent.code, curData);
              if (Array.isArray(result)) {
                value = result.map((val) => `${val[field]}`);
              }
            } else {
              value = curData;
            }
          }
        }
      }
    }
    // 组件中数据源只有一个对象的组件，取字段映射值时取出的是字符串, 如 文本、按钮、指标文本、播放器等组件
    const comTypes = new Set(SingleObjectArrayCompType.map((obj) => obj.comType));
    if ((comTypes.has(comp.type) || comTypes.has(comp.englishName)) && Array.isArray(value) && value.length > 0) {
      value = value[0];
    }
  } catch (error) {
    console.error(error);
  }

  // 数据项全部改为字符串类型，兼容条件拦截中includes的判断
  if (Array.isArray(value)) {
    value = value.map((val) => `${val}`);
  }

  return value;
};

const generateValidateFn = (code) => {
  return new Function(
    'data',
    `
    try {
      return ${code}
    } catch (error) {
      console.error(error)
      return false
    }
  `,
  );
};

/**
 * 获取多个规则 且关系运算结果
 * @param {事件触发条件中的规则列表} rules
 * @returns true false
 */
const validateWithRules = (rules) => {
  let code = '';
  rules.forEach((rule, idx) => {
    // v8.5.1 添加是否当前选中值
    const { compKey, isSelected, compDataItem, operator, value } = rule;
    // console.log('validateWithRules value', value);
    let val;
    if (compDataItem) {
      const selectedComp = getComp(compKey);
      const { type } = selectedComp;
      val =
        type === 'Input' || type === 'NewInput' || (passCurrentValueComps.has(type) && isSelected === 1)
          ? getChangeValue(selectedComp, 2, compDataItem)
          : compDataOptionValue(compKey, compDataItem);
    } else {
      val = '';
    }
    if (typeof val === 'number') val += '';
    const optionValue = JSON.stringify(val === undefined ? '' : val);
    if (operator === 'include') {
      code += `(${optionValue}.includes('${value}'))`;
    } else if (operator === 'exclude') {
      code += `(!${optionValue}.includes('${value}'))`;
    } else {
      const filterVal = /^-?[\d.]+$/.test(value) ? value : `'${value}'`;
      code += `(${optionValue} ${operator} ${filterVal})`;
    }
    if (idx < rules.length - 1) {
      code += ' && ';
    }
  });
  const fn = generateValidateFn(code);
  const res = fn();
  console.info(code, res);
  return res;
};

/**
 * 获取多个条件 或关系运算结果
 * @param {import('@/staticJson/PageEvent').ActionGroup['conditions']} conditions
 * @returns {boolean}
 */
export const validateWithConditions = (conditions = []) => {
  if (conditions.length === 0) return true;

  let code = '';
  conditions.forEach((condition, idx) => {
    const { rules } = condition;
    const bool = validateWithRules(rules);
    code += `${bool}`;
    if (idx < conditions.length - 1) {
      code += '||';
    }
  });

  const fn = generateValidateFn(code);
  const res = fn();
  console.info(code, res);

  return res;
};

/**
 * 跟进传入的事件对象返回该事件是否通过拦截校验
 * @param {import('@/staticJson/PageEvent').CompEvent | import('@/staticJson/PageEvent').PageEvent} event
 * @returns {boolean}
 */
export const eventInterceptors = (event, ag, idx) => {
  const validate = validateWithConditions(ag.conditions || []);
  if (!validate) {
    console.warn(`${event.eventType}-动作组${idx + 1} - 事件触发条件不满足，无法触发后续交互!`);
  }
  return validate;
};

/**
 * 筛选出被选择组件所依赖的变量
 * @param {变量组组} dataStore
 * @param {组} comListStr
 * @returns 筛选出依赖变量组
 */
export const filterDataStore = (dataStore, comListStr) => {
  const copyDataStore = JSON.parse(JSON.stringify(dataStore));
  return copyDataStore
    .map((group) => {
      for (let index = group.children.length - 1; index >= 0; index--) {
        const variable = group.children[index];
        if (!comListStr.includes(variable.key)) {
          group.children.splice(index, 1);
        }
      }
      return group;
    })
    .filter((group) => group.children.length > 0);
};

/**
 * 筛选出有数据请求操作的组件
 * @param {变量组组} dataStore
 * @param {组} comList
 * @returns 接口集合
 */
export const filterRelatedApi = (comList) => {
  const list = window.DataI().pushStack(comList).find('dataQuery').toArray();
  const apis = [];
  list.forEach((com) => {
    com.eventSetings?.forEach((event) => {
      event.actions?.forEach((action) => {
        if (
          action.actionType === 'dataQuery' &&
          apis.findIndex((api) => api.id === action.actionSettings.apiInfo.id) === -1
        ) {
          apis.push(action.actionSettings.apiInfo);
        }
      });
    });
  });
  return apis;
};

/**
 * 根据传入的树形结构，找到目标id的路径
 * @param {Array} tree 树形结构
 * @param {string} targetId 目标id
 */
export const findPath = (tree, targetId) => {
  function traverse(node, path = []) {
    // 如果没有子节点且id匹配，或者子节点遍历完毕且id匹配（后者其实不会发生，因为id匹配会立即返回），返回路径
    const children = node.children || node.childComList || [];
    if (!children || node.key === targetId) {
      return node.key === targetId ? path.concat(node.name || node.compName).join('/') : null;
    }
    // 否则，遍历子节点
    for (let child of children) {
      const result = traverse(child, [...path, node.name || node.compName]); // 将当前节点名添加到路径中
      if (result) return result;
    }
    return null;
  }
  // 遍历每个可能的根节点
  for (let root of tree) {
    const result = traverse(root, []);
    if (result) return result;
  }

  return null;
};
