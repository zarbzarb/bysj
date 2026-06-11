import React, { useState, useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { Tree, message } from 'antd';
import { cloneDeep, isEqual } from 'lodash';
// import drawerBack from '@/assets/newIcon/drawerBack.png';
import plusBtn from '@/assets/newIcon/plus.png';
import TreeTitle from './components/TreeTitle';
import './index.less';
/*
 * @Author: 赵晶晶
 * 图层管理
 */
// interface IProps {}
/**
 * 添加图层
 */

const LayerManagement = () => {
  const { globalStore, layerStore, serviceStore, editorStore } = useStore();
  const { bigScreenType, bigScreenId, screenConfig } = globalStore;
  const { layers, defaultLayerId, activeLayerId, createLayer, changeActiveLayerId, delLayer, updateLayersState } =
    layerStore;
  const { deleteEditLayer } = serviceStore;
  const { forceUpdateLayout } = editorStore;
  // const scrollContainerRef = useRef(null); // 滚动容器
  /**
   * 依据activeLayerId 获取
   */
  const defaultSelectedKey = useCallback(() => {
    const activeLayer = layers.filter((v) => v.layerId === activeLayerId);
    if (activeLayer.length > 0) {
      return [activeLayer[0].key];
    }
    return [];
  }, [layers, activeLayerId]);

  const [selectedKey, setSelectedkey] = useState(defaultSelectedKey());

  const selectedRef = useRef(false);
  /**
   * 新增图层
   */
  const addLayer = () => {
    const layer = createLayer();
    const data = [layer, ...layers];
    window.executeCommand('LayerCommand', layer.layerId, layers, {
      type: 'add',
      layers: data,
    });
  };
  // 修改图层名称
  const editLayer = useCallback(
    (node) => {
      node.editing = true;
      updateLayersState([...layers]);
    },
    [updateLayersState, layers],
  );

  // 删除图层
  const removeLayer = useCallback(
    (node) => {
      deleteEditLayer(node.layerId, bigScreenId)
        .then((res) => {
          if (Number(res.code) === 200) {
            delLayer(node.layerId, (waitRemoveComp) => {
              const data = cloneDeep(layers);
              const currentIndex = data.findIndex((v) => v.layerId === node.layerId);
              data.splice(currentIndex, 1);
              // const { filter } = screenConfig;
              window.executeCommand('LayerCommand', node.layerId, layers, {
                type: 'del',
                layers: data,
                activeLayerId,
                waitRemoveComp,
                // layerFilter: cloneDeep(filter[node.layerId]),
              });
            });
          }
        })
        .catch((error) => {
          message.warning(error);
        });
    },
    [activeLayerId, bigScreenId, delLayer, deleteEditLayer, layers],
  );

  // 取消编辑
  const onCancelEdit = useCallback(
    (node) => {
      node.editing = false;
      // const container = $(e.target.parentNode).parents('.ant-tree-title').parent();
      // container.removeClass('ant-tree-node-edit');
      updateLayersState([...layers]);
    },
    [updateLayersState, layers],
  );

  // 确认修改
  const onConfirmEdit = useCallback(
    (node, val) => {
      node.layerName = val;
      node.editing = false;
      window.executeCommand('LayerCommand', node.layerId, layers, {
        type: 'edit',
        layers,
      });
    },
    [layers],
  );
  // 图层显隐
  const toggleVisible = useCallback(
    (node) => {
      window.executeCommand('LayerCommand', node.layerId, layers, {
        type: 'visible',
        layers,
      });
    },
    [layers],
  );
  /**
   * 图层树节点
   */
  const renderTitle = useCallback(
    (node) => {
      return (
        <TreeTitle
          node={node}
          onCancelEdit={onCancelEdit}
          onConfirmEdit={onConfirmEdit}
          removeLayer={removeLayer}
          toggleVisible={toggleVisible}
          editLayer={editLayer}
        />
      );
    },
    [editLayer, removeLayer, onCancelEdit, onConfirmEdit, toggleVisible],
  );

  // 拖拽移动图层
  const onDrop = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos.at(-1));

    // 如果新建图层内部没有添加组件，不让拖动，否则新加入的组件不好找准自己在componentList中的位置
    const layer = layers.find((v) => v.key === dragKey);
    if (layer.layerId === defaultLayerId) {
      message.warning('基础图层不允许拖动排序!');
      return;
    }
    const hasCom = window.componentList.some((com) => com.layerId === layer.layerId);
    if (!hasCom) {
      message.warning('添加组件后再拖动图层排序!');
      return;
    }

    const loop = (data, key, callback) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          callback(data[i], i, data);
          return;
        }
        if (data[i].children) {
          loop(data[i].children, key, callback);
        }
      }
    };
    const data = [...layers];

    // Find dragObject
    let dragObj;
    let dragLayerId;
    let dragLayerIndex;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
      dragLayerId = item.layerId;
      dragLayerIndex = index;
    });

    if (!info.dropToGap) {
      console.warn('只支持同级别拖拽改变层级顺序!');
      return;
    }
    if (
      // 二级
      (info.node.props.children || []).length > 0 && // Has children
      info.node.props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      console.warn('只支持同级别拖拽改变层级顺序!');
      return;
    }
    // 只可能执行这里
    let ar;
    let i;
    loop(data, dropKey, (item, index, arr) => {
      ar = arr;
      i = index;
    });
    if (dropPosition === -1) {
      ar.splice(i, 0, dragObj);
    } else {
      ar.splice(i + 1, 0, dragObj);
    }
    window.executeCommand('LayerCommand', dragLayerId, layers, {
      type: 'sort',
      layers: data,
      dragLayerIndex,
    });
  };
  /**
   * 选中图层
   * @param selectedKeys 选中节点key数组
   * @param info 节点数据
   * @returns
   */
  const onSelect = (selectedKeys, info) => {
    if (selectedKeys.length === 0) return;
    const { layerId } = info.node;
    setSelectedkey(selectedKeys);
    changeActiveLayerId(layerId);
    selectedRef.current = true;

    // 清空被选中的组件
    editorStore.setChangeKeys([]);
  };

  const mouseMoveFn = () => {
    if (selectedRef.current) {
      selectedRef.current = false;
      forceUpdateLayout();
    }
  };

  useEffect(() => {
    const EventEmitter = window.globalEventEmitter;
    // 组件定位: 组件key不在当前选中图层时，需要选中定位组件所在图层
    const listenFn = ({ keys, layerId }) => {
      setSelectedkey(keys);
      changeActiveLayerId(layerId);
    };
    EventEmitter.on('layerSelect', listenFn);
    return () => {
      EventEmitter.removeListener('layerSelect', listenFn);
    };
  }, [changeActiveLayerId]);

  useEffect(() => {
    const activeLayerKeys = defaultSelectedKey();
    if (!isEqual(selectedKey, activeLayerKeys)) {
      setSelectedkey(activeLayerKeys);
    }
  }, [defaultSelectedKey, selectedKey]);

  // useEffect(() => {
  //   if (layers.length > 5 && scrollContainerRef.current) {
  //     // 使用requestAnimationFrame来确保在DOM更新后执行
  //     requestAnimationFrame(() => {
  //       scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  //     });
  //   }
  // }, []);

  return (
    <div className='menu-config-content'>
      <div className='menu-config-tree'>
        {/* 图层列表头部 */}
        <div className='layer-list-title'>
          <div>图层列表</div>
          <div>
            {/* 新增图层按钮 */}
            {bigScreenType === 'page' && (
              <img
                alt=''
                src={plusBtn}
                onClick={
                  // 新增图层
                  () => addLayer()
                }
              />
            )}
            {/* 收起按钮 */}
            {/* <img
              alt='收起'
              title='收起'
              src={drawerBack}
              onClick={() => {
                // 收起图层列表
                changeTabsHandler('layer');
              }}
            /> */}
          </div>
        </div>
        {/* 图层列表内容 */}
        <div className='menu-config-tree-wrap' onMouseMove={mouseMoveFn}>
          <Tree
            defaultSelectedKeys={selectedKey}
            selectedKeys={selectedKey}
            draggable={{
              icon: false,
              nodeDraggable: () => {
                return true;
              },
            }}
            blockNode
            treeData={layers.map((item) => {
              item.title = item.layerName;
              return item;
            })}
            onDrop={onDrop}
            onSelect={onSelect}
            titleRender={renderTitle}
          />
        </div>
      </div>
    </div>
  );
};

export default observer(LayerManagement);
