/* eslint-disable promise/no-nesting */
import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import { dynamicLoadCustomComp, parseCustomCompCode, dynamicLoadCustomCompSource } from '@/utils/loadScript';
import { message, Spin } from 'antd';
import { antdLog, compListenVariableLog } from '@/utils/log';
import { babelTransform, getImageUrl } from '@/utils/utils';
import { Store } from '@/store/index';
import ErrorBoundary from './ErroyBoundary';
import CustomCompWrap from './CustomCompWrap';

const { editorStore } = Store;

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

function CompRender(props) {
  const EventEmitter = window.globalEventEmitter;
  const { css, refresh, count, config } = props;
  let { item } = props;

  compatible(item, config);

  const CompRef = useRef(null);

  useEffect(() => {
    let customCode = parseCustomCompCode(item.releaseUrl);
    let listenFn;
    const eventEmitterEft = window.globalEventEmitter;

    if (!customCode) {
      customCode = item.customCode;
    }

    if (window[customCode]) {
      if (item.initial) {
        item = window[customCode].Initial(item);
        item.initial = false;
      }
      CompRef.current = window[customCode].Render;
      refresh && refresh();
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
                    if (item.initial && window[customCode].Initial) {
                      item = window[customCode].Initial(item);
                      item.initial = false;
                      editorStore.forceUpdateAttr();
                    }
                    CompRef.current = window[customCode]
                      ? window[customCode].Render
                      : () => <div style={{ textAlign: 'center' }}>组件加载错误!</div>;
                    if (refresh) refresh();
                  };
                  eventEmitterEft.on(customCode, listenFn);
                } else {
                  try {
                    // eslint-disable-next-line no-eval
                    eval(res); // 后期可以改变打包方式，不再挂载到window上

                    if (item.initial) {
                      item = window[customCode].Initial(item);
                      item.initial = false;
                      editorStore.forceUpdateAttr();
                    }
                    CompRef.current = window[customCode].Render;
                  } catch (error) {
                    console.error(customCode, error);
                    message.error('自定义组件解析失败,请检查自定义组件源代码!');
                    CompRef.current = () => <div style={{ textAlign: 'center' }}>组件加载错误!</div>;
                  } finally {
                    if (refresh) refresh();
                  }
                  eventEmitterEft.emit(customCode, '');
                }
              },
              (error) => {
                const { compName } = item;
                const errInfo = `${compName}不存在`;
                message.error(errInfo);
                CompRef.current = () => <div style={{ textAlign: 'center' }}>自定义组件请求失败!</div>;
                if (refresh) refresh();
              },
            )
            .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
    }

    return () => {
      listenFn && eventEmitterEft.removeListener(customCode, listenFn);
    };
  }, []);

  const Comp = CompRef.current;

  const domOption = {
    'data-com-type': 'com',
    'data-key': `@com_${item.key}`,
    className: 'dom-container com-container ',
  };
  return (
    <>
      {Comp ? (
        <div {...domOption} style={{ ...css, opacity: undefined }}>
          <ErrorBoundary
            key={count}
            compName={item.name}
            compKey={item.key}
            width={item.styles.width}
            height={item.styles.height}
          >
            <CustomCompWrap Comp={Comp} {...props} />
          </ErrorBoundary>
        </div>
      ) : (
        <div
          style={{
            width: '300px',
            height: '300px',
            textAlign: 'center',
            top: '50px',
          }}
        >
          <Spin spinning={!Comp} />
        </div>
      )}
    </>
  );
}

export default memo(CompRender);
