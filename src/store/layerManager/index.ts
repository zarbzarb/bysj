import { Modal } from 'antd';
import { makeObservable, toJS, action, observable, computed } from 'mobx';
import _ from 'lodash';
import { generateId } from '@/utils/random';
import { initComs } from '@/utils/initComs';

const { confirm } = Modal;
/**
 * 删除图层弹框
 * @param componentList
 * @param layerId
 * @param callBackFn
 */
const DelLayerCompByLayerId = (componentList, layerId, callBackFn) => {
  // 获取删除图层的组件
  const waitRemoveComp = componentList.filter((item) => item.layerId === layerId);
  const titleStr = '删除图层，配置的内容将被清空，请确认删除！';
  const delStr = `关联子组件：${waitRemoveComp
    .map((vl) => {
      return vl.compName || vl.name;
    })
    .join(',')}`;
  confirm({
    getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
    title: titleStr,
    content: delStr,
    className: 'del-notice-modal',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      callBackFn(waitRemoveComp);
    },
    onCancel() {},
  });
};
// 图层节点数据
export interface LayerItem {
  title: string;
  layerId: string; // 对应图层唯一标识
  layerName: string; // 图层名称
  layerLevel: number; // 图层层级
  key: string; // 图层key
  isDefault: boolean; // 是否默认
  editing: boolean; // 是否可以编辑
  visible: boolean; // 是否可见
  // selectable: boolean; // 是否可选择
  children: []; // 子节点
}
/**
 * 图层管理
 */
export default class LayerManagerStore {
  @observable rootStore;

  @observable appPageId = '';

  // 默认基础图层ID
  @observable defaultLayerId = String(Date.now());

  // 当前选中图层ID
  @observable activeLayerId = this.defaultLayerId;

  // 图层列表，自定义页面默认有一个基础图层
  @observable layers = [
    {
      layerId: this.defaultLayerId,
      layerName: '基础图层',
      layerLevel: 1,
      key: String(generateId()),
      isDefault: true,
      children: [],
      editing: false,
      visible: true,
      // selectable: true,
    },
  ] as Array<LayerItem>;

  // 图层组件列表映射  [ {layerId:12345643212345,componentList:[]}]
  @observable.shallow layerComList = [];

  // 选中图层组件列表
  @observable.shallow currentLayerComList = [];

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  // 渲染依赖组件列表(完整当前页面组件列表)
  @computed get comList() {
    // const { bigScreenType } = this.rootStore.GlobalStore;
    const list = this.layerComList.flatMap((layer) => {
      return layer.componentList || [];
    });
    // if (bigScreenType !== 'card') {
    //   window.componentList = list;
    // }
    // console.log('comList list', list);
    window.componentList = list;
    return list;
  }

  /**
   * 设置页面id
   */
  @action setAppPageId = (appPageId) => {
    this.appPageId = appPageId;
  };

  /**
   * 重置属性
   */
  @action reset = () => {
    this.layerComList = [];
    this.currentLayerComList = [];
  };

  /**
   * 新建图层
   * @param layerName 图层名称
   * @param editing 是否可编辑
   * @returns
   */
  @action createLayer = (layerName = '新建图层', editing = false) => {
    const newLayer = {
      layerId: Date.now() - Math.floor(Math.random() * 10_000 + 9999),
      layerName,
      layerLevel: 1,
      key: String(generateId()),
      isDefault: false,
      children: [],
      editing,
      visible: true,
      // selectable: false,
    };
    return newLayer;
  };

  /**
   * 删除图层
   * @param layerId 删除图层id
   * @param callback 删除回调函数
   */
  @action delLayer = (layerId, callback) => {
    DelLayerCompByLayerId(this.comList, layerId, callback);
  };

  /**
   * 设置图层是否可见
   * @param layerId 图层id
   * @param visible 是否可见
   */
  @action toggleLayerVisible = (layerId, visible) => {
    const waitInvisibleComp = this.comList.filter((item) => item.layerId === layerId);
    this.visibleWithLoop(waitInvisibleComp, !visible);
  };

  /**
   * 从后台数据更新默认图层id
   * @param layerId 图层id
   */
  @action updateDefaultLayerId = (layerId) => {
    const { GlobalStore } = this.rootStore;
    this.defaultLayerId = layerId;
    // TODO 8.0 多页面需要处理 当前页面
    GlobalStore.updateScreenConfig(layerId, 'defaultLayerId', 'layerConfig');
  };

