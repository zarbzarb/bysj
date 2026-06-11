import React, { useLayoutEffect, useState, useRef } from 'react';
import { RenderByType } from './Render';

const ChunkRender = (props) => {
  const { list, compCount, config, isDynamicPanelChild } = props;
  const [chunks, setChunks] = useState([]);
  const ref = useRef();
  // let now = Date.now();
  // console.log(list, '-----------');

  const timeChunk = (data, func, interval) => {
    data = [...data];
    let chunks = [],
      timer = null,
      { length } = data,
      count = 1;
    const start = () => {
      for (let i = 0; i < Math.min(count, length); i++) {
        const com = data.shift();
        if (!com) break;
        chunks.push(com);
      }
      count += 2;
      func(chunks);
    };
    return () => {
      timer = setInterval(() => {
        if (data.length === 0) {
          ref.current = timer;
          return clearInterval(timer);
        }
        start();
      }, interval);
    };
  };

  useLayoutEffect(() => {
    // console.log('JS运行时间：', Date.now() - now, 'ms');
    list.length && timeChunk(list, (n) => setChunks([...n]), 0)();
    return () => {};
  }, [list]);

  // console.log(chunks);
  // setTimeout(() => {
  //   console.log('总渲染时间：', Date.now() - now, 'ms');
  // }, 0);

  return chunks.map((child, idx) => {
    return config ? (
      <RenderByType
        key={child.key}
        compCount={compCount}
        item={child}
        index={idx}
        config={config}
        isDynamicPanelChild={isDynamicPanelChild}
      />
    ) : null;
  });
};

export default ChunkRender;
