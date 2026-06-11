import { formatPosition as formatTransform } from '@/utils/analysis';

const getComponent = window.DataI.getComponentByKey;

// 检查是否可以调用对齐功能，不允许跨组对齐
export function checkCanAlign(keys) {
  let canAlign = true;
  if (keys.length < 2) {
    return false;
  }
  const compList = keys.map((key) => getComponent(key)); // getComponent(keys);
  let groupKey = null;
  compList.forEach((com) => {
    if (groupKey === null && com.groupKey) {
      groupKey = com.groupKey;
    }
    if (groupKey && com.groupKey && groupKey !== com.groupKey) {
      canAlign = false;
    }
  });

  return canAlign;
}

export const leftTopAlignEvent = (keys, type) => {
  let left = 0;

  const newComs = keys.map((key) => {
    const obj = getComponent(key); // 获取对应的组件元素
    if (obj.styles) {
      const transform = formatTransform(obj.styles.transform);
      const transformVal = type === 'left' ? transform[0] : transform[1];
      if (!left || left > transformVal) {
        left = transformVal;
      }
    }
    return obj;
  });

  const coordsCompMap = newComs
    .map((item) => {
      if (!item.styles) return null;

      const transform = formatTransform(item.styles.transform);

      return [item.key, type === 'left' ? [left, transform[1]] : [transform[0], left]];
    })
    .filter(Boolean);

  window.executeCommand('MoveCompsCommand', newComs, Object.fromEntries(coordsCompMap));
};
export const rightBotAlignEvent = (keys, type) => {
  let right = 0;

  const newComs = keys.map((key) => {
    const obj = getComponent(key); // 获取对应的组件元素
    if (obj.styles) {
      const transform = formatTransform(obj.styles.transform);
      const width = Number.parseInt(obj.styles.width);
      const height = Number.parseInt(obj.styles.height);
      const transformVal = type === 'right' ? transform[0] + width : transform[1] + height;
      if (!right || right < transformVal) {
        right = transformVal;
      }
    }
    return obj;
  });

  const coordsCompMap = newComs
    .map((item) => {
      if (!item.styles) return null;

      const transform = formatTransform(item.styles.transform);
      const width = Number.parseInt(item.styles.width);
      const height = Number.parseInt(item.styles.height);
      const transformVal = type === 'right' ? right - width : right - height;

      return [item.key, type === 'right' ? [transformVal, transform[1]] : [transform[0], transformVal]];
    })
    .filter(Boolean);

  window.executeCommand('MoveCompsCommand', newComs, Object.fromEntries(coordsCompMap));
};

export const centerAlignEvent = (keys, type) => {
  const center = [];

  const newComs = keys.map((key) => {
    const obj = getComponent(key); // 获取对应的组件元素
    if (obj.styles) {
      const transform = formatTransform(obj.styles.transform);
      const halfWidth = Math.floor(Number.parseInt(obj.styles.width) / 2);
      const halfHeight = Math.floor(Number.parseInt(obj.styles.height) / 2);
      const pushVal = type === 'center' ? transform[0] + halfWidth : transform[1] + halfHeight;
      center.push(pushVal);
    }
    return obj;
  });

  const middleCenter = Math.floor(center.reduce((a, b) => a + b) / keys.length);

  const coordsCompMap = newComs
    .map((item) => {
      if (!item.styles) return null;

      const transform = formatTransform(item.styles.transform);
      const halfWidth = Math.floor(Number.parseInt(item.styles.width) / 2);
      const halfHeight = Math.floor(Number.parseInt(item.styles.height) / 2);
      const transformVal = type === 'center' ? middleCenter - halfWidth : middleCenter - halfHeight;

      return [item.key, type === 'center' ? [transformVal, transform[1]] : [transform[0], transformVal]];
    })
    .filter(Boolean);

  window.executeCommand('MoveCompsCommand', newComs, Object.fromEntries(coordsCompMap));
};

/**
 * @param {string[]} keys
 * @param {'row' | 'column'} type
 */
