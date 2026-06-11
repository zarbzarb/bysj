import React, { useEffect, useState, useCallback, useRef } from 'react';
import TriggerAction from '@/TriggerAction';
// eslint-disable-next-line import/no-unresolved
import dataiVisualComponentLibrary from '@yl/datai-visual-component-library/es/pureRender';
import ErrorBoundary from '@/components/commons/ErrorBoundary';
import { babelTransform, transformCss } from '@/utils/utils';
import { addLog } from '@/utils/log';
import AnimateEvents, {
  handleCreateAfterEvent,
  clickEvent,
  doubleClickEvent,
  mouseEnterEvent,
  mouseLeaveEvent,
} from '@/EventHandlers/AnimateEvent';
import { setStoreData } from '@/utils/dataStoreUtils';
import PreviewRenderEngine from '@/pages/Preview/Render/Render';
import { useGenChildComList } from '@/utils/customReactHooks';
import VisiableToggle from '@/TriggerAction/visiableToggle';
import AntdRender from '@/pages/Preview/Render/AntdRender';
import CompRender from '@/pages/Preview/Render/CompRender';
import { hasMouseEvent } from '@/utils/componentUtils';
import { useComponentConfigDataSource } from '@/hooks/useComponentConfigDataSource';
import { eventInterceptors } from '@/utils/common';
import type { IProps } from './AsyncCompPureRender';

type AntdLibsPureRenderProps = IProps & {
  el: AntdComp.InstanceType;
  useComponentDataSource?: () => void;
  screenConfig?: Record<string, any>;
  compEvents?: Record<string, any>; // 所有事件函数
  onChangeValue?: (value: any, unbindFlag: any) => void;
  getChangeValueVariable?: () => void;
  getChangeValueStrategy?: () => void;
};

const customCompBind = (el) => {
  if (!el.isCustomListChild) return;

  const parentComp = window.DataI(el.parentKey)?.[0];

  if (!parentComp) return;

  if (!parentComp?.customListInsArr) parentComp.customListInsArr = [];

  parentComp?.customListInsArr.push(el);
};

