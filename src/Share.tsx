/*
 * @Author: lvbowen
 * @Date: 2022-12-28 16:18:20
 * @LastEditors: lvbowen
 * @LastEditTime: 2022-12-29 10:28:50
 * @Description:
 */
import React, { useMemo } from 'react';
import shareErrImg from '@/assets/newIcon/share_error_bg.png';
import errImg from '@/assets/newIcon/errImg.png';
import './styles/share.less';

const shareErrorTexts = {
  401: '页面已失效，请重新发布',
  405: '页面不存在，请输入正确地址',
};

type ComProps = {
  errorCode: string;
};

const Share: React.FC<ComProps> = (props: ComProps) => {
  const loading: HTMLElement = document.querySelector('#i-loading');
  if (loading) {
    loading.style.display = 'none';
  }

  const isMobile = useMemo(() => {
    const userAgent = navigator.userAgent;
    return (
      /android/i.test(userAgent) || /iphone/i.test(userAgent) || /ipad/i.test(userAgent) || /ipod/i.test(userAgent)
    );
  }, []);

  const shareImg = isMobile ? errImg : shareErrImg;
  return (
    <div className={`${isMobile ? 'mobile-cls ' : ''}share-error-wrap`}>
      <img className='share-img' src={shareImg} alt='' />
      <span className='share-text'>{shareErrorTexts[props.errorCode]}</span>
    </div>
  );
};

export default Share;
