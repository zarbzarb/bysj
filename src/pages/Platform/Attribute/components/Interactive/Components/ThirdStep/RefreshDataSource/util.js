import CompatibleTool from '@/pages/Platform/DataSource/Compatible';
import fetch from '@/services/xhr/fetch';
import { getMapData } from '@/pages/Preview/Render/gisCommon';
// 通过映射字段无法归为统一类型处理的组件
const dataiComps = new Set(['MediaImageBasic', 'MediaImageDynamic']);
/**
 *  增加图表组件默认是没有 dynamic 字段的，有些情况需要手动加上
 * @param {Object} config
 */
const compatibleChartDynamic = (config, CompInstance, comp) => {
  // 数据为动态数据
  if (!config.dynamic) {
    if (CompatibleTool.isXYSChart(CompInstance.config)) {
      // 默认的系列数
      const series =
        CompInstance.compAttr.series || CompInstance.compAttr.dataSeries || CompInstance.compAttr.markLineData || [];
      const configDynamic = {
        apis: [], // 选择过的api列表
        seriesType: 1, // 系列类型，默认1，2的时候使用dataMap2和dimensionMap2
        dataMap: [
          {
            key: 'x',
            name: 'x轴',
          },
          ...series.map((ser, idx) => {
            return {
              key: `series${idx}`,
              name: `系列${idx + 1}`,
            };
          }),
        ],
        dimensionMap: [
          {
            dataMapKey: 'x',
            col: 'x',
            row: [],
          },
          ...series.map((ser, idx) => {
            return {
              dataMapKey: `series${idx}`,
              col: `series${idx}`,
              row: [],
            };
          }),
        ],
        dataMap2: [
          {
            key: 'x',
            name: 'x轴',
          },
          {
            key: 's',
            name: '系列',
          },
          {
            key: 'y',
            name: '值',
          },
        ],
        dimensionMap2: [
          {
            dataMapKey: 'x',
            col: 'x',
            row: [],
          },
          {
            dataMapKey: 's',
            col: 's',
            row: [],
          },
          {
            dataMapKey: 'y',
            col: 'y',
            row: [],
          },
        ],
        reserved: [
          {
            key: 'data-key',
            col: 'x',
            row: [],
            name: '保留值',
          },
        ],
        source: {
          id: '',
          params: [],
          repeat: {
            on: false,
            intervalTime: 60,
          },
        },
      };
      if (!config.dynamic) {
        config.dynamic = { ...configDynamic };
      }
      // v7.11 新增“指标接口”配置
      if (!config.indicator) {
        config.indicator = { ...configDynamic };
      }
    } else if (CompatibleTool.isNVChart(CompInstance.config) && !dataiComps.has(comp.englishName)) {
      const configDynamic = {
        apis: [], // 选择过的api列表
        dataMap: [
          {
            key: 'x',
            name: '系列',
          },
          {
            key: 'series0',
            name: '值',
          },
        ],
        dimensionMap: [
          {
            dataMapKey: 'x',
            col: 'x',
            row: [],
          },
          {
            dataMapKey: 'series0',
            col: 'series0',
            row: [],
          },
        ],
        reserved: [
          {
            key: 'data-key',
            col: 'x',
            row: [],
            name: '保留值',
          },
        ],
        source: {
          id: '',
          params: [],
          repeat: {
            on: false,
            intervalTime: 60,
          },
        },
      };
      if (!config.dynamic) {
        config.dynamic = { ...configDynamic };
      }
      // v7.11 新增“指标接口”配置
      if (!config.indicator) {
        config.indicator = { ...configDynamic };
      }
    } else {
      // config.dynamic = {
      //   apis: [], //选择过的api列表
      //   dataMap: [
      //     // {
      //     //   key: 'x',
      //     //   name: '系列'
      //     // },
      //     // {
      //     //   key: 'series0',
      //     //   name: '值'
      //     // }
      //   ],
      //   dimensionMap: [
      //     // {
      //     //   dataMapKey: 'x',
      //     //   col: 'x',
      //     //   row: []
      //     // },
      //     // {
      //     //   dataMapKey: 'series0',
      //     //   col: 'series0',
      //     //   row: []
      //     // }
      //   ],
      //   reserved: [
      //     {
      //       key: 'data-key',
      //       col: 'x',
      //       row: [0, 1, 2, 3, 4, 5],
      //       name: '保留值'
      //     }
      //   ],
      //   source: {
      //     id: '',
      //     params: [],
      //     repeat: {
      //       on: false,
      //       intervalTime: 1000
      //     }
      //   }
      // };
    }
  }
};

const getMapOptions = async ({ mapKey, layerCode = [], layerCodeSw, dataParams }, comp, action) => {
  // layerCodeSw 是否是默认的还是数据驱动
  let code = layerCode,
    data = [];

  if (layerCodeSw == 1 || layerCodeSw == 'default') {
    //兼容业务图层
    let type = JSON.stringify(layerCode).includes('#');
    layerCode = type ? [layerCode[0].split('#')[1]] : [layerCode[0]];
  }
  if (layerCodeSw == 2 || layerCodeSw == 'varible') {
    //全局查询 layerCodes 周边查询 layerCodeLocal
    let layerCodeObj = getMapData({ action, comp }, dataParams);
    layerCode = layerCodeObj['layerCodes'] || layerCodeObj['layerCodeLocal'];
  }
  console.log(layerCode, '---------');
  let mapCom = DataI.getComList(mapKey);
  let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
  foundationPlan?.layers?.forEach((v) => {
    if (layerCode.includes(v.key)) {
      code = v.instance.compAttr.relation_layer_code;
    }
  });
  if (!code) return;
  data = await fetch.get(`/api/gis/api/field/listFields?layerCode=${code}&needIdGeom=false`);
  data = data && data.data.map(({ name }) => ({ label: name, value: name }));
  data.unshift({ label: 'all', value: 'all' });
  return data;
};

export { compatibleChartDynamic, getMapOptions };
