import React, { useState, useCallback, useEffect, useRef } from 'react';
import '@/styles/pages/attr.less';
import { inject, observer } from 'mobx-react';
import settingIcon from '@/assets/newIcon/设置.png';
import settingHoverIcon from '@/assets/newIcon/设置启用.png';
import datasetIcon from '@/assets/newIcon/数据.png';
import datasetHoverIcon from '@/assets/newIcon/数据启用.png';
import interactiveIcon from '@/assets/newIcon/交互.png';
import interactiveHoverIcon from '@/assets/newIcon/交互启用.png';
import { isEqual, set, get } from 'lodash';
import type { PropsParamsType, AttrType } from '@/types/CompType';
import { useStore } from '@/hooks';
import { listerAttrWraperScroll } from '@/utils/componentUtils';
import { isPlainObject } from '@/utils/utils';
import DynamicApi from '@/pages/Platform/DataSource/Dynamic';
import IndicatorApi from '@/pages/Platform/DataSource/Indicator';
import MapField from '@/pages/Platform/DataSource/MapField';
import MapFieldForDefault from '@/pages/Platform/DataSource/MapFieldForDefault';
import CompTree from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/components/CompTree';
import CustomPropsPage from '@/components/CustomCompRender/PropsPage';
import CustomCompStyle from '@/components/CustomCompRender/CustomCompStyle';
import TemplateSelectModifier from '@/components/TemplateSelectModifier';
import Interactive from './components/Interactive';
import BasicStyles from './components/BasicStyles';
import BasicProps from './components/BasicProps';
import styles from './AntdAttr.less';
import hocSetConfigProvider from './components/hocSetConfigProvider';
import '@/styles/index.global.less';
import TempList from '../TempList';

const BasicDarkStyles = hocSetConfigProvider(BasicStyles);
const BasicDarkProps = hocSetConfigProvider(BasicProps);
const InteractiveS = hocSetConfigProvider(Interactive);
const CustomPropsPageStyles = hocSetConfigProvider(CustomPropsPage);
const CustomCompDarkStyle = hocSetConfigProvider(CustomCompStyle);

const borderDataSource = [
  { key: 'none', text: '无' },
  { key: 'hidden', text: '隐藏' },
  { key: 'dotted', text: '点状' },
  { key: 'dashed', text: '虚线' },
  { key: 'solid', text: '实线' },
  { key: 'double', text: '双线' },
  { key: 'groove', text: '3D凹槽' },
  { key: 'ridge', text: '3D垄状' },
  { key: 'inset', text: '3Dinset' },
  { key: 'outset', text: '3Doutset' },
  { key: 'inherit', text: '继承' },
];

const overflowDataSource = [
  { label: '默认值', value: 'visible' },
  { label: '隐藏', value: 'hidden' },
  { label: '滚动条显示', value: 'scroll' },
  { label: '自动显示滚动条', value: 'auto' },
];

const dataIcon = {
  setting: {
    icon: settingIcon,
    hoverIcon: settingHoverIcon,
  },
  data: {
    icon: datasetIcon,
    hoverIcon: datasetHoverIcon,
  },
  interactive: {
    icon: interactiveIcon,
    hoverIcon: interactiveHoverIcon,
  },
};

export type AntdAttrProps = {
  className?: string;
  item?: AntdComp.InstanceType;
} & AttrType;

