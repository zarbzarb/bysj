import React from 'react';
import dataiVisualComponentLibrary from '@yl/datai-visual-component-library';

export default (el: AntdComp.InstanceType) => {
  const type = el.type[0].toUpperCase() + el.type.slice(1);
  const Comp = dataiVisualComponentLibrary[type]?.Initial || <div />;
  return Comp(el);
};
