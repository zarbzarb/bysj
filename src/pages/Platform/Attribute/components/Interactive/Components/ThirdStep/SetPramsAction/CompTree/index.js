import React, { useCallback } from 'react';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { TreeSelect } from 'antd';
import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import styles from './index.less';

const { TreeNode, SHOW_PARENT } = TreeSelect;

const CompTree = (props) => {
  const { comp, relation, onTreeChange, type, getPopupContainer, appPageId } = props;
  const {
    layerStore,
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    pageTabsStore: { selectedKey },
  } = useStore();
  const pageType = GetQueryString('type');

  const isStatic = (v, itemType) => {
    if (v.type === 'LayerLegend') {
      // 图层图例
      // v.dataset = v.props.dataSourceSet;
      return v.props.dataSourceSet.category === 'json';
    }
    if (v.classType === 'antd') {
      if (v.type === 'Calendar') {
        // 日历卡片
        return !v.dataset.isVariable;
      }
      if (v.dataset?.category) {
        return v.dataset.category === 'json';
      }
    }
    if (v.classType === 'com' && v.instance?.config?._source) {
      const { _source } = v.instance.config;
      return _source === 'json';
    }
    if (v.classType === 'group') {
      // 组要保留
      return true;
    }

    if (v.classType === 'customComp') {
      return v.dataset.category === 'json';
    }
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

      // 组件为自定义列表，并且当前绑定交互的组件不是自定义列表的子组件
      const isCustomList =
        (item.type === 'CustomList' && !comp?.isCustomListChild) ||
        (item.type === 'CustomCell' && !comp?.isCustomListChild);

      if (
        (type === 'updateData' || type === 'compData') &&
        (item.classType === 'group' || ['CustomList', 'CustomCell'].includes(item.type))
      ) {
        obj.disabled = true;
      }

      if (type === 'updateData') {
        obj.isStaticData = isStatic(item, '');
      }

      if (item.type === 'List' || isCustomList) {
        // 自定义列表，多行列表无法被选择
        obj.isStaticData = false;
      }

      // 自定义列表组件特殊，不考虑更新数据功能
      if (item.childComList && !isCustomList) {
        const arr = mapData(item.childComList);
        obj.children = arr;
      }
      return obj;
    });
  };

  // 只显示组或者使用动态数据或指标数据的组件
  const treeNodeRender = useCallback((data = [], type) => {
    return data.map(({ title, value, children, disabled, isStaticData }) => {
      return (
        <TreeNode
          value={value}
          title={title}
          key={value}
          disabled={!!disabled}
          style={isStaticData === false ? { display: 'none' } : null}
        >
          {children && treeNodeRender(children, type)}
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
    } else if (pageInfoMap[appPageId]) {
      // 跨页面
      // 如果左侧页面加载过，则用它的，因为可以拿到增删改最新的组件信息
      layers = pageInfoMap[appPageId]?.pageConfig?.layerConfig?.layers || [];
      comList = pageInfoMap[appPageId]?.componentList || [];
    } else if (actionPageInfoMap[appPageId]) {
      // 跨页面
      // 否则则用自己请求到的
      layers = actionPageInfoMap[appPageId]?.pageConfig?.layerConfig?.layers || [];
      comList = actionPageInfoMap[appPageId]?.componentList || [];
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
      if (type === 'updateData' || type === 'compData') {
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
  if (type === 'updateData' || type === 'compData') {
    delete tProps.treeCheckable;
  }
  if (getPopupContainer) {
    tProps.getPopupContainer = getPopupContainer;
  }

  return (
    <TreeSelect
      showSearch
      suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
      className={styles.compTree}
      dropdownClassName={styles.dropDown}
      treeNodeFilterProp='title'
      {...tProps}
      virtual={false}
    >
      {treeNodeRender(treeData, type)}
    </TreeSelect>
  );
};

export default CompTree;
