/**
 * datai 组件动态渲染(预览态)
 */
import React, { useRef, useEffect, useState } from 'react';
import { loadVideoJS, dynamicLoadGIS, dynamicLoadGISCom, loadEchartsGL } from '@/utils/loadScript';
import { mapBasePlanType } from '@/staticJson/MapBasic';

const DynamicCompPureRender = (props) => {
  const { item, /* isPreview, */ compCount } = props;
  const { type } = item;
  const Comp = useRef();
  const [count, setCount] = useState(0);

  const loadResource = () => {
    import('@/pages/Preview/Render/CompRender').then(({ default: module }) => {
      Comp.current = module;
      compCount && compCount();
      setCount(count + 1);
    });
  };
  useEffect(() => {
    if (type === '@yl/datai-com-media-mp4-player') {
      loadVideoJS().then(() => {
        loadResource();
      });
    } else if (mapBasePlanType.includes(type)) {
      dynamicLoadGIS([item]).then(() => {
        dynamicLoadGISCom([item]).then(() => {
          loadResource();
        });
      });
    } else if (type === '@yl/datai-com-chart-column-3d') {
      // v8.13： 3d柱状图
      loadEchartsGL().then(() => loadResource());
    } else {
      loadResource();
    }
  }, [type]);

  return Comp.current ? <Comp.current {...props} /> : null;
};

export default DynamicCompPureRender;
