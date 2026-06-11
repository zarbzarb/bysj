/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:27:59
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-03-04 10:23:57
 * 编辑器筛选模块
 */
import { makeAutoObservable, toJS, observable, runInAction } from 'mobx';
import { message } from 'antd';
import anime from 'animejs/lib/anime.es';
import { mapBasePlanType } from '@/staticJson/MapBasic';
import { bunchFn } from '@/components/ContextMenu/Operation';
import _ from 'lodash';
import { clearSelection } from '@/utils/utils';
// import {
//   getAllIds,
//   getComponentByCurrentLayerList,
//   getComponent,
//   deepDestoryInstance,
//   getGroupChildIdx,
//   mapComKeys,
//   computeGroupPos,
//   concatDataStore,
//   crossLevelSelection,
// } from '@/utils/configPageUtils';

import { deepDestoryInstance } from '@/utils/componentUtils';
import DataI from '../../utils/global-api/core';

const getComponent = window.DataI.getComponentByKey;

/**
 * 比较新增选中组件
 * @param targetKey 新增组件
 * @param changeKeys 已选中组件
 * @param LayerStore 图层数据管理
 * @returns
 */
const compareComponent = (targetKey, changeKeys, LayerStore) => {
  const { getComponentByCurrentLayerList } = LayerStore;
  let target = getComponentByCurrentLayerList(targetKey);
  if (_.isUndefined(target) || _.isNull(target)) return [];
  const targetLevel = target.level;
  if (changeKeys && changeKeys.length > 0) {
    // 获取第一个组件
    let firstSibling = getComponentByCurrentLayerList(changeKeys[0]) ?? null;
    if (firstSibling) {
      const currentLevel = firstSibling.level;
      if (currentLevel <= targetLevel) {
        const difference = targetLevel - currentLevel;
        for (let index = 0; index < difference; index++) {
          target = getComponentByCurrentLayerList(target.groupKey);
        }
        if ((firstSibling.level === 1 && target.level === 1) || firstSibling?.groupKey === target?.groupKey) {
          if (!changeKeys.includes(target.key)) {
            changeKeys.push(target.key);
          }
        } else {
          for (let i = currentLevel; i > 1; i--) {
            firstSibling = getComponentByCurrentLayerList(firstSibling.groupKey);
            target = getComponentByCurrentLayerList(target.groupKey);
            if ((firstSibling.level === 1 && target.level === 1) || firstSibling?.groupKey === target?.groupKey) {
              console.log('加级');
              changeKeys = firstSibling.key === target.key ? [firstSibling.key] : [firstSibling.key, target.key];
              break;
            }
          }
        }
      } else {
        const difference = currentLevel - targetLevel;
        for (let index = 0; index < difference; index++) {
          firstSibling = getComponentByCurrentLayerList(firstSibling.groupKey);
        }
        if ((firstSibling.level === 1 && target.level === 1) || firstSibling?.groupKey === target?.groupKey) {
          console.log('父类同一级');
          changeKeys = firstSibling.key === target.key ? [firstSibling.key] : [firstSibling.key, target.key];
        } else {
          for (let i = targetLevel; i > 1; i--) {
            firstSibling = getComponentByCurrentLayerList(firstSibling.groupKey);
            target = getComponentByCurrentLayerList(target.groupKey);
            if ((firstSibling.level === 1 && target.level === 1) || firstSibling?.groupKey === target?.groupKey) {
              console.log('父类同加级');
              changeKeys = firstSibling.key === target.key ? [firstSibling.key] : [firstSibling.key, target.key];
              break;
            }
          }
        }
      }
    }
  } else {
    changeKeys.push(targetKey);
  }
  return changeKeys;
};
/**
 * 跨层级选择
 * @param list
 * @returns
 */
const crossLevelSelection = (list, layerStore, isSearch) => {
  let newChangeKeys = [];
  if (list && list.length > 0) {
    // 针对通过组件定位进行自动选中
    if (list.length === 1 && isSearch) {
      return list;
    }
    for (const element of list) {
      newChangeKeys = compareComponent(element, newChangeKeys, layerStore);
    }
  }
  return newChangeKeys;
};

