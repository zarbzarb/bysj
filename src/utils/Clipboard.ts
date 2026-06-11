import _, { isPlainObject } from 'lodash';
import { message } from 'antd';
import { groupPosition, mapGetMatrix } from '@/utils/compute';
import { addApiRelatedByList } from '@/services/apis/dataManage';
import { allowMapToGroup } from '@/Computed/Comp/ConditionComputed';
import { dynamicLoadPlugins, dynamicLoadBasic, dynamicLoadChart } from '@/utils/loadScript';
import { removeCompInstance, concatDataStore } from '@/utils/componentUtils';
import { initCom, initGroup } from '@/utils/initComs';
import {
  resetComponentKey,
  replaceKey,
  filterRelatedApi,
  filterDataStore,
  dealCopyDataStoreKey,
  filterCardUrl,
} from '@/utils/resetKeys';
import type GlobalStore from '@/store/common/global';
import type OssStore from '@/store/module/OssStore';
import type ServiceStore from '@/store/module/ServiceStore';
import type LayerManagerStore from '@/store/layerManager';
import DataI from '@/utils/global-api/core';
import { getDataByKey, removeDataToComp, mapDataToComp } from '@/utils/dataStoreUtils';
import { forParentChain, getCompOffset, askReadPermission, askWritePermission } from './configPageUtils';

export const getUrlInfo = () => {
  const { href } = window.location;
  const paramArr = href.split('?')[1].split('&');
  const params = {};
  for (const i of paramArr) {
    const [key, value] = i.split('=');
    params[key] = value;
  }
  return params;
};

function replaceLayerId(list, activeLayerId, appPageId) {
  list.forEach((item) => {
    // 一级组件；layerId替换为当前激活图层id和页面id
    item.layerId = activeLayerId;
    item.appPageId = appPageId;
    if (item.classType === 'group') {
      // 组内组件递归替换
      replaceLayerId(item.childComList || [], activeLayerId, appPageId);
    }
    // v8.17 新增折叠面板
    if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
      // 动态面板子组件递归替换
      item.children.forEach((v) => {
        replaceLayerId(v.AntdChildComponents || [], activeLayerId, appPageId);
      });
    }
    // 自定义列表、自定义单元格、地图标牌
    if (item.isDragContainer) {
      replaceLayerId(item.childComList || [], activeLayerId, appPageId);
    }
  });
}

// 修改组件位置和尺寸
const changeChildrenPos = (
  children: { styles: { transform: string; width: string; height: string } }[],
  areaIncludePasteThings: { left?: any; top?: any },
  mleft: number,
  mtop: number,
  typeOfWherePasteIn: 'group' | 'dynamicPanel' | 'normal' | 'DragContainer',
  keyFromWherePasteIn: string,
) => {
  const { left, top } = areaIncludePasteThings;

  children.forEach((el: { styles: { transform: string; width: string; height: string } }) => {
    let [elL, elT] = mapGetMatrix(el.styles.transform);

    const elWidth = Number.parseInt(el.styles.width);
    const elHeight = Number.parseInt(el.styles.height);

    elL = elL - left + mleft;
    elT = elT - top + mtop;

    if ((typeOfWherePasteIn === 'group' || typeOfWherePasteIn === 'dynamicPanel') && keyFromWherePasteIn) {
      const parent = DataI.getComponentByKey(keyFromWherePasteIn);

      const [parentLeft, parentTop] = getCompOffset(parent);

      let lastRight = elL + elWidth;
      let lastBottom = elT + elHeight;

      elL = elL > parentLeft ? elL - parentLeft : 0;
      elT = elT > parentTop ? elT - parentTop : 0;

      forParentChain(parent, (c) => {
        let [pWidth, pHeight] = [Number.parseInt(c.styles.width), Number.parseInt(c.styles.height)];
        const [pLeft, pTop] = getCompOffset(c);
        const [pRight, pBottom] = [pWidth + pLeft, pHeight + pTop];

        if (pRight >= lastRight) lastRight = pRight;
        else pWidth += lastRight - pRight;

        if (pBottom >= lastBottom) lastBottom = pBottom;
        else pHeight += lastBottom - pBottom;

        const tmp = {
          width: `${pWidth}px`,
          height: `${pHeight}px`,
        };

        // 重新计算粘贴目标组组件宽高
        c.styles = {
          ...c.styles,
          ...tmp,
        };
        c.shapeCss = {
          ...c.styles,
          ...tmp,
        };
      });
    }

    elL = elL < 0 ? 0 : elL;
    elT = elT < 0 ? 0 : elT;

    el.styles.transform = `translate(${elL}px, ${elT}px)`;
  });
};

