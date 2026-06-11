/**
 *  组件渲染，动态面板也会用这个组件
 */
import React, { Fragment } from 'react';
import _ from 'lodash';
import RenderByType from './CommonRender';

const Render = (props: any) => {
  const isDynamicPanelChild = !!props.isDynamicPanelChild;
  const { activeKey, list } = props; // 动态面板的激活的key值
  console.log('list', list);
  return (
    <>
      {list.map((child: any, idx: number) => {
        return (
          <Fragment key={child.key}>
            <RenderByType
              {...props}
              key={child.key}
              item={child}
              index={idx}
              isDynamicPanelChild={isDynamicPanelChild}
              activeKey={activeKey}
              config={props.config}
            />
          </Fragment>
        );
      })}
    </>
  );
};
export default Render;
