import { setStoreData } from '@/utils/dataStoreUtils';
import TriggerAction from '@/TriggerAction';
import $ from 'jquery';
import { getComponent, listenSubLayerVariable } from './componentUtils';
import { eventInterceptors, getDataiBasicChartType } from './common';

function getChartClickIndex({ event, chartIns }) {
  let dataIndex;
  const { offsetX, offsetY, target } = event || {};
  if (!target) {
    return dataIndex;
  }
  const curOption = chartIns.getOption();
  const ecInnerKey = Object.keys(target).find((itemKey) => itemKey.includes('__ec_inner_'));
  const ecInnerObj = target[ecInnerKey] || {};
  const pointInPixel = [offsetX, offsetY];
  // const gridIndexArr = [...new Array(curOption?.grid?.length || 0).keys()];
  const gridIndexArr = Array.from({ length: curOption?.grid?.length || 0 }, (_, index) => index);

  if (chartIns.containPixel({ gridIndex: gridIndexArr }, pointInPixel)) {
    const convertParams = {};
    if (ecInnerObj.seriesIndex !== undefined) {
      convertParams.seriesIndex = ecInnerObj.seriesIndex;
    }
    dataIndex = chartIns.convertFromPixel(convertParams, pointInPixel);
  }
  return dataIndex;
}
function parseChartClickValue({ dataIndex, chartIns, isBarChart, isChartColumnContrastHistogram }) {
  let dataVals;
  const preOption = chartIns.getOption();
  const { dataset, series, xAxis, yAxis } = preOption;
  if (!Array.isArray(dataIndex)) {
    return dataVals;
  }

  const xIndex = isBarChart ? dataIndex[1] : dataIndex[0];
  if (Array.isArray(dataset)) {
    const dataSource = dataset[0].source;
    // 时间轴
    if (xAxis[0].type === 'time') {
      const xValTmp = Number.parseInt(xIndex);
      let minVal = xValTmp;
      dataSource.forEach((item) => {
        const val = Math.abs(new Date(item[0]).getTime() - xValTmp);
        dataVals = item;
        if (val <= minVal) {
          minVal = val;
          dataVals = item;
        }
      });
    } else {
      dataVals = dataSource[xIndex];
    }
    return dataVals;
  }

  const xVal = isBarChart ? '' : xAxis[0].data[xIndex];
  const yVal = [];
  series.forEach((item) => {
    if (isChartColumnContrastHistogram) {
      // v8.1 单击系列取值，如果data有其他值，只取value
      const curData = item.data[xIndex];
      yVal.push(curData?.value ? curData.value : curData);
    } else {
      const curData = item.data[xIndex];
      yVal.push(curData?.value ? curData.value : curData); // v8.4: 基础条形图也会存在 value 情况
    }
  });
  dataVals = [xVal, ...yVal];
  return dataVals;
}

export const clickSeriesCb = ({ clickSeriesEvent, compItem, clickChartData, rowIndex } = {}) => {
  if (!clickSeriesEvent) return;

  clickSeriesEvent.groups?.forEach((ag, agIdx) => {
    const validate = eventInterceptors(clickSeriesEvent, ag, agIdx);
    if (!validate) return;
    // v8.5.0 如果单击系列选择了变量，则单击系列时将当前系列数据写入变量
    clickSeriesEvent.singleValue = clickChartData;
    clickSeriesEvent.rowIndex = rowIndex;
    if (ag.variable) {
      setStoreData(ag.variable, clickChartData); // 更新全局存储的变量数据
    }

    ag.actions?.forEach((action) => {
      TriggerAction(action, {
        item: compItem,
        events: [clickSeriesEvent],
        config: {},
        actions: ag.actions || [],
      });
    });
  });
};

const cancleLengend = (opts = {}) => {
  const { selected, chartIns } = opts;
  const legend = [];
  for (const name in selected) {
    if (Object.prototype.hasOwnProperty.call(selected, name)) {
      legend.push({ name });
    }
  }
  chartIns.dispatchAction({
    type: 'legendSelect',
    batch: legend,
  });
};

export const clickLegendCb = ({ selected, compItem, clickLegendEvent } = {}) => {
  if (!clickLegendEvent) return;

  clickLegendEvent.groups?.forEach((ag, agIdx) => {
    const validate = eventInterceptors(clickLegendEvent, ag, agIdx);
    if (!validate) return;
    // v8.5.0 如果单击图例选择了变量，则单击系列时将当前图例数据写入变量
    clickLegendEvent.singleValue = selected;
    if (ag.variable) {
      setStoreData(ag.variable, selected); // 更新全局存储的变量数据
    }
    ag.actions?.forEach((action) => {
      TriggerAction(action, {
        item: compItem,
        events: [clickLegendEvent],
        config: {},
        actions: ag.actions || [],
      });
    });
  });
};

