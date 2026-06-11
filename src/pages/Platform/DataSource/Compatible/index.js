import { cloneDeep } from 'lodash';

const CompatibleTool = {
  // 兼容雷达图
  compatibleRadarChart(normaldata) {
    const compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            value: data[ser],
            field: data.x,
            rate: data[ser],
            sort: data[ser],
            s: ser,
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },

  // v8.14兼容矩形树图
  // compatibleTreemapChart(normaldata) {
  //   const compatibledata = [];
  //   const childStr = 'children';
  //   const treeMap = {};

  //   if (!Array.isArray(normaldata)) {
  //     return compatibledata;
  //   }

  //   // eslint-disable-next-line no-prototype-builtins
  //   const checkFieldFlag = normaldata.some((item) => !item.hasOwnProperty('id') || !item.hasOwnProperty('pid'));
  //   if (checkFieldFlag) {
  //     return normaldata;
  //   }

  //   // 清除之前的children
  //   // 将所有数据的id作为key键，添加到treeMap对象中
  //   normaldata.forEach((item) => {
  //     delete item[childStr];
  //     treeMap[item.id] = item;
  //   });

  //   // 遍历数据，修改数据层级
  //   normaldata.forEach((item) => {
  //     const parentId = item.pid;
  //     if (parentId) {
  //       // 找到父节点
  //       const parent = treeMap[parentId];
  //       if (parent) {
  //         // 添加子节点到父节点的 children 数组中
  //         if (!parent[childStr]) {
  //           parent[childStr] = [];
  //         }
  //         parent[childStr].push(item);
  //       } else {
  //         // 如果父节点不存在，将当前节点存储到compatibledata 中
  //         compatibledata.push(item);
  //       }
  //     } else {
  //       // 如果没有父节点将当前节点存储到compatibledata 中
  //       compatibledata.push(item);
  //     }
  //   });
  //   return compatibledata;
  // },

  // 兼容极坐标堆叠柱图
  compatiblePolarChart(normaldata) {
    const compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            angle: data.x,
            r: data[ser] - 0,
            s: ser,
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },
  // 兼容嵌套环形图二维数组
  // [{pieName: '火车', ringName: '飞机', series0: 180, series1: 1375}]
  // [[{name:'火车',value:180}],[{name:'飞机',value:1375]]
  compatibleDoubleDimensionalArray(normaldata) {
    // 内
    const pie = normaldata
      .map((data) => {
        return {
          name: data.pieName,
          value: data.series0,
        };
      })
      .filter((val) => val.name !== undefined && val.value !== undefined);

    // 外
    const ring = normaldata
      .map((data) => {
        return {
          name: data.ringName,
          value: data.series1,
        };
      })
      .filter((val) => val.name !== undefined && val.value !== undefined);

    return [ring, pie];
  },
  // [{x:'2016',series0:"60"},{x:'2017',series0:"80"}]==>[{name:'2017',value:'80'}]
  compatibleNVFn: (normaldata) => {
    const compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            name: data.x,
            value: data[ser],
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },
  // [{x:'2016',series0:"60",series1:"100"}]==>[{x:'2016',y:'60',s:'series0'},{x:'2016',y:'60',s:'series0'}]
  compatibleXYSFn: (normaldata) => {
    const compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        for (const data of normaldata) {
          if (data.x === undefined) continue; // 跳过无x轴的数据
          const mapData = {
            x: data.x,
            y: data[ser],
            s: ser,
          };
          compatibledata.push(mapData);
        }
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },

  /**
   * 过滤数据集
   * @param {object} _dimensionMap 属性字段映射关系
   * @param {array} dataSet       数据集
   * @returns
   */
  filterDataset(_dimensionMap, dataSet) {
    const result = [];
    if (dataSet.length === Number.POSITIVE_INFINITY) return result;
    for (const [rowIndex, rowData] of dataSet.entries()) {
      const allUnchecked = _dimensionMap.every((item) => item.row.includes(rowIndex));
      if (allUnchecked) continue; // 如果所有字段都取消勾选了这一行，则过滤掉这一行
      result.push(rowData);
    }
    return result;
  },

  /**
   * 映射成多个对象的数组
   * @param {object} _dimensionMap 属性字段映射关系
   * @param {array} dataSet       数据集
   * @param {boolean} needReplace   是否替换数据中的字段名
   * @param {boolean} keepAllField  是否保留所有字段
   * @returns
   */
  dataFieldMapArrayObject(_dimensionMap, dataSet, needReplace = true, keepAllField = false) {
    const result = [];
    if (dataSet.length === Number.POSITIVE_INFINITY) return result;
    for (const [rowIndex, rowData] of dataSet.entries()) {
      const allUnchecked = _dimensionMap.every((item) => item.row.includes(rowIndex));
      if (allUnchecked) continue; // 如果所有字段都取消勾选了这一行，则过滤掉这一行
      const obj = _dimensionMap.reduce((pre, cur) => {
        const field = needReplace ? cur.dataMapKey : cur.col;
        const unchecked = cur.row.includes(rowIndex);
        //  如果当前字段取消勾选了这一行，则值设置为 undefined
        pre[field] = unchecked ? undefined : rowData[cur.col];
        return pre;
      }, {});
      const record = keepAllField ? { ...rowData, ...obj } : obj;
      result.push(record);
    }
    return result;
  },

  // 映射成只有一个对象的数组
  dataFieldMapOnlyObject(dimensionMap, dataSet) {
    const obj = dimensionMap.reduce((pre, cur) => {
      pre[cur.dataMapKey] = dataSet
        .filter((data, idx) => cur.row.includes(idx))
        .map((v) => v[cur.col])
        .join('');
      return pre;
    }, {});
    return [obj];
  },

  // 老数据转成新数据 [{x:'2016',y:'60',s:'series0'},{x:'2016',y:'60',s:'series0'}] ==> [{x:'2016',series0:"60",series1:"100"}]
  dataFieldMapHasX: (dimensionMap, dataSet) => {
    const groups = dimensionMap.map((dims) => {
      return dataSet
        .filter((val, idx) => dims.row.includes(idx))
        .map((data) => {
          return {
            [dims.dataMapKey]: data[dims.col],
          };
        });
    });

    // 取x轴数据长度
    const lens = groups
      .map((g, idx) => {
        const key = dimensionMap[idx].dataMapKey;
        const obj = {
          [key]: g.length,
        };
        return obj;
      })
      .find((f) => f.x)?.x;

    const list = [];
    for (let index = 0; index < lens; index++) {
      const obj = {};
      groups.forEach((g, idx) => {
        const key = dimensionMap[idx].dataMapKey;
        obj[key] = g[index] && g[index][key];
      });
      list.push(obj);
    }

    return list;
  },
  // 映射字段中有value、field、s 雷达图
  isRadarChart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('value') && fields.includes('field') && fields.includes('s');
    return match;
  },
  // 映射字段中有r、angle、s 极坐标
  isPolarChart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('r') && fields.includes('angle') && fields.includes('s');
    return match;
  },
  // 映射字段中有x,y,s类型的图表
  isXYSChart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('x') && fields.includes('y') && fields.includes('s');
    return match;
  },

  // 映射字段中有x,y,y1类型的图表，比如双Y轴条形图
  isXYY1Chart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('x') && fields.includes('y') && fields.includes('y1');
    return match;
  },
  // 映射字段中有rate，value类型的图表,比如条形面积图
  isRVChart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('rate') && fields.includes('value') && fields.length === 2;
    return match;
  },

  // 映射字段中有title,subTitle,value,subValue,suffix， 比如排行榜
  isTSVSSchart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    match =
      fields.includes('title') &&
      fields.includes('subTitle') &&
      fields.includes('value') &&
      fields.includes('subValue') &&
      fields.includes('suffix');
    return match;
  },

  // 映射字段中有name,value类型的图表
  isNVChart(config) {
    let match = false;
    const { _api } = config;
    const fields = _api.map((f) => f.field) || [];
    const _mockData = config._mockData ? config._mockData : config._data;
    const { dynamic } = config;
    const _mapFields = dynamic?.dataMap?.map((v) => v.key) ?? [];
    const includes = _mapFields.includes('name') && _mapFields.includes('value') && _mapFields.includes('type'); // 排除词云
    // 必须有name、value 或者text、value
    // 暂时让水波图不归为这一类
    // v8.14 通过不包含pid排除矩形树图
    match =
      (fields.includes('name') || fields.includes('text')) &&
      fields.includes('value') &&
      !fields.includes('percent') &&
      !fields.includes('pid') &&
      !includes &&
      Object.prototype.toString.call(_mockData[0]) === '[object Object]';

    return match;
  },

  // v8.14映射字段中有id，pid, name，value，类型的图表
  // isTreeChart(config) {
  //   let match = false;
  //   const { _api } = config;
  //   const fields = _api.map((f) => f.field) || [];
  //   match = fields.includes('id') && fields.includes('pid') && fields.includes('name') && fields.includes('value');
  //   return match;
  // },

  compatibleTwoWay(data) {
    const compData = data.map((v) => {
      return {
        x: v.y,
        y: v.x,
        s: v.s,
      };
    });
    return compData;
  },
  /**
   * 过滤出选中数据
   * @param {未选中数据的行号} rows
   * @param {数据列表} data
   * @returns
   */
  filterCheckFieldRows(rows = [], data = []) {
    return data.reduce((pre, cur, idx) => {
      if (!rows.includes(idx)) {
        pre.push(idx);
      }
      return pre;
    }, []);
  },
};

export default CompatibleTool;
