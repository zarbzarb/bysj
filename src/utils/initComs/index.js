/**
 * 编辑态文件
 */
import { Store } from '@/store';
import { createKeyName } from '../random';
import { matrixToTransform } from '../analysis';
import { addComp } from './antdCompUtils';
import { addMapComp } from './mapCompUtils';
import { addCustomComp } from './customCompUtils';

const defaultCss = {
  fontFamily: 'Microsoft Yahei',
  transform: 'translateX(150px) translateY(200px) rotate(0deg)',
};

// 添加组件会走这个
export const initComponent = (item, activeLayerId, bigScreenType, templateKey) => {
  const {
    pageTabsStore: { selectedKey },
  } = Store;
  if (['antd', 'mapInteraction', 'UnrealEngine', 'SceneFrame'].includes(item.parentType)) {
    const antdItem = addComp(item, activeLayerId, templateKey); // antd组件,地图交互组件,云渲染组件,场景组件(注册)
    return antdItem;
  }

  if (item.parentType === 'customMap') {
    return addMapComp(item, activeLayerId, bigScreenType); // 时空地理组件
  }

  if (item.parentType === 'customCom') {
    // console.log(item, 'initCom', '--------------');
    return addCustomComp(item, activeLayerId, bigScreenType, selectedKey); // 自定义组件
  }
  const { index, config } =
    window[
      item.englishName ? item.englishName : item.refComName // Sonar last duplicate
    ];
  const type = 'com'; // 组件类型
  const key = `@${type}_${createKeyName()}`; // 组件key

  const com = {
    styles: {
      width: item.englishName === 'ChartColumn3D' ? '420px' : '0px', // 宽度
      height: item.englishName === 'ChartColumn3D' ? '280px' : '0px', // 高度
      transform: 'translate(0, 0)', // datai组件的初始位置
    },
    version: item.version, // 版本
    author: item.author ? item.author : '', // 作者
    displayState: true, // 是否显示
    classType: 'com',
    instance: undefined, // 实例组件后的对象
    initCom: index, // 初始化组件的方法 => 单独组件的index.js （构造函数）
    CssPage: config, // 组件的css样式界面 => 单独组件的config.js （样式操作界面）
    key, // 组件key
    imgUrl: item.imgUrl, // 组件封面图
    type: item.componentCode, // 组件类型
    englishName: item.englishName || item.refComName, // 组件英文名称
    name: item.componentName || '组件', // 组件名称
    compName: item.componentName, // 组件名称
    title: item.componentName, // 组件标题
    cssStyle: { ...defaultCss }, // 组件css样式
    // 新增基础组件添加图层id
    layerId: activeLayerId,
    appPageId: selectedKey || undefined, // 添加页面 id
    level: item.level,
    createFlag: item.createFlag, // 创建
    showFlag: item.showFlag, // 显示
    comCreated: true, // 编辑态是否创建组件
    templateKey, // 模版key
  };
  return com;
};

/** 初始化组件实例, 比如datai组件的属性会在这里重新定义一份且增加 `CssPage`、`initCom` 属性，不是和接口返回的属性一样，这点需要注意。 */
export const initCom = (item, activeLayerId, bigScreenType, witchPage) => {
  if (item.classType === 'antd') {
    if (item.children && item.children.length > 0) {
      const children = [];
      item.children.forEach((child) => {
        const currentAntdChildComponents = JSON.parse(JSON.stringify(child));
        child.AntdChildComponents.forEach((AntdChild, index) => {
          let currentChild;
          switch (AntdChild.classType) {
            case 'com': {
              currentChild = initCom(AntdChild, activeLayerId, bigScreenType, witchPage);

              break;
            }
            case 'group': {
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              currentChild = initGroup(AntdChild, activeLayerId, bigScreenType, witchPage);

              break;
            }
            case 'antd': {
              currentChild = AntdChild;

              break;
            }
            default: {
              break;
            }
          }
          currentAntdChildComponents.AntdChildComponents[index] = currentChild;
        });
        children.push(currentAntdChildComponents);
      });
      item.children = children;
    }

    return addComp(item, activeLayerId); // antd组件
  }

  if (item.classType === 'customMap') {
    return addMapComp(item, activeLayerId, bigScreenType); // 时空地理组件
  }

  if (item.classType === 'customComp') {
    return addCustomComp(item, activeLayerId, bigScreenType); // 自定义组件
  }

  const compName = item.englishName || item.refComName; // 兼容性处理
  if (!window[compName]) {
    return false; // 组件全局挂载？
  }
  const { index, config } = window[compName];
  const transformStr = matrixToTransform(item.cssStyle.transform);
  const com = {
    preAttr: {
      _attr: item._attr ? item._attr : item.preAttr ? item.preAttr._attr : undefined,
      _data: item._data ? item._data : item.preAttr ? item.preAttr._data : undefined,
      _shape: item._shape ? item._shape : item.preAttr ? item.preAttr._shape : undefined,
      _config: item._config ? item._config : item.preAttr ? item.preAttr._config : undefined,
    },
    comLock: item.comLock, // 组件锁定
    comInvisible: item.comInvisible, // 组件是否可见
    version: item.version, // 组件版本
    author: item.author, // 组件作者
    layers: item.layers || [], // 图层
    displayState: item.displayState, // 显示状态
    classType: item.classType,
    middleWareFnCode: item.middleWareFnCode || undefined, // 报表中间件
    instance: undefined, // 实例
    initCom:
      witchPage === 'preview' && window.environment !== 'private'
        ? window[compName].index
          ? window[compName].index
          : window[compName]
        : index,
    CssPage: config,
    key: item.key, // 组件key
    imgUrl: item.imgUrl, // 组件封面图
    groupKey: item.groupKey, // 组key
    type: item.type, // 组件类型
    englishName: compName, // 组件英文名
    name: item.name || '组件', // 组件名称
    styles: item.styles, // 组件样式
    cssStyle: {
      ...item.cssStyle,
      transform: transformStr,
    },
    // 基础组件重新渲染时添加图层id
    layerId: item.layerId,
    appPageId: item.appPageId || undefined, // 添加页面 id
    level: item.level,
    createFlag: item.createFlag, // 创建
    showFlag: item.showFlag, // 显示
    comCreated: item.comCreated, // 编辑态组件是否创建
    templateKey: item.templateKey, // v8.12： 组件模板 key
  };
  if (item.animateQueue) com.animateQueue = item.animateQueue;
  if (item.eventSetings) {
    if (Array.isArray(item.eventSetings)) {
      com.eventSetings = item.eventSetings;
    } else {
      com.eventSetings = [];
    }
  }
  return com;
};

