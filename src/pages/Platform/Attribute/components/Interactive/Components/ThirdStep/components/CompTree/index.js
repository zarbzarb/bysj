import React, { useCallback } from 'react';
import { TreeSelect } from 'antd';
import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import DataICompKit from '@/utils/dataiUtils';
import styles from './index.less';

const { TreeNode, SHOW_PARENT } = TreeSelect;

const CompTree = (props) => {
  const { comp, relation, onTreeChange, type, getPopupContainer, appPageId, listenEvent } = props;
  const {
    layerStore,
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    pageTabsStore: { selectedKey },
  } = useStore();
  const pageType = GetQueryString('type');

  const isDynamic = (v) => {
    if (v.classType === 'antd' && v.dataset?.category) {
      const { category } = v.dataset;
      return category === 'dynamic' || category === 'indicator';
    }
    if (v.classType === 'com') {
      let _source = '';
      if (v.instance?.config?._source) {
        _source = DataICompKit.getConfig(v)?._source;
      } else if (v._config?._source) {
        // 跨页面的话 datai 组件可能没 instance
        _source = v._config?._source;
      }
      return _source === 'dynamic' || _source === 'indicator';
    }
    if (v.classType === 'customComp' && v.dataset?.category) {
      const { category } = v.dataset;
      return category === 'dynamic' || category === 'indicator';
    }
    if (v.classType === 'group') {
      // 组要保留
      return true;
    }
    return false;
  };

  const mapData = (data) => {
    return data.map((item) => {
      const obj = {
        title: item.name || item.compName,
        value: item.key,
        layerId: item.layerId,
      };

      // 组件为自定义列表，并且当前绑定交互的组件不是自定义列表的子组件
      const isCustomList =
        (item.type === 'CustomList' && !comp?.isCustomListChild) ||
        (item.type === 'CustomCell' && !comp?.isCustomListChild);

      if (
        (type === 'refreshDataSource' || type === 'compData' || type === 'listenEvent') &&
        item.classType === 'group'
      ) {
        obj.disabled = true;
      }
      if (type === 'compData' && ['CustomList', 'CustomCell'].includes(item.type)) {
        obj.disabled = true;
      }
      if (type === 'refreshDataSource') {
        obj.isDynamicData = isDynamic(item);
      }
      // 过滤出静态数据的组件（监听事件组件数据有用到）
      if (type === 'listenEvent') {
        if (item.classType === 'com') {
          const config = item.instance ? item.instance.config : item.preAttr ? item.preAttr._config : item._config;
          if (config._source !== 'json') {
            obj.isNotJson = true;
          }
        } else if (item.classType === 'antd' && (!item.dataset || item.dataset.category !== 'json')) {
          // v8.5.1修改判断条件，加上某些组件可能没有dataset
          obj.isNotJson = true;
        }
      }
      if (item.childComList && !isCustomList) {
        const arr = mapData(item.childComList);
        obj.children = arr;
      }
      // 显隐动画选择时去掉地图子组件
      // if (item.layers) {
      //   let arr = mapData(item.layers);
      //   obj.children = arr;
      // }

      if (item.type === 'DynamicPanel') {
        obj.children = item.props.panes.map((child, index) => {
          return {
            title: child.name || child.title,
            value: `DynamicPanel-${item.key}-${child.key}`,
            layerId: item.layerId,
            disabled: type === 'refreshDataSource',
            children: mapData(item.children[index].AntdChildComponents),
          };
        });
      }

      // v8.17 新增折叠面板
      if (item.type === 'CollapsePanel') {
        obj.children = item.props.items.map((child, index) => {
          return {
            title: child.name,
            value: `CollapsePanel-${item.key}-${child.key}`,
            layerId: item.layerId,
            disabled: type === 'refreshDataSource',
            children: mapData(item.children[index].AntdChildComponents),
          };
        });
      }
      return obj;
    });
  };

  // 只显示组或者使用动态数据或指标数据的组件
  const treeNodeRender = useCallback(
    (data = []) => {
      return data.map(({ title, value, children, disabled, isDynamicData, isNotJson }) => (
        <TreeNode
          value={value}
          title={title}
          key={value}
          disabled={!!disabled}
          style={isDynamicData === false || (type === 'listenEvent' && isNotJson === true) ? { display: 'none' } : null}
        >
          {children && treeNodeRender(children)}
        </TreeNode>
      ));
    },
    [type],
  );

  // 组件数据
  const getTreeData = () => {
    let layers = [],
      comList = [];
    if (appPageId === selectedKey || !appPageId) {
      // 当前页
      layers = layerStore.layers;
      comList = layerStore.comList;
      // 跨页面
    } else if (pageInfoMap[appPageId]) {
      // 如果左侧页面加载过，则用它的，因为可以拿到增删改最新的组件信息
      layers = pageInfoMap[appPageId]?.pageConfig?.layerConfig?.layers || [];
      comList = pageInfoMap[appPageId]?.componentList || [];
    } else if (actionPageInfoMap[appPageId]) {
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
      const typeList = ['animate', 'LayerSearch', 'refreshDataSource', 'compData', 'listenEvent'];
      if (typeList.includes(type)) {
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
  if (type !== 'refreshDataSource' && type !== 'listenEvent') {
    tProps.treeData = treeData;
  }
  // 动画不支持多选
  if (type === 'animate' || type === 'refreshDataSource' || type === 'compData' || type === 'listenEvent') {
    delete tProps.treeCheckable;
  }
  if (getPopupContainer) {
    tProps.getPopupContainer = getPopupContainer;
  }
  // if (type === 'showHide') {
  //   tProps.showCheckedStrategy =  SHOW_CHILD,
  // }

  return type === 'refreshDataSource' || type === 'listenEvent' ? (
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
  ) : (
    <TreeSelect
      suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
      showSearch
      className={styles.compTree}
      dropdownClassName={styles.dropDown}
      treeNodeFilterProp='title'
      {...tProps}
      virtual={false}
    />
  );
};

export default CompTree;
