/* eslint-disable promise/no-nesting */
import React, { Fragment, useEffect, useRef } from 'react';
import TriggerAction from '@/TriggerAction';
import { dynamicLoadCustomComp, parseCustomCompCode, dynamicLoadCustomCompSource } from '@/utils/loadScript';
import { message } from 'antd';
import { handleCreateAfterEvent, handleAfterShowUpOrHidden } from '@/EventHandlers/AnimateEvent';
import { getImageUrl } from '@/utils/utils';
import { antdLog } from '@/utils/log';
import { hasMouseEvent } from '@/utils/componentUtils';
import ErrorBoundary from './ErroyBoundary';
import CustomCompWrap from './CustomCompWrap';

const compatible = (item, config) => {
  let tenantId = '';
  const { bucketName } = config;
  if (!item.releaseUrl) {
    if (config.tenantId !== 'default') {
      tenantId = `_${config.tenantId}`;
      item.customCode += tenantId;
    }
    item.releaseUrl = `/iocoss/${bucketName}/custom/${item.customCode}.js`;
  } else {
    const urlArr = item.releaseUrl.split('/');
    urlArr[2] = bucketName;
    item.releaseUrl = urlArr.join('/');
  }
};

const RealComp = (props) => {
  const { config, item, css, refresh, compCount } = props;
  compatible(item, config);
  const el = item;
  const CompRef = useRef(null);

  useEffect(() => {
    let customCode = parseCustomCompCode(item.releaseUrl);
    let listenFn;
    const EventEmitter = window.globalEventEmitter;

    if (!customCode) {
      customCode = item.customCode;
    }
    if (compCount) compCount();
    if (window[customCode]) {
      CompRef.current = window[customCode].Render;
      if (refresh) refresh();
    } else {
      dynamicLoadCustomCompSource()
        .then(() => {
          const featchURI = getImageUrl(item.releaseUrl);
          item.featchURI = featchURI;
          dynamicLoadCustomComp(featchURI)
            .then(
              (res) => {
                if (res === 'loading') {
                  // 自定义组件加载完成回调
                  listenFn = () => {
                    CompRef.current = window[customCode]
                      ? window[customCode].Render
                      : () => <div style={{ textAlign: 'center' }}>组件加载错误!</div>;
                    if (refresh) refresh();
                  };
                  EventEmitter.on(customCode, listenFn);
                } else {
                  try {
                    // eslint-disable-next-line no-eval
                    eval(res); // 后期可以改变打包方式，不再挂载到window上
                    CompRef.current = window[customCode].Render;
                    // compCount && compCount();
                  } catch (error) {
                    console.error(customCode, error);
                    message.error('自定义组件解析失败,请检查自定义组件源代码!');
                    CompRef.current = () => <div style={{ textAlign: 'center' }}>组件加载错误!</div>;
                  } finally {
                    if (refresh) refresh();
                  }
                  EventEmitter.emit(customCode, '');
                }
              },
              () => {
                const { compName } = item;
                const errInfo = `${compName}不存在`;
                message.error(errInfo);

                if (compCount) compCount();

                CompRef.current = () => <div style={{ textAlign: 'center' }}>自定义组件请求失败!</div>;

                if (refresh) refresh();
              },
            )
            .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
    }

    return () => {
      listenFn && EventEmitter.removeListener(customCode, listenFn);
    };
  }, []);

  // 组件创建后事件触发
  useEffect(() => {
    if (CompRef.current) {
      handleCreateAfterEvent({ item, config: props.config });
      antdLog(el, '组件初始化');
    }
  }, [CompRef.current, item.createFlag]);

  /** 单击触发函数事件信息 */
  const clickHandler = () => {
    const list = item.eventSetings || [];
    const clickEvent = list.find((vl) => vl.eventType === 'click');
    if (!clickEvent) return;
    antdLog(el, '组件单击');
    const { actions = [] } = clickEvent;
    actions.forEach((action) => {
      TriggerAction(action, {
        item,
        events: list,
        config,
        actions,
      });
    });
  };

  /** 双击触发函数事件信息 */
  const doubleClickHandler = () => {
    const list = item.eventSetings || [];
    const clickEvent = list.find((vl) => vl.eventType === 'doubleClick');
    if (!clickEvent) return;

    antdLog(el, '组件双击');
    const { actions = [] } = clickEvent;
    actions.forEach((action) => {
      TriggerAction(action, {
        item,
        events: list,
        config,
        actions,
      });
    });
  };

  /** v7.1鼠标移入函数事件信息 */
  const mouseEnterHandler = () => {
    const list = item.eventSetings || [];
    const mouseEnterEvent = list.find((vl) => vl.eventType === 'mouseenter');
    if (!mouseEnterEvent) return;
    antdLog(el, '鼠标移入事件');
    const { actions = [] } = mouseEnterEvent;
    actions.forEach((action) => {
      TriggerAction(action, {
        item,
        events: list,
        config,
        actions,
      });
    });
  };

  /** v7.1鼠标移出函数事件信息 */
  const mouseLeaveHandler = () => {
    const list = item.eventSetings || [];
    const mouseLeaveEvent = list.find((vl) => vl.eventType === 'mouseleave');
    if (!mouseLeaveEvent) return;
    antdLog(el, '鼠标移出事件');
    const { actions = [] } = mouseLeaveEvent;
    actions.forEach((action) => {
      TriggerAction(action, {
        item,
        events: list,
        config,
        actions,
      });
    });
  };

  const Comp = CompRef.current;

  const domOption = {
    'data-com-type': 'com',
    'data-key': `@com_${el.key}`,
    className: 'dom-container com-container perf-comp ',
  };
  const spinWrapSty = {
    position: 'absolute',
    width: css.width,
    height: css.height,
    transform: css.transform,
  };

  // 是否走新的创建销毁逻辑
  const { createFlag, showFlag } = item;

  const extraStyles = {};
  if (hasMouseEvent(item) && config.mouseType === 1) {
    extraStyles.cursor = 'pointer';
  }

  return (
    <>
      {Comp ? (
        typeof createFlag === 'undefined' ? (
          <div
            {...domOption}
            style={{ ...css, display: item.hideFlag && 'none', ...extraStyles }}
            onClick={clickHandler}
            onDoubleClick={doubleClickHandler}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
          >
            <ErrorBoundary width={el.styles.width} height={el.styles.height} compName={el.name} compKey={el.key}>
              <CustomCompWrap Comp={Comp} {...props} />
            </ErrorBoundary>
          </div>
        ) : (
          createFlag && (
            <div
              {...domOption}
              style={{ ...css, display: !showFlag && 'none', ...extraStyles, opacity: undefined }}
              onClick={clickHandler}
              onDoubleClick={doubleClickHandler}
              onMouseEnter={mouseEnterHandler}
              onMouseLeave={mouseLeaveHandler}
            >
              <ErrorBoundary width={el.styles.width} height={el.styles.height} compName={el.name} compKey={el.key}>
                <CustomCompWrap Comp={Comp} {...props} />
              </ErrorBoundary>
            </div>
          )
        )
      ) : typeof createFlag === 'undefined' ? (
        <div
          style={{
            display: item.hideFlag && 'none',
            ...spinWrapSty,
          }}
        />
      ) : (
        createFlag && (
          <div
            style={{
              display: !showFlag && 'none',
              ...spinWrapSty,
            }}
          />
        )
      )}
    </>
  );
};

export default function CompRender(props) {
  const { item } = props;
  return <>{item && <RealComp {...props} />}</>;
}
