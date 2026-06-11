import React, { Fragment, useLayoutEffect, useMemo, useCallback } from 'react';
import _ from 'lodash';
import { insertFontStyleSheet, loadFonts } from '@/utils/loadScript';
import { useStore } from '@/hooks';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { initComs } from '@/utils/initComs';
// import { handleData } from '@/utils/componentUtils';
import { getImageUrl } from '@/utils/utils';
import RenderLayer from './layer';
import Render from './render';

const Index = (props) => {
  const {
    layerStore: { layerComList }, // layerComList 当前选中页面的图层组件信息
    globalStore: { bigScreenType, isApp, screenConfig },
    editorStore: { editModePaths },
    pageTreeStore,
    pageTabsStore,
  } = useStore();
  const { getPageInfo, homePageId, isHomePageResidency /* homePageBase64 */ } = pageTreeStore;
  const { selectedKey } = pageTabsStore;
  // const list = editorStore.getCompList();

  const getScreenConfig = useCallback(
    (key) => {
      const temp = toJS(screenConfig);
      if (isApp && key && getPageInfo(key) && getPageInfo(key).pageConfig) {
        const pageConfig = toJS(getPageInfo(key).pageConfig);
        temp.layerConfig = pageConfig.layerConfig;
        temp.dynamicApis = pageConfig.dynamicApis;
      }
      return toJS(temp) || {};
    },
    [getPageInfo, isApp, screenConfig],
  );

  const homePage = useMemo(() => {
    // console.log('Render 11 homePage', homePageId);
    if (
      homePageId &&
      selectedKey &&
      homePageId !== selectedKey &&
      isHomePageResidency &&
      // editModePaths.length === 0 &&
      getPageInfo(homePageId)
    ) {
      const pageInfo = getPageInfo(homePageId);
      const { componentList = [], pageConfig } = toJS(pageInfo);
      // 初始化组件实例
      // v8.4.1 去掉主页常驻重复取旧值
      // handleData(componentList, pageConfig?.layerConfig?.activeLayerId, 'beforeInit');
      initComs(_.cloneDeep(componentList), pageConfig?.layerConfig?.activeLayerId, 'page');
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
      return (
        // 常驻主页页面的图层层级应该要低些，不能挡住其他页面的
        <div
          key={`${homePageId}-homePage`}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            position: 'relative',
            zIndex: 99,
          }}
        >
          {layerList.map((child: any, idx: number) => {
            return (
              <Fragment key={child.layerId}>
                <RenderLayer layer={child} index={idx} config={getScreenConfig(homePageId)} appPageId={homePageId} />
              </Fragment>
            );
          })}
        </div>
      );
    }
    return null;
  }, [getPageInfo, getScreenConfig, homePageId, selectedKey]);

  useLayoutEffect(() => {
    insertFontStyleSheet(); // 加载字体

    // 用户上传的字体
    const { fonts } = screenConfig;
    fonts.forEach((fontItem) => {
      loadFonts(fontItem.name, getImageUrl(fontItem.url));
    });
    return () => {};
  }, []);

  console.info('layerComList==>', toJS(layerComList));
  // console.log('Render 11 selectedKey', selectedKey);
  return (
    <>
      {/* 主页常驻 */}
      <div
        key={`${homePageId}-homePageContsiner`}
        style={{
          display: isApp && selectedKey && isHomePageResidency && editModePaths.length === 0 ? 'block' : 'none',
        }}
      >
        {homePageId === selectedKey ? null : homePage}
      </div>
      {bigScreenType !== 'card' && editModePaths.length === 0 ? (
        layerComList.map((child: any, idx: number) => {
          return (
            <Fragment key={child.layerId}>
              <RenderLayer
                {...props}
                layer={child}
                index={idx}
                config={getScreenConfig(selectedKey)}
                appPageId={selectedKey}
              />
            </Fragment>
          );
        })
      ) : (
        <Render {...props} />
      )}
    </>
  );
};
export default observer(Index);