const AntdAttr: React.FC<AntdAttrProps> = (props) => {
  const [count, setCount] = useState(0);
  const stores = useStore();
  const { item, item: el, StylePage, PropsPage } = props;

  const {
    editorStore: { forceUpdate, forceUpdateLayout, changeKeys, renderAttrCount },
    compLibStore: { showTempListByAttr },
    pageTreeStore,
    globalStore: { isMobile },
  } = stores;

  const {
    props: { variable: bindValue, mapGlobalVariable },
  } = item;

  useEffect(() => {
    const value = bindValue || mapGlobalVariable; // mapGlobalVariable兼容页面选择组件和多按钮组件
    const find = item.eventSetings?.some((eventSeting) => {
      const { eventType, variable } = eventSeting;
      if (eventType === 'changeValue' && variable === value) {
        return true;
      }
      return false;
    });
    if (!!value && !find) {
      const eventSeting = {
        eventType: 'changeValue',
        isActive: true,
        variable: value,
        actions: [{}],
      };
      item.eventSetings.push(eventSeting); // 兼容之前放在数据源面板里设置的变量绑定
      setCount(count + 1);
    }
  }, [bindValue, item.eventSetings, mapGlobalVariable]);

  useEffect(() => {
    const scrollAttrEle = document.querySelector('[data-name="scrollAttr"]');
    scrollAttrEle && scrollAttrEle.addEventListener('scroll', listerAttrWraperScroll);
    return () => {
      scrollAttrEle && scrollAttrEle.removeEventListener('scroll', listerAttrWraperScroll);
    };
  }, []);

  const [tabIdx, setTabIdx] = useState(0);

  // 切换组件选中时默认选中组件第一栏配置
  useEffect(() => {
    setTabIdx(0);
    return () => {};
  }, [el.key]);

  // 切换组件时重置属性面板标签
  const tabIdxRef = useRef(tabIdx);
  const itemKeyRef = useRef(item.key);
  if (item?.key === itemKeyRef.current) {
    tabIdxRef.current = tabIdx;
  } else {
    itemKeyRef.current = item?.key;
    tabIdxRef.current = 0;
  }

  const isActive = (i: number) => {
    return i === tabIdx ? 'active' : '';
  };

  const styleProps = el.styles;

  const updateAttr = (field: string, value: any) => {
    if (typeof field === 'string' && isEqual(el.styles[field], value)) {
      return console.log(el.styles[field], value, '重复styles值不更新');
    }
    if (isPlainObject(field) && Object.entries(field).some(([key, val]) => el.styles[key] === val)) {
      return console.log(field, '重复styles值不更新');
    }
    window.executeCommand('updateAttr', el, field, value);
    setCount((c) => c + 1);
    return;
  };

  const updateCustomStyle = (field: string, value: any) => {
    // 更新自定义style
    set(el.customStyles, field, value);
    el.refresh && typeof el.refresh === 'function' && el.refresh();
    // fix: 自定义列表 - 滚动条的开关，页面的编辑未保存黄色标识没有显示
    pageTreeStore.setPageInfoStep(1);
    forceUpdateLayout();
    setCount(count + 1);
  };

  const refresh = () => {
    // forceUpdate();
    setCount(count + 1);
  };

  const updateField = useCallback(
    (field: string, value: any) => {
      window.executeCommand('updateField', el, field, value);
      setCount((c) => c + 1);
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    [setCount, el],
  );

  const updateMockData = useCallback(
    (value: Record<string, any>[]) => {
      // 更新字段
      el.mockData = value;
      // forceUpdate();
      setCount((c) => c + 1);
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    [setCount],
  );

  const updateDataSource = useCallback(
    (field: string, value: any) => {
      if (isEqual(get(el.dataset, field), value)) {
        return;
      }

      window.executeCommand('UpdateDataSourceCommand', el, field, value);
      setCount((c) => c + 1);
    },
    [setCount, el],
  );

  const translate = styleProps.transform
    .replace('translate(', '')
    .replaceAll(/px/gi, '')
    .replace(')', '')
    .replaceAll(/ /gi, '')
    .split(',');

  /** 传给组件库的 props 属性  */
  const propsParams: PropsParamsType = {
    forceUpdate: refresh,
    parentStyles: styles,
    store: stores,
    el,
    borderDataSource,
    forceUpdateLayout,
    overflowDataSource,
    PropsPage,
    StylePage,
    styleProps,
    styles,
    TemplateSelectModifier,
    translate,
    updateAttr,
    updateCustomStyle,
    updateDataSource,
    updateField,
    updateMockData,
  };
  if (el.type === 'LayerSearch') {
    propsParams.CompTree = CompTree;
    propsParams.getComponent = window.DataI.getComponentByKey;
  } else if (el.type === 'LayerLegend') {
    propsParams.DynamicApi = DynamicApi;
    propsParams.IndicatorApi = IndicatorApi;
    propsParams.MapField = MapField;
    propsParams.MapFieldForDefault = MapFieldForDefault;
  } else if (
    el.type === 'Descriptions' &&
    (propsParams.styleProps.overflow === 'visible' || propsParams.styleProps.overflow === 'auto')
  ) {
    propsParams.styleProps.overflow = 'hidden';
  }

  return (
    <div className={props.className || ''} style={{ overflow: showTempListByAttr ? 'visible' : 'hidden' }}>
      {showTempListByAttr && <TempList className='temp-list-attr' type='attr' item={item} />}

      <div className='yl-comp-tabs '>
        <div
          className={`yl-comp-tab ${isActive(0)}`}
          onClick={() => {
            setTabIdx(0);
          }}
        >
          <img title='样式' src={isActive(0) ? dataIcon.setting.hoverIcon : dataIcon.setting.icon} alt='' />
        </div>
        {item.classType === 'customMap' ? null : (
          <>
            <div
              className={`yl-comp-tab ${isActive(1)}`}
              onClick={() => {
                setTabIdx(1);
              }}
            >
              <img title='数据' src={isActive(1) ? dataIcon.data.hoverIcon : dataIcon.data.icon} alt='' />
            </div>
            <div
              className={`yl-comp-tab ${isActive(2)}`}
              onClick={() => {
                setTabIdx(2);
              }}
            >
              <img title='交互' src={isActive(2) ? dataIcon.interactive.hoverIcon : dataIcon.interactive.icon} alt='' />
            </div>
          </>
        )}
      </div>

      {tabIdxRef.current === 0 &&
        // v8.8 添加key值区分，防止错误复用
        (item.classType !== 'customMap' && item.classType !== 'customComp' ? (
          <BasicDarkStyles key={`BasicDarkStyles-${el.key}`} {...propsParams} />
        ) : (
          <CustomCompDarkStyle key={`CustomCompDarkStyle-${el.key}`} {...propsParams} />
        ))}
      {tabIdxRef.current === 1 &&
        (item.classType !== 'customMap' && item.classType !== 'customComp' ? (
          <BasicDarkProps {...propsParams} />
        ) : (
          <CustomPropsPageStyles {...propsParams} />
        ))}
      {tabIdxRef.current === 2 && item.classType !== 'customMap' && (
        <InteractiveS changeKeys={changeKeys as [string]} isMobile={isMobile} />
      )}
    </div>
  );
};

export default observer(AntdAttr);
