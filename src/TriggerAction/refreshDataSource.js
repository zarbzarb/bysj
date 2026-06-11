import { getComponent } from '@/utils/componentUtils';
import { getDataByKey } from '@/utils/dataStoreUtils';
import {
  dataiComps,
  getChangeValue,
  passCurrentValueComps,
  getDataset,
  getCategory,
  compDataOptionValue,
} from '@/utils/common';
import { cloneDeep, isPlainObject } from 'lodash';

// 通过映射字段无法归为统一类型处理的组件
// const dataiComps = new Set(['MediaImageBasic', 'MediaImageDynamic']);

export default (action, settings) => {
  // console.log('settings==>', settings);
  if (window.DataI.isConfigPage()) {
    return;
  }
  const { compKey, dataParams } = action.actionSettings;
  // eslint-disable-next-line prefer-const
  let { item, config: screenConfig, el } = settings; // item 是绑定该交互的当前组件
  if (el) {
    // 点击系列、点击图例
    item = el;
  }

  const getComp = (key) => {
    return window.comList && key ? window.comList.get(key) : getComponent(key, window.layerList);
  };

  const triggerComp = getComp(compKey); // 触发对象组件

  if (!triggerComp) return;

  // 给参数赋值
  const setParamValue = (paramType, paramItemId, val, dataset) => {
    if (val === undefined) val = '';
    const { headers, params } = dataset.dynamic.interactDynamicParams;
    let arr = [];
    paramType === 'header' ? (arr = headers) : (arr = params);
    arr.forEach((h) => {
      if ((h.id && h.id === paramItemId) || (!h.id && h.name === paramItemId)) {
        const _val = typeof val === 'object' ? JSON.stringify(val) : val;
        // if (h.hasOwnProperty('value')) {   // 有些接口没有 value， example 字段去掉这个判断算了
        h.value = _val;
        // }
        // if (h.hasOwnProperty('example')) {
        h.example = _val;
        // }
      }
    });
  };

  // 解析参数
  const parseParams = (dataset) => {
    const arr = dataset.dynamic.interactDynamicParams.params.filter((p) => p.paramType !== 'header');
    dataset.dynamic.interactDynamicParams.params = arr; // 过滤非 header 参数，接口传参取的这里
    dataParams.forEach((param) => {
      if (param.paramItemId) {
        /**
         * v8.5.1 编辑参数 新增是否选中值isSelected
         * paramType
         * paramItemId
         * compDataItem 组件数据
         * isSelected 是否选中值
         */
        const { paramType, paramItemId, compDataItem, inputVal, isSelected = 1, dataSwitch, dataSwitchContent } = param;
        if (param.updateType === 1) {
          // 手动输入
          let newVal = [];
          newVal =
            inputVal && inputVal.startsWith('[') && inputVal.endsWith(']')
              ? inputVal.replace(/\[|]/g, '').split(',')
              : inputVal;
          setParamValue(paramType, paramItemId, newVal, dataset);
        } else if (param.updateType === 2) {
          if (!compDataItem) {
            setParamValue(paramType, paramItemId, '', dataset);
            return;
          }
          const selectedComp = getComp(param.compKey);
          if (
            selectedComp.type === 'Input' ||
            selectedComp.type === 'NewInput' ||
            (passCurrentValueComps.has(selectedComp.type) && isSelected === 1)
          ) {
            // v8.5.1 选中值组件读取选中值
            const val = getChangeValue(selectedComp, 2, compDataItem, action);
            setParamValue(paramType, paramItemId, val, dataset);
          } else {
            // 数据项
            const val = compDataOptionValue(param.compKey, compDataItem, item, dataSwitch, dataSwitchContent);
            // console.log('val', val);
            setParamValue(paramType, paramItemId, val, dataset);
            // let val;
            // const dataset2 = getDataset(selectedComp);
            // const { classType } = selectedComp;
            // const category = getCategory(dataset2, classType);
            // let pureData = getCompPureData(selectedComp);
            // console.log('pureData', pureData);
            // if (selectedComp.isCustomListChild && category === 'dynamic') {
            //   // 如果选择的组件是自定义列表的子组件，并且数据源是“父组件数据”，它的数据应该取 dataFromParent
            //   // const { groupKey, key } = item;
            //   // const customListComp = getComp(groupKey);
            //   // const rowIndex = Number(key.split('_')[1]);
            //   // const customListData = getCompPureData(customListComp);
            //   // console.log({ customListData }, { rowIndex });
            //   // const dataFromParent = [customListData[rowIndex]];
            //   const { dataFromParent } = getDataset(item).dynamic;
            //   const { dimensionMap } = dataset2.dynamic;
            //   console.log({ dataFromParent }, { dimensionMap });
            //   pureData = CompatibleTool.dataFieldMapArrayObject(dimensionMap, dataFromParent);
            // }
            // if (classType === 'antd') {
            //   if (Array.isArray(pureData)) {
            //     // v8.5.1 获取对应数据源映射，数组长度为1时，默认取序号0值
            //     // if (pureData[0]) val = pureData[0][compDataItem];
            //     val = pureData.map((temp) => temp[compDataItem]);
            //     val = val.length === 1 ? val[0] : val;
            //   } else if (param.dataSwitch > 0) {
            //     // 数据格式转换
            //     const result = parseCode(param.dataSwitchContent.code, pureData);
            //     if (Array.isArray(result)) {
            //       val = result.map((temp) => temp[compDataItem]);
            //       val = val.length === 1 ? val[0] : val;
            //     }
            //     // if (Array.isArray(result) && result[0]) val = result[0][compDataItem];
            //   } else {
            //     val = pureData;
            //   }
            //   // v8.5.1 新增默认数据特殊处理
            //   if (
            //     selectedComp.type === 'Input' ||
            //     selectedComp.type === 'NewInput' ||
            //     selectedComp.type === 'TreeList' ||
            //     selectedComp.type === 'TreeSelect'
            //   ) {
            //     val = pureData;
            //   } else if (selectedComp.type === 'DatePicker') {
            //     // 时间选择器
            //     if (selectedComp.props.isRangePicker) {
            //       val = compDataItem === 'startTime' ? val[0] : val[1];
            //     }
            //     val = pureData;
            //   }
            // } else if (classType === 'com') {
            //   if (CompatibleTool.isXYSChart(dataset2)) {
            //     // x/y/s兼容格式数据
            //     const { _seriesType = 2, _source, dynamic, indicator } = selectedComp.instance?.config;
            //     // if里面是赋值给系列的，所以从对应的系列取值，else是把x，y，s中的某一项全部覆盖
            //     if (
            //       (_source === 'dynamic' && dynamic.seriesType === 1) ||
            //       (_source === 'indicator' && indicator.seriesType === 1) ||
            //       (_source === 'json' && _seriesType !== 2) ||
            //       selectedComp.englishName === 'ChartBabel'
            //     ) {
            //       // x/y/s兼容格式数据
            //       const obj = chartToParams(pureData, 'x', 'y', 's');
            //       console.log(obj, 'obj', compDataItem);
            //       val = Array.isArray(obj[compDataItem]) ? [...new Set(obj[compDataItem])] : obj[compDataItem];
            //       if (['ChartScatter', 'ChartAreaBroken'].includes(selectedComp.englishName)) {
            //         // 区域折线图
            //         val = obj[compDataItem];
            //       }
            //     } else {
            //       val = pureData.map((temp) => temp[compDataItem]);
            //     }
            //   } else if (CompatibleTool.isNVChart(dataset2) && !dataiComps.has(selectedComp.englishName)) {
            //     // name/value兼容格式数据
            //     const obj = getNVChartObj(pureData);
            //     const key = compDataItem === 'x' ? 'name' : 'value';
            //     val = obj[key];
            //   } else if (
            //     dataset2._data?.[0] &&
            //     dataset2._data?.every((it) => Array.isArray(it)) // 二维数组
            //   ) {
            //     // 嵌套环形图
            //     const ringObj = getNVChartObj(pureData[0]);
            //     const pieObj = getNVChartObj(pureData[1]);
            //     const obj = {
            //       ringName: ringObj.name,
            //       pieName: pieObj.name,
            //       series0: pieObj.value,
            //       series1: ringObj.value,
            //     };
            //     val = obj[compDataItem];
            //   } else if (CompatibleTool.isPolarChart(dataset2)) {
            //     // 极坐标
            //     const obj = chartToParams(pureData, 'angle', 'r', 's');
            //     if (compDataItem === 'x') {
            //       val = obj.angle;
            //     } else if (category === 'dynamic' || category === 'indicator') {
            //       val = obj[compDataItem];
            //     } else {
            //       const keys = Object.keys(obj);
            //       const i = dataset2.dynamic.dataMap.findIndex((s) => s.key === compDataItem);
            //       val = obj[keys[i]];
            //     }
            //   } else if (CompatibleTool.isRadarChart(dataset2)) {
            //     // 雷达图
            //     const obj = chartToParams(pureData, 'field', 'rate', 's');
            //     if (compDataItem === 'x') {
            //       val = obj.field;
            //     } else if (category === 'dynamic' || category === 'indicator') {
            //       val = obj[compDataItem];
            //     } else {
            //       const key = getChartSeriesKey(
            //         compDataItem,
            //         dataset2.dynamic.dataMap,
            //         selectedComp.instance.compAttr.series,
            //         'field',
            //       );
            //       val = obj[key];
            //     }
            //   } else {
            //     // 数组对象类型(ArrayObject): 新旧数据结构一致、映射字段一致
            //     val = pureData[0][compDataItem];
            //   }
            // }
          }
        } else if (param.updateType === 3) {
          // 变量
          if (!param.variableKey) {
            setParamValue(paramType, paramItemId, '', dataset);
          } else {
            const val = getDataByKey(param.variableKey);
            setParamValue(paramType, paramItemId, val, dataset);
          }
        } else if (param.updateType === 4) {
          // 交互传入值
          if (!param.interactDataItem || !item) {
            setParamValue(paramType, paramItemId, '', dataset);
          } else {
            const val = getChangeValue(item, 4, param.interactDataItem, action);
            setParamValue(paramType, paramItemId, val, dataset);
          }
        }
      }
    });
  };

  const dataset = getDataset(triggerComp);
  if (dataset) {
    if (!dataset.dynamic.interactDynamicParams) {
      // 参数拷贝，刷新数据源基于这个修改，不要覆盖原有的否则会和自动刷新请求参数冲突
      const category = getCategory(dataset, triggerComp.classType);
      if (category !== 'dynamic' && category !== 'indicator') return;
      const dynamic = dataset[category];
      if (dynamic) {
        // TODO 8.0 dynamicApis
        const apis = (screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
        const currentApi = apis.find((api) => api.id === dynamic.source.id);
        dataset.dynamic.interactDynamicParams = {
          headers: currentApi ? cloneDeep(currentApi.headers) : [],
          params: cloneDeep(dynamic.source.params),
        };
      }
    }
    // 解析参数并赋值
    parseParams(dataset);
    if (['antd', 'customComp'].indexOf(triggerComp.classType) > -1) {
      // 为了useComponentDataSource里的 useEffect 能触发, 需要重新赋值一下！
      dataset.dynamic = { ...dataset.dynamic };
      typeof triggerComp.refresh === 'function' && triggerComp.refresh();
    } else if (triggerComp.classType === 'com') {
      if (dataiComps.has(triggerComp.englishName)) {
        triggerComp.instance.dataRequest(
          dataset,
          (data) => {
            triggerComp.instance.setData(data);
          },
          true,
        );
      } else {
        triggerComp.instance.dataRequest(dataset);
      }
    }
  }
};
