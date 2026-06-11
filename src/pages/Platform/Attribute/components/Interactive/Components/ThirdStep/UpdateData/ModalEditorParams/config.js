import CompatibleTool from '@/pages/Platform/DataSource/Compatible';

/**
 *
 * @param {*} v 当前的实例
 * @param {*} selectedDynamic 选中的组件
 * @param {*} updateType 数据来源
 * @returns 请选择组件的数据下拉框
 */
export const optionsFn = (v, selectedDynamic, updateType) => {
  let options = [];
  if (v.instance) {
    const { compAttr, config } = v.instance;
    const { _source, dynamic, indicator, _seriesType, _api, _dataMap } = config;
    if (CompatibleTool.isXYSChart(config)) {
      options.push({ label: 'x轴', value: 'x' });
      /**
       * 不同于其他的xys datai 组件
       * 散点图(ChartScatter): compattr没有seriesname
       * 区域折线图(ChartAreaBroken): compAttr没有series
       * 基本气泡图(ChartBabel)：数据格式为xysr格式
       */

      if (v.englishName === 'ChartBabel' && _source !== 'json') {
        options = dynamic.dataMap.map((temp) => ({
          label: temp.name,
          value: temp.key,
        }));
        return options;
      }

      /** x，y，s的数据格式 */
      if (_source === 'dynamic' && dynamic.seriesType === 1) {
        // 动态系列动态开关按钮关闭
        dynamic.dataMap.forEach((temp) => {
          if (temp.key !== 'x') {
            options.push({
              label: temp.name,
              value: temp.key,
            });
          }
        });
      } else if (_source === 'indicator' && indicator.seriesType === 1) {
        // 指标系列动态开关按钮关闭
        indicator.dimensionMap.forEach((temp, index) => {
          if (temp.dataMapKey !== 'x') {
            options.push({
              label: `系列${index}`,
              value: temp.dataMapKey,
            });
          }
        });
      } else if (updateType === 4) {
        // 交互传入值，只有x轴、系列1、系列2...
        compAttr.series.forEach((s, i) => {
          options.push({
            label: `系列${i + 1}`,
            value: s.serieName || s.name,
          });
        });
      } else {
        const list = _seriesType === 2 ? _api : _dataMap;
        options = list.map((temp) => {
          return {
            label: temp.name,
            value: temp.mapField,
          };
        });
      }
    } else {
      options = dynamic.dataMap.map((temp) => ({
        label: temp.name,
        value: temp.key,
      }));
    }
  } else {
    options =
      v.dataset.category === 'json' && v.dataset._api
        ? v.dataset._api.map((temp) => ({
            label: temp.name,
            value: temp.mapField,
          }))
        : selectedDynamic.dataMap.map((d) => ({
            label: d.name,
            value: d.key,
          }));
  }

  return options;
};
