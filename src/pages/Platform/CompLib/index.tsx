import React, { useState, useLayoutEffect, useCallback, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { Collapse, Input, message, Tooltip } from 'antd';
import customIcon from '@/assets/icon/自定义大图.png';
import searchIcon from '@/assets/icon/search1.png';
import drawerBack from '@/assets/newIcon/drawerBack.png';
import tempIcon from '@/assets/newIcon/temp_icon.png';
import hoverTempIcon from '@/assets/newIcon/hover_temp_icon.png';
import { toJS } from 'mobx';
import { throttle, cloneDeep } from 'lodash';
import {
  // dynamicLoadVideoSource,
  dynamicLoadPlugins,
  dynamicLoadBasic,
  dynamicLoadChart,
  dynamicLoad2D,
  dynamicLoad3D,
  dynamicLoadGL,
  dynamicLoadMobileLibrary,
} from '@/utils/loadScript';
import { DragEndPosition } from '@/Computed/PositionComputed';
import './index.less';
import { initComponent } from '@/utils/initComs';
import { setCompTransform } from '@/utils/transformUtils';
import * as operate from '@/utils/operate';
import { deepDestoryInstance } from '@/utils/configPageUtils';
import { GetQueryString } from '@/utils/BrowserUtils';
import { chartCompTemplatesMap, templateThumbnailListType } from '@/staticJson/CompTemplates';
import templateManager from '@/theme/TemplateManager';

// const _chartCompTemplates = cloneDeep(chartCompTemplatesMap)

const { Panel } = Collapse;
/*
 * @Author: 赵晶晶
 * 组件库
 */
interface IProps {
  className: string;
  parentRef?: any;
}

/** 依据组件获取组件url */
const computeUrl = (comItem) => {
  const imgUrlPrefix = process.env.NODE_ENV === 'development' ? '/assets/' : '/visual-console/assets/';
  let imgUrl = ''; // 组件的图标,后续调整组件系统的时候优化
  try {
    imgUrl = comItem.imgUrl.includes('/storage/file/v1/console/downloadFileByUrl')
      ? `/iocoss/${comItem.imgUrl.replace(/.+\?url=/, '')}`
      : comItem.imgUrl.replace('/oss/default/', '/iocoss/default/');
  } catch {
    imgUrl = comItem.imgUrl;
  }
  imgUrl = imgUrl && imgUrl.replace('/iocoss/default/', imgUrlPrefix);
  if (imgUrl === undefined) {
    imgUrl = customIcon;
  }
  return imgUrl;
};

const CompLib = (props: IProps) => {
  const { className } = props;
  const { controlStore, compLibStore, globalStore, comStore, editorStore, layerStore } = useStore();
  const { changeTabsHandler } = controlStore;
  const { layers, activeLayerId, comList } = layerStore;
  const {
    mapResLoaded,
    setMapResLoaded,
    sourceLoaded,
    setSourceLoaded,
    categoryTree,
    getCustomComList,
    setCurrentCompTemps,
    setShowTempListByLib,
    setShowTempListByAttr,
    setCurrentComItem,
    showTempListByLib,
    showTempListByAttr,
  } = compLibStore;
  const { bigScreenType, isMobile } = globalStore;
  const { addCom } = comStore;
  const { editModePaths } = editorStore;
  // state
  // 选中分类名称
  const [typeStr, setTypeStr] = useState('text');
  // 选中分类的激活子类
  const [activeKey, setActiveKey] = useState('');
  // 搜索框输入值
  const [searchName, setSearchName] = useState('');
  // 搜索结果
  const [searchList, setSearchList] = useState([]);
  // 搜索框以及结果可见
  const [visible, setVisible] = useState(false);

  const [count, setCount] = useState(0);

  let categoryTreeList = toJS(categoryTree);
  if (isMobile) {
    categoryTreeList = categoryTreeList.filter((item) => {
      return item.categoryCode !== 'map';
    });
    categoryTreeList = categoryTreeList.map((category) => {
      category.children = category.children.filter((child) => {
        child.versions = child.versions.filter((item) => item.supportMobile);
        return child.versions.length > 0;
      });

      return category;
    });
  }

  // 获取选中组件库分类
  const childTree = categoryTreeList.find((item) => item.categoryCode === typeStr);
  // 获取选中分类的第一个子类
  const subChildArr = childTree.children || [];
  // 卡片删除一张图组件
  subChildArr.forEach((item, indx) => {
    if (item.categoryCode === 'OneMap' && bigScreenType === 'card') {
      // 卡片删除一张图组件
      subChildArr.splice(indx, 1);
    }
  });
  // 动态加载地图资源
  const dynamicLoadMapSource = useCallback(() => {
    if (!mapResLoaded) {
      const promise1 = dynamicLoad2D([], true);
      const promise2 = dynamicLoad3D([], true);
      const promise3 = dynamicLoadGL([], true);
      Promise.allSettled([promise1, promise2, promise3])
        .then((results) => {
          setMapResLoaded(true);
          return results;
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }, [mapResLoaded, setMapResLoaded]);

  const changeComType = (key) => {
    setTypeStr(key);
    setActiveKey('');
  };
  const handleOpenCollapse = (e) => {
    setActiveKey(e);
  };

  const searchFilter = (name) => {
    const newList = [];
    for (const item of categoryTreeList) {
      const fatherName = item.categoryName;
      for (const child of item.children) {
        const sonName = child.categoryName;
        for (const version of child.versions) {
          if (name && version.componentName.includes(name)) {
            version.fatherName = `${fatherName}/${sonName}/`;
            newList.push(version);
          }
        }
      }
    }
    setSearchList(newList);
  };

  const searchFilterHandle = throttle(searchFilter, 500);
  // 点击搜索按钮
  const visibleFn = () => {
    setVisible((preVisible) => !preVisible);
    setSearchList([]);
    setSearchName('');
  };

  const limitHandler = (comItem, isTooltips = true) => {
    console.log(comItem, 'comItem');
    // 动态面板内部不允许使用的组件
    const filterComp = new Set([
      'LayerLegend',
      'LayerTree',
      'Map3DFoundationPlan',
      'MapFoundationPlan',
      'MapGlFoundationPlan',
      // 'PieChart3D',
      'RegionSelect',
    ]);
    const filterMap = new Set(['MapFoundationPlan', 'MapGlFoundationPlan', 'Map3DFoundationPlan']);

    if (editModePaths.length > 0 && [...filterComp, 'PieChart3D'].includes(comItem.englishName)) {
      if (isTooltips) {
        message.warning('动态面板/折叠面板内部不允许拖入地图组件!');
      }
      return false;
    }
    if (!mapResLoaded && filterComp.has(comItem.englishName)) {
      if (isTooltips) {
        message.warning('地图资源加载中，请稍后操作~~~');
      }
      return false;
    }
    // 控制图层编辑器各图层放入组件
    if (bigScreenType === 'layer') {
      // 获取当前正在编辑的图层名称
      const layerName = layers.find((v) => v.layerId === activeLayerId)?.layerName;
      // 获取基础图层的组件
      const basicLayer = layers.find((v) => v.layerName === '基础图层');
      const basicComs = comList.filter((v) => v.layerId === basicLayer.layerId);
      const maps = basicComs.filter((com) => {
        return filterMap.has(com.englishName);
      });
      if (maps.length > 0 && filterMap.has(comItem.englishName) && layerName === '基础图层') {
        if (isTooltips) {
          message.warning('图层编辑器基础图层只允许放入一个地图组件!');
        }
        return false;
      }
      if (layerName === '基础图层') {
        if (!filterComp.has(comItem.englishName)) {
          if (isTooltips) {
            message.warning('图层编辑器基础图层不允许放入地图和地图交互(图层图例、图层树、网格选择)以外的组件!');
          }
          return false;
        }
      } else if (layerName === '搜索图层' && filterComp.has(comItem.englishName)) {
        if (isTooltips) {
          message.warning(`${layerName}无法使用地图和地图交互(图层图例、图层树、网格选择)相关组件!`);
        }
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    getCustomComList();
    return () => {};
  }, []);

  useLayoutEffect(() => {
    if (!sourceLoaded) {
      // 加载视频播放器资源
      // dynamicLoadVideoSource([], true);
      // 加载第三方插件
      dynamicLoadPlugins([], true);

      if (isMobile) {
        dynamicLoadMobileLibrary();
      } else {
        // 加载基础组件
        dynamicLoadBasic();
        // 加载报表组件
        dynamicLoadChart();
        // 加载地图资源
        dynamicLoadMapSource();
      }

      setSourceLoaded(true);
    }
  }, [dynamicLoadMapSource, getCustomComList, setSourceLoaded, sourceLoaded, isMobile]);
  /**
   * 切换分类，获取默认激活子类为第一个子类
   */
  useLayoutEffect(() => {
    if (!activeKey && subChildArr && subChildArr.length > 0) {
      setActiveKey(subChildArr[0].id);
    }
  }, [activeKey, subChildArr]);

  function getNodeMap(tree) {
    const nodeMap = {};
    const nodeParentMap = {};

    const deepMap = (arr, parent) => {
      arr.forEach((item) => {
        nodeMap[item.key] = item;
        nodeParentMap[item.key] = parent;
        if (item.childComList && item.childComList.length > 0) {
          deepMap(item.childComList, item);
        }
      });
    };
    deepMap(tree, null);
    return {
      nodeMap,
      nodeParentMap,
    };
  }

  const addComPro = ({ comItem, parentCom, position, targetDatasetItem, currentItemDragStartClientX, e }) => {
    /**
     * type === card： 自定义卡片，卡片的layerStore.currentLayerComList只有一个子级，
     * 所以不管如何将组件列表的组件拖动到组件树中，永远都是拖动到子级下，而不是跟子级平级
     */
    const type = GetQueryString('type');
    const oldList = [...layerStore.currentLayerComList];
    const { nodeMap: oldNodeMap } = getNodeMap(oldList);
    const oldAllKeys = Object.keys(oldNodeMap);
    const com = initComponent(comItem, activeLayerId, bigScreenType);

    if (parentCom) {
      // 地图组件
      const parentItem = window.DataI.getComponentByKey(parentCom);
      window.executeCommand('MapLayersCommand', com, parentItem, { type: 'add' });
    } else {
      // 普通组件
      if (position) {
        // 拖拽组件设置组件位置
        setCompTransform(com, position[0], position[1]);
      }
      window.executeCommand('AddCompCommand', com);
    }

    if (targetDatasetItem === 'com-operation-sort') {
      return;
    }

    const newlist = [...layerStore.currentLayerComList];
    const { nodeMap } = getNodeMap(newlist);
    const allKeys = Object.keys(nodeMap);
    const currentItemKey = allKeys.find((item) => !oldAllKeys.includes(item));
    const currentItem = nodeMap[currentItemKey];

    let list = [];

    // if (targetDatasetItem === 'com-operation-sort') {
    //   // 当目标是置顶位置时，则放在第一位
    //   list = operate.newMove(currentItem, null, newlist, '', false);
    // } else
    if (targetDatasetItem === 'com-change-com-layer') {
      if (type === 'card') {
        const target = newlist[0].childComList.at(-1);
        list = operate.newMove(currentItem, target, newlist, '', false);
      } else {
        // 当目标是容器时，则放到最外层的最后一位
        list = operate.newMove(currentItem, newlist.at(-1), newlist, '', false);
      }
    } else {
      const targetKey = JSON.parse(targetDatasetItem).key;
      const targetItem = window.DataI.getComponentByKey(targetKey);
      const isOpen = e.target.classList.contains('open');
      targetItem.isOpen = isOpen;

      const moveSite = targetItem.classType === 'group' && currentItemDragStartClientX > 90 && 'childNode';
      if (type === 'card') {
        /**
         * unshift：是因为之前图层的逻辑是增加组件时，都是往当前组件树子级的0号位增加一个组件
         * splice：移除新增这个组件所在原来的位置，统一放到组件0号位统一处理，沿用之前的逻辑
         */
        newlist.unshift(currentItem);
        newlist[1].childComList.splice(0, 1);
        list = operate.newMove(currentItem, targetItem, newlist, moveSite, true);
      } else {
        list = operate.newMove(currentItem, targetItem, newlist, moveSite, true);
      }
    }

    list.forEach((item) => {
      deepDestoryInstance(item);
    });
    layerStore.updateCurrentLayerComList(list);
  };

  // 当组件拖动结束时，销毁对应挂载在window上的事件
  const removeDropCallback = () => {
    (window as any).isComponentListDrag = false;
    (window as any).dropCallback = null;
    const comOperSort = document.querySelector('.com-operation-sort');
    if (comOperSort) {
      comOperSort.classList.remove('drag-up', 'drag-down');
    }
  };

  // v8.12：鼠标移入模板图标
  const handleMouseEnterTemp = (englishName: string, comItem: any) => {
    const currentCompTemps: templateThumbnailListType = [];
    Object.entries(chartCompTemplatesMap).forEach(([key, value]) => {
      value.isActive = !!(key === englishName);
    });
    if (englishName) {
      // 注册组件模板数据
      templateManager
        .registryTemplateWithComType(englishName as Parameters<typeof templateManager.registryTemplateWithComType>[0])
        .then((res) => {
          Object.entries(res).forEach(([key, value]) => {
            currentCompTemps.push({
              id: key,
              name: (value as any).name,
              thumbnail: (value as any).thumbnail,
            });
          });
          setCurrentCompTemps(currentCompTemps);
        });
      setShowTempListByLib(true);

      if (showTempListByAttr) setShowTempListByAttr(false);

      setCurrentComItem(comItem);
    }
    setCount((c) => c + 1);
  };

  useEffect(() => {
    setCount((c) => c + 1);
  }, [showTempListByLib]);

  useImperativeHandle(props.parentRef, () => ({
    limitHandler,
  }));

  return (
    <div className={className || ''}>
      <div className='com-list-title'>
        <div className='list'>
          {/* 标题 */}
          <span>组件列表</span>
          {/* 搜索容器 */}
          <div className='search'>
            {/* 搜索按钮 */}
            <span
              onClick={() => {
                // 点击显示搜索框
                visibleFn();
              }}
            >
              {/* 搜索按钮图片 */}
              <img alt='搜索' style={{ height: '16px', width: '16px' }} src={searchIcon} />
            </span>
            {/* 搜索框 */}
            {visible && (
              <div className='search-content'>
                {/* 输入框 */}
                <Input
                  style={{ height: '28px' }}
                  allowClear
                  placeholder='请输入名称'
                  onChange={(evt) => {
                    const trimmedValue = evt.target.value.trim();
                    // 设置搜索关键字
                    setSearchName(trimmedValue);
                    // 获取搜索结果
                    searchFilterHandle(trimmedValue);
                  }}
                />
                {/* 搜索结果展示 */}
                {searchName && (
                  <div className='result'>
                    <span>&quot;</span>
                    {searchName}
                    <span>&quot;</span>搜索结果({searchList.length}){' '}
                  </div>
                )}
                {/* 搜索结果列表 */}
                {searchList.length > 0 &&
                  searchList.map((comItem, index) => {
                    const imgUrl = computeUrl(comItem);
                    const chartCompTemp = chartCompTemplatesMap[comItem.englishName];
                    const templateKey = chartCompTemp ? 'Default' : undefined;
                    return (
                      <ul
                        key={`${index}-${comItem.englishName}`}
                        className='com-msg'
                        draggable='true'
                        onDragStart={() => {
                          /**
                           * 将组件拖动到左侧的回调，
                           * 当 isComponentListDrag === true时，组件列表拖动到组件树时不走 原有的 GroupInnerFn 方法
                           */
                          (window as any).isComponentListDrag = true;
                          (window as any).dropCallback = (targetDatasetItem, currentItemDragStartClientX, e) => {
                            if (limitHandler(comItem, false)) {
                              addComPro({
                                comItem,
                                position: [0, 0],
                                parentCom: undefined,
                                targetDatasetItem,
                                currentItemDragStartClientX,
                                e,
                              });
                            }
                            // addCom(comItem, undefined, position)
                          };
                        }}
                        onDragEnd={async (evt) => {
                          // v8.12：注册模板
                          if (chartCompTemp)
                            await templateManager.registryTemplateWithComType(comItem.englishName ?? comItem.type);

                          removeDropCallback();
                          // 拖拽组件缩略图，组件是否可以添加，支持拖拽位置
                          if (limitHandler(comItem)) {
                            const position = DragEndPosition({
                              x: evt.clientX,
                              y: evt.clientY,
                            });
                            if (position === undefined) return;
                            addCom(comItem, undefined, position, templateKey);
                          }
                        }}
                        onClick={async () => {
                          // v8.12：注册模板
                          if (chartCompTemp)
                            await templateManager.registryTemplateWithComType(comItem.englishName ?? comItem.type);
                          // 点击缩略图，组件是否可以添加，添加组件
                          if (limitHandler(comItem)) {
                            addCom(comItem, undefined, undefined, templateKey);
                          }
                        }}
                      >
                        <li>{comItem.fatherName}</li>
                        <li className='img-msg'>
                          <span>
                            <img alt='组件图片' src={imgUrl} />
                          </span>
                          <div className='name-version'>
                            <div>{comItem.componentName}</div>
                            <div>{comItem.latestVersion}</div>
                          </div>
                        </li>
                      </ul>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        {/* 收起按钮 */}
        <div>
          <img
            alt='收起'
            src={drawerBack}
            onClick={() => {
              changeTabsHandler('com');
            }}
          />
        </div>
      </div>

      <div className='com-list-container row'>
        {/* 组件库侧边栏 */}
        <div className='com-type-bar'>
          <ul>
            {categoryTreeList.map((item, i) => {
              return (
                // 组件分类icon
                <li
                  key={i}
                  className={typeStr === item.categoryCode ? 'active' : ''}
                  onClick={() => {
                    // 点击切换分类
                    changeComType(item.categoryCode);
                  }}
                >
                  {/* 组件库分类提示 */}
                  <Tooltip placement='rightTop' title={item.categoryName}>
                    {/* icon */}
                    <img alt={item.categoryName} src={`${item.imageUrl}`} draggable='false' />
                    {/* <img alt={item.categoryName} src={`${window.publicPath}${item.imageUrl}`} draggable='false' /> */}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </div>
        <div className='com-by-type-list'>
          <Collapse accordion activeKey={activeKey} onChange={handleOpenCollapse}>
            {/* 展示选中的分类，分为几个子类，每个子类有一个id，管风琴激活子类 */}
            {childTree
              ? subChildArr.map((item) => {
                  let len = 0;
                  if (item.versions) {
                    len = item.versions.length; // 子类个数
                  }
                  return (
                    // 子类
                    <Panel header={`${item.categoryName}（${len}）`} key={item.id}>
                      {/* 子类排列 */}
                      {item.versions
                        .filter((comItem) => {
                          // 过滤组
                          return comItem.componentCode !== 'GroupBasic';
                        })
                        .map((comItem) => {
                          // 过滤组
                          // 通过组件信息获取组件缩略图
                          const imgUrl = computeUrl(comItem);
                          const chartCompTemp = chartCompTemplatesMap[comItem.englishName];
                          const templateKey = chartCompTemp ? 'Default' : undefined;
                          return (
                            <div
                              draggable='true'
                              data-widget-type={comItem.englishName}
                              onDragStart={() => {
                                /**
                                 * 将组件拖动到左侧的回调，
                                 * 当 isComponentListDrag === true时，组件列表拖动到组件树时不走 原有的 GroupInnerFn 方法
                                 */
                                (window as any).isComponentListDrag = true;
                                (window as any).dropCallback = (targetDatasetItem, currentItemDragStartClientX, e) => {
                                  if (limitHandler(comItem, false)) {
                                    addComPro({
                                      comItem,
                                      position: [0, 0],
                                      parentCom: undefined,
                                      targetDatasetItem,
                                      currentItemDragStartClientX,
                                      e,
                                    });
                                  }
                                  // addCom(comItem, undefined, position)
                                };
                              }}
                              onDragEnd={async (evt) => {
                                if (chartCompTemp)
                                  await templateManager.registryTemplateWithComType(
                                    comItem.englishName ?? comItem.type,
                                  );
                                removeDropCallback();
                                // 拖拽组件缩略图，组件是否可以添加，支持拖拽位置
                                if (limitHandler(comItem)) {
                                  const position = DragEndPosition({
                                    x: evt.clientX,
                                    y: evt.clientY,
                                  });
                                  if (position === undefined) return;
                                  addCom(comItem, undefined, position, templateKey);
                                }
                              }}
                              onClick={async () => {
                                if (chartCompTemp)
                                  await templateManager.registryTemplateWithComType(
                                    comItem.englishName ?? comItem.type,
                                  );
                                // 点击缩略图，组件是否可以添加，添加组件
                                if (limitHandler(comItem)) {
                                  addCom(comItem, undefined, undefined, templateKey);
                                }
                              }}
                              className='com-info'
                              key={comItem.englishName ?? comItem.type + comItem.componentName}
                              data-middleware='com-operable'
                            >
                              {/* 组件名称 */}
                              <div className='com-title' data-middleware='com-operable' title={comItem.componentName}>
                                {comItem.componentName}
                              </div>
                              {/* 组件缩略图 */}
                              <div className='com-img'>
                                <img
                                  className='thumbnail-img'
                                  alt='组件缩略图'
                                  src={imgUrl}
                                  data-middleware='com-operable'
                                  draggable='false'
                                  onError={(err) => {
                                    const dom = err.target;
                                    $(dom).attr('src', customIcon);
                                  }}
                                />
                                {chartCompTemp && (
                                  <img
                                    className='hover-temp-icon'
                                    alt='icon'
                                    src={chartCompTemp.isActive ? hoverTempIcon : tempIcon}
                                    onMouseEnter={() =>
                                      handleMouseEnterTemp(comItem.englishName ?? comItem.type, comItem)
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </Panel>
                  );
                })
              : null}
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default observer(CompLib);
