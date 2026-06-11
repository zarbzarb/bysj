import React from 'react';
import PcScreenRender from './PcScreenRender';
import MobileScreenRender from './MobileScreenRender';

const Screen = (props) => {
  const { isMobile } = props;
  return isMobile ? <MobileScreenRender {...props} /> : <PcScreenRender {...props} />;
};

export default Screen;