  /**
   * 更新图层列表信息
   * @param layers
   * @param waitRemoveComp
   */
  @action updateLayersState = (layers, waitRemoveComp = []) => {
    const { GlobalStore } = this.rootStore;
    // 删除selectable属性，不需要使用
    const newLayers = layers.map((layerItem) => {
      delete layerItem.selectable;
      return layerItem;
    });
    this.layers = newLayers;
    // 更新图层配置
    // TODO 8.0 多页面需要处理 当前页面
    GlobalStore.updateScreenConfig(toJS(newLayers), 'layers', 'layerConfig');

    // 添加新建图层数据结构
    this.layerComList = this.layers.map((layer) => {
      let componentList = this.comList.filter((com) => com.layerId === layer.layerId);
      if (componentList.length === 0) {
        componentList = waitRemoveComp;
      }
      return {
        layerId: layer.layerId,
        layerName: layer.layerName,
        visible: layer.visible,
        componentList,
      };
    });
  };

  /**
   * 选中图层时更新选中图层layerId
   * @param layerId
   */
  @action changeActiveLayerId = (layerId) => {
    const { GlobalStore } = this.rootStore;

    this.activeLayerId = layerId;
    // 查询当前选中图层,获取选中图层的组件
    const current = this.layerComList.find((layer) => layer.layerId === layerId);
    this.updateCurrentLayerComList(current?.componentList || []);
    this.lockLayers(layerId);
    // TODO 8.0 多页面需要处理 当前页面
    GlobalStore.updateScreenConfig(layerId, 'activeLayerId', 'layerConfig');
  };

  /**
   * 非选中图层上锁
   * @param {选中图层的id} layerId
   */
  @action lockLayers = (layerId) => {
    const { comList } = this; // window.componentList;
    // 未选中图层所有组件列表
    const lockList = comList.filter((v) => v.layerId !== layerId);
    // 选中图层组件列表
    const unLockList = comList.filter((v) => v.layerId === layerId);
    // // 未选中图层所有组件key
    // const lockKeys = lockList.map((v) => v.key);
    // // 选中图层所有组件的key
    // const unlockKeys = unLockList.map((v) => v.key);

    // 锁定非选中图层组件
    // lock(lockKeys);
    // 自动解锁选中图层组件
    // unLock(unlockKeys);

    // for (const com of lockList) com.comLock = true;
    // for (const com of unLockList) com.comLock = false;
    for (const com of lockList) com.layerLock = true;
    for (const com of unLockList) com.layerLock = false;
  };

  /**
   * 1. 拖动图层时移动组件在componentlist中的位置
   * 2. 改变组件位置重新渲染时会更新z-index
   * @param dragLayerId  拖动图层id
   * @param dragStartIndex
   */
  @action dragChangeComponentList = (dragLayerId, dragStartIndex) => {
    // 所有组件数组
    const { comList, layers } = this; // window.componentList;
    // 所有组件layerId数组，单独取出便于查找索引
    const layerIdList = comList.map((v) => v.layerId);
    // 需要在componentlist中被整体移动位置的组件列表
    const waitMoveComList = comList.filter((v) => v.layerId === dragLayerId);
    // 被移动位置的组件列表起始索引
    const waitMoveStartIndex = layerIdList.indexOf(dragLayerId);
    // console.log(waitMoveStartIndex, waitMoveComList.length);
    // 先从原组件列表中删除这一部分需要移动位置的组件
    comList.splice(waitMoveStartIndex, waitMoveComList.length);

    // 图层拖动后新的索引
    const dragEndIndex = layers.findIndex(({ layerId }) => layerId === dragLayerId);
    let targetLayerId; // 被插入图层layerId
    let targetIndex; // 被移动组件需要放到指定索引
    if (dragEndIndex > dragStartIndex) {
      // console.log('从上向下移动', dragEndIndex - 1);
      // 从上向下拖动
      targetLayerId = layers[dragEndIndex - 1].layerId;
      targetIndex = layerIdList.lastIndexOf(targetLayerId);

      // 将被删除(需要被移动)的组件插入到组件列表指定位置
      comList.splice(targetIndex + 1, 0, ...waitMoveComList);
    } else {
      // console.log('从下向上移动', dragEndIndex + 1);
      // 从下向上拖动
      targetLayerId = layers[dragEndIndex + 1].layerId;
      targetIndex = layerIdList.indexOf(targetLayerId);

      // 将被删除(需要被移动)的组件插入到组件列表指定位置
      comList.splice(targetIndex, 0, ...waitMoveComList);
    }

    // window.componentList = comList;
    this.updateComList(comList);
    // console.log(waitMoveStartIndex, waitMoveComList, comList);

    // console.log(
    //   dragLayerId,
    //   targetLayerId,
    //   dragStartIndex,
    //   dragEndIndex,
    //   targetIndex
    // );
  };

