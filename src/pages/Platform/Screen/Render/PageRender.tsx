/**
 *  组件渲染，动态面板也会用这个组件
 */
import React, { Fragment, useMemo } from 'react';
import { observer } from 'mobx-react';
import { initComs } from '@/utils/initComs';
import { useStore } from '@/hooks';
import RenderLayer from './layer';

const PageRender = (props: any) => {
  const { pageTreeStore, pageTabsStore } = useStore();
  const { getPageInfo } = pageTreeStore;
  const { selectedKey } = pageTabsStore;
  const { appPageId, config, otherProps } = props; //

  /**
   * 获取页面信息
   */
  const pageLayerComList = useMemo(() => {
    if (appPageId && getPageInfo(appPageId)) {
      const pageInfo = getPageInfo(appPageId);
      const { componentList = [], pageConfig } = pageInfo;
      // 初始化组件实例
      initComs(componentList, pageConfig?.layerConfig?.activeLayerId, 'page');
      // 需要对组件列表进行深度遍历操作的都可以放到这个方法中
      window.DataI.each(componentList, (component) => {
        // 组件树转为map映射
        window.DataI.setComInfoMap(component);
        // 组件编辑态的显隐状态决定组件是否创建
        // comInvisible: false显示 true隐藏 isCreate属性取反操作
        component.comCreated = !component.comInvisible;
      });
      const layerList =
        pageConfig?.layerConfig?.layers?.map((l: any) => {
          const comList = componentList.filter((v: any) => v.layerId === l.layerId);
          return {
            layerId: l.layerId,
            layerName: l.layerName,
            visible: l.visible,
            componentList: comList,
          };
        }) || [];
      return layerList;
    }
    return [];
  }, [appPageId, getPageInfo]);

  return (
    <div key={`pageId-${appPageId}`} style={{ display: appPageId === selectedKey ? 'block' : 'none' }}>
      {pageLayerComList.map((child: any, idx: number) => {
        return (
          <Fragment key={child.layerId}>
            <RenderLayer {...otherProps} layer={child} index={idx} config={config} appPageId={appPageId} />
          </Fragment>
        );
      })}
    </div>
  );
};
export default observer(PageRender);
