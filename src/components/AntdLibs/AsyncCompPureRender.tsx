import React, { useRef, useEffect, useState } from 'react';
import { dynamicLoadVideoSource, dynamicLoadGIS } from '@/utils/loadScript';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export type IProps = {
  item: AntdComp.InstanceType;
  key: string;
  isPreview?: boolean;
  css?: AntdComp.StylesType;
  config?: Record<string, any>;
  compCount?: () => void;
  useComponentDataSource?: (dataset?: any) => any;
  PreviewRenderEngine?: any;
  VisiableToggle?: any;
  useGenChildComList?: any;
  AntdRender?: any;
  CompRender?: any;
  clickHandler?: any;
  doubleClickHandler?: any;
};

const DynamicCompPureRender: React.FC<IProps> = (props) => {
  const { item, compCount } = props;
  const { type } = item;
  const Comp = useRef<React.FC<IProps>>();
  const [count, setCount] = useState(0);
  const loadResource = () => {
    import('./CompPureRender')
      .then(({ default: module }) => {
        Comp.current = module;
        if (compCount) compCount();
        setCount(count + 1);
      })
      .catch((error) => {
        console.warn(error);
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
    } else if (type === 'RegionSelect' && item.props.relation_map_key) {
      // 网格组件关联了地图，则需要先加载 gis sdk, 因为网络组件初始化用到了 sdk 里的方法
      const mapComp = window.DataI.getComponentByKey(item.props.relation_map_key);
      if (mapComp) {
        dynamicLoadGIS([mapComp])
          .then(() => {
            loadResource();
          })
          .catch((error) => {
            console.warn(error);
          });
      } else {
        loadResource();
      }
    } else {
      loadResource();
    }
  }, []);

  const CompCurrent = Comp.current;

  return <ConfigProvider locale={zhCN}>{CompCurrent ? <CompCurrent {...props} /> : null}</ConfigProvider>;
};

export default DynamicCompPureRender;