// 循环查找父组进行显示
const createParentWithLoop = (comp) => {
  if (comp.groupKey) {
    const parent = DataI.getComponentByKey(comp.groupKey);
    parent.comCreated = true;
    createParentWithLoop(parent);
  }
};

class EditorStore {
  rootStore = null;

  /**
   * forceUpdateAttr() 函数刷新编辑器右侧样式配置栏
   */
  renderAttrCount = 0; //

  /**
   * forceUpdateLayout() 函数刷新编辑器编辑区组件渲染
   */
  renderLayoutCount = 0;

  /**
   * forceUpdateLayer() 函数刷新图层列表渲染
   */
  renderLayerCount = 0;

  /**
   * forceAccurateUpdate 组件列表变动时的精确更新
   */
  accurateCount = 0;

  /**
   * forceUpdateVisible 编辑态组件显示时强制刷新
   */
  visibleCount = 0;

  /**
   * 卡片顶级组刷新
   */
  rootGroupCount = 0;

  /**
   * 保存撤销步骤的栈列表
   */
  undoStack = [];

  /**
   * 保存重做步骤的栈列表
   */
  redoStack = [];

  /**
   * 组内编辑，记录编辑组的key
   */
  editModePaths: string[] = [];

  /**
   * v8.5.0 是否编辑地图
   */
  isEditMap = false;

  /**
   * 右键编辑的动态面板key
   */
  dynamicPanelEditComp = '';

  prevDynamicPanelActive = undefined;

  dynamicPanelCount = 0;

  /**
   * 组件、外部资源加载完毕
   */
  screenConfigLoaded = 0;

  /**
   * 选中的组件key
   */
  changeKeys: string[] = [];

  /**
   * 是否是选中引用的地图组件
   */
  isSelectedReferenceMapComp = false;

  /**
   * 是否按下空格键
   */
  isSpaceDown = false;

  /**
   * 画布缩放级别
   */
  zoom = 100;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  /**
   * 控制画布区域更新
   */
  forceUpdateLayout = () => {
    this.renderLayoutCount += 1;
  };

  /**
   * 控制左组件列表区域更新
   */
  forceUpdateLayer = () => {
    this.renderLayerCount += 1;
  };

  /**
   * 控制右侧配置栏面板区域更新
   */
  forceUpdateAttr = () => {
    this.renderAttrCount += 1;
  };

  /**
   * 控制组件渲染时的精确更新: 配合组件身上的_accurate_update属性使用
   */
  forceAccurateUpdate = () => {
    this.accurateCount += 1;
  };

  /**
   * 控制组件显隐时的强制刷新
   */
  forceUpdateVisible = () => {
    this.visibleCount += 1;
  };

  /**
   * v8.11控制顶级组刷新
   * */
  forceCard = () => {
    this.rootGroupCount += 1;
  };

  /**
   * 清空撤销回退栈
   */
  clearStack = () => {
    this.undoStack = [];
    this.redoStack = [];
  };