export const initGroup = (item, activeLayerId, bigScreenType, witchPage) => {
  const { index, config } = window.GroupBasic;
  const group = {
    preAttr: {
      _attr: item._attr,
      _data: item._data,
      _shape: item._shape,
      _config: item._config,
    },
    _attr: item._attr, // 跨屏粘贴的时候需要加上
    _data: item._data, // 跨屏粘贴的时候需要加上
    _shape: item._shape, // 跨屏粘贴的时候需要加上
    _config: item._config, // 跨屏粘贴的时候需要加上
    imgUrl: item.imgUrl, // 组封面图
    englishName: 'GroupBasic', // 组英文名
    comLock: item.comLock, // 组锁定
    comInvisible: item.comInvisible, // 组是否可见
    type: '@yl/dataq-com-group-basic', // 组类型
    author: item.author, // 组作者
    version: item.version, // 组版本
    key: item.key, // 组key
    displayState: item.displayState, // 组显示状态
    name: item.name, // 组名称
    title: item.title, // 组标题
    classType: item.classType,
    initCom: witchPage === 'preview' && window.environment !== 'private' ? window.GroupBasic : index,
    CssPage: item.CssPage || config,
    styles: item.styles, // 组样式
    instance: undefined, // 组实例
    initSize: {
      width: item.cssStyle.width.replace('px', ''), // 初始宽度
      height: item.cssStyle.height.replace('px', ''), // 初始高度
    },
    cssStyle: { ...item.cssStyle },
    childComList: [], // 维护的组件列表
    layerId: item.layerId, // 所属图层
    appPageId: item.appPageId || undefined, // 添加页面 id
    groupKey: item.groupKey,
    level: item.level,
    createFlag: item.createFlag, // 创建
    showFlag: item.showFlag, // 显示
    comCreated: item.comCreated, // 编辑态组件是否创建
  };

  group.childComList = item.childComList.map((vl) => {
    if (vl.classType === 'group') {
      return initGroup(vl, activeLayerId, bigScreenType);
    }
    return initCom(vl, activeLayerId, bigScreenType, witchPage);
  });

  if (item.animateQueue) group.animateQueue = item.animateQueue;
  if (item.eventSetings) {
    group.eventSetings = item.eventSetings;
  }
  return group;
};

export const initChildLayer = (parent, index) => {
  const map = parent.instance._map;
  const empty = undefined;
  // eslint-disable-next-line new-cap
  parent.layers[index].instance = new parent.layers[index].initCom(empty, empty, empty, map);
};

export const initComs = (list, activeLayerId, bigScreenType) => {
  list.forEach((item, idx) => {
    if (item.classType === 'group') {
      list[idx] = initGroup(item, activeLayerId, bigScreenType);
    } else if (item.children && item.children.length > 0) {
      // let activeKey = item.props.activeKey;
      const componentListChildren = [];
      item.children.forEach((child) => {
        const antdComps = [];
        child.AntdChildComponents.forEach((antdComp) => {
          if (antdComp.classType === 'group') {
            antdComps.push(initGroup(antdComp, activeLayerId, bigScreenType));
          } else {
            antdComps.push(initCom(antdComp, activeLayerId, bigScreenType));
          }
        });
        const compChild = JSON.parse(JSON.stringify(child));
        compChild.AntdChildComponents = antdComps;
        componentListChildren.push(compChild);
      });
      list[idx].children = componentListChildren;
    } else {
      list[idx] = initCom(item, activeLayerId, bigScreenType);
    }
  });
};
