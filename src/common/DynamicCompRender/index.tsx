/**
 * datai 组件动态渲染(编辑态)
 */
import React, { useRef, useEffect, useState, ReactComponentElement } from 'react';
import { loadVideoJS, loadEchartsGL } from '@/utils/loadScript';
import { mapBasePlanType } from '@/staticJson/MapBasic';

const DynamicCompRender = (props) => {
  const { item, /* isPreview, */ compCount, count } = props;
  const { type } = item;
  const Comp = useRef(null);
  const [_count, setCount] = useState(0);

  const loadResource = () => {
    import('@/pages/Platform/Components/ComponentType')
      .then(({ default: module }) => {
        Comp.current = module;
        setCount(_count + 1);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (type === '@yl/datai-com-media-mp4-player') {
      loadVideoJS()
        .then(() => {
          loadResource();
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (type === '@yl/datai-com-chart-column-3d') {
      // v8.13： 3d柱状图
      loadEchartsGL().then(() => loadResource());
    } else if (mapBasePlanType.includes(type)) {
      // 编辑状态的地图资源懒加载
      loadResource();
    } else {
      loadResource();
    }
  }, [type, count]);

  const Component = Comp.current as React.FC;

  return Component ? <Component {...props} /> : null;
};

export default DynamicCompRender;
