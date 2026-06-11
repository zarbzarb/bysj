import React, { Fragment, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
// 应用列表
import AppMenu from '@/pages/Platform/AppMenu';
// 组件库列表
import CompLib from '@/pages/Platform/CompLib';
// 卡片
import CardList from '@/pages/Platform/CardList';
// 组件模板
import TempList from '@/pages/Platform/TempList';

// import styles from './index.less';
/*
 * @Author: 赵晶晶
 * 右上角菜单弹框容器
 */
interface IProps {
  showMenu: (e) => void;
}
const TabControl = (props: IProps) => {
  const { showMenu } = props;
  const parentRef = useRef(null);
  const { controlStore, globalStore, editorStore, compLibStore } = useStore();
  const { isApp } = globalStore;
  const { selectedTabs } = controlStore;
  // 是否处于地图编辑状态
  const { isEditMap } = editorStore;
  // 模板列表显示
  const { showTempListByLib, setShowTempListByLib, setShowTempListByAttr, showTempListByAttr } = compLibStore;
  // 是否显示应用菜单
  const showAppMenu = selectedTabs.includes('layer');
  // 是否显示组件库
  const showCompLib = selectedTabs.includes('com');
  // 是否显示卡片库
  const showCardLib = selectedTabs.includes('card');
  // 是否是应用
  //   const isApp = bigScreenType === 'page';

  // v8.12： 点击空白区域关闭模板列表
  useEffect(() => {
    const fn = (event: Event) => {
      const cDom = document.querySelector('#tempListWrap');
      const btnDom = document.querySelector('.attr-comp-temp-btn');
      if (!cDom) return;
      const tDom = event.target as HTMLElement;
      if (!(cDom === tDom || cDom.contains(tDom))) {
        if (showTempListByLib) setShowTempListByLib(false);
        if (!btnDom?.contains(tDom) && showTempListByAttr) setShowTempListByAttr(false);
      }
    };
    document.removeEventListener('click', fn);
    document.addEventListener('click', fn);
    return () => {
      document.removeEventListener('click', fn);
    };
  }, [showTempListByLib, showTempListByAttr]);

  return (
    <>
      {/* 应用菜单 */}
      {showAppMenu && !isEditMap && (
        <AppMenu isApp={isApp} onContextMenu={showMenu} className={`com-change-list ${showAppMenu ? 'open' : ''}`} />
      )}
      {/* 组件列表 */}
      {showCompLib && !isEditMap && (
        <CompLib className={`com-list ${showCompLib ? ' open' : ''}`} parentRef={parentRef} />
      )}
      {/* 卡片列表 */}
      {showCardLib && !isEditMap && !showTempListByLib && (
        <CardList className={`card-list ${showCardLib ? ' open' : ''}`} />
      )}
      {/* 组件模板 */}
      {showTempListByLib && !isEditMap && <TempList className='temp-list-lib' type='lib' parentRef={parentRef} />}
      {/* 暂无 */}
    </>
  );
};

export default observer(TabControl);
