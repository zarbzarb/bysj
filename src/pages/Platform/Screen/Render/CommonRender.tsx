import React, { useState, useCallback } from 'react';
import ComponentType from '@/common/DynamicCompRender';
import { mapBasePlanType } from '@/staticJson/MapBasic';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { getFilterStyle } from '@/EventHandlers/HeaderOperationEvent';
import GroupType from '../../Components/GroupType';
import AntdType from '../../Components/AntdCompType';
import CustomCompType from '../../Components/CustomCompType';

const indexMax = 9999;
// 当前选中图层层级提升，不使用 样式类!important 是因为单独选中组件时才提升为最高
const computedIndex = (config, item, index) => {
  // console.log('computedIndex config', config);
  const { activeLayerId } = config?.layerConfig || {};
  // const { activeLayerId } = window.screenConfig.layerConfig;
  const { layerId, zIndex } = item;
  // 组件顺序变化后没有同步zIndex,所以zIndex每次需要重新计算
  // if (zIndex) {
  //   return zIndex;
  // }
  if (activeLayerId === layerId) {
    return index + 1000;
  }
  return index;
};

const CompRender = (item, i, isDynamicPanelChild, activeKey, props, filterStyle = {}) => {
  const zIndex = computedIndex(props.config, item, indexMax - i);
  item.zIndex = zIndex;
  // v8.3.1: 修复设置主页常驻后，切换页面主页常驻会渲染两次，第二次会导致地图组件不渲染进而 instance 丢失地图显示不出来
  // 修改 count， 可让第二次渲染生效，先这样处理后续看能否进一步优化
  if (mapBasePlanType.includes(item.type)) {
    item.count = item.count === undefined ? 0 : ++item.count;
  }
  return (
    item.comCreated && (
      <ComponentType
        zIndex={zIndex}
        key={item.key}
        item={item}
        isDynamicPanelChild={isDynamicPanelChild}
        activeKey={activeKey}
        {...props}
        filterStyle={filterStyle}
        count={item.count}
      />
    )
  );
};

const GroupRender = (item, i, isDynamicPanelChild, props, filterStyle = {}) => {
  const zIndex = computedIndex(props.config, item, indexMax - i);
  item.zIndex = zIndex;
  return (
    item.comCreated && (
      <GroupType
        zIndex={zIndex}
        key={item.key}
        item={item}
        isDynamicPanelChild={isDynamicPanelChild}
        filterStyle={filterStyle}
        {...props}
      />
    )
  );
};

const AntdRender = (item, i, isDynamicPanelChild, props, filterStyle = {}) => {
  const zIndex = computedIndex(props.config, item, indexMax - i);
  item.zIndex = zIndex;
  return (
    item.comCreated && (
      <AntdType
        zIndex={zIndex}
        item={item}
        isDynamicPanelChild={isDynamicPanelChild}
        filterStyle={filterStyle}
        {...props}
      />
    )
  );
};

const CustomCompRender = (item, i, isDynamicPanelChild, props, filterStyle = {}) => {
  const zIndex = computedIndex(props.config, item, indexMax - i);
  item.zIndex = zIndex;
  return (
    item.comCreated && (
      <CustomCompType
        zIndex={zIndex}
        item={item}
        isDynamicPanelChild={isDynamicPanelChild}
        filterStyle={filterStyle}
        {...props}
      />
    )
  );
};

const RenderByType = (props) => {
  const { item, index, isDynamicPanelChild, activeKey, config } = props;
  const {
    editorStore: { visibleCount },
  } = useStore();

  // v8.10 滤镜配置
  const filterStyle = config.filter ? getFilterStyle(config.filter) : {};

  let Comp = null;

  switch (item.classType) {
    case 'com': {
      Comp = CompRender(item, index, isDynamicPanelChild, activeKey, props, filterStyle);
      break;
    }
    case 'group': {
      Comp = GroupRender(item, index, isDynamicPanelChild, props, filterStyle);
      break;
    }
    case 'antd': {
      Comp = AntdRender(item, index, isDynamicPanelChild, props, filterStyle);
      break;
    }
    case 'customComp': {
      Comp = CustomCompRender(item, index, isDynamicPanelChild, props, filterStyle);
      break;
    }
    default: {
      Comp = <div>渲染错误</div>;
      break;
    }
  }

  return Comp;
};

export default observer(RenderByType);
