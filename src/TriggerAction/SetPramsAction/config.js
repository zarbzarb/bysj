import { getComponent } from '@/utils/componentUtils';
import { babelTransform2 } from '@/utils/utils';

// 通过映射字段无法归为统一类型处理的组件,分别为  图片组件、URL图片
export const dataiComps = new Set(['MediaImageBasic', 'MediaImageDynamic']);

export const getComp = (key) => {
  return window.comList && key ? window.comList.get(key) : getComponent(key, window.layerList);
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

// 将普通格式的数据，转换为 xys 格式的数据
export const normalDataToXYS = (data, xMapField = 'x') => {
  const res = [];
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'x' && key !== xMapField) {
        const x = item[xMapField] || item.x || '';
        res.push({ x, s: key, y: item[key] });
      }
    });
  });
  return res;
};

// 静态数据动态系列的展示
export const xysDataDispose = (paramType, val, dataset, triggerComp) => {
  const isHavaX = Object.keys(dataset._data[0]).includes('x');
  const result = dataset._data.reduce(
    ([current, res], temp) => {
      let findIndex = current.indexOf(isHavaX ? temp.x : temp[paramType]);
      if (findIndex === -1) {
        current.push(temp[paramType]);
        findIndex = current.length - 1;
      }

      const format = { ...temp, [paramType]: val[findIndex] };
      res.push(format);
      return [current, res];
    },
    [[], []],
  );
  // 对于echarts图表，如果有x轴，并且x轴没数据，则过滤掉
  const res = isHavaX ? result[1].filter((temp) => temp.x || temp.x === 0) : result[1];
  dataset._data = res;
  triggerComp.instance.config._data = res;
  triggerComp.instance._data = res;
};

// 静态数据动态系列关闭的开关操作
export const xysDataDispose1 = (paramType, val, dataset, triggerComp) => {
  const map = new Map(); // 用map存数据，是因为map存的对象的key顺序不会变，而object顺序会被改变
  const newArr = [];
  let result = [];

  dataset._data.forEach((temp) => {
    map.set(temp.x, map.get(temp.x) ? { ...map.get(temp.x), [temp.s]: temp.y } : { x: temp.x, [temp.s]: temp.y });
  });

  let i = -1;
  for (const value of map.values()) {
    i += 1;
    newArr.push({ ...value, [paramType]: val[i] });
  }
  result = normalDataToXYS(newArr).filter((temp) => temp.x);
  dataset._data = result;
  triggerComp.instance.config._data = result;
  triggerComp.instance._data = result;
};

// 静态数据动态系列关闭的开关操作：替换数组对象中的某一个key的全部。比如全部替换x，或者y，或者s
export const replaceKeyDataDispose = (paramType, val, dataset, triggerComp) => {
  // 触发对象的映射字段
  const triggerKeys = new Set(dataset._api.map((item) => item.mapField));

  if (dataset._data.length < val.length) {
    const len = val.length - dataset._data.length;
    for (let i = 0; i < len; i++) {
      dataset._data.push({});
    }
  }

  const result = dataset._data.map((temp, index) => {
    return {
      ...temp,
      [paramType]: val[index],
    };
  });

  const res = result.filter((item) => {
    let isBool = false;
    for (const i in item) {
      if (triggerKeys.has(i) && (item[i] || item[i] === 0)) {
        isBool = true;
        break;
      }
    }
    return isBool;
  });

  dataset._data = res;
  triggerComp.instance.config._data = res;
  triggerComp.instance._data = res;
};

export const antdDataDispose = (paramType, val, dataset, triggerComp) => {
  const defaultValues = dataset.defaultValue;

  // 触发对象的映射字段
  let triggerKeys = [];

  triggerKeys = dataset._api
    ? new Set(dataset._api.map((item) => item.mapField))
    : new Set(dataset.dynamic.dataMap.map((item) => item.key));

  // 当触发组件长度小于数据来源组件长度，那么需要补充默认值
  if (defaultValues.length < val.length) {
    const len = val.length - defaultValues.length;
    for (let i = 0; i < len; i++) {
      defaultValues.push({});
    }
  }

  const result = defaultValues.map((temp, index) => {
    return {
      ...temp,
      [paramType]: val.length > 0 ? (typeof val[index] === 'object' ? JSON.stringify(val[index]) : val[index]) : '',
    };
  });

  // 过滤掉空值
  const res = result.filter((item) => {
    let isBool = false;
    for (const i in item) {
      if (triggerKeys.has(i) && (item[i] || item[i] === 0)) {
        isBool = true;
        break;
      }
    }
    return isBool;
  });

  if (triggerComp.type === 'LayerLegend') {
    triggerComp.props.dataSourceSet.defaultValue = res;
  } else {
    triggerComp.dataset.defaultValue = res;
  }
};

export const TableMap = (comp) => {
  const map = {};

  const { dataMap } = comp.dataset.dynamic;
  const { columns } = comp.props;

  dataMap.forEach((item, index) => {
    map[item.key] = columns[index].dataIndex;
    map[columns[index].dataIndex] = item.key;
  });
  return map;
};

/**
 * compDataItem 和 selectedComp 只有来源组件为表格的时候才传，这个组件特殊，要单独处理
 * @param {*} compDataItem 表格组件的选中的key
 * @param {*} selectedComp 表格组件的实例
 */
export const TableDataDispose = (paramType, val, dataset, triggerComp, compDataItem, selectedComp) => {
  let result = [];
  let values = [];
  const map = TableMap(triggerComp);
  const { columns } = triggerComp.props;

  // 如果传递的数据格式不是col，则反转一下
  if (columns.map((item) => item.dataIndex).includes(paramType)) {
    paramType = map[paramType];
  }
  // 当来源组件为table，并且为静态数据时，取来源组件的_data
  values =
    selectedComp && selectedComp.type === 'Table' && selectedComp.dataset.category === 'json'
      ? selectedComp.dataset._data.map((item) => item[map[compDataItem]])
      : val;

  result = dataset.defaultValue.map((temp, index) => ({
    ...temp,
    [map[paramType]]: values[index],
  }));
  triggerComp.dataset.defaultValue = result;
};

// 嵌套环形图
export const chartNestDataDispose = (paramType, val, dataset, triggerComp) => {
  /**
   * pieName: 饼状图名称
   * ringName: 环形图名称
   * series0: 饼状图数值
   * series1: 环形图数值
   * 饼状图对应的数据是data[1]，环形图对应的数据data[0]
   */
  let key = 0;
  let result = [];
  const type = ['pieName', 'ringName'].includes(paramType) ? 'name' : 'value';
  if (['pieName', 'series0'].includes(paramType)) {
    key = 1;
  }
  result = dataset._data[key].map((temp, index) => ({
    ...temp,
    [type]: val[index],
  }));
  triggerComp.instance.config._data[key] = result;
};

const refresh = (c) => (c.classType === 'com' ? c?.instance?.render?.() : c?.refresh?.());

export const render = (triggerComp, dataset) => {
  if (!triggerComp?.isCustomListChild) {
    refresh(triggerComp);

    return;
  }

  getComp(triggerComp.parentKey)
    ?.customListInsArr?.filter(({ key }) => key.includes(triggerComp.key))
    ?.forEach?.(refresh);

  // 为了useComponentDataSource里的 useEffect 能触发, 需要重新赋值一下！
  if (dataset) dataset.dynamic = { ...dataset.dynamic };
};
