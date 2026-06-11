import React, { Fragment } from 'react';
import _ from 'lodash';
// import { useStore } from '@/hooks';
// import { observer } from 'mobx-react';
import RenderByType from './CommonRender';

type IProps = {
  [key: string]: any;
  layer: {
    layerId: string | number;
    layerName: string;
    visible: boolean;
    componentList: any[];
  };
  index: number;
};

const indexMax = 9999;
// 图层设置层级
const computedIndex = (activeLayerId: string | number, layerId: string | number, index: number) => {
  // const { activeLayerId } = window.screenConfig.layerConfig; // 当前选中页面的 layerConfig
  if (activeLayerId === layerId) {
    return index + 1000;
  }
  return index;
};

const Layer: React.FC<IProps> = (props) => {
  const isDynamicPanelChild = !!props.isDynamicPanelChild;
  const { activeKey, layer, index, config: screenConfig, appPageId } = props; // 动态面板的激活的key值
  const { componentList = [], layerId, layerName, visible } = layer;
  const { layerConfig } = screenConfig;
  const css = {
    zIndex: computedIndex(layerConfig.activeLayerId, layerId, indexMax - index),
    width: Number.parseInt(screenConfig.width),
    height: Number.parseInt(screenConfig.height),
    display: visible ? 'block' : 'none',
  };

  return (
    <div className='layer-container' data-key={`@layer_${appPageId}_${layerId}`} data-name={layerName} style={css}>
      {componentList.map((child: any, idx: number) => {
        return (
          <Fragment key={child.key}>
            <RenderByType
              {...props}
              key={child.key}
              item={child}
              index={idx}
              isDynamicPanelChild={isDynamicPanelChild}
              activeKey={activeKey}
              // layerVisible={visible}
            />
          </Fragment>
        );
      })}
    </div>
  );
};
export default Layer;