  /**
   * 更新撤销回退栈，通知编辑器刷新
   * @param undoStack
   * @param redoStack
   * @param type excute:正常执行命令 undo:执行回退命令 redo:执行重做命令 clear:执行清空栈命令
   * @returns
   */
  updateStack = (undoStack, redoStack, type) => {
    const { PageTreeStore } = this.rootStore;
    this.undoStack = undoStack;
    this.redoStack = redoStack;
    if (type === 'clear') {
      // 清空栈列表
      this.clearStack();
      //   this.forceUpdate();
      return;
    }
    let current = null;
    // 取出当前执行的命令类型
    let step = 0;
    if (type === 'excute' || type === 'redo') {
      step = 1;
      current = [...undoStack].pop();
    } else if (type === 'undo') {
      step = -1;
      current = [...redoStack].pop();
    }
    // TODO 判断当前页面是否更新
    PageTreeStore.setPageInfoStep(step);
    //
    const cmdType = current?.constructor.cmdType;
    // console.log(cmdType, type);
    // 正常执行命令操作
    if (type === 'excute') {
      // 卡片编辑器修改尺寸需要重新渲染画布大小
      if (
        this.rootStore.GlobalStore.bigScreenType === 'card' &&
        ['UpdateAttrCommand', 'DragAndMoveCommand'].includes(cmdType)
      ) {
        // v7.4 修复，像表格组件、指标文本、描述列表等组件的容器样式配置修改不需要整体更新，否则会导致下拉自动收起
        if (cmdType === 'UpdateAttrCommand' && current?.el.type !== '@yl/dataq-com-group-basic') {
          this.forceUpdateLayout();
          return;
        }

        this.forceUpdateAttr();
        return;
      }

      if (['UpdateAttrCommand', 'MoveCompsCommand', 'UpdateFieldCommand', 'CssPageCommand'].includes(cmdType)) {
        // 更新属性调用画布中当前组件的重新渲染
        this.forceUpdateLayout();
        return;
      }
      if (['DragAndMoveCommand', 'MoveCompsCommand', 'UpdateDataSourceCommand', 'MapLayersCommand'].includes(cmdType)) {
        // 拖拽组件调用右侧配置栏更新
        this.forceUpdateAttr();
        this.forceUpdateLayout();
        return;
      }
      if (['LockCommand', 'VisibleCommand', 'SortCommand'].includes(cmdType)) {
        // 更新属性调用画布中当前组件的重新渲染
        this.forceUpdateLayout();
        // 渲染左侧图层列表
        this.forceUpdateLayer();
        // v8.6.0刷新编辑器右侧样式配置栏
        if (cmdType === 'LockCommand') {
          this.forceUpdateAttr();
        }
      }

      if (['BunchingCommand', 'AddComponentCommand', 'RemoveComponentCommand'].includes(cmdType)) {
        // 新增、删除、成组对比更新
        this.forceAccurateUpdate();
      }
      // v8.12: 切换模板命令，更新属性面板
      if (['TemplateCommand'].includes(cmdType)) {
        this.forceUpdateAttr();
      }
    } else {
      // 回退重做操作
      if (
        [
          'UpdateAttrCommand',
          'MoveCompsCommand',
          'UpdateFieldCommand',
          'CssPageCommand',
          'DragAndMoveCommand',
          'UpdateDataSourceCommand',
        ].includes(cmdType)
      ) {
        // 回退重做同时需要渲染画布和右侧配置
        this.forceUpdateAttr();
        this.forceUpdateLayout();
        return;
      }

      // }
      if (['BunchingCommand', 'AddComponentCommand', 'RemoveComponentCommand'].includes(cmdType)) {
        // 新增、删除、成组对比更新
        this.forceAccurateUpdate();
        // 组内组件删除时回退需要更新组件列表
        this.forceUpdateLayer();
      }

      if (['LockCommand', 'VisibleCommand', 'SortCommand'].includes(cmdType)) {
        // 更新属性调用画布中当前组件的重新渲染
        this.forceUpdateLayout();
        // 渲染左侧图层列表
        this.forceUpdateLayer();
      }

      if (['InteractionCommand', 'MapLayersCommand', 'TemplateCommand'].includes(cmdType)) {
        this.forceUpdateAttr();
      }
    }
  };