  /**
   * 更新单个组件
   * @param com
   */
  @action updateComponent = (com) => {
    const comp = com;
    const componentList = this.currentLayerComList;
    function findList(array) {
      const list = array;
      for (const [idx, l] of list.entries()) {
        if (comp.key === l.key) {
          list[idx] = comp;
        } else {
          if (l.classType === 'group') {
            findList(l.childComList);
          }
          if (l.type === 'DynamicPanel' || l.type === 'CollapsePanel') {
            // v8.17 新增折叠面板
            for (const child of l.children) {
              findList(child.AntdChildComponents);
            }
          }
        }
      }
    }
    findList(componentList);
    this.updateCurrentLayerComList(componentList || []);
  };

  /**
   * 子图层数据合并
   * @param list
   */
  @action updateLayerComList = (list) => {
    const { bigScreenType } = this.rootStore.GlobalStore;
    // 将子图层列表映射为 layerId: componentList
    const layerMap = {};
    for (const l of list) {
      layerMap[l.layerId] = l.componentList;
    }
    // console.log(this.currentLayerComList);

    // 更新本地LayerComList组件列表
    for (const layer of this.layerComList) {
      const componentList = layerMap[layer.layerId];
      // 其他图层数据取最新获取的
      if (componentList) {
        layer.componentList = componentList;
        for (const c of layer.componentList) c.comLock = true;
        // 请求了其他图层最新数据，需要渲染到页面则需要初始化组件
        initComs(layer.componentList, this.activeLayerId, bigScreenType);
      }

      // 当前图层数据取本地的
      if (layer.layerId === this.activeLayerId) {
        layer.componentList = this.currentLayerComList;
      }
    }
  };

  /**
   * 将总数据分离成子图层数据,只在获取大屏总数据后调用
   * @param list
   */
  @action updateComList = (list) => {
    this.layerComList = this.layers.map((layer) => {
      return {
        layerId: layer.layerId,
        layerName: layer.layerName,
        visible: layer.visible,
        componentList: list.filter((com) => com.layerId === layer.layerId),
      };
    });
    // console.log('updateComList this.layerComList', toJS(this.layerComList));
  };

  /**
   * 所有需要对组件列表进行操作，都调用次函数操作当前图层数据(增加、删除、移动、成组、复制)
   * @param currentLayerComList
   */
  @action updateCurrentLayerComList = (currentLayerComList = []) => {
    // console.log('updateCurrentLayerComList', currentLayerComList);
    this.currentLayerComList = currentLayerComList;
    for (const l of this.layerComList) {
      if (l.layerId === this.activeLayerId) {
        l.componentList = [...this.currentLayerComList];
      }
    }
    // 解决 shallow 浅观察  造成单个组件成组不重新渲染问题
    this.layerComList = [...this.layerComList];
    // console.log(this.layerComList);
  };

  /**
   * 更新指定图层的组件列表
   * @param layerId
   * @param list
   */
  @action updateComponentList = (layerId, list) => {
    for (const l of this.layerComList) {
      if (l.layerId === layerId) {
        l.componentList = [...list];
      }
    }
    // 解决 shallow 浅观察  造成单个组件成组不重新渲染问题
    // console.log('updateComponentList');
    this.layerComList = [...this.layerComList];
  };

  /**
   * 依据key值从组件列表里获取第一个组件
   * @param key 组件key
   * @param comList 组件列表
   * @returns
   */
  getComponent = (key, comList?) => {
    // const { bigScreenType } = this.rootStore.GlobalStore;
    let list = comList;
    if (!comList) {
      list = this.comList;
    }
    // 临时处理
    // if (bigScreenType === 'card' && !comList) {
    //   return window.DataI.getComList(key, window.componentList)[0];
    // }
    const compList = window.DataI.getComList(key, list);
    return key && compList && compList.length > 0 ? compList[0] : null;
  };

