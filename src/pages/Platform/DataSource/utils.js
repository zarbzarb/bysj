/**
 * 将 xys 格式的数据，转换为普通格式的数据
 *
 * 示例：
 *
 * xys 格式的数据：[{x: '1', y: 1375, s: '火车'}, {x: '1', y: 180, s: '飞机'}, {x: '1', y: 117, s: '汽车'}]
 *
 * 普通格式的数据：[{x: '1', '火车': 1375, '飞机': 180, '汽车': 117}]
 *
 * @param {array} data xys 格式的数据
 * @param {string} xMapField x轴映射的字段
 * @param {object} xysMap xys字段映射关系
 * @returns
 */
export function XYSDataToNormal(data, xMapField = 'x', xysMap) {
  const obj = {};
  for (const item of data) {
    const x = item[xysMap.x] || item.x;
    const y = item[xysMap.y] || item.y;
    const s = item[xysMap.s] || item.s;
    if (!x || !s || !y) continue;

    if (!obj[x]) {
      obj[x] = { [s]: y };
    } else {
      obj[x][s] = y;
    }
  }

  return Object.keys(obj).map((key) => ({
    [xMapField]: key,
    ...obj[key],
  }));
}

/**
 * 将普通格式的数据，转换为 xys 格式的数据
 *
 * 示例：
 *
 * 普通格式的数据：[{x: '1', '火车': 1375, '飞机': 180, '汽车': 117}]
 *
 * xys 格式的数据：[{x: '1', y: 1375, s: '火车'}, {x: '1', y: 180, s: '飞机'}, {x: '1', y: 117, s: '汽车'}]
 *
 * @param {array} data 普通格式的数据
 * @param {string} xMapField x轴映射的字段
 * @param {object} xysMap xys字段映射关系
 * @returns
 */
export function normalDataToXYS(data, xMapField = 'x', xysMap) {
  const map = {
    x: xysMap.x || 'x',
    y: xysMap.y || 'y',
    s: xysMap.s || 's',
  };
  const res = [];
  for (const item of data) {
    Object.keys(item).forEach((key) => {
      if (key !== xMapField) {
        const x = item[xMapField] || '';
        res.push({ [map.x]: x, [map.s]: key, [map.y]: item[key] });
      }
    });
  }
  return res;
}

/**
 * 获取数据中的字段
 * @param {array} data 数据
 * @param {bool} onlyFirstRow 是否只取第一行的字段，否则取所有数据行不重复的字段
 * @returns array
 */
export function getDataFields(data, onlyFirstRow = true) {
  if (onlyFirstRow) return Object.keys(data?.[0] ?? {});

  let fields = [];
  data.forEach((item) => {
    fields = [...fields, ...Object.keys(item)];
  });
  fields = [...new Set(fields)]; // 去重
  return fields;
}

/**
 * 获取动态接口的返回字段说明信息
 * @param {object} currentApi 接口详情
 * @returns object
 */
export function getResultMetadata(currentApi) {
  const metadata = {};
  try {
    const result = JSON.parse(currentApi.result);
    if (result && result[0]?.properties) {
      const { properties } = result[0];
      if (Array.isArray(properties)) {
        properties.forEach((item) => {
          metadata[item.name] = item.description;
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
  return metadata;
}
