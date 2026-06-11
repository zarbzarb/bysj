import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Radio } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import cls from 'classnames';
import { GetQueryString } from '@/utils/BrowserUtils';
import { getShareGeneral } from '../Preview/ajax';

import './index.less';

const indefinitely = '2099-12-31';
const MobileIndex = () => {
  const [selectMobile, setSelectMobile] = useState(0);
  const iframe = useRef<HTMLIFrameElement>();

  const pageId = useMemo(() => GetQueryString('id'), []);
  const appPageId = useMemo(() => GetQueryString('appPageId'), []);
  const spaceId = useMemo(() => GetQueryString('spaceId'), []);
  const mobileList = useMemo(
    () => [
      {
        label: 'iphone X/XS/11/',
        value: 0,
        type: '--iphone-xs',
        width: 375,
        height: 812,
      },
      {
        label: 'iphone XR/XS Max',
        value: 1,
        type: '--iphone-xr',
        width: 414,
        height: 896,
      },
      {
        label: 'iphone 14/15 Pro',
        value: 2,
        type: '--iphone-14',
        width: 393,
        height: 852,
      },
      {
        label: 'iphone 14/15 Pro Max',
        value: 3,
        type: '--iphone-14-pro-max',
        width: 430,
        height: 932,
      },
      {
        label: '华为 Mate60 Pro',
        value: 4,
        type: '--huawei-mate60',
        width: 378,
        height: 816,
      },
      {
        label: '小米 14',
        value: 5,
        type: '--xiaomi-14',
        width: 360,
        height: 801,
      },
      {
        label: 'Redmi K70/K70 Pro',
        value: 6,
        type: '--redmi-k70',
        width: 432,
        height: 960,
      },
    ],
    [],
  );
  const [shareUrl, setShareUrl] = useState(`${window.location.origin}/pre.html?type=page&id=${pageId}`);
  const [loadInfo, setLoadInfo] = useState({ loadTime: 0, pageHeight: 0 });

  const iframeSrc = useMemo(() => {
    let src = `${window.publicPath}pre.html?type=page&id=${pageId}`;
    if (appPageId) {
      src += `&appPageId=${appPageId}`;
    }
    if (spaceId) {
      src += `&spaceId=${spaceId}`;
    }
    return src;
  }, [pageId, appPageId, spaceId]);

  useEffect(() => {
    const generalUrl = () => {
      getShareGeneral(pageId, {
        expire: indefinitely,
        pageType: 1,
        version: 'major',
      }).then((res) => {
        if (res.code === '200' && res.data?.tinyURL) {
          console.log(res);
          setShareUrl(window.location.origin + res.data?.tinyURL);
        } else if (res.code !== '200') {
          console.error(res);
        }
      });
    };
    generalUrl();
    return () => {};
  }, [pageId]);

  useEffect(() => {
    window.addEventListener('message', function (event) {
      if (event.origin === window.location.origin && event.data.type === 'pageLoadInfo') {
        setLoadInfo(event.data.data);
      }
    });

    return () => {};
  }, []);

  const reload = () => {
    iframe.current.contentWindow?.location.reload();
  };
  const currentMobile = mobileList[selectMobile];
  return (
    <div className={cls('preview-wrapper', currentMobile.type)}>
      <div className='preview-area'>
        <div className='iframe-wp'>
          <div className='iframe-width'>width: {currentMobile.width} px</div>
          <iframe title='mobile' ref={iframe} src={iframeSrc} className='mobile-page' />
          <div className='iframe-height'>height: {currentMobile.height} px</div>
        </div>
      </div>
      <div className='config-area'>
        <div className='mobile-config'>
          <div className='mobile-type config-sec'>
            <div className='qrcode-wp'>
              <div className='qrcode-item'>
                <QRCodeSVG className='qrcode-img' size={90} value={shareUrl} />
                <p className='qrcode-title'>预览页</p>
              </div>
            </div>
            <p className='mobile-config-title'>机型选择</p>

            <Radio.Group
              onChange={(evt) => {
                setSelectMobile(evt.target.value);
              }}
              value={selectMobile}
              style={{ maxWidth: '400px', lineHeight: '30px' }}
            >
              {mobileList.map((mobile) => (
                <Radio key={mobile.type} style={{ fontSize: '12px', color: '#BCC9D4' }} value={mobile.value}>
                  {mobile.label}
                </Radio>
              ))}
            </Radio.Group>

            <p className='mobile-config-layout-tip'>* 布局采用等比缩放宽度铺满方式，机型渲染效果仅供预览</p>
          </div>
          <div className='config-sec config-sec'>
            <p className='mobile-config-title'>页面统计</p>
            <p>页面高度: {loadInfo.pageHeight ?? 0} px</p>
            <p>页数: {Math.ceil(loadInfo.pageHeight / currentMobile.height) ?? 0} 页</p>
            <p>加载时间: {loadInfo.loadTime ?? 0} s</p>
          </div>
          <div className='cation-btn config-sec'>
            <Button style={{ width: '140px', borderRadius: 0 }} type='primary' onClick={reload}>
              刷新页面
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileIndex;
