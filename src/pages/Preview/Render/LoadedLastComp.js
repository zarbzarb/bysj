import React, { useEffect } from 'react';

const LoadedLastComp = ({ loadedCallBack, renderWrapperId }) => {
  useEffect(() => {
    loadedCallBack && loadedCallBack(renderWrapperId);
  }, []);

  return <></>;
};

export default LoadedLastComp;
