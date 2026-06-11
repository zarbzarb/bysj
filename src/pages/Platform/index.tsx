import React, { useCallback, useEffect, useRef } from 'react';
import EditorStore from '@/store/module/EditorStore';
import { observer } from 'mobx-react';
import { message, Spin } from 'antd';
import { GetQueryString, rewriteHttpRequest } from '@/utils/BrowserUtils';
import './index.less';
import { drawScreenEventHandler, keyboardEventHandler } from '@/EventHandlers/LayoutDragEvent';
import { ConsoleMouseDown, ConsoleMove, ConsoleMouseUp } from '@/EventHandlers/ConsoleEvent';
import { useStore } from '@/hooks';
import { useContextMenu } from 'react-contexify';
import ContextMenu from '@/components/ContextMenu';
import {
  MoveLayerExKeyMap,
  addListenConsoleKeyBoardEnter,
  addListenSaveHandler,
  addListenUndoShortCutKey,
  copyAndPasteExKeyMap,
  groupExKeyMap,
} from '@/EventHandlers/KeyboardEvent';
import { CARDINFOBYUID, MARKETCARDINFOBYID } from '@/services/apis/CardApi';
import $ from 'jquery';
import ManagerControl from './ManagerControl';
// import LeftTopMenu from './LeftTopMenu';
import PageContextMenu from './AppMenu/components/PageContextMenu';
import TabControl from './TabControl';
// 属性面板 （选择组件的时候显示）
import Attr from './Attribute';
import PageTabs from './AppMenu/components/PageTabs';
import Screen from './Screen';
import OperationScreen from './OperationScreen';
import BottomTools from './BottomTools';
/*
 * @Author: 赵晶晶
 * 大屏界面
 */
// interface IProps {}