  /**
   * 设置选中组件key
   * @param keys 被选择的组件key集合
   * @param isSearch  是否通过组件定位进行自动选中
   * @returns
   */
  setChangeKeys = (keys, isSearch = false) => {
    clearSelection();
    const {
      ControlStore,
      LayerStore,
      PageTabsStore: { selectedKey },
    } = this.rootStore;
    // 跨层级选择
    const newKeys = crossLevelSelection(keys, LayerStore, isSearch);
    // console.log('newKeys', newKeys);
    // 1. 当前key对应的组件
    const com = newKeys[0] ? getComponent(newKeys[0]) : null;
    if (isSearch && (!com || (com.appPageId && selectedKey !== com.appPageId))) {
      // console.warn(`key:${newKeys[0]}对应组件不在当前大屏中或者当前子页面中！！！`);
      message.warning('定位组件不在当前大屏中或者当前子页面中');
      return;
    }
    if (!_.isEqual(toJS(newKeys), toJS(this.changeKeys))) {
      this.changeKeys = newKeys || [];
      this.isSelectedReferenceMapComp = false;
    }
    // 画布中选中组件通知左侧组件列表进入选中状态
    window.globalEventEmitter.emit('changeKeys', this.changeKeys);

    // console.log('***********this.changeKeys******************', toJS(this.changeKeys));

    // 1.1 没有查找到组件
    if (!com) {
      console.warn(`key:${newKeys[0]}对应组件不在当前大屏中！！！`);
      return;
    }
    /* ========搜索定位时datai类型组件如果没有创建需要创建生成instance才能显示属性配置，同时需要创建父组========= */
    this.showDataIComp(com);

    // 没有选中组件或者不是从组件定位输入key值进入此方法，不需要改变图层选中
    if (!newKeys[0] || !isSearch) return;
    ControlStore.changeTabsHandler('layer', true); // 第二个参数只在此处使用 用于控制组件定位时自动打开图层列表

    // 定位组件解锁
    com.comLock && (com.comLock = false);

    // 2. 当前组件对应的图层
    const layer = LayerStore.layers.find((v) => v.layerId === com.layerId);
    if (layer) {
      // 3. 被查找组件就在当前选中图层中，不需要再改变选中
      if (layer.layerId === LayerStore.activeLayerId) return;
      // 4. 通知被查找组件所在图层为选中状态
      // setTimeout保证打开图层列表时先注册监听，再发布事件
      setTimeout(() => {
        window.globalEventEmitter.emit('layerSelect', {
          keys: [layer.key],
          layerId: layer.layerId,
        });
        // 刷新画布
        this.forceUpdateLayout();
        // v8.12.0 刷新attr
        this.forceUpdateAttr();
      }, 0);
    }
    // console.log('2***********this.changeKeys******************', toJS(this.changeKeys));
  };

  /**
   * 普通页选中引用地图组件
   * @param keys
   */
  setReferenceMapChangeKeys = (keys) => {
    this.changeKeys = keys || [];
    this.isSelectedReferenceMapComp = true;
    this.backMapAttrs({});
    this.forceUpdateAttr();
  };

  /* ========搜索定位时datai类型组件如果没有创建需要创建生成instance才能显示属性配置，同时需要创建父组========= */
  showDataIComp = (com) => {
    // v8.12 com.comInvisible判断组件是否创建不准确，有可能父组不可见，导致可见子组件也不可见
    // 1. 组件是显示状态不处理
    // if (!com.comInvisible) return;
    // 2. DOM存在说明已经创建不处理
    if ($(`[data-key="${com.key}"]`).get(0)) return;
    // 3. 设置组件是否需要创建的状态为true
    com.comCreated = true;
    // 4. 显示父组
    createParentWithLoop(com);
    // 5. 触发组件的重新渲染创建组件和父组
    this.forceUpdateVisible();
  };

  getEditComp = (editModePaths) => {
    const { LayerStore } = this.rootStore;
    const lastKey = editModePaths.at(-1);
    const editComp = LayerStore.getComponentByCurrentLayerList(lastKey);
    // if (!editComp) {
    //   editComp = getGroup(lastKey);
    // }
    return editComp;
  };