/**
 * @param {string} keys
 * @returns
 */
export const copy = async (layerStore, keys, isCopy = true) => {
  // v7.9 复制 通过key获取组件信息
  const crossScreenCopy = keys.map((key) => {
    const item = layerStore.getComponentByCurrentLayerList(key);
    const obj = _.cloneDeep(item);
    const newObj = removeCompInstance(obj);

    return newObj;
  });

  // 不允许复制地图组件
  if (!allowMapToGroup(keys)) {
    message.warning('不允许复制地图组件!');
    return false;
  }

  const dynSrcIdVec = [] as (string | null)[];

  DataI.each(crossScreenCopy, (i: any): string | null => {
    /* eslint-disable no-underscore-dangle */

    if (i.dataset?.category === 'dynamic') dynSrcIdVec.push(i.dataset?.dynamic?.source?.id ?? null);

    if (i?.preAttr?._config?._source === 'dynamic') dynSrcIdVec.push(i?.preAttr?._config?.dynamic?.source?.id ?? null);

    if (i.dataset?.category === 'indicator') dynSrcIdVec.push(i.dataset?.indicator?.source?.id ?? null);

    if (i?.preAttr?._config?._source === 'indicator')
      dynSrcIdVec.push(i?.preAttr?._config?.indicator?.source?.id ?? null);

    return null;
  });

  const { GlobalStore: GlobalStoreFromProp } = layerStore.rootStore as {
    GlobalStore: GlobalStore;
  };

  const currentScreenConfig = GlobalStoreFromProp.getScreenConfig(false);
  const dynamicApiVec: Promise<any>[] = dynSrcIdVec
    .map((id) => {
      const { dynamicApis = [] } = currentScreenConfig || {};
      const dynamicApi = dynamicApis.find((api) => api.id === id);
      return dynamicApi;
    })
    .filter((api) => isPlainObject(api));

  console.log('dynamicApiVec', dynamicApiVec);

  // 转化json字符串
  const crossScreenCopyStr = JSON.stringify(crossScreenCopy);
  // 筛选出被选择组件所依赖的变量
  const copyDataStore = filterDataStore(window.dataStore, crossScreenCopyStr);

  const copyReady = {
    crossScreenId: GlobalStoreFromProp.bigScreenId,
    crossScreenType: GlobalStoreFromProp.bigScreenType,
    crossScreenCopy: JSON.parse(crossScreenCopyStr),
    crossScreenCopyDataStore: copyDataStore,
    crossScreenCopyRelatedApi: _.uniqWith(
      [...filterRelatedApi(crossScreenCopy), ...dynamicApiVec],
      (a, b) => (a?.id ?? 'a') === (b?.id ?? 'b'),
    ), // 过滤出关联接口
  };

  dynamicApiVec.forEach(async (i) => copyReady.crossScreenCopyRelatedApi.push(await i));

  window.localStorage.setItem('copyReady', JSON.stringify(copyReady));

  // 保存到剪贴板
  const permission = await askWritePermission();
  if (permission) {
    await navigator.clipboard.writeText(JSON.stringify(copyReady));
    message.success(isCopy ? '复制成功' : '剪切成功');
  } else {
    message.success(isCopy ? '复制成功' : '剪切成功');
    console.warn('需要跨域复制粘贴请开启剪贴板权限');
  }

  return true;
};

