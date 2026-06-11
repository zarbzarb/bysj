import React, { useRef, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react';
import { Scrollbars } from 'react-custom-scrollbars';
import { Spin } from 'antd';
import { useStore } from '@/hooks';
import { getImageUrl } from '@/utils/utils';
import Ruler from './Ruler';
import Render from './Render';
import styles from './index.less';

const getRect = (value) => {
  return {
    rulerWidth: value.width * 1.2,
    ruleHeight: value.height * 1.2,
  };
};

const PcScreenRender = (props) => {
  const { count, onContextMenu, accurateCount, setScrollContainerRef } = props;
  const { editorStore: store, globalStore, pageTabsStore } = useStore();
  const { screenConfig } = globalStore;
  const { editModePaths, getEditComp, isEditMap, rootGroupCount } = store;
  const { isLoadPage } = pageTabsStore;
  const scrollBarAreaRef = useRef();
  const ref = useRef();
  const consoleRef = useRef();
  const horizontalRuler = useRef();
  const verticalRuler = useRef();

  const comList = store.getCompList();
  // console.log('comList', comList);

  // 组编辑界面
  const size = useMemo(() => {
    let width = Number.parseInt(screenConfig.width);
    let height = Number.parseInt(screenConfig.height);
    if (editModePaths.length > 0) {
      const editComp = getEditComp(editModePaths);
      // console.log('rootGroupCount', rootGroupCount);
      width = Number.parseInt(editComp.styles.width);
      // v8.17 新增折叠面板编辑高度处理
      if (editComp.type === 'CollapsePanel') {
        const { activeKey, items = [] } = editComp.props;
        const activeItem = items.find((um) => um.key === activeKey);
        height = Number.parseInt(activeItem?.itemHeight ?? 0);
      } else {
        height = Number.parseInt(editComp.styles.height);
      }

      // console.log('width', width);
      // console.log('height', height);
    }
    return {
      width,
      height,
    };
  }, [screenConfig.width, screenConfig.height, editModePaths, getEditComp, rootGroupCount]);

  const screenBackgroundStyle = useMemo(() => {
    const { screenBackground = 'to bottom-#0d1117-#0d1117', screenBackgroundImage } = screenConfig;
    const list = screenBackground.split('-');
    if (screenBackgroundImage) {
      return {
        background: `url("${getImageUrl(screenBackgroundImage)}")  center center / 100% 100%  no-repeat ${
          list.length === 3 && list[1] === list[2] ? list[1] : ''
        }`,
      };
    }
    return { backgroundImage: `linear-gradient(${list.join(',')})` };
  }, [screenConfig]);

  const { rulerWidth, ruleHeight } = getRect(size);

  useEffect(() => {
    setScrollContainerRef(ref);
  }, [setScrollContainerRef]);

  return (
    <Scrollbars
      data-type='scroll-container'
      autoHide
      ref={ref}
      renderTrackHorizontal={({ style, ...args }) => (
        <div {...args} className='track-horizontal' style={{ ...style, height: '8px', zIndex: 99999 }} />
      )}
      renderTrackVertical={({ style, ...args }) => (
        <div {...args} className='track-vertical' style={{ ...style, width: '8px', zIndex: 99999 }} />
      )}
      renderThumbHorizontal={(args) => <div {...args} className='thumb-horizontal' />}
      renderThumbVertical={(args) => <div {...args} className='thumb-vertical' />}
    >
      <Ruler
        horizontalRuler={horizontalRuler}
        verticalRuler={verticalRuler}
        styles={styles}
        rulerWidth={rulerWidth}
        ruleHeight={ruleHeight}
        _this={this}
      />
      <div data-type='drawconsole' id='MoveScroll' className={styles.drawConsole} ref={scrollBarAreaRef}>
        <div
          ref={consoleRef}
          data-type='console'
          onContextMenu={isEditMap ? () => {} : onContextMenu}
          className={`${styles.realDrawConsole} render-console`}
          style={{
            ...size,
            transformOrigin: 'left top',
            ...screenBackgroundStyle,
          }}
        >
          <div className={`select-box ${styles.drawRect}`} />
          {isLoadPage ? (
            <Spin
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            />
          ) : (
            <Render
              list={comList}
              config={screenConfig}
              consoleRef={consoleRef}
              count={count}
              accurateCount={accurateCount}
            />
          )}
        </div>
      </div>
    </Scrollbars>
  );
};
export default observer(PcScreenRender);
