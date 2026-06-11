// 自定义react hook封装公用业务逻辑
import React, { useState, useRef, useMemo, useContext, useEffect, useCallback, memo } from 'react';
import { Switch, Row, Col } from 'antd';
import { produce } from 'immer';
import _ from 'lodash';
import AntdRender from '@/pages/Preview/Render/AntdRender';
import CompRender from '@/pages/Preview/Render/CompRender';
import GroupRender from '@/pages/Preview/Render/GroupRender';
import CustomCompRender from '@/pages/Preview/Render/CustomCompRender';
import ScreenConfigContext from '@/pages/Preview/Render/ScreenConfigContext';

// antd折叠面板状态栏
// 放在header中，位置left;放在extra中，位置right;
export function useCollapseExtra({ key, title, status, updateCb }) {
  // const [collapseActiveKey, setCollapseActiveKey] = useState([key]);
  // const [panelKey, setPanelKey] = useState('');
  const [panelProps, setPanelProps] = useState({
    forceRender: true,
    collapsible: status ? '' : 'disabled',
  });
  const createSwitchExtra = useCallback(() => {
    return (
      <Row>
        <Switch
          checked={status}
          onClick={(checked, event) => {
            event.stopPropagation();
          }}
          onChange={(checked) => {
            // setCollapseActiveKey([key]);
            // setPanelKey(checked ? key : '');
            const tmp = _.cloneDeep(panelProps);
            if (checked) {
              delete tmp.collapsible;
            } else {
              tmp.collapsible = 'disabled';
            }
            setPanelProps(tmp);
            updateCb(checked);
          }}
        />
        {title && <span style={{ marginLeft: '5px' }}>{title}</span>}
      </Row>
    );
  }, [status, key]);

  /* useEffect(() => {
    let tmp = _.cloneDeep(panelProps);
    if (status) {
      delete tmp.collapsible;
    } else {
      tmp.collapsible = 'disabled';
    }
    setPanelProps(tmp);
  }, [status]);

  const collapseChangeCb = useCallback((e) => {
    setCollapseActiveKey(e);
  }, []); */

  return [panelProps, createSwitchExtra];
}

// 不可变对象
export const useImmerState = (initialStateOrInitialFunction) => {
  const [state, setState] = useState(initialStateOrInitialFunction);

  const updateState = useCallback((updater) => {
    setState(produce(updater));
  }, []);

  return [state, updateState];
};

// 选择框查询
export function useSelectSearch({ list, field }) {
  const orgList = useRef(list);
  const [searchListState, setSearchListState] = useState(list);
  useEffect(() => {
    orgList.current = list;
    setSearchListState(_.cloneDeep(list));
  }, [list]);

  const updateSearchListState = useCallback((val) => {
    const tmp = val == '' ? orgList.current : orgList.current.filter((item) => item[field].includes(val));
    setSearchListState(_.cloneDeep(tmp));
  }, []);

  return [searchListState, updateSearchListState];
}

// 容器组件(地图标牌有用到)-子节点生成
export function useGenChildComList({ el, props }) {
  const screenConfigRef = useContext(ScreenConfigContext);

  const childListEle = useMemo(() => {
    const extraProps = {
      ...props,
      config: screenConfigRef.current || {},
    };

    const childComList = el.childComList || [];

    return childComList.map((item, index) => {
      const cloneItem = _.cloneDeep(item);
      const renderTypeObj = {
        com: CompRender,
        antd: AntdRender,
        customComp: CustomCompRender,
        group: GroupRender,
      };
      if (!Object.keys(renderTypeObj).includes(item.classType)) {
        return null;
      }
      const RenderType = renderTypeObj[item.classType];
      const itemZindex = 999 - index;
      return <RenderType {...extraProps} key={cloneItem.key} zIndex={itemZindex} item={{ ...cloneItem }} />;
    });
  }, [el.childComList]);

  return childListEle;
}