  /**
   * 获取组件列表
   * @param flag 获取选中图层组件传true
   * @returns
   */
  getCompList = (flag = false) => {
    const { LayerStore } = this.rootStore;
    let { comList } = LayerStore;
    const { currentLayerComList } = LayerStore;
    if (flag) {
      comList = currentLayerComList;
    }
    if (this.editModePaths.length > 0) {
      const editComp = this.getEditComp(this.editModePaths);
      // console.log('getCompList editComp.instance', editComp.instance);
      if (editComp) {
        // v8.5.0 新增地图编辑
        if (mapBasePlanType.includes(editComp.type)) {
          comList = [editComp];
        } else if (editComp.type === 'DynamicPanel' || editComp.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          // v8.17 折叠面板和动态面板区分
          const { activeKey } = editComp.props;
          let activeIndex = activeKey;
          console.log('getCompList activeIndex1', activeIndex);
          if (editComp.type === 'CollapsePanel') {
            activeIndex = editComp.children.findIndex((child) => child.key === activeKey);
          }
          console.log('getCompList activeIndex2', activeIndex);
          comList = editComp.children[activeIndex].AntdChildComponents;
          console.log('getCompList comList', comList);
        } else if (editComp.type === '@yl/dataq-com-group-basic' || editComp?.isDragContainer) {
          comList = editComp.childComList;
        }
      }
    }
    return comList;
  };

  /**
   * 切换动态面板组件中的面板
   * @param activeKey
   */
  changeDynamicPanelActive = (activeKey: number | string) => {
    if (activeKey !== this.prevDynamicPanelActive) {
      this.dynamicPanelCount++;
    }
    this.prevDynamicPanelActive = activeKey;
  };

  /**
   * 进入动态面板编辑界面
   * @param key
   */
  setDynamicPanelEditComp = (key) => {
    this.dynamicPanelEditComp = key;
    // this.forceUpdate();
  };

  /**
   *
   * @param paths 右键编辑的组件key(editModePath)
   * @param duration 进入组编辑器动画时间
   */
  setEditModePath = (paths, duration = 500) => {
    // this.editModeAnimeRunning = true; //记录动画进行状态
    const editComp = this.getEditComp(paths);
    anime({
      targets: '.render-console',
      easing: 'easeInOutExpo',
      scale: 0,
      duration,
      complete: () => {
        runInAction(() => {
          // console.log('editComp', editComp);
          if (editComp) {
            deepDestoryInstance(editComp);
          } else {
            for (const item of this.rootStore.LayerStore.comList) {
              deepDestoryInstance(item);
            }
          }
          this.editModePaths = paths;
          // v8.5.0 退出编辑态，或者编辑态组件不是地图，都认为是介绍地图编辑
          this.isEditMap = !(paths.length === 0 || (editComp && !mapBasePlanType.includes(editComp.type)));
          // v7.9 清空组件
          this.setChangeKeys([], false);
          this.setDynamicPanelEditComp('');
          // this.forceUpdate();
          this.forceAccurateUpdate();
        });
        anime({
          targets: '.render-console',
          easing: 'easeInOutExpo',
          scale: 1,
          duration,
        });
      },
    });
  };

  /**
   * v8.5.0退出编辑模式，切换页面时需要先退出编辑模式
   */
  exitEditMode = () => {
    this.editModePaths = [];
    this.isEditMap = false;
    this.setChangeKeys([], false);
    this.setDynamicPanelEditComp('');
  };

  /**
   * 追加选中组件
   * @param key
   * @param groupKey
   */
  addChangeComponents = (key) => {
    this.rootStore.MapStore.backMapAttr();
    // this.changeItemParentKey = undefined;
    // v7.9 选中组件
    const keys = [...this.changeKeys, ...key];
    const res = this.deepIsActiveKey(keys);
    if (res) {
      /**
       * 修复从画布多选组件成组时，成组的位置无法以当前位置最靠前的为准，而是以第一个选中的位置为准。
       * 保持跟左侧组件树一致的操作，以位置靠前的组件或者组为准。
       */
      const index = keys.indexOf(res.key);
      keys.splice(index, 1);
      keys.unshift(res.key);
      this.setChangeKeys(keys, false);
    } else {
      // this.setChangeKeys([...this.changeKeys, ...key], false);
      this.setChangeKeys(keys, false);
    }
  };

  deepIsActiveKey = (keys) => {
    const res = this.getCompList(true).find((item) => keys.includes(item.key));
    return res;
  };

