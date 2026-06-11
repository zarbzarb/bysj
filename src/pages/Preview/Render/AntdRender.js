import React, { useState } from 'react';
import CompRender from '@/components/AntdLibs/AsyncCompPureRender';
import { transformCss } from '@/utils/utils';
import { formatPosition } from '@/utils/transformUtils';

export default (props) => {
  const { item, zIndex, compCount, config, filter } = props;
  const positionArr = formatPosition(item.styles.transform);
  const [position] = useState(positionArr);

  return (
    <CompRender
      css={{
        ...transformCss(item.styles, 'pureRender'),
        zIndex,
        filter,
        transform: `translateX(${position[0]}px) translateY(${position[1]}px)`,
      }}
      key={item.key}
      item={item}
      config={config}
      compCount={compCount}
    />
  );
};
