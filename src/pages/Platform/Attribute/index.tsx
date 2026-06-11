import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import dataiVisualComponentLibrary from '@yl/datai-visual-component-library';
import hocSetConfigProvider from './components/hocSetConfigProvider';

// datai组件属性
import ComponentAttr from './ComponentAttr';
import CardRootGroupAttr from './CardRootGroupAttr';
// Antd组件属性
// 地图子组件图层属性 （画布属性） （跟选中组件显示的互相排斥）
import LevelAttribute from './LevelAttr';
// 屏幕属性
import ScreenAttr from './ScreenAttr';
import AntdAttr from './AntdAttr';
// 应用设置属性
import AppProperties from '../AppProperties';

// 设置 antd 组件主题
const ComAttr = hocSetConfigProvider(ComponentAttr, 200);
const LevelAttr = hocSetConfigProvider(LevelAttribute, 200);

const Attr: React.FC = () => {
  const { editorStore, globalStore, mapStore, pageTreeStore } = useStore();
  const { getSelectedComp } = pageTreeStore;
  // v8.6.0 支持右侧配置栏面板区域更新renderAttrCount
  const { changeKeys, editModePaths, isEditMap, renderAttrCount } = editorStore;
  const { layerItem } = mapStore;
  const { bigScreenType, isApp } = globalStore;

  let key = '';
  if (changeKeys.length > 0) {
    key = changeKeys[0];
  }
  if (changeKeys.length === 0 && editModePaths.length > 0) {
    key = editModePaths.at(-1);
  }
  let comItem;
  if (key) {
    comItem = getSelectedComp(key);
  }
  const isLock = comItem && comItem.comLock ? comItem.comLock : false;

  let layerAttrState = layerItem ? 'open' : 'close';
  if (comItem?.englishName === 'MapFoundationPlan' || comItem?.englishName === 'Map3DFoundationPlan') {
    layerAttrState = `base-${layerAttrState}`;
  }

  // 卡片编辑器中组件锁定时显示卡片根组
  if (isLock && bigScreenType === 'card') {
    key = editModePaths.at(-1);
    if (key) comItem = window.DataI.getComponentByKey(key);
  }

  const getLibAttrProps = () => {
    if (comItem && comItem.classType === 'antd') {
      const designComp = dataiVisualComponentLibrary[comItem.type] || {
        StylePage: () => <></>,
        PropsPage: () => <></>,
      };
      return designComp
        ? {
            StylePage: designComp.StylePage,
            PropsPage: designComp.PropsPage,
          }
        : {};
    }
    return {};
  };

  const AntdAttrProps = {
    item: comItem,
    className: 'com-attr',
    ...getLibAttrProps(),
  };
  // v8.6.0 支持右侧配置栏面板区域更新
  console.log('renderAttrCount', renderAttrCount);
  // console.log('isLock', isLock);
  // v8.5.0 isEditMap为true时，不显示属性面板
  return (
    <div className='attr' style={{ display: 'flex', height: 'calc(100vh - 74px)' }}>
      {isLock ? (
        <>
          {bigScreenType === 'card' ? (
            !isEditMap && <CardRootGroupAttr item={comItem} className='com-attr' />
          ) : isApp ? (
            <AppProperties isShow={changeKeys && changeKeys.length === 0 && editModePaths.length === 0} />
          ) : (
            <ScreenAttr className='com-attr' />
          )}
        </>
      ) : (
        <>
          {/* 地图子组件配置项 */}
          <div style={{ display: 'none' }} className='com-layer-attr-obs-cls' layer-attr-state={layerAttrState} />
          {comItem && layerItem && !isEditMap && <LevelAttr key={layerItem.key} className='com-attr com-layer-attr' />}

          {/* 普通组件配置项 */}
          {changeKeys &&
            changeKeys.length === 1 &&
            comItem &&
            (!comItem.compType || !['antd', 'customComp'].includes(comItem.compType)) &&
            !isEditMap && <ComAttr item={comItem} className='com-attr' />}

          {/* antd组件配置项 */}
          {changeKeys &&
            changeKeys.length === 1 &&
            comItem &&
            comItem.compType &&
            ['antd', 'customComp'].includes(comItem.compType) && <AntdAttr {...AntdAttrProps} />}
          {
            changeKeys &&
              changeKeys.length === 0 &&
              editModePaths.length > 0 &&
              comItem &&
              (comItem.compType && ['antd', 'customComp'].includes(comItem.compType) ? (
                <AntdAttr {...AntdAttrProps} />
              ) : (
                !isEditMap &&
                (bigScreenType === 'card' && editModePaths.length === 1 ? (
                  <CardRootGroupAttr item={comItem} className='com-attr' />
                ) : (
                  <ComAttr item={comItem} className='com-attr' />
                ))
              )) // 页面设置
          }
          {bigScreenType !== 'card' &&
            (isApp ? (
              <AppProperties isShow={changeKeys && changeKeys.length === 0 && editModePaths.length === 0} />
            ) : changeKeys && changeKeys.length === 0 && editModePaths.length === 0 ? (
              <ScreenAttr className='com-attr com-layer-attr' />
            ) : null)}
        </>
      )}
    </div>
  );
};

export default observer(Attr);