const RealComp: React.FC<IProps> = (props) => {
  const { config, item, css: pCss } = props;
  const el = item;

  const [count, setCount] = useState(0);
  const ref = useRef(null); // 传给 antd 组件的 ref

  el.refresh = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  el.compRef = ref;

  customCompBind(el);

  /** 单击触发函数事件信息 */
  const clickHandler = () => {
    clickEvent(item.eventSetings, config, item);
  };

  /** 双击触发函数事件信息 */
  const doubleClickHandler = () => {
    doubleClickEvent(item.eventSetings, config, item);
  };

  // 查找选中值存在哪个变量
  const getChangeValueVariable = () => {
    let ret = '';
    const list = item.eventSetings || [];
    const changeValueEvent = list.find(
      (ev) =>
        ev.eventType === 'changeValue' ||
        ev.eventType === 'tableRowClick' || // tableRowClick用于单击表格行
        ev.eventType === 'treeRowClick', // treeRowClick用于单击列表行
    );
    if (!changeValueEvent) return ret;

    const { variable = '' } = changeValueEvent;
    ret = variable;
    return ret;
  };

  // 查找选中值存放策略,树形选择器支持父子节点或父节点
  const getChangeValueStrategy = () => {
    let ret = '';
    const list = item.eventSetings || [];
    const changeValueEvent = list.find((ev) => ev.eventType === 'changeValue');
    if (!changeValueEvent) return ret;

    const { strategy = 'all' } = changeValueEvent;
    ret = strategy;
    return ret;
  };

  /** 选中值存到变量 */
  const onChangeValue = (value: any, unbindFlag: any) => {
    item.selectedValue = value; // v8.5.1 添加选中值写入
    const events = item.eventSetings || [];
    let eventSetings = item.eventSetings || [];
    eventSetings = eventSetings.filter((event) => {
      return (
        event.eventType === 'changeValue' // 存在多个选中值事件
      );
    });
    if (eventSetings.length === 0) {
      // 兼容老大屏暂时保留
      const variableA = item.props.variable || item.props.mapGlobalVariable;
      if (variableA) {
        setStoreData(variableA, value); // 更新全局存储的变量数据
      }
      return;
    }

    for (const info of eventSetings) {
      info.groups.forEach((ag, agIdx) => {
        // 事件条件拦截
        const validate = eventInterceptors(info, ag, agIdx);
        if (!validate) return;
        // 选中值存到变量
        if (!unbindFlag) {
          // v8.5.0 如果选中值选择了变量，则选中值时将当前选中值写入变量
          info.singleValue = value; // 选中值还是存储到事件上
          const { variable } = ag;
          if (variable) {
            setStoreData(variable, value); // 更新全局存储的变量数据
          }
        }

        // 选中表达式,用于监听选中变量
        try {
          const expression = ag.expression || 'data';
          const bool = babelTransform(expression, value); // 运行时ES6转ES5
          // bool === '' 兼容输入框组件删空数据时能够触发选中值事件(KQ-6319)
          if (bool || bool === '' || bool === 0) {
            const { actions = [] } = ag;
            actions.forEach((action) => {
              TriggerAction(action, {
                item,
                events,
                config,
                actions,
              });
            });
          }
        } catch (error) {
          console.error(error);
        }
      });
    }
  };

  /** v7.1鼠标移入函数事件信息 */
  const mouseEnterHandler = () => {
    mouseEnterEvent(item.eventSetings, config, item);
  };

  /** v7.1鼠标移出函数事件信息 */
  const mouseLeaveHandler = () => {
    mouseLeaveEvent(item.eventSetings, config, item);
  };

  const type = el.type[0].toUpperCase() + el.type.slice(1);
  const Comp: React.ComponentType<AntdLibsPureRenderProps> = dataiVisualComponentLibrary[type] || (() => <></>);
  const domOption = {
    'data-com-type': 'com',
    'data-key': `@com_${el.key}`,
    className: 'dom-container com-container perf-comp ',
  };

  const styleInnerList = new Set(['Select', 'DatePicker', 'Button', 'TreeSelect']);
  /* start 没用父组件传的 css 是因为会报 ts 类型错误，原因还未知，放在组件里处理却是好的  */
  const css = el.styles ? transformCss(item.styles, 'pureRender') : item.cssStyle || {};
  css.zIndex = pCss.zIndex;
  css.filter = pCss.filter;
  css.transform = pCss.transform;
  /* end =============  */
  const { transform, position, zIndex, opacity, filter } = css;

  // v8.17 新增折叠面板
  if (['LayerSearch', 'DynamicPanel', 'CollapsePanel'].includes(type)) {
    delete css.overflow;
  }

  if (type === 'Statistic') {
    delete css.paddingTop;
    delete css.paddingRight;
    delete css.paddingBottom;
    delete css.paddingLeft;
  }
  if (type === 'RegionSelect') {
    delete css.borderWidth;
    delete css.borderStyle;
  }
  if (type === 'Text' && el.props?.contentOverflow === 'scroll') {
    css.overflowX = 'hidden';
  }

  /** *
   * v6-18启用新的指定设置
   * 地图交互组件设置指定设置
   * 屏幕缩放后，里面的子组件的边距也进行了缩放，如果指定位置，则子组件边距也要反向进行缩放
   * 指定位置之后，如果选择不变形，则组件进行反向缩放，但子组件边距不会跟着改变
   * 如果选择跟随页面，则不进行反向缩放，但因为已经使用边距实现指定位置，所以要把移动去掉，改为none。
   */
  const resetScaleAndPos = (_el: AntdComp.InstanceType) => {
    const { style } = _el.props;
    // v6-18启用新的指定设置
    // const { scaleMode, posMode } = style;
    const { isFixedPosition, posMode, newScaleMode } = style;
    if (isFixedPosition) {
      const { scaleX, scaleY } = config; // 已经缩放的比例
      css.transform = newScaleMode === 1 ? `scaleX(${1 / scaleX}) scaleY(${1 / scaleY})` : 'none';
      css.transformOrigin = posMode; // 定位方式
      const { styles } = _el;
      const { transform: _transform } = styles;
      let left = 0;
      let top = 0;
      let right = 0;
      let bottom = 0;
      const matches = _transform.match(/^translate\((\d+)px, (\d+)px\)$/);
      // 组件本身的间距
      if (matches.length === 3) {
        left = +matches[1];
        top = +matches[2];
      }
      // 组件本身的宽高
      let { width, height } = styles; // 计算右边距和下边距会用到
      width = width.replace('px', '');
      height = height.replace('px', '');
      right = config.width - left - +width; // 原始的右边距
      bottom = config.height - top - +height; // 原始的底边距
      left = (left * 1) / scaleX;
      right = (right * 1) / scaleX;
      top = (top * 1) / scaleY;
      bottom = (bottom * 1) / scaleY;

      switch (posMode) {
        case 'left top': {
          // 左上固定
          css.left = `${left}px`;
          css.top = `${top}px`;
          break;
        }
        case 'right top': {
          // 右上固定
          css.right = `${right}px`;
          css.top = `${top}px`;
          break;
        }
        case 'left bottom': {
          // 左下固定
          css.left = `${left}px`;
          css.bottom = `${bottom}px`;
          break;
        }
        case 'right bottom': {
          // 右下固定
          css.right = `${right}px`;
          css.bottom = `${bottom}px`;
          break;
        }
        case 'center top': {
          // 横向居中固定
          css.left = '50%';
          css.top = `${top}px`;
          // css.bottom = bottom * 1.0 + 'px';
          // css.bottom = '50%';
          css.marginLeft = `${(-width * 1) / 2}px`;
          // css.marginBottom = (-height * 1.0) / 2.0 + 'px';
          break;
        }
        default: {
          break;
        }
      }
    }
  };
  /* 地图交互组件设置不变形处理 */

  const mapInteractiveComList = new Set(['RegionSelect', 'LayerTree', 'LayerLegend']); // 目前就这三个地图交互组件

  if (mapInteractiveComList.has(type)) {
    resetScaleAndPos(el);
  }

  let resizeTimer = null;
  const onResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resetScaleAndPos(el);
      if (item.type === 'RegionSelect') {
        css.background = 'transparent'; // REVIEW liuming 加这一段是为了兼容老的网格选择组件初始背景色是白色
      }
      const { display: cssDisplay, ...otherCss } = css || {};
      $(`[data-key='@com_${el.key}']`).css(otherCss); // 重新设置地图交互组件
      resizeTimer = null;
    }, 100);
  };

  useEffect(() => {
    if (mapInteractiveComList.has(type)) {
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
      };
    }
  }, []);

  // 组件创建后事件触发
  useEffect(() => {
    handleCreateAfterEvent({ item, config: props.config });
  }, [item.createFlag]);

  const errorBoundaryProps = {
    // key: count,
    compName: el.name,
    compKey: el.key,
    width: el.styles.width,
    height: el.styles.height,
  };

  // 是否走新的创建销毁逻辑
  const { createFlag, showFlag } = item;
  const useComponentDataSourceFunc = (dataset?) => {
    return useComponentConfigDataSource(config, dataset, el);
  };

  /** 传给组件库的 props 属性  */
  const commonProps = {
    ...props,
    el,
    onChangeValue,
    getChangeValueVariable,
    getChangeValueStrategy,
    screenConfig: config,
    useComponentDataSource: useComponentDataSourceFunc,
    compEvents: AnimateEvents,
    ref,
  };
  // v8.17 新增折叠面板
  if (['LayerSearch', 'DynamicPanel', 'CollapsePanel'].includes(el.type)) {
    commonProps.PreviewRenderEngine = PreviewRenderEngine;
    if (el.type === 'LayerSearch') commonProps.VisiableToggle = VisiableToggle;
  } else if (['MapInfoWin'].includes(el.type)) {
    commonProps.useGenChildComList = useGenChildComList;
  } else if (['CustomList', 'CustomCell'].includes(el.type)) {
    commonProps.AntdRender = AntdRender;
    commonProps.CompRender = CompRender;
  } else if (el.type === 'Button') {
    commonProps.clickHandler = clickHandler;
    commonProps.doubleClickHandler = doubleClickHandler;
  }

  const extraStyles: Record<string, string> = {};
  if (hasMouseEvent(item) && config.mouseType === 1) {
    extraStyles.cursor = 'pointer';
  }
  return (
    <>
      {!styleInnerList.has(type) &&
        (createFlag === undefined ? (
          <div
            {...domOption}
            style={{
              ...css,
              display: item.hideFlag && 'none',
              background:
                item.type === 'RegionSelect' || item.type === 'IFrame' ? 'transparent' : item.styles.background, // REVIEW liuming 加这一段是为了兼容老的网格选择组件和 iframe组件 初始背景色是白色
              ...extraStyles,
            }}
            onClick={clickHandler}
            onDoubleClick={doubleClickHandler}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
          >
            <ErrorBoundary {...errorBoundaryProps}>
              <Comp {...commonProps} />
            </ErrorBoundary>
          </div>
        ) : (
          createFlag && (
            <div
              {...domOption}
              style={{
                ...css,
                display: !showFlag && 'none',
                background:
                  item.type === 'RegionSelect' || item.type === 'IFrame' ? 'transparent' : item.styles.background, // REVIEW liuming 加这一段是为了兼容老的网格选择组件和 iframe 初始背景色是白色
                ...extraStyles,
              }}
              onClick={clickHandler}
              onDoubleClick={doubleClickHandler}
              onMouseEnter={mouseEnterHandler}
              onMouseLeave={mouseLeaveHandler}
            >
              <ErrorBoundary {...errorBoundaryProps}>
                <Comp {...commonProps} />
              </ErrorBoundary>
            </div>
          )
        ))}
      {styleInnerList.has(type) &&
        (createFlag === undefined ? (
          <div
            {...domOption}
            style={{
              position,
              zIndex,
              transform,
              opacity,
              filter,
              display: item.hideFlag && 'none',
              ...extraStyles,
            }}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
          >
            <ErrorBoundary {...errorBoundaryProps}>
              <Comp {...commonProps} />
            </ErrorBoundary>
          </div>
        ) : (
          createFlag && (
            <div
              {...domOption}
              style={{
                position,
                zIndex,
                transform,
                opacity,
                filter,
                display: !showFlag && 'none',
                ...extraStyles,
              }}
              onMouseEnter={mouseEnterHandler}
              onMouseLeave={mouseLeaveHandler}
            >
              <ErrorBoundary {...errorBoundaryProps}>
                <Comp {...commonProps} />
              </ErrorBoundary>
            </div>
          )
        ))}
    </>
  );
};

export default function CompPureRender(props: IProps) {
  const { item } = props;
  return <>{item && <RealComp {...props} />}</>;
}
