import React, { useState } from 'react';
import { transformCss } from '@/utils/utils';
import CustomCompPureRender from '@/components/CustomCompRender/pureRender';

const Comp: React.FC<{
  item: { key: string; styles: any };
  zIndex: number;
  compCount: any;
  config: any;
  filter: any;
}> = (props) => {
  const { item, zIndex, compCount, config, filter } = props;
  const [count, setCount] = useState(0);
  const refresh = () => {
    setCount(count + 1);
  };

  let css = transformCss(item.styles, 'pureRender');
  css = {
    ...css,
    zIndex,
    filter,
  };

  return (
    <CustomCompPureRender
      css={{ ...css }}
      key={item.key}
      item={item}
      config={config}
      refresh={refresh}
      compCount={compCount}
    />
  );
};

export default Comp;
