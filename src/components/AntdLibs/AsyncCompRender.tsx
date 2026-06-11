import React, { useRef, useEffect, useState } from 'react';
import { dynamicLoadVideoSource } from '@/utils/loadScript';
import updateCompMergeWithTemplate from '@/utils/updateCompMergeWithTemplate';

export type IProps = {
  item: AntdComp.InstanceType;
  isPreview?: boolean;
  css?: AntdComp.StylesType;
  config?: Record<string, any>;
  dynamicPanelCount?: number;
  useComponentDataSource?: (dataset?: any) => any;
  screenConfig?: any;
  count?: number;
  accurateCount?: number;
  CustomContainerRender?: any;
  RenderEngine?: any;
  PreviewRenderEngine?: any;
};

const DynamicCompRender: React.FC<IProps> = (props) => {
  const { item } = props;
  const { type } = item;
  const Comp = useRef<React.FC<IProps>>();
  const [count, setCount] = useState(0);

  const loadResource = () => {
    import('./CompRender')
      .then(({ default: module }) => {
        if (item.templateKey) updateCompMergeWithTemplate(item);
        Comp.current = module;
        setCount(count + 1);
      })
      .catch((error) => {
        return console.warn(error);
      });
  };

  useEffect(() => {
    if (type === 'UniversalPlayer') {
      dynamicLoadVideoSource()
        .then(() => {
          loadResource();
        })
        .catch((error) => {
          console.warn(error);
        });
    } else {
      loadResource();
    }
  }, []);

  const CompCurrent = Comp.current;
  return CompCurrent ? <CompCurrent {...props} /> : null;
};

export default DynamicCompRender;