const Platform = () => {
  const { serviceStore, globalStore, editorStore, controlStore, pageTabsStore, pageTreeStore, versionStore } =
    useStore();
  const { saveLayer, savePreviewImg, saveConfigToBackend } = serviceStore;
  const { pageSourceLoadedMap } = pageTreeStore;
  const { selectedKey } = pageTabsStore;
  const { getLocalStorageTabs } = controlStore;
  const { accurateCount, screenConfigLoaded, setZoom, editModePaths } = editorStore as EditorStore;
  const { urlVersion, currentVersion, versionLoading } = versionStore;

  const eventHandler = {
    onMouseDown: (evt) => ConsoleMouseDown(evt, editorStore),
    onMouseMove: (evt) => {
      evt.preventDefault();
      return ConsoleMove(evt, editorStore);
    },
    onMouseUp: (evt) => {
      return ConsoleMouseUp(evt);
    },
  };

  // const listener = useRef({ onWheel: null, onKeyDown: null, onKeyUp: null, onMouseMove: null });
  const wheelZoomerRef = useRef(null) as React.MutableRefObject<HTMLDivElement>;
  const scrollContainerRef = useRef(null);
  const moveScrollParentNode = useRef(null);
  const isMouseDownRef = useRef(false);
  const beforeMouseCoordRef = useRef({
    x: 0,
    y: 0,
  });
  const scrollDeltaCoord = {};
  const showLoadingRef = useRef(true);

  const { bigScreenId, bigScreenType, isApp, isMobile } = globalStore;

  const changeZoom = useCallback(
    (value) => {
      setZoom(value);
      const consoleDom = document.querySelector('#MoveScroll [data-type="console"]') as HTMLElement;
      consoleDom.style.transform = `scale(${value / 100})`;
    },
    [setZoom],
  );

  const { show } = useContextMenu({
    id: 'menu_id',
  });
  /**
   * 显示右键菜单
   */
  const showMenu = useCallback(
    (e) => {
      // 获取鼠标在编辑器上的位置
      const consolePosition = $('[data-type="console"]').offset();
      if (consolePosition === undefined) return;
      const { top, left } = consolePosition;
      const mouseX = Number.parseInt(e.clientX) - Math.round(left);
      const mousey = Number.parseInt(e.clientY) - Math.round(top);
      const inScreen = $(e.target).is('.dataq-edit-console *');
      globalStore.updateMenuStatus(inScreen);
      globalStore.updateMenuPosition({
        left: mouseX < 0 ? 0 : mouseX,
        top: mousey < 0 ? 0 : mousey,
      });

      const has = !!window.localStorage.getItem('crossScreenCopyStr');
      globalStore.updateHasParseContent(has);
      show({
        event: e,
        id: 'menu_id', // 调用显示右键菜单
      });
    },
    [globalStore, show],
  );

  const delayLoad = useCallback(() => {
    const currentBigScreenId = globalStore.bigScreenId;
    const currentBigScreenType = globalStore.bigScreenType;
    if (process.env.NODE_ENV === 'development') {
      serviceStore.loadScreenInfo(currentBigScreenType, currentBigScreenId);
    } else {
      serviceStore.loadScreenInfo(currentBigScreenType, currentBigScreenId);
    }
    // 保存快捷键
    addListenSaveHandler(editorStore);
    // 删除，上下左右移动快捷键
    addListenConsoleKeyBoardEnter(editorStore);
    // 撤销快捷键
    addListenUndoShortCutKey(editorStore);
    // 移动组件层级快捷键
    MoveLayerExKeyMap(editorStore);
    // 复制粘贴快捷键
    copyAndPasteExKeyMap(editorStore);
    // 成组快捷键
    groupExKeyMap(editorStore);
  }, [bigScreenId, bigScreenType, editorStore, serviceStore]);

  const onPagePreview = useCallback(
    (appPageId) => {
      const id = bigScreenId;
      const type = bigScreenType;
      let url = `${window.location.origin}/${globalStore.isMobile ? 'mobile' : 'pre'}.html?type=${type}&id=${id}&appPageId=${appPageId}`;
      const spaceId = GetQueryString('spaceId');
      if (spaceId) {
        url = `${url}&spaceId=${spaceId}`;
      }
      if (urlVersion) {
        url = `${url}&version=${urlVersion}`;
      }
      window.open(url);
    },
    [bigScreenId, bigScreenType, urlVersion],
  );

  const onPreview = useCallback(() => {
    const id = bigScreenId;
    const type = bigScreenType;
    const src = GetQueryString('src');
    let url = `${window.location.origin}/${globalStore.isMobile ? 'mobile' : 'pre'}.html?type=${type}&id=${id}`;

    const spaceId = GetQueryString('spaceId');
    if (spaceId) {
      url = `${url}&spaceId=${spaceId}`;
    }
    if (urlVersion) {
      url = `${url}&version=${urlVersion}`;
    }

    if (type === 'card') {
      if (src === 'market') {
        url += '&src=market';
        MARKETCARDINFOBYID({ id })
          .then((rs) => {
            if (!rs.data.jsonConfig) {
              message.error('请保存后再预览');
              return;
            }
            window.open(url);
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        CARDINFOBYUID({ sysCardId: id })
          .then((rs) => {
            if (!rs.data.jsonConfig) {
              message.error('请保存后再预览');
              return;
            }
            window.open(url);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } else {
      window.open(url);
    }
  }, [bigScreenId, bigScreenType, urlVersion]);

  const goToHook = useCallback(
    (appPageId) => {
      const id = bigScreenId;
      const type = bigScreenType;
      const spaceId = GetQueryString('spaceId');
      let url = `${window.location.pathname}hook.html?id=${id}&type=${type}&appPageId=${appPageId}`;
      if (spaceId) {
        url += `&spaceId=${spaceId}`;
      }
      if (currentVersion) {
        url = `${url}&version=${currentVersion}`;
      }
      window.open(url);
    },
    [bigScreenId, bigScreenType, currentVersion],
  );

  // 直接保存配置到后端，cb 为 ManagerControl 传入的回调（用于隐藏 loading）
  const onSaveConfig = useCallback(
    async (cb?: () => void) => {
      try {
        const result = await saveConfigToBackend();
        if (result.success) {
          message.success('配置保存成功');
        } else {
          message.error(result.message || '保存配置失败');
        }
      } catch (error) {
        console.error('保存配置错误:', error);
        message.error('保存配置失败');
      }
      cb && cb();
    },
    [saveConfigToBackend],
  );

  // v7.7空格拖拽 Screen
  const moveScrollByScrollCoord = (coord) => {
    const { x, y } = coord;
    const LEVEL = 1;
    const getScrollLeft = scrollContainerRef.current.getScrollLeft();
    const getScrollTop = scrollContainerRef.current.getScrollTop();
    const left = getScrollLeft + x / LEVEL > 0 ? getScrollLeft + x / LEVEL : 0;
    moveScrollParentNode.current.scrollLeft = Math.trunc(left);
    const top = getScrollTop + y / LEVEL > 0 ? getScrollTop + y / LEVEL : 0;
    moveScrollParentNode.current.scrollTop = Math.trunc(top);
  };

  const setScrollContainerRef = (ref) => {
    scrollContainerRef.current = ref.current;
    moveScrollParentNode.current = document.querySelector('#MoveScroll')?.parentNode;
  };

  /**
   * componentDidMount
   */
  useEffect(() => {
    const urlId = GetQueryString('id');
    const urlType = GetQueryString('type');
    if (urlId && urlId !== globalStore.bigScreenId) {
      globalStore.bigScreenId = urlId;
    }
    if (urlType && urlType !== globalStore.bigScreenType) {
      globalStore.bigScreenType = urlType as 'card' | 'layer' | 'page';
    }

    rewriteHttpRequest(false);
    globalStore.getPlatform();
    serviceStore.getConfig();
    serviceStore.queryPath();

    Promise.resolve().then(() => {
      delayLoad();
    });

    /**
     * 拖拽/缩放画布
     */
    const onWheelListener = (evt: WheelEvent) => {
      const { platform } = globalStore;
      if ((platform === 'Win' && evt.ctrlKey) || (platform === 'Mac' && evt.metaKey)) {
        evt.preventDefault();
        const afterZoom = editorStore.zoom - evt.deltaY / 10;

        changeZoom(afterZoom >= 10 && afterZoom <= 1000 ? afterZoom : editorStore.zoom);
      }
    };

    wheelZoomerRef.current.addEventListener('wheel', onWheelListener, { passive: false });

    const onMouseMoveListener = (evt: MouseEvent) => {
      const { updateMousePos } = globalStore;
      const consolePosition = $('[data-type="console"]').offset();

      if (consolePosition === undefined) return;

      const { top, left } = consolePosition;
      const mouseX = evt.clientX - Math.round(left);
      const mousey = evt.clientY - Math.round(top);
      const isInScreen = $(evt.target).is('.dataq-edit-console *');
      const mousePos = {
        left: mouseX,
        top: mousey,
        isInScreen,
      };

      updateMousePos(mousePos);
    };

    wheelZoomerRef.current.addEventListener('mousemove', onMouseMoveListener);

    const onKeyDownListener = keyboardEventHandler(editorStore, wheelZoomerRef, isMouseDownRef).onKeyDown;
    const onKeyUpListener = keyboardEventHandler(editorStore, wheelZoomerRef, isMouseDownRef).onKeyUp;

    // 处理 Ctrl+S 快捷键
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSaveConfig();
        return;
      }
      onKeyDownListener(e);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', onKeyUpListener);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', onKeyUpListener);
      wheelZoomerRef.current?.removeEventListener('wheel', onWheelListener);
    };
  }, []);

  useEffect(() => {
    if (screenConfigLoaded > 0 && showLoadingRef.current) {
      showLoadingRef.current = false;
      const loading = document.querySelector('#i-loading');
      if (loading && loading instanceof HTMLElement) {
        loading.style.display = 'none';
      }
      getLocalStorageTabs();
    }
  }, [screenConfigLoaded, getLocalStorageTabs]);
  return (
    <div id='on_wheel_zoomer' ref={wheelZoomerRef}>
      <Spin wrapperClassName='spin-version-loading' spinning={versionLoading} tip='切换版本中...'>
        <div>
          {/* 导航工具条 */}
          <ManagerControl
            saveScreen={onSaveConfig}
            saveLayer={saveLayer}
            savePreviewImg={savePreviewImg}
            pagePreview={onPagePreview}
            preview={onPreview}
            goToHook={goToHook}
          />

          <div className='edit-container row'>
            {/* 图层、组件、卡片容器 */}
            <TabControl showMenu={showMenu} />
            {/* 可编辑区域 */}
            <div
              className='dataq-edit-console-container'
              {...drawScreenEventHandler(
                editorStore,
                wheelZoomerRef,
                isMouseDownRef,
                beforeMouseCoordRef,
                moveScrollByScrollCoord,
              )}
            >
              {/* 编辑器菜单栏 */}
              <OperationScreen />
              {/* 页面tabs导航栏 */}
              {editModePaths.length === 0 && <PageTabs />}
              {/* 编辑器 */}
              <div
                tabIndex={-1}
                role='tabpanel'
                className='dataq-edit-console'
                onDragOver={(evt) => {
                  evt.preventDefault();
                }}
                {...eventHandler}
              >
                {screenConfigLoaded > 0 && (!isApp || (selectedKey && pageSourceLoadedMap[selectedKey])) && (
                  <Screen
                    // count={count}
                    accurateCount={accurateCount}
                    onContextMenu={showMenu}
                    scrollDeltaCoord={scrollDeltaCoord}
                    setScrollContainerRef={setScrollContainerRef}
                    isMobile={isMobile}
                  />
                )}
              </div>
            </div>

            {/* 鼠标右键菜单 */}
            <ContextMenu />
            {/* 鼠标右键菜单 */}
            <PageContextMenu />
            {/* 组件属性配置 */}
            <Attr />
            {/* 底部工具栏 */}
            <BottomTools changeZoom={changeZoom} zoom={editorStore.zoom} />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default observer(Platform);