function deepEq(a, b, aStack, bStack) {
  const isFunction = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Function]';
  };
  // a 和 b 的内部属性 [[class]] 相同时 返回 true
  const className = Object.prototype.toString.call(a);
  if (className !== Object.prototype.toString.call(b)) return false;

  switch (className) {
    case '[object RegExp]':
    case '[object String]':
      return `${a}` === `${b}`;
    case '[object Number]':
      /* eslint no-self-compare: "warn" */
      if (+a !== +a) return +b !== +b;
      return +a === 0 ? 1 / +a === 1 / b : +a === +b;
    case '[object Date]':
    case '[object Boolean]':
      return +a === +b;
  }

  const areArrays = className === '[object Array]';
  // 不是数组
  if (!areArrays) {
    // 过滤掉两个函数的情况
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const aCtor = a.constructor;
    const bCtor = b.constructor;
    // aCtor 和 bCtor 必须都存在并且都不是 Object 构造函数的情况下，aCtor 不等于 bCtor， 那这两个对象就真的不相等啦
    if (
      aCtor == bCtor &&
      !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) &&
      'constructor' in a &&
      'constructor' in b
    ) {
      return false;
    }
  }

  aStack = aStack || [];
  bStack = bStack || [];
  let { length } = aStack;

  // 检查是否有循环引用的部分
  while (length--) {
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }

  aStack.push(a);
  bStack.push(b);

  // 数组判断
  if (areArrays) {
    length = a.length;
    if (length !== b.length) return false;

    while (length--) {
      if (!deepEqProps(a[length], b[length], aStack, bStack)) {
        return false;
      }
    }
  }
  // 对象判断
  else {
    const keys = Object.keys(a);
    let key;
    length = keys.length;

    if (Object.keys(b).length !== length) {
      return false;
    }
    const specField = new Set([
      /* 'count','zIndex' */
      'instance',
      'consoleRef',
      'config',
      'list',
      'accurateCount',
    ]);
    while (length--) {
      key = keys[length];
      if (specField.has(key)) {
        continue;
      }
      if (!(b.hasOwnProperty(key) && deepEqProps(a[key], b[key], aStack, bStack))) {
        // console.error('keys**2*', key);
        return false;
      }
    }
  }

  aStack.pop();
  bStack.pop();
  return true;
}

function deepEqProps(a, b, aStack, bStack) {
  // === 结果为 true 的区别出 +0 和 -0
  if (a === b) return a !== 0 || 1 / a === 1 / b;

  // typeof null 的结果为 object ，这里做判断，是为了让有 null 的情况尽早退出函数
  if (a == null || b == null) return false;

  // 判断 NaN
  /* eslint no-self-compare: "warn" */
  if (a !== a) return b !== b;

  // 判断参数 a 类型，如果是基本类型，在这里可以直接返回 false
  const type = typeof a;
  if (type !== 'function' && type !== 'object' && typeof b !== 'object') return false;

  // 更复杂的对象使用 deepEq 函数进行深度比较
  return deepEq(a, b, aStack, bStack);
}

function deepEqSpecialField(list, depth = 0) {
  if (!Array.isArray(list)) return false;
  let flag = true;
  for (const element of list) {
    if (element.hasOwnProperty('_accurate_update') && element._accurate_update) {
      depth == 0 && (element._accurate_update = false);
      flag = false;
      break;
    }
    if (element.childComList?.length > 0) {
      flag = deepEqSpecialField(element.childComList, depth + 1);
      if (flag == false) {
        break;
      }
    }
  }

  return flag;
}

// 组件props对比扩展
export const ComparePropsHocWrap = (comRender, opts = {}) => {
  return memo(comRender, (prevProps, nextProps) => {
    // if (prevProps.key !== nextProps.key) {
    //   return false;
    // }
    // return true;
    // const { filterKey } = opts;
    // console.log('prevProps?.count', prevProps?.count);
    // console.log('nextProps?.count', nextProps?.count);
    // console.log('prevProps', prevProps);
    // console.log('nextProps', nextProps);
    let flag = true;
    if (nextProps?.accurateCount == 0) {
      // 初始化加载
      flag = false;
    } else if (prevProps?.count != nextProps?.count) {
      // 强制更新
      flag = false;
    } else {
      // 局部更新
      // flag = deepEqProps(prevProps, nextProps);
      const itemEq = deepEqSpecialField([nextProps.item]);
      const configEq = _.isEqual(nextProps.config, prevProps.config);
      flag = itemEq && configEq;
    }
    // console.warn('ComparePropsHocWrap***prevProps*', prevProps, flag);
    // if (!flag) {
    //   console.warn('ComparePropsHocWrap****', prevProps);
    // }
    return flag;
  });
};