// 单击报表系列、图例事件
export const dispatchEchartsEvent = (opts = {}) => {
  const { item: compItem, instance } = opts;
  const { isLineChart, isBarChart, isColoumnChart, isPieChart } = getDataiBasicChartType({
    englishName: compItem.englishName,
  });
  const isChartColumnContrastHistogram = compItem.englishName === 'ChartColumnContrastHistogram';

  const chartIns = instance.chart;
  let clickChartData;
  // todo ChartRankingList、ChartBarAreaMap非echarts组件
  if (!chartIns) {
    return;
  }
  const clickSeriesEvent = compItem.eventSetings?.find((item) => item.eventType === 'clickSeries');
  const clickLegendEvent = compItem.eventSetings?.find((item) => item.eventType === 'clickLegend');

  const is3dColoumnChart = compItem.englishName === 'ChartColumn3D';
  const isTreeMapChart = compItem.englishName === 'ChartTreemap';

  if (!clickSeriesEvent && !clickLegendEvent) return;

  if (compItem.englishName === 'Sankey')
    chartIns?.on('click', ({ dataType, data }) => {
      if (dataType !== 'edge') return;

      const { source, target, value } = data ?? {};

      console.log('=============>', { sourceId: source, targetId: target, value });

      clickSeriesCb({ clickSeriesEvent, compItem, clickChartData: { sourceId: source, targetId: target, value } });
    });

  if (is3dColoumnChart || isLineChart || isBarChart || isColoumnChart) {
    chartIns?.on('click', (params) => {
      if (params.componentType === 'series') {
        clickChartData = {
          x: compItem.instance?.config?._data?.[params.value[0]].x,
          [params.seriesName]: params.value[2],
        };
        clickSeriesCb({ clickSeriesEvent, compItem, clickChartData });
      }
    });
  }

  if (isLineChart || isBarChart || isColoumnChart) {
    chartIns?.getZr()?.on('click', (event) => {
      const dataIndex = getChartClickIndex({ event, chartIns });
      if (!dataIndex) {
        return;
      }
      clickChartData = parseChartClickValue({
        dataIndex,
        chartIns,
        isBarChart,
        isChartColumnContrastHistogram,
      });
      clickSeriesCb({ clickSeriesEvent, compItem, clickChartData });
      // console.log('clickSeriesEvent***dataIndex*', dataIndex, clickChartData);
    });
  }

  if (isPieChart) {
    chartIns.on('click', (params) => {
      // console.log('dispatchEchartsEvent***params***', params);
      clickChartData = params.data;
      const rowIndex = params.dataIndex;
      clickSeriesCb({ clickSeriesEvent, compItem, clickChartData, rowIndex });
    });
  }

  if (isTreeMapChart) {
    chartIns.on('click', (params) => {
      console.log('isTreeMapChart****dispatchEchartsEvent***params***', params);
      if (params.dataType === 'main') {
        clickChartData = params.data;
        const rowIndex = params.dataIndex;
        clickSeriesCb({ clickSeriesEvent, compItem, clickChartData, rowIndex });
      }
    });
  }

  if (!clickLegendEvent) return;

  const oldOption = chartIns.getOption();

  const newOption = {
    animation: false,
  };

  chartIns.on('legendselectchanged', (params) => {
    chartIns.setOption(newOption, { notMerge: false });

    cancleLengend({ selected: params.selected, chartIns });
    clickLegendCb({ clickLegendEvent, compItem, selected: params.name });

    window.setTimeout(() => {
      chartIns.setOption(oldOption, { notMerge: false });
    }, 1);
  });
};

/**
 * 预览态地图子组件生成 instance
 * @param {*} item
 * @param {*} instance
 * @param {*} layers 动态加载地图子组件
 */