export const paste = async (
  editorStore: any,
  offsetXY = [0, 0] as [number, number],
  typeOfWherePasteIn?: 'group' | 'dynamicPanel' | 'normal' | 'DragContainer',
  keyFromWherePasteIn?: string,
  isMouseInScreen = false, // 鼠标是否在画布上
  isCallFromMenu = false, // 是否菜单栏
) => {
  // v8.5.0 地图编辑态禁止粘贴组件
  const { isEditMap } = editorStore;
  if (isEditMap) {
    message.warning('地图编辑态禁止粘贴组件');
    return;
  }
  const {
    GlobalStore,
    LayerStore,

    PageTabsStore,
    OssStore,
  }: {
    GlobalStore;
    LayerStore: LayerManagerStore;
    ServiceStore: ServiceStore;
    PageTabsStore: any;
    OssStore: OssStore;
  } = editorStore.rootStore;
  const { ossPathInfo } = OssStore;

  const currentScreenConfig = GlobalStore.getScreenConfig(false);

  const { bigScreenId, bigScreenType, menuPosition, mousePos } = GlobalStore;

  let clipText = (await askReadPermission())
    ? await navigator.clipboard.readText()
    : window.localStorage.getItem('copyReady');

  let copyReady = {} as {
    crossScreenId?: any;
    crossScreenType?: any;
    crossScreenCopy?: any;
    crossScreenCopyDataStore?: any;
    crossScreenCopyRelatedApi?: any;
  };

  try {
    copyReady = JSON.parse(clipText);
  } catch {
    clipText = window.localStorage.getItem('copyReady');
    copyReady = JSON.parse(clipText);
  }

  const {
    crossScreenId,
    crossScreenType,
    crossScreenCopy, // 组件列表
    crossScreenCopyDataStore, // 数据变量列表
    crossScreenCopyRelatedApi, // 关联接口列表
  } = copyReady;

  if (!crossScreenCopy || !Array.isArray(crossScreenCopy)) {
    message.error('粘贴数据非法');
    return;
  }

  // 备份
  let copyStr = JSON.stringify(crossScreenCopy);
  if (crossScreenId !== bigScreenId) {
    // 替换跨屏复制出的变量key，每次粘贴都要换key，防止不同应用出现相同的变量
    const onlyOnce = crossScreenType === 'page' && bigScreenType === 'page';
    copyStr = dealCopyDataStoreKey(onlyOnce, bigScreenId, crossScreenCopyDataStore, copyStr);
  }
  // 获取key值
  const keys = resetComponentKey(JSON.parse(copyStr));
  // 重置key
  copyStr = replaceKey(_.cloneDeep(copyStr), keys);
  // 解析
  let pasteThings = JSON.parse(copyStr) ?? null;

  const alertMsg = () => {
    // if (crossScreenId !== bigScreenId) {
    // 添加数据变量
    concatDataStore(crossScreenCopyDataStore);
    // // 应用自动保存变量
    // if (isApp) {
    //   ServiceStore.saveAPP();
    // }
    // }
    // 迁移非本屏目录下的资源
    // console.log('filterCardUrl');
    const filteredDataJson = filterCardUrl(copyStr, ossPathInfo, bigScreenType);
    if (filteredDataJson.fileCopy !== 'copyed') {
      filteredDataJson.fileCopy;
    }

    if (_.isNull(pasteThings)) {
      pasteThings = [];
      message.error('粘贴失败, 没有反序列化出粘贴对象.');
      return;
    }

    if (!crossScreenCopyRelatedApi || crossScreenCopyRelatedApi?.length <= 0) {
      message.success('粘贴成功');
      return;
    }

    const { dynamicApis = [] } = currentScreenConfig ?? {};

    GlobalStore.updateScreenConfig(
      _.uniqWith([...dynamicApis, ...crossScreenCopyRelatedApi], (a, b) => (a?.id ?? 'a') === (b?.id ?? 'b')),
      'dynamicApis',
    );

    const apiParams = {
      filters: crossScreenCopyRelatedApi
        .filter((api) => isPlainObject(api))
        .filter((api) => api?.isIndicator !== true)
        .map(({ interfaceCode, apiInfo, id: apiId }) => {
          return {
            interfaceCode: interfaceCode ?? apiInfo.interfaceCode, // 换成不变的code
            pageId: bigScreenId,
            apiId, // 通过id保存引用关系兼容项目现场没有升级大屏
          };
        }) as any[],
    };

    // 添加本页面关联接口
    if (apiParams.filters.length > 0) {
      addApiRelatedByList(apiParams)
        .then((res) => {
          if (res?.code !== '200') {
            message.error('关联接口失败');
            return;
          }
          message.success('粘贴成功');
        })
        .catch(() => {
          console.error('关联接口失败');
        });
    }
  };

  try {
    alertMsg();
  } catch (error) {
    pasteThings = [];
    message.error('粘贴失败', error);
  }

  // 组件处理 删除groupKey，添加layerId
  pasteThings.forEach((child: { groupKey: any }) => {
    // 粘贴时删除组件的groupKey(解决A屏中复制组内组件到B屏时,B屏无法删除组件)
    delete child.groupKey;
    // 粘贴时替换粘贴过来的组件的layerId为当前选中图层的id
    replaceLayerId([child], LayerStore.activeLayerId, PageTabsStore.selectedKey);
  });

  // 加载组件资源
  await dynamicLoadPlugins(pasteThings);
  await dynamicLoadBasic();
  await dynamicLoadChart();

  // 粘贴的组件初始化
  const crossScreenPasteInitCom = (comList) => {
    if (comList && Array.isArray(comList)) {
      comList.forEach((com, index) => {
        switch (com.classType) {
          case 'com': {
            if (com?.preAttr?._config?._source === 'variableRef' && getDataByKey(com?.preAttr?._config?._variable)) {
              mapDataToComp(com.preAttr._config._variable, com.key);
            }

            comList[index] = initCom(com);
            break;
          }

          case 'group': {
            comList[index] = initGroup(com);
            break;
          }

          case 'antd': {
            comList[index] = initCom(com);
            // 动态面板内部子组件需要递归初始化
            if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
              com.children.forEach((child) => {
                crossScreenPasteInitCom(child.AntdChildComponents || []);
              });
            }
            // 地图标牌、自定义列表、自定义单元格
            if (com?.isDragContainer) {
              crossScreenPasteInitCom(com.childComList || []);
            }
            break;
          }

          default: {
            break;
          }
        }
      });
    }
  };

  // 粘贴的组件初始化
  crossScreenPasteInitCom(pasteThings || []);

  // 获取所有组件虚拟组的起始位置和尺寸
  const areaIncludePasteThings = groupPosition(pasteThings); // 虚拟组left、top
  const [pasteToL, pasteToT] = [
    isMouseInScreen ? (isCallFromMenu ? menuPosition.left : mousePos.left) : areaIncludePasteThings.left + offsetXY[0],
    isMouseInScreen ? (isCallFromMenu ? menuPosition.top : mousePos.top) : areaIncludePasteThings.top + offsetXY[1],
  ];

  // 修改组件位置和尺寸
  changeChildrenPos(pasteThings, areaIncludePasteThings, pasteToL, pasteToT, typeOfWherePasteIn, keyFromWherePasteIn);

  const replaceCrossLevel = (list, level) => {
    list.forEach((child) => {
      child.level = level + 1;
      if (child.classType === 'group' || child?.isDragContainer) {
        replaceCrossLevel(child.childComList, child.level);
      }
    });
  };

  // 鼠标选中组就粘贴到组里
  if (typeOfWherePasteIn === 'group' && keyFromWherePasteIn) {
    const item = LayerStore.getComponentByCurrentLayerList(keyFromWherePasteIn); // 目标组件
    pasteThings.forEach((com) => {
      com.groupKey = keyFromWherePasteIn;
    });

    if (!_.isUndefined(item) && !_.isUndefined(item.childComList)) {
      window.executeCommand('AddCompCommand', pasteThings, item.key, item.childComList);
    }
    replaceCrossLevel(item.childComList, item.level);
  } else if (typeOfWherePasteIn === 'DragContainer' && keyFromWherePasteIn) {
    // 鼠标选中地图标牌、自定义列表编辑页就粘贴到地图标牌、自定义列表
    const item = LayerStore.getComponentByCurrentLayerList(keyFromWherePasteIn);
    if (item?.isDragContainer) {
      pasteThings.forEach((com) => {
        com.groupKey = keyFromWherePasteIn;
      });
      if (!_.isUndefined(item) && !_.isUndefined(item.childComList)) {
        window.executeCommand('AddCompCommand', pasteThings, item.key, item.childComList);
      }
      replaceCrossLevel(item.childComList, item.level);
    }
  } else if (typeOfWherePasteIn === 'dynamicPanel' && keyFromWherePasteIn) {
    // 鼠标选中动态面板编辑页就粘贴到动态面板
    const item = LayerStore.getComponentByCurrentLayerList(keyFromWherePasteIn);
    replaceCrossLevel(pasteThings, 0);
    item.children.forEach((child) => {
      if (child.key === item.props.activeKey) {
        child.AntdChildComponents.unshift();
        window.executeCommand('AddCompCommand', pasteThings, item.key, child.AntdChildComponents);
      }
    });
  } else if (typeOfWherePasteIn === 'normal' || (typeOfWherePasteIn ?? null) === null) {
    // 什么组件或组都不选就粘贴到最外层
    replaceCrossLevel(pasteThings, 0);
    window.executeCommand('AddCompCommand', pasteThings.reverse());
  } else {
    message.error('无法贴入');
  }

  // v7.6.0 获取粘贴的组件key
  if (pasteThings && pasteThings.length > 0) {
    const curKeys = pasteThings.map((item) => item.key);
    editorStore.changeComponents(curKeys);
  }
  editorStore.forceUpdate();
};