  /**
   * 依据key值从当前图层获取第一个组件
   * @param keys
   * @returns {any}
   */
  getComponentByCurrentLayerList = (keys) => {
    const list = this.currentLayerComList;
    return this.getComponent(keys, list);
  };

  /**
   * 设置父祖是否可见
   * @param comp
   */
  visibleParentLoop = (comp) => {
    if (comp.groupKey) {
      const parent = this.getComponentByCurrentLayerList(comp.groupKey);
      parent.comInvisible = false;
      this.visibleParentLoop(parent);
    }
  };

  /**
   * 设置组件是否可见
   * @param comps
   * @param visible
   */
  visibleWithLoop = (comps, visible) => {
    comps.forEach((com) => {
      com.comInvisible = visible;
      // 子组件显示时，父组件应该为显示状态
      if (!visible) {
        this.visibleParentLoop(com);
      }
      // 组件为组时，设置所有子组件显示状态一致
      if (com.classType === 'group' || com?.isDragContainer) {
        this.visibleWithLoop(com.childComList, visible);
      }
      // 组件未动态面板时，设置所有子面板的字组件显示状态一致
      if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        com.children.forEach((element) => {
          this.visibleWithLoop(element.AntdChildComponents, visible);
        });
      }
    });
  };

  /**
   * 获取所有组件id，只考虑组，不考虑动态面板
   * @returns
   */
  getAllIds = () => {
    const item = [];
    function findInList(list = []) {
      list.forEach((cp) => {
        item.push(cp.key);
        if (cp.classType === 'group') {
          findInList(cp.childComList || []);
        }
      });
    }
    findInList(this.comList || []); // 遍历查找所有的组件key
    return item;
  };

  /**
   * 重置组件层级
   * @param componentList
   */
  resetComponentLevel = (componentList) => {
    componentList.forEach((com) => com.groupKey && delete com.groupKey);
    let level = 0;
    const loopAddLevel = (list) => {
      level++;
      list.forEach((child) => {
        // componentList上的组件没有groupKey,level为1
        if (child.groupKey) {
          const parent = this.getComponent(child.groupKey, componentList);
          if (parent) {
            child.level = parent.level + 1;
          } else {
            child.level = 1;
            console.warn(`组件: ${child.key} 父组件未知!`);
          }
        } else {
          level = 1;
          child.level = level;
        }

        if (child.classType === 'group') {
          loopAddLevel(child.childComList);
        }
      });
    };
    loopAddLevel(componentList);

    // 兼容老大屏组件上没有level，导致二级组同层级level在递增
    // 同层级分组level取第一个分组的level
    const loopReplaceLevel = (list) => {
      list.forEach((com) => {
        if (com.classType === 'group' && com.childComList.length > 0) {
          const firstLevel = com.childComList[0].level;
          com.childComList.forEach((child) => {
            child.level = firstLevel;
          });
          loopReplaceLevel(com.childComList);
        }
      });
    };
    loopReplaceLevel(componentList);
  };

  // 删除组件
  removeComponent = (keys, list, type) => {
    if (typeof keys === 'string') {
      keys = [keys];
    }
    let newComList = [];
    const removedList = [];

    function filterList(array) {
      return array.filter((l) => {
        if (_.indexOf(keys, l.key) > -1) {
          removedList.push(l);
          return false;
        }
        if (l.classType === 'group') {
          l.childComList = filterList(l.childComList);
        }
        if (l.type === 'DynamicPanel' || l.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          l.children.forEach((child) => {
            child.AntdChildComponents = filterList(child.AntdChildComponents);
          });
        }
        return true;
      });
    }
    newComList = filterList(list);

    // if (type === 'card') {
    //   window.componentList = newComList;
    // } else {
    //   this.updateCurrentLayerComList(newComList || []);
    // }
    this.updateCurrentLayerComList(newComList || []);

    return removedList;
  };

  removeComponentByCurrentLayerList = (keys) => {
    const { bigScreenType } = this.rootStore.GlobalStore;
    // let list = window.componentList;
    // if (bigScreenType !== 'card') {
    //   list = this.currentLayerComList;
    // }
    const list = this.currentLayerComList;
    return this.removeComponent(keys, list, bigScreenType);
  };
}