export const initInstance = (item, instance, layers, compType) => {
  const _layers = layers || item.layers;
  const EventEmitter = window.globalEventEmitter;
  item.instance = instance;
  item.cssStyle = { ...instance.shapeCss, ...item.cssStyle };
  // compCount && compCount();
  dispatchEchartsEvent({ item, instance });
  if (_layers) {
    const { iocStorageUrl } = window;
    _layers.forEach((vl, i) => {
      if (vl.createFlag === undefined) {
        const englishName = vl.englishName ? vl.englishName : vl.refComName;
        const index = window[englishName];
        vl.initCom = index;
        vl.CssPage = undefined;
        const map = item.instance._map;
        if (!Array.isArray(vl._config._data)) {
          try {
            vl._config._data = JSON.parse(vl._config._data);
            vl._config._initData = JSON.parse(vl._config._initData);
          } catch {
            vl._config._data = [];
            vl._config._initData = [];
          }
        }

        // eslint-disable-next-line new-cap
        vl._attr.layerKey = vl.key;
        if (compType === 'referenceMap') {
          vl._attr.zIndex = vl._attr.zIndex + 50; // 引用地图的子图层层级要比主页的高
        }
        vl.instance = new vl.initCom(undefined, vl._config, vl._attr, map, iocStorageUrl);
        if (vl.instance.bindClick) {
          vl.instance.bindClick(function () {
            vl.eventSetings &&
              vl.eventSetings.click.forEach((em, index) => {
                EventEmitter.emit(em.animateKey, em, index);
              });
          });
        }
        // compCount && compCount();

        listenSubLayerVariable(vl);
      } else if (vl.createFlag) {
        const englishName = vl.englishName ? vl.englishName : vl.refComName;
        const index = window[englishName];
        vl.initCom = index;
        vl.CssPage = undefined;
        const map = item.instance._map;
        if (!Array.isArray(vl._config._data)) {
          try {
            vl._config._data = JSON.parse(vl._config._data);
            vl._config._initData = JSON.parse(vl._config._initData);
          } catch {
            vl._config._data = [];
            vl._config._initData = [];
          }
        }

        // eslint-disable-next-line new-cap
        vl._attr.layerKey = vl.key;
        vl._attr.visible = !!(vl.showFlag || vl.showFlag === undefined);
        vl.instance = new vl.initCom(undefined, vl._config, vl._attr, map, iocStorageUrl);
        // vl.instance.hiddenState = true; // 底图子组件
        // vl.instance.mergeAttr({
        //   visible: false,
        // });
        vl.instance?.hide();
        if (vl.instance.bindClick) {
          vl.instance.bindClick(function () {
            vl.eventSetings &&
              vl.eventSetings.click.forEach((item, index) => {
                EventEmitter.emit(item.animateKey, item, index);
              });
          });
        }
        // compCount && compCount();

        listenSubLayerVariable(vl);
        if (vl.showFlag) {
          // vl.instance.hiddenState = false; // 底图子组件
          // vl.instance.mergeAttr({
          //   visible: true,
          // });
          vl.instance?.show();
        }
      }
    });
  }
};

export const formatPosition = (transform) => {
  let arr = [];
  arr = transform.indexOf(',') > 0 ? transform.split(',') : transform.split(' ');

  const pattern = /(-?\d+\.\d*)|(-?\d+)/;

  return arr.map((vl) => {
    return Number.parseFloat(pattern.test(vl) ? pattern.exec(vl)[0] : 0);
  });
};
export const syncTransformComp = (key, position) => {
  const comp = getComponent(key, window.layerList);
  const compPosition = formatPosition(comp.styles.transform);
  compPosition[0] += Number.parseInt(position.x);
  compPosition[1] += Number.parseInt(position.y);
  const transform = `translate(${compPosition[0]}px, ${compPosition[1]}px)`;
  const css = { transform };
  // comp.styles.transform = transform;
  $(`[data-key='${comp.key}']`).css(css);
  return transform;
};

export const setTransform = (dom, x, y) => {
  dom.style.transform = `translate(${x}px, ${y}px )`;
};

export const setCompTransform = (el, x, y) => {
  el.styles.transform = `translate(${x}px, ${y}px )`;
};

export const computedCompRect = (item) => {
  if (!item.styles) {
    return {
      position: 'absolute',
      width: '0px',
      height: '0px',
      transform: 'translate(0px, 0px)',
    };
  }

  return {
    position: 'absolute',
    width: item.styles.width,
    height: item.styles.height,
    transform: item.styles.transform,
  };
};

export const isMovedFn = (item, rect) => {
  const widthMove = item.cssStyle.width !== `${rect.width}px`;
  const heightMoved = item.cssStyle.height !== `${rect.height}px`;
  const transformMoved = item.cssStyle.transform !== rect.transform;
  return widthMove || heightMoved || transformMoved;
};

// 兼容低版本浏览器不支持的原生方法
export const compatibleNativeFun = () => {
  if (String.prototype.replaceAll === undefined) {
    // eslint-disable-next-line no-extend-native
    String.prototype.replaceAll = function (targetStr, newStr) {
      let sourceStr = this.valueOf();
      while (sourceStr.includes(targetStr)) {
        sourceStr = sourceStr.replace(targetStr, newStr);
      }
      return sourceStr;
    };
  }
  if (Promise.allSettled === undefined) {
    Promise.allSettled = function (arr) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
      const P = this;
      return new P(function (resolve, reject) {
        if (Object.prototype.toString.call(arr) !== '[object Array]') {
          return reject(
            new TypeError(`${typeof arr} ${arr} is not iterable(cannot read property Symbol(Symbol.iterator))`),
          );
        }
        const args = Array.prototype.slice.call(arr);
        if (args.length === 0) return resolve([]);
        let arrCount = args.length;

        function resolvePromise(index, value) {
          if (typeof value === 'object') {
            const { then } = value;
            if (typeof then === 'function') {
              then.call(
                value,
                function (val) {
                  args[index] = { status: 'fulfilled', value: val };
                  if (--arrCount === 0) {
                    resolve(args);
                  }
                },
                function (e) {
                  args[index] = { status: 'rejected', reason: e };
                  if (--arrCount === 0) {
                    resolve(args);
                  }
                },
              );
            }
          }
        }

        for (const [i, arg] of args.entries()) {
          resolvePromise(i, arg);
        }
      });
    };
  }
};
