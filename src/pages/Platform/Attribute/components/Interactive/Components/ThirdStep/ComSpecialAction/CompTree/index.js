import React, { useCallback, useEffect, useState } from 'react';
import { TreeSelect } from 'antd';
import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { COMPONENT_SPECIAL_ACTIONS } from '../constant';
import styles from './index.less';

const { TreeNode, SHOW_PARENT } = TreeSelect;

// 支持“组件特定动作”的组件集合
const supportComponents = Object.keys(COMPONENT_SPECIAL_ACTIONS);

const CompTree = (props) => {
  const { relation, onTreeChange, type, getPopupContainer, appPageId } = props;
  const {
    layerStore,
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    pageTabsStore: { selectedKey },
  } = useStore();
  const pageType = GetQueryString('type');

  const isStatic = (v) => {
    if (v.classType === 'group') return true; // 组要保留
    const compType = v.classType === 'antd' ? v.type : v.englishName;
    if (supportComponents.includes(compType)) return true;
    return false;
  };

  const mapData = (data) => {
    return data.map((item) => {
      const obj = {
        title: item.name || item.compName,
        value: item.key,
        layerId: item.layerId,
        classType: item.classType,
      };
      if (item.classType === 'group') {
        obj.disabled = true;
      }
      if (type === 'comspecialAction') {
        obj.isStaticData = isStatic(item);
      }
      // 展开组
      if (item.childComList && item.classType === 'group') {
        obj.children = mapData(item.childComList);
      }
      return obj;
    });
  };

  // 只显示组或者使用动态数据或指标数据的组件
  const treeNodeRender = useCallback((data = []) => {
    return data.map(({ title, value, children, disabled, isStaticData }) => {
      return (
        <TreeNode
          value={value}
          title={title}
          key={value}
          disabled={!!disabled}
          style={isStaticData === false ? { display: 'none' } : null}
        >
          {children && treeNodeRender(children)}
        </TreeNode>
      );
    });
  }, []);

  // 组件数据
  const getTreeData = () => {
    let layers = [],
      comList = [];
    if (appPageId === selectedKey || !appPageId) {
      // 当前页
      layers = layerStore.layers;
      comList = layerStore.comList;
    } else {
      // 跨页面
      if (pageInfoMap[appPageId]) {
        // 如果左侧页面加载过，则用它的，因为可以拿到增删改最新的组件信息
        layers = pageInfoMap[appPageId]?.pageConfig?.layerConfig?.layers || [];
        comList = pageInfoMap[appPageId]?.componentList || [];
      } else if (actionPageInfoMap[appPageId]) {
        // 否则则用自己请求到的
        layers = actionPageInfoMap[appPageId]?.pageConfig?.layerConfig?.layers || [];
        comList = actionPageInfoMap[appPageId]?.componentList || [];
      }
    }
    const layersData = layers.map((item) => {
      const arr = comList.filter((v) => v.layerId === item.layerId);
      const obj = {
        title: item.layerName,
        value: item.key,
        layerId: item.layerId,
        selectable: true,
        disabled: false,
        children: mapData(arr),
      };
      if (type === 'comspecialAction') {
        obj.selectable = false;
        obj.disabled = true;
      }
      if (pageType === 'layer') {
        obj.selectable = false;
        obj.disabled = true;
      }
      return obj;
    });
    return layersData;
  };

  let treeData = getTreeData();
  if (pageType === 'card') {
    treeData = mapData(window.componentList);
  }
  const tProps = {
    value: relation,
    onChange: onTreeChange,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '请选择',
    treeCheckable: true, // 多选
    showArrow: true,
    treeDefaultExpandAll: true,
  };
  // if (type !== 'updateData') {
  //   tProps.treeData = treeData;
  // }
  // 动画不支持多选
  if (type === 'comspecialAction') {
    delete tProps.treeCheckable;
  }
  if (getPopupContainer) {
    tProps.getPopupContainer = getPopupContainer;
  }

  return (
    <TreeSelect
      suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
      showSearch
      className={styles.compTree}
      dropdownClassName={styles.dropDown}
      treeNodeFilterProp='title'
      {...tProps}
      virtual={false}
    >
      {treeNodeRender(treeData)}
    </TreeSelect>
  );
};

export default CompTree;