  /**
   * 选中组件
   * @param key
   * @returns
   */
  changeComponents = (key) => {
    if (_.isEqual(key, this.changeKeys)) return;
    this.rootStore.MapStore.backMapAttr();
    const list = this.getCompList(true).filter((vl) => {
      return key.indexOf(vl) >= -1;
    });
    // this.changeItemParentKey = undefined;
    // 点击的组件在选中图层才需要被记录
    if (list.length > 0) {
      // 7.4 修复成组后组件层级顺序不是原顺序的问题
      if (key?.length > 1) {
        // 多选
        const keys = new Set(new Set(key));
        const newKeys = [];
        const loop = (tree) => {
          for (const item of tree) {
            if (keys.has(item.key)) newKeys.push(item.key);
            if (item.childComList?.length) {
              loop(item.childComList);
            }
          }
        };
        loop(list);
        // v7.9 选中组件
        this.setChangeKeys(newKeys, false);
      } else {
        // v7.9 选中组件
        this.setChangeKeys([...key], false);
      }
    }

    // 切换选中组件时，刷新antd和datai组件配置栏，解决相同类型的组件配置栏不更新数据问题
    // 刷新区域见AntdAttr和ComponentAttr中使用 renderAttrCount 属性的位置
    this.forceUpdateAttr();
  };

  backMapAttrs = (layer) => {
    this.rootStore.MapStore.backMapAttr(layer);
  };

  updateCss = (field, value) => {
    // let reg = /translate/g;
    // if (value.indexOf('(p') >= 0) {
    //   value = value.replace('(px', '(0px');
    // }
    // let key = this.changeKeys[0];
    // let item = getComponentByCurrentLayerList(key);
    // item.cssStyle[field] = value;
    // let css = Object.assign({}, item.cssStyle);
    // item.cssStyle = css;
    // item.instance.render();
    // $(`[data-key="${key}"]`).css(item.cssStyle);
    // this.renderAttrCount += 1;
    // let currentRenderAttrCount = this.renderAttrCount;
    // this.renderAttrCount = currentRenderAttrCount;
  };

  getMapChildLayer = () => {
    const item = this.changeKeys[0];
    // 这里容易出bug，思考下什么原因导致的
    // return item ? item.layers || [] : [];
  };

  setScreenLoaded = () => {
    this.screenConfigLoaded += 1;
  };

  /**
   * 设置是否按下空格键
   * @param bool 是否按下空格
   */
  setIsSpaceDown = (bool: boolean) => {
    this.isSpaceDown = bool;
  };

  /**
   * 进入编辑态
   * @param keys
   * @param duration
   * @returns
   */
  SetEditMode = (keys, duration = 500) => {
    const { setEditModePath, editModePaths, setDynamicPanelEditComp, rootStore } = this;
    const { getComponentByCurrentLayerList } = rootStore.LayerStore;
    const waitEditComp = keys.map((key) => {
      const comp = getComponentByCurrentLayerList(key);
      return comp;
    })[0];

    // v8.5.0 新增地图支持编辑
    // v8.17 新增折叠面板
    if (
      waitEditComp &&
      (waitEditComp.type === 'DynamicPanel' ||
        waitEditComp.type === 'CollapsePanel' ||
        waitEditComp.type === '@yl/dataq-com-group-basic' ||
        waitEditComp?.isDragContainer ||
        mapBasePlanType.includes(waitEditComp.type))
    ) {
      if (waitEditComp.type === 'DynamicPanel' || waitEditComp.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        setDynamicPanelEditComp(waitEditComp.key);
      }
      const newEditModePath = JSON.parse(JSON.stringify(editModePaths));
      if (newEditModePath.at(-1) === waitEditComp.key) return;
      newEditModePath.push(waitEditComp.key);
      setEditModePath(newEditModePath, duration);
    } else {
      message.error('只能编辑组以及动态面板');
    }
  };

