/**
 * 编辑态文件
 */
// import { action } from 'mobx';
import uuid from 'short-uuid';
import SHA256 from 'crypto-js/sha256';
import { FILECOPY } from '@/services/apis/CardApi';
import { initCom, initGroup } from '@/utils/initComs';
import { Store } from '@/store';

export const resetComponentKey = (list = [], keyList = []) => {
  const {
    pageTabsStore: { selectedKey },
  } = Store;
  list.forEach((child, idx) => {
    child.appPageId = selectedKey;
    // 如果原始数据已经有重复的组件key值，则重复的组件key值重新生成
    if (keyList.includes(child.key)) {
      child.key = uuid.generate();
    }
    keyList.push(child.key);
    if (child.layers?.length) {
      resetComponentKey(child.layers, keyList);
    }
    list[idx] = child;
    if (child.classType === 'group' || child?.childComList || ['CustomList', 'CustomCell'].includes(child.type)) {
      resetComponentKey(child.childComList, keyList);
    } else if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
      // v8.17 新增折叠面板
      child.children.forEach((val) => {
        resetComponentKey(val.AntdChildComponents, keyList);
      });
    }
  });
  return keyList;
};

export const replaceKey = (item, keyList) => {
  let newItem = item;
  keyList.forEach((key) => {
    let uid = uuid.generate();
    if (key.includes('group_')) {
      uid = `group_${uid}`;
    }
    if (key.includes('store_')) {
      uid = `store_${uid}`;
    }
    if (key.includes('@com_')) {
      uid = `@com_${uid}`;
    }
    const reg = new RegExp(key, 'g');
    newItem = newItem.replace(reg, uid);
  });
  // console.log(keyList, JSON.parse(newItem), JSON.parse(item), 'ssss');
  return newItem;
};

export const resetKeys = (item) => {
  let keyList = [];

  const { componentList, dataStore } = JSON.parse(item);
  if (Array.isArray(componentList)) {
    keyList = resetComponentKey(componentList, keyList);
  }
  dataStore?.forEach((val) => {
    keyList.push(val.key);
    val.children.forEach((v) => {
      keyList.push(v.key);
      if (v.mapCompIds?.length > 0) {
        v.mapCompIds = v.mapCompIds.forEach((em) => keyList.push(em));
      }
    });
  });
  return replaceKey(item, keyList);
};

const switchType = (item, activeLayerId, bigScreenType) => {
  item =
    item.classType === 'group'
      ? initGroup(item, activeLayerId, bigScreenType)
      : initCom(item, activeLayerId, bigScreenType);
  return item;
};

export const intNewComponent = (item, activeLayerId, bigScreenType) => {
  const {
    pageTabsStore: { selectedKey },
  } = Store;
  item.forEach((child, idx) => {
    child.appPageId = selectedKey;
    child = switchType(child, activeLayerId, bigScreenType);
    item[idx] = child;
    if (child.classType === 'group') {
      resetComponentKey(child.childComList);
    } else if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
      // v8.17 新增折叠面板
      child.children.forEach((val) => {
        resetComponentKey(val.AntdChildComponents);
      });
    }
  });
};

// 筛选出被选择组件所依赖的变量
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

export const filterRelatedApi = (comList) => {
  // 查找有数据请求操作的组件
  const list = window.DataI().pushStack(comList).find('dataQuery').toArray();
  // 接口集合
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

const deepComponent = (list = [], isTypeList = []) => {
  list.forEach((child, idx) => {
    if (child.type === 'PanoramaMap') {
      isTypeList.push(true);
    }
    if (child.classType === 'group') {
      deepComponent(child.childComList, isTypeList);
    } else if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
      // v8.17 新增折叠面板
      child.children.forEach((val) => {
        deepComponent(val.AntdChildComponents, isTypeList);
      });
    }
  });
  return isTypeList;
};

export const isPanoramaMapFn = (list = []) => {
  const isTypeList = [];
  if (deepComponent(list, isTypeList).length > 0) {
    return true;
  }
  return false;
};

// 一致性哈希处理
function consistentHash(input, id) {
  const hash = SHA256(input + id).toString();
  const hashSubstring = hash.slice(0, 22); // 取前 22 位作为修改后的 UUID
  return hashSubstring;
}

