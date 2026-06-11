import React, { useState } from 'react';
import { useComponentConfigDataSource } from '@/hooks/useComponentConfigDataSource';
import { formatCustomCompDataMap } from '@/utils/initComs/customCompUtils';

const CustomCompWrap = ({ Comp, ...props }) => {
  const { item, config } = props;
  formatCustomCompDataMap(item);

  const [counter, setCounter] = useState(0);

  const refresh = () => setCounter(counter + 1);

  item.refresh = refresh;

  const data = useComponentConfigDataSource(config, item.dataset, item);

  return (
    <div
      style={{
        opacity: (item?.styles?.opacity ?? 100) / 100,
        position: item?.styles?.position,
        minWidth: item?.styles?.minWidth,
        minHeight: item?.styles?.minHeight,
        maxWidth: item?.styles?.maxWidth,
        maxHeight: item?.styles?.maxHeight,
        width: item?.styles?.width,
        height: item?.styles?.height,
        boxSizing: item?.styles?.boxSizing,
      }}
    >
      <Comp {...props} el={item} data={data} configuration={item.props.configuration} />
    </div>
  );
};

export default CustomCompWrap;
