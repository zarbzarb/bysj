import React, { useState, useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { useStore } from '@/hooks';
import { isEqual } from 'lodash';
import './index.less';
import { handleDragDrop } from '@/utils/configPageUtils';
import DataI from '@/utils/global-api';
import GroupLayer from './GroupLayer';
import ComponentLayer from './ComponentLayer';
import CustomListLayer from './CustomListLayer';
import TopBarTools from '../TopBarTools';
import MapReference from './MapReference';

const getComponent = DataI.getComponentByKey;

function filterNode(node, filterFunc) {
  // if (item.classType === 'group' || item.isDragContainer) {
  //   loop(item.childComList, callback);
  // } else if (item.type === 'DynamicPanel') {
  //   item.children.forEach((child) => {
  //     loop(child.AntdChildComponents, cb);
  //   });
  // }
  const children = node.childComList || [];
  const filteredChildren = [];

  for (const child of children) {
    const filteredChild = filterNode(child, filterFunc);
    if (filteredChild) {
      filteredChildren.push(filteredChild);
    }
  }

  const shouldIncludeNode = filterFunc(node);

  if (shouldIncludeNode || filteredChildren.length > 0) {
    return { ...node, childComList: filteredChildren };
  }

  return null;
}
// filterTree函数接受一个树和一个过滤条件函数，返回一个搜索树
function filterTree(rootNodes, filterFunc) {
  const filteredRootNodes = [];

  for (const rootNode of rootNodes) {
    const filteredRootNode = filterNode(rootNode, filterFunc);
    if (filteredRootNode) {
      filteredRootNodes.push(filteredRootNode);
    }
  }

  return filteredRootNodes;
}
/*
 * @Author: 赵晶晶
 * 组件列表
 */
interface IProps {
  onContextMenu: (e) => void; // 显示右键菜单
  bigScreenType?: string;
}

let currentItemDragStartClientX = 0;

const CompTree = (props: IProps) => {
  const { onContextMenu, bigScreenType } = props;
  const {
    // controlStore,
    editorStore,
    pageTreeStore: { isHomePage },
  } = useStore();
  const {
    changeKeys,
    renderLayerCount, // v8.6.0 支持左组件列表区域更新
    setReferenceMapChangeKeys,
    changeComponents,
    editModePaths,
    getEditComp,
    forceAccurateUpdate,
    forceUpdateAttr,
    getCompList,
  } = editorStore;

  const overRef = useRef(null);
  const draggedRef = useRef(null);
  const layerRef = useRef(null);
  const [selectedKeys, setSelectedKeys] = useState(changeKeys || []);
  // console.log('CompTree');
  const componentList = getCompList(true);
  const [dragCount, setDragCount] = useState(0); // 用来记录每次拖动的记录，拖动完成后更新选中状态的颜色
  const [groupInnerLine, setGroupInnerLine] = useState(null); // 组件移动到组内展示的底部的线

  // 是否搜索状态
  const [keyWord, setKeyWord] = useState('');
  const [searchTree, setSearchTree] = useState(componentList);
  /**
   * 组件拖动到顶部和底部滚动条跟着滚动
   * 拖动的缓冲区不超过一个item的高度(62px)，设置的是42，让缓冲区域更小
   */

  const dragTopBottomScroll = (e) => {
    const layerBox = layerRef.current;

    const speed = 2;

    // 当组件拖动到顶部的时候向上滚动
    if (e.clientY - layerBox.offsetTop < 42) {
      layerBox.scrollTop -= speed;
    }

    // 当组件拖动到底部的时候向下滚动
    if (window.innerHeight - e.clientY - 30 < 42) {
      layerBox.scrollTop += speed;
    }
  };

  // 判断组件是否移动到组内，如果是则给一根标识线
  const GroupInnerFn = (e) => {
    const childNodes = [...e.target.childNodes];
    const bottomPartLine: HTMLElement | undefined | any = childNodes.find((item: any) =>
      item.classList.contains('bottom-part-line'),
    );

    const moveSite = e.clientX - currentItemDragStartClientX > layerRef.current.offsetWidth / 10 && 'childNode';

    if (moveSite === 'childNode') {
      // 如果移动到组内，则显示组内线
      if (bottomPartLine) {
        setGroupInnerLine(bottomPartLine);
        bottomPartLine.style.display = 'block';
        overRef.current?.classList.remove('drag-up', 'drag-down');
      }
    } else {
      // 如果移动到组外，则隐藏组内线
      if (bottomPartLine) {
        bottomPartLine.style.display = 'none';
      }
      setGroupInnerLine(null);
    }
  };

  /**
   * 拖拽
   * @param e
   */
  const onDragOver = (e) => {
    dragTopBottomScroll(e);
    e.preventDefault();
    const animateName = 'drag-down';
    if (overRef.current && e.target.dataset.item !== overRef.current?.dataset?.item) {
      overRef.current?.classList.remove('drag-up', 'drag-down');
      if (groupInnerLine) {
        groupInnerLine.style.display = 'none';
      }
    }
    // 排除没有data-item的元素
    if (!e.target.classList.contains(animateName) && e.target.dataset.item) {
      e.target.classList.add(animateName);
      overRef.current = e.target;
      if (!(window as any).isComponentListDrag) {
        GroupInnerFn(e);
      }
    }
    // if (!e.target.dataset.item) {
    //   overRef.current = null;
    // }
  };

  // 组件拖拽
  const dragCommonFn = (e, sourceItem, isOldSelectedComp) => {
    // 判断拖动的x坐标值是否超过容器宽度的十分之一
    const moveSite = e.clientX - currentItemDragStartClientX > layerRef.current.offsetWidth / 10 && 'childNode';
    if (moveSite === 'childNode') {
      if (groupInnerLine) {
        groupInnerLine.style.display = 'none';
      }
      setGroupInnerLine(null);
    }
    // draggedRef.current.style.display = 'flex';
    e.target.classList.remove('drag-up');
    e.target.classList.remove('drag-down');
    if (overRef.current.dataset.item === 'com-operation-sort') {
      // 拖到上下移动置顶置底按钮那里，表示拖到组件列表第一个去
      handleDragDrop(changeKeys.length > 1 && isOldSelectedComp ? changeKeys : sourceItem, null, editorStore);
      // handleDragDrop(sourceItem, null, editorStore);
    } else {
      const targetItem = JSON.parse(overRef.current.dataset.item || {});
      targetItem.isOpen = overRef.current.classList.contains('open'); // 目标组是否展开
      const targetParent = getComponent(targetItem.groupKey);

      if (sourceItem.key === targetItem.key) {
        return;
      }
      if (
        (['CustomList', 'CustomCell'].includes(targetItem.type) ||
          ['CustomList', 'CustomCell'].includes(targetParent?.type)) &&
        !['Text', 'Images', 'Statistic'].includes(sourceItem.type) &&
        !['MediaImageDynamic', 'MediaImageBasic', 'ProgressBar'].includes(sourceItem.englishName)
      ) {
        // 只有文本、URL 图片等几个组件，允许拖入自定义列表组件
        return;
      }
      if (editModePaths.length > 0) {
        sourceItem.parentKey = draggedRef.current.dataset.parent
          ? draggedRef.current.dataset.parent
          : getEditComp(editModePaths).key;
        targetItem.parentKey = overRef.current.dataset.parent
          ? overRef.current.dataset.parent
          : getEditComp(editModePaths).key;
      } else {
        if (draggedRef.current.dataset.parent) {
          sourceItem.parentKey = draggedRef.current.dataset.parent;
        }
        if (overRef.current.dataset.parent) {
          targetItem.parentKey = overRef.current.dataset.parent;
        }
      }
      handleDragDrop(
        changeKeys.length > 1 && isOldSelectedComp ? changeKeys : sourceItem,
        targetItem,
        editorStore,
        moveSite,
      );
      // handleDragDrop(sourceItem, targetItem, editorStore, moveSite);
    }
    forceAccurateUpdate();
    forceUpdateAttr();
    setDragCount((count) => count + 1);
  };

  /**
   * 选中组件
   * @param evt
   * @param item
   * @param isNotSelectedDrag 只有一种场景用到，拖拽的组件不是选中的组件，需要借助这个方法对画布组件进行一个选中的效果
   * @returns
   */
  const changeInstance = (evt, item, isNotSelectedDrag = false) => {
    // 单选组件
    let keys = [item.key];
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    // 多选组件
    if (isCtrl) {
      const curChangeKeys = selectedKeys; // toJS(ComStore.changeKeys);
      // 复点击需要取消选中组件, 未选中需要选中组件
      keys = curChangeKeys.includes(item.key)
        ? curChangeKeys.filter((key) => {
            return key !== item.key;
          })
        : [item.key, ...curChangeKeys];
    } else {
      // 单选取消选中
      $('.com-change').removeClass('com-change');
      $('.group-change').removeClass('group-change');
    }
    $(`.dom-container[data-key="${item.key}"]`).addClass(item.classType === 'group' ? 'group-change' : 'com-change');
    if (isEqual(selectedKeys, keys)) return;
    setSelectedKeys(keys);
    //
    if (isEqual(toJS(changeKeys), keys)) return;
    // console.log('changeInstance changeComponents keys', keys);
    changeComponents(keys);
    // // 延时同步数据
    // const timer = setTimeout(() => {
    //   if (isEqual(changeKeys, selectedKeys)) return;
    //   changeComponents(selectedKeys);
    //   clearTimeout(timer);
    // }, 100);

    if (isNotSelectedDrag) {
      dragCommonFn(evt, item, false);
    }

    // ========== 选中组件时，如果组件是隐藏状态且没有被创建，需要创建组件生成instance =========
    // v8.12 com.comInvisible判断组件是否创建不准确，有可能父组不可见，导致可见子组件也不可见
    // 1. 组件是显示状态不处理
    // if (!item.comInvisible) return;
    // 2. DOM存在说明已经创建不处理
    if ($(`[data-key="${item.key}"]`).get(0)) return;
    // 3. 组件未创建状态点击时需要强制渲染进行创建
    if (!item.comCreated) {
      item._accurate_update = true;
    }
    // 4. 设置组件是否需要创建的状态为true
    item.comCreated = true;
    // 5. 非datai类型组件不需要重新渲染创建
    if (!['com', 'group'].includes(item.classType)) return;
    // 6. 触发组件的重新渲染生成instance
    editorStore.forceUpdateVisible();
    // console.log('forceUpdateVisible');
  };

  /**
   * 拖拽开始
   * @param e
   */
  const dragStart = (e) => {
    currentItemDragStartClientX = e.clientX;
    draggedRef.current = e.currentTarget;
  };

  /**
   * 拖拽结束
   */
  const dragEnd = (e) => {
    if (overRef.current) {
      // 清除 dragOver 提示线
      overRef.current.classList.remove('drag-up');
      overRef.current.classList.remove('drag-down');
    }
  };

  /**
   * 放置事件
   */
  const onDrop = (e) => {
    const sourceItem = JSON.parse(draggedRef.current.dataset.item);
    if (!changeKeys.includes(sourceItem.key)) {
      // 如果拖到的组件不是当前选中的组件，先选中它再移动位置
      changeInstance(e, sourceItem, true);
      return;
    }
    // 如果拖到的组件就是当前选中的组件，直接移动位置
    dragCommonFn(e, sourceItem, true);
  };

  /**
   * 组件选中事件处理
   * @param curChangeKeys
   * @returns
   */
  const changeKeysListener = useCallback(
    (curChangeKeys) => {
      if (isEqual(selectedKeys, curChangeKeys)) return;
      setSelectedKeys(curChangeKeys);
    },
    [selectedKeys],
  );

  /**
   * 选中地图引用组件
   */
  const changeMapInstance = (evt, item) => {
    // 单选组件
    const keys = [item.key];
    // 单选取消选中
    $('.com-change').removeClass('com-change');
    $('.group-change').removeClass('group-change');
    $(`.dom-container[data-key="${item.key}"]`).addClass(item.classType === 'group' ? 'group-change' : 'com-change');
    if (isEqual(selectedKeys, keys)) return;
    setSelectedKeys(keys);

    if (isEqual(toJS(changeKeys), keys)) return;
    setReferenceMapChangeKeys(keys);
  };
  /**
   * 监听changeKeys事件，
   */
  useEffect(() => {
    if (!window.globalEventEmitter) return;
    window.globalEventEmitter.on('changeKeys', changeKeysListener);
    return () => {
      window.globalEventEmitter.removeListener('changeKeys', changeKeysListener);
    };
  }, [changeKeysListener]);

  /**
   * 获取搜索关键字
   */
  useEffect(() => {
    const EventEmitter = window.globalEventEmitter;
    const listenFn = (val) => {
      setKeyWord(val);
    };
    EventEmitter.on('LayerListSearch', listenFn);
    return () => {
      EventEmitter.removeListener('LayerListSearch', listenFn);
    };
  }, []);
  /**
   * 过滤页面树
   */
  useEffect(() => {
    // 页面树搜索功能
    if (keyWord) {
      const tree = filterTree(componentList, (node) => {
        // console.log('node.name', node.name);
        return node?.compName?.includes(keyWord) || node.name?.includes(keyWord) || node.type?.includes(keyWord);
      });
      setSearchTree(tree);
    } else {
      setSearchTree(componentList);
    }
  }, [componentList, keyWord, renderLayerCount]);

  // const onDropTest = (evt) => {
  //   console.log(evt.target.dataset, 'dataset');
  //   (window as any).dropCallback(evt.target.dataset.id);
  //   // 第一evt里面能够判断出来我是拖到了哪个组或者哪个组件下面，需要在改组，或者最外层去add
  // }
  // v8.6.0 支持左组件列表区域更新
  console.log('renderLayerCount', renderLayerCount);
  return (
    <>
      <div className='com-list-title'>
        <div>组件列表</div>
      </div>

      {/* 头部工具栏 */}
      <TopBarTools onDragOver={onDragOver} onDrop={onDrop} />

      {/* 组件列表 */}
      <div
        className={`com-change-com-layer ${bigScreenType === 'card' ? 'card' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        ref={layerRef}
      >
        {/* 普通页引用地图组件 */}
        {!isHomePage && editModePaths.length === 0 && bigScreenType === 'page' && (
          <MapReference changeInstance={changeMapInstance} selectedKeys={selectedKeys} />
        )}
        {/* 正常组件 */}
        {searchTree.map((item, key) => {
          if (item.classType === 'group') {
            return (
              <GroupLayer
                changeInstance={changeInstance}
                dragEnd={dragEnd}
                dragStart={dragStart}
                onContextMenu={onContextMenu}
                item={item}
                keyWord={keyWord}
                key={item.key}
                data-key={item.key}
                keyIndex={key}
                dragCount={dragCount}
                selectedKeys={selectedKeys}
              />
            );
          }
          if (item?.isDragContainer) {
            return (
              <CustomListLayer
                changeInstance={changeInstance}
                dragEnd={dragEnd}
                dragStart={dragStart}
                onContextMenu={onContextMenu}
                item={item}
                keyWord={keyWord}
                key={item.key}
                keyIndex={key}
                selectedKeys={selectedKeys}
              />
            );
          }
          return (
            <ComponentLayer
              changeInstance={changeInstance}
              dragEnd={dragEnd}
              dragStart={dragStart}
              onContextMenu={onContextMenu}
              item={item}
              key={item.key}
              keyIndex={key}
              selectedKeys={selectedKeys}
            />
          );
        })}
      </div>
    </>
  );
};

export default observer(CompTree);