// 替换跨屏复制出的变量key
export const dealCopyDataStoreKey = (onlyOnce = false, bigScreenId, dataStore, comListStr, prefix) => {
  let retComListStr = comListStr;
  const dealData = dataStore;
  dealData?.forEach((item, index) => {
    if (prefix) {
      const preKey = dealData[index].key;
      let uid = uuid.generate();
      if (onlyOnce) {
        const match = preKey.match(/-(.*)/);
        // console.log('match111111111111111111', match);
        // console.log('length1', consistentHash(match[1], bigScreenId).length === uid.length);
        // 如果匹配成功，则提取 uid
        uid = match ? consistentHash(match[1], bigScreenId) : uid;
        // console.log('uid111111111111', uid);
      }
      const storeKey = `${prefix}-${uid}`;
      dealData[index].key = storeKey;
      retComListStr = retComListStr.replaceAll(new RegExp(preKey, 'g'), storeKey);
    } else {
      const preKey = dealData[index].key;
      let uid = uuid.generate();
      if (onlyOnce) {
        const match = preKey.match(/store_group_(.*)/);
        // console.log('match2222222222222', match);
        // console.log('length2', consistentHash(match[1], bigScreenId).length === uid.length);
        // 如果匹配成功，则提取 uid
        uid = match ? consistentHash(match[1], bigScreenId) : uid;
        // console.log('uid2222222222222', uid);
      }
      const groupKey = `store_group_${uid}`;
      dealData[index].key = groupKey;
      retComListStr = dealCopyDataStoreKey(onlyOnce, bigScreenId, item.children, retComListStr, groupKey);
    }
  });
  return retComListStr;
};

// 保存大屏需要迁移引用的卡片资源到大屏
export const filterCardUrl = (listStr, ossPathInfo, type) => {
  const id = window.screenConfig.pageId; // 卡片和业务图层要用短ID
  // const { ossPathInfo } = ComStore;
  const { prefix } = ossPathInfo; // 专门为梧桐空间添加
  const icoScreenPathReg = new RegExp(
    `"\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
      prefix ? prefix.length : 0
    }}\/[^\/]{0,}[\/]{0,1}(screen|card|layer|custom)\/(?!${id})[0-9]+\/[^"]+"`, // 兼容处理，卡片之前也存在screen文件夹里面
    'g',
  );
  const matchedArr = listStr.match(icoScreenPathReg) || []; // 找出所有的存储路径
  // console.log('matchedArr', matchedArr);
  if (matchedArr.length > 0) {
    // const pathArr = _.uniqBy(matchedArr.map((item) => item.replace(/"/g, ''))); // 存储路径去重
    const pathArr = [
      ...new Set(
        matchedArr.map((item) => {
          const matchedPath = item.replace(/"/g, ''); // 存储路径去重
          return matchedPath;
        }),
      ),
    ];
    // console.log('pathArr', pathArr);
    const filteredPathArr = pathArr.map((path) => {
      const filteredPath = path.replace(
        new RegExp(`\/iocoss\/${window.screenConfig.bucketName}\/`), // 去掉桶名的桶内原始文件存储路径
        '',
      );
      return filteredPath;
    });
    // console.log('filteredPathArr', filteredPathArr);
    let ossFolderType = 'screen';
    if (type !== 'page') {
      ossFolderType = type; // REVIEW liuming 考虑到卡片和业务图层的资源迁移
    }
    const pathReg = new RegExp(
      `\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
        prefix ? prefix.length : 0
      }}\/(screen|card|layer|custom)\/(?!${id})[0-9]+\/`, // 兼容处理，卡片之前也存在screen文件夹里面
      'g',
    );
    // let moveToPathArr = _.uniqBy(
    //   pathArr.map((item) => {
    //     const moveToPath = item.replace(pathReg, `${ossFolderType}\/${id}\/`); // 桶内目的文件存储路径
    //     return moveToPath;
    //   }),
    // );
    let moveToPathArr = [
      ...new Set(
        pathArr.map((item) => {
          // console.log('item', item);
          // console.log('pathReg', pathReg);
          // console.log('replace', `${ossFolderType}\/${id}\/`);
          const moveToPath = item.replace(pathReg, `${ossFolderType}\/${id}\/`); // 桶内目的文件存储路径，卡片使用card文件夹
          return moveToPath;
        }),
      ),
    ];
    moveToPathArr = moveToPathArr.map((item) => {
      const res = item.split('/');
      res.pop(); // 桶内目的存储路径
      return res.join('/');
    });
    const idReg = new RegExp(
      `"\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
        prefix ? prefix.length : 0
      }}\/(screen|card|layer|custom)\/(?!${id})[0-9]+\/`, // 兼容处理，卡片之前也存在screen文件夹里面
      'g',
    );
    const filteredData = listStr.replace(
      idReg,
      `"\/iocoss\/${window.screenConfig.bucketName}${prefix ? `/${prefix}` : ''}\/${ossFolderType}\/${id}\/`, // 修改提交的桶内文件存储路径
    );

    const copyParams = {
      fileCopyItemList: moveToPathArr.map((item, index) => {
        const param = {
          fromBucket: window.screenConfig.bucketName,
          fromUrl: filteredPathArr[index], // 以去重后的数组为准，因为存在多个卡片引用同一个资源的情况
          toBucket: window.screenConfig.bucketName,
          toDiretoryPath: item,
        };
        return param;
      }),
    };
    // console.log('copyParams', copyParams);
    const fileCopy =
      copyParams.fileCopyItemList && copyParams.fileCopyItemList.length > 0 ? FILECOPY(copyParams) : 'copyed';
    return {
      fileCopy,
      filteredData,
    };
  }
  return {
    fileCopy: 'copyed',
    filteredData: listStr,
  };
};
