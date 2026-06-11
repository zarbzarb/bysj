import React, { useEffect, useState } from 'react';
import RenderByType from './CommonRender';

const LayerRender = (props) => {
  const [renderList, setRenderList] = useState([]);
  const { screenConfig, componentList, compCount } = props;
  let layerList = [];

  const convertToLayerList = () => {
    const { layerConfig = {} } = screenConfig;
    const { layers = [] } = layerConfig;
    if (layers.length === 0) {
      // 卡片没有图层的概念
      layerList = [
        {
          layerId: Math.random(),
          layerName: Math.random(),
          componentList: componentList,
        },
      ];
    } else {
      const layerArr = layers.map((layer) => {
        return {
          layerId: layer.layerId,
          layerName: layer.layerName,
          componentList: componentList.filter((com) => com.layerId == layer.layerId),
        };
      });
      layerList = layerArr;
      layerList.reverse(); // 按照从下往上的顺序渲染
    }

    const arr = [];
    while (layerList.length > 0) {
      const layer = layerList.shift();
      arr.push(layer);
      setRenderList(arr); // 按照逻辑图层的顺序分批渲染
    }
  };

  useEffect(() => {
    convertToLayerList();
  }, [componentList]); // 添加依赖是为了多主题切换重新渲染

  return renderList.map((layer) =>
    layer.componentList.map((child, idx) => (
      <RenderByType key={child.key} compCount={compCount} item={child} index={idx} config={screenConfig} />
    )),
  );
};

export default LayerRender;