  /**
   * 卡片进入编辑态
   */
  setCardEditMode = () => {
    const { LayerStore, GlobalStore } = this.rootStore;
    if (window.componentList.length > 0) {
      const changeKeys = [];
      let group = null;
      if (window.componentList.length === 1 && window.componentList[0].type === '@yl/dataq-com-group-basic') {
        group = window.componentList[0];
      } else {
        // 新建卡片自动成组
        const keys = window.componentList.map((item) => {
          return item.key;
        });
        group = bunchFn(LayerStore, {}, GlobalStore.bigScreenType, keys);
        // 新组的key需要加入到DataI的组件映射
        DataI.addComKeyMap(group);
      }
      if (group) {
        changeKeys.push(group.key);
        // v7.9 选中组件
        this.setChangeKeys([group.key]);
        this.SetEditMode(this.changeKeys, 0);
      }
    }
  };

  /*
   * 设置缩放级别
   * @param num 缩放级别
   */
  setZoom = (num) => {
    this.zoom = num;
  };

  /**
   * 刷新所有
   */
  forceUpdate = () => {
    this.forceUpdateLayer();
    this.forceUpdateLayout();
    this.forceAccurateUpdate();
    this.forceUpdateAttr();
  };

  /**
   * v8.5.0 获取当前地图信息，并同步到地图
   */
  saveMapInfo = (isSave) => {
    if (this.isEditMap) {
      // 获取当前被编辑地图信息
      let centerArr, zoomValue, rotation, pitch, attr;
      const editComp = this.getEditComp(this.editModePaths);
      // console.log('editComp', editComp);
      if (editComp && editComp.instance && editComp.instance._map) {
        switch (editComp.englishName) {
          case 'MapFoundationPlan': {
            attr = editComp.instance.compAttr;
            // console.log('attr', attr);
            centerArr = editComp.instance._map.getCenter();
            zoomValue = editComp.instance._map.getZoom();

            break;
          }
          case 'MapGlFoundationPlan': {
            centerArr = editComp.instance._map.getCenter();
            zoomValue = editComp.instance._map.getZoom();
            rotation = editComp.instance._map.getRotation();
            pitch = editComp.instance._map.getPitch();

            break;
          }
          case 'Map3DFoundationPlan': {
            centerArr = editComp.instance._map.getCenter();
            zoomValue = editComp.instance._map.getZoom();
            rotation = editComp.instance._map.getRotation();
            pitch = editComp.instance._map.getPitch();

            break;
          }
          default: {
            break;
          }
        }
      }
      // console.log('centerArr', centerArr);
      // console.log('zoomValue', zoomValue);
      // console.log('rotation', rotation);
      // console.log('pitch', pitch);
      // console.log('attr', attr);
      // 保存到对应页面组件列表信息
      const { PageTreeStore } = this.rootStore;
      const { setPageInfoStep } = PageTreeStore;
      let newAttr;
      const mapCom = editComp;
      // console.log('mapCom', mapCom);
      switch (mapCom.englishName) {
        case 'MapFoundationPlan': {
          newAttr = {
            extent: {
              longitude: Number(centerArr[0]),
              latitude: Number(centerArr[1]),
            },
            zoom: {
              isZoom: attr.zoom.isZoom,
              value: zoomValue,
            },
          };

          break;
        }
        case 'MapGlFoundationPlan': {
          newAttr = {
            longitude: Number(centerArr[0]),
            latitude: Number(centerArr[1]),
            zoom: zoomValue,
            pitch,
            rotation,
          };

          break;
        }
        case 'Map3DFoundationPlan': {
          newAttr = {
            longitude: Number(centerArr[0]),
            latitude: Number(centerArr[1]),
            zoom: zoomValue,
            pitch,
            rotation,
          };

          break;
        }
        default: {
          break;
        }
      }
      // 有实例同步值到实例
      if (mapCom.instance) {
        mapCom.instance.mergeAttr(newAttr);
      }
      // 同步值到_attr
      mapCom._attr = {
        ...mapCom.preAttr._attr,
        ...newAttr,
      };
      mapCom.preAttr._attr = JSON.parse(JSON.stringify(mapCom._attr));
      if (!isSave) {
        setPageInfoStep(1);
      }
    }
  };
}

export default EditorStore;
