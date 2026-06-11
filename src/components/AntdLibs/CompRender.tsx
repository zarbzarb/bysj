import React, { Fragment, memo, useEffect, useState, useCallback, useRef } from 'react';
import { set } from 'lodash';
import { produce } from 'immer';
import dataiVisualComponentLibrary from '@yl/datai-visual-component-library';
// import type { CompListenVariableLog } from '@/types/FnArgsType';
import ErrorBoundary from '@/components/commons/ErrorBoundary';
import { babelTransform, transformCss } from '@/utils/utils';
import { useStore } from '@/hooks';
import { useComponentConfigDataSource } from '@/hooks/useComponentConfigDataSource';
import CustomContainerRender from '@/components/commons/CustomContainerRender';
import PreviewRenderEngine from '@/pages/Preview/Render/Render';
import RenderEngine from '@/pages/Platform/Screen/Render/render';
import { antdLog, compListenVariableLog } from '@/utils/log';
import type { IProps } from './AsyncCompRender';

// immer 更新数据
const updateField = (el: AntdComp.InstanceType, field: string, value: any) => {
  const nextProps = produce(el.props, (draft: any) => {
    set(draft, field, value);
  });
  el.props = nextProps;
};

// 编辑状态下更新圆角样式
const updateStyle = (css: any) => {
  // 需要更新的样式 key
  const styleKeys = [
    'borderTopLeftRadius',
    'borderBottomLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
  ];

  const borderStyleKeys = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'];

  for (const item of styleKeys) {
    css[item] = css[item] ? css[item] : css.borderRadius;
  }

  for (const item of borderStyleKeys) {
    css[item] = css[item] ? css[item] : `${css.borderWidth} ${css.borderStyle} ${css.borderColor}`;
  }
};

type AntdLibsRenderProps = IProps & {
  updateField: (el: AntdComp.InstanceType, field: string, value: any) => void;
  el: AntdComp.InstanceType;
  useComponentDataSource?: () => void;
};

function CompRender(props: IProps) {
  const EventEmitter = window.globalEventEmitter;
  const { item, isPreview, config } = props;
  const stores = useStore();
  const el = item;

  const css = el.styles ? transformCss(item.styles) : item.cssStyle || {};
  delete css.width;
  delete css.height;
  delete css.transform;

  const [count, setCount] = useState(0);
  const ref = useRef(null); // 传给 antd 组件的 ref

  el.refresh = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  el.compRef = ref;

  if (!el) {
    return null;
  }

  const type = el.type[0].toUpperCase() + el.type.slice(1);
  const Comp: React.ComponentType<AntdLibsRenderProps> = dataiVisualComponentLibrary[type]?.Render || (() => <></>);
  if (!isPreview) {
    // css.pointerEvents = "none"
  }
  const domOption = {
    'data-com-type': 'com',
    'data-key': `@com_${el.key}`,
    className: 'dom-container com-container ',
  };

  // 兼容已经修改组件样式
  const styleInnerList = new Set(['Select', 'DatePicker', 'Button', 'TreeSelect']);
  // table表格宽度不随拖拽容器变化
  if (type === 'Table') {
    css.width = '100%';
  }
  // 描述列表限制高度
  if (type === 'Descriptions') {
    css.width = el.styles.width;
  }
  if (type === 'Statistic') {
    delete css.paddingTop;
    delete css.paddingRight;
    delete css.paddingBottom;
    delete css.paddingLeft;
  }
  // v8.17 新增折叠面板
  if (['LayerSearch', 'DynamicPanel', 'CollapsePanel'].includes(type)) {
    delete css.overflow;
  }

  if (type === 'RegionSelect') {
    delete css.borderWidth;
    delete css.borderStyle;
  }

  updateStyle(css);

  const errorBoundaryProps = {
    // key: count,
    compName: el.name,
    compKey: el.key,
    width: el.styles.width,
    height: el.styles.height,
  };
  const useComponentDataSourceFunc = (dataset?) => {
    return useComponentConfigDataSource(config, dataset, el);
  };
  /** 传给组件库的 props 属性  */
  const commonProps = {
    ...props,
    updateField,
    el,
    screenConfig: config,
    useComponentDataSource: useComponentDataSourceFunc,
    store: stores,
    ref,
  };
  if (['CustomList', 'MapInfoWin', 'CustomCell'].includes(el.type)) {
    commonProps.CustomContainerRender = CustomContainerRender;
  } else if (['LayerSearch', 'DynamicPanel', 'CollapsePanel'].includes(el.type)) {
    // v8.17 新增折叠面板
    commonProps.PreviewRenderEngine = PreviewRenderEngine;
    if (el.type === 'DynamicPanel' || el.type === 'CollapsePanel') commonProps.RenderEngine = RenderEngine;
  }

  return (
    <>
      {!styleInnerList.has(type) && (
        <div
          {...domOption}
          style={{
            ...css,
            height: '100%',
            background: item.type === 'RegionSelect' ? 'transparent' : item.styles.background, // REVIEW liuming 加这一段是为了兼容老的网格选择组件初始背景色是白色
          }}
        >
          <ErrorBoundary {...errorBoundaryProps}>
            <Comp {...commonProps} />
          </ErrorBoundary>
        </div>
      )}

      {styleInnerList.has(type) && (
        <div {...domOption} style={{ height: '100%', filter: css.filter }}>
          <ErrorBoundary {...errorBoundaryProps}>
            <Comp {...commonProps} />
          </ErrorBoundary>
        </div>
      )}
    </>
  );
}

export default memo(CompRender);

/**
 * , (pre, next) => {
  let strA = pre.itemStr.replace(/px/gi, ''),
    strB = next.itemStr.replace(/px/gi, '');

  let bool = strA == strB;

  return bool;
}
 */