export const equallySpaced = (keys, type) => {
  let totalAxialLength = 0;

  /** @type {[number, number]} */
  const liminal = [Number.POSITIVE_INFINITY, 0];

  const sortedComps = keys
    .map(
      /** @returns {[any, number] | null} */
      (k) => {
        const comp = getComponent(k);

        if (!comp.styles) return null;

        const compAxialLength =
          type === 'row' ? Number.parseInt(comp.styles.height) : Number.parseInt(comp.styles.width);
        totalAxialLength += compAxialLength;

        const compAxialStartCoord = formatTransform(comp.styles.transform)[type === 'row' ? 1 : 0];

        if (liminal[0] > compAxialStartCoord) liminal[0] = compAxialStartCoord;

        const compAxialEndCoord = compAxialStartCoord + compAxialLength;

        if (liminal[1] < compAxialEndCoord) liminal[1] = compAxialEndCoord;

        return [comp, compAxialStartCoord + compAxialLength / 2];
      },
    )
    .filter((v) => v !== null)
    .sort((a, b) => a[1] - b[1])
    .map(([x]) => x);

  const space = (liminal[1] - liminal[0] - totalAxialLength) / (keys.length - 1);

  /** @type {number | null} */
  let lastEnd = null;

  const coordsCompMap = sortedComps.map(
    /** @returns {[string, [number, number]]} */
    (comp) => {
      const compAxialLength = type === 'row' ? Number.parseInt(comp.styles.height) : Number.parseInt(comp.styles.width);
      const transform = formatTransform(comp.styles.transform);

      if (lastEnd === null) {
        lastEnd = transform[type === 'row' ? 1 : 0] + compAxialLength;
        return [comp.key, transform];
      }

      /** @type {[number, number]} */
      const coord = type === 'row' ? [transform[0], lastEnd + space] : [lastEnd + space, transform[1]];

      lastEnd += compAxialLength + space;

      return [comp.key, coord.map((v) => v.toFixed(1))];
    },
  );

  window.executeCommand('MoveCompsCommand', sortedComps, Object.fromEntries(coordsCompMap));
};

// 旧版是逻辑图层维度的滤镜
// export const getFilterStyle = (filter) => {
//   filter = JSON.parse(JSON.stringify(filter));
//   const filterObj = {};
//   for (const key in filter) {
//     if (!filter[key]) continue;

//     let filterStyle = '';
//     if (Object.prototype.hasOwnProperty.call(filter, key)) {
//       const layer = filter[key];
//       // console.log(layer, key, '-------------');
//       if (layer.switchVal) {
//         Object.keys(layer).forEach((item) => {
//           if (!layer[item] || item === 'switchVal') return;

//           switch (item) {
//             case 'hueRotate': {
//               filterStyle += `hue-rotate(${layer[item]}deg)`;
//               break;
//             }
//             case 'saturation': {
//               filterStyle += `saturate(${layer[item]}%)`;
//               break;
//             }
//             case 'brightness': {
//               filterStyle += `brightness(${layer[item]}%)`;
//               break;
//             }
//             case 'contrastRatio': {
//               filterStyle += `contrast(${layer[item]}%)`;
//               break;
//             }
//             default: {
//               filterStyle += `opacity(${layer[item]}%)`;
//               break;
//             }
//           }
//         });
//       } else {
//         filterStyle = '';
//       }

//       filterObj[key] = filterStyle;
//     }
//   }
//   // console.log(filterObj);
//   return filterObj;
// };

// v8.10 新版是页面维度滤镜
export const getFilterStyle = (filter) => {
  filter = JSON.parse(JSON.stringify(filter));

  let filterStyle = '';
  if (filter.switchVal) {
    Object.keys(filter).forEach((item) => {
      if (!filter[item] || item === 'switchVal') return;

      switch (item) {
        case 'hueRotate': {
          filterStyle += `hue-rotate(${filter[item]}deg)`;
          break;
        }
        case 'saturation': {
          filterStyle += `saturate(${filter[item]}%)`;
          break;
        }
        case 'brightness': {
          filterStyle += `brightness(${filter[item]}%)`;
          break;
        }
        case 'contrastRatio': {
          filterStyle += `contrast(${filter[item]}%)`;
          break;
        }
        default: {
          filterStyle += `opacity(${filter[item]}%)`;
          break;
        }
      }
    });
  } else {
    filterStyle = '';
  }

  return filterStyle;
};
