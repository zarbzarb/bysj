import React from 'react';
import Render from './Render';
import RGL, { WidthProvider } from 'react-grid-layout';
const ReactGridLayout = WidthProvider(RGL);

export default (props) => {
  let { list, screenConfig, compCount } = props;
  let gridMarginHor = screenConfig.gridMarginHor == undefined ? 10 : screenConfig.gridMarginHor;
  let gridMarginVer = screenConfig.gridMarginVer == undefined ? 10 : screenConfig.gridMarginVer;

  const defaultProps = {
    className: 'layout',
    cols: 24,
    rowHeight: screenConfig.gridPerHeight == undefined ? 100 : screenConfig.gridPerHeight,
    margin: [gridMarginHor, gridMarginVer],
    isResizable: true,
    transformScale: props.zoom == undefined ? 1 : props.zoom / 100,
  };

  const createElement = (el) => {
    let { backgroundColor, borderRadiusLT, borderRadiusRT, borderRadiusRB, borderRadiusLB } = el.compAttr;
    let backgroundColorArr = backgroundColor.split('-');
    const gridStyle = {
      boxShadow: '0 0 5px #3fb5d2',
      borderRadius: `${borderRadiusLT}px ${borderRadiusRT}px ${borderRadiusRB}px ${borderRadiusLB}px`,
      background: `linear-gradient(${backgroundColorArr[0]}, ${backgroundColorArr[1]}, ${backgroundColorArr[2]})`,
    };
    el.isDraggable = false;
    return (
      <div
        className={`drag-container`}
        data-key={el.key}
        style={gridStyle}
        key={el.i + '_' + el.isDraggable}
        data-grid={el}
      >
        <Render list={el.gridLayoutComponentList} screenConfig={screenConfig} compCount={compCount} />
      </div>
    );
  };
  return (
    <ReactGridLayout {...defaultProps}>
      {list.map((el) => {
        return createElement(el);
      })}
    </ReactGridLayout>
  );
};
