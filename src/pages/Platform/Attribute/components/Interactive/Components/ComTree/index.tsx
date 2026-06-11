import React, { useCallback, useMemo } from 'react';
import { TreeSelect } from 'antd';
import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { TreeNode, SHOW_PARENT } = TreeSelect;

const CompTree = (props) => {
  const { relation, onTreeChange, type, getPopupContainer } = props;
  const {
    layerStore,
    pageTreeStore: { pageInfoMap, homePageId, pageTree, selectedItem },
  } = useStore();
  const pageType = GetQueryString('type');

  const mapData = (data) => {
    return data.map((item) => {
      const obj = {
        title: item.name || item.compName,
        value: item.key,
        layerId: item.layerId,
        children: [],
        disabled: false,
      };
      if ((type === 'refreshDataSource' || type === 'compData') && item.classType === 'group') {
        obj.disabled = true;
      }
      if (item.childComList) {
        const arr = mapData(item.childComList);
        obj.children = arr;
      }

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

      if (['CustomList', 'CustomCell'].includes(item.type)) {
        obj.children = [];
      }
      return obj;
    });
  };

  const homePage = useMemo(() => {
    const loop = (tree: any) => {
      return tree.find((item) => {
        if (item.appPageId === homePageId) {
          return item;
        }
        if (item.children?.length) {
          return loop(item.children);
        }
        return null;
      });
    };
    const data = loop(pageTree);
    return data;
  }, [homePageId]);

  // console.log(pageTree, homePage);

  const treeNodeRender = useCallback((data = []) => {
    return data.map(({ title, value, children, disabled }) => (
      <TreeNode value={value} title={title} key={value} disabled={!!disabled}>
        {children && treeNodeRender(children)}
      </TreeNode>
    ));
  }, []);

  // 组件数据
  const getTreeData = () => {
    if (pageType === 'card' || pageType === 'layer') {
      return mapData(window.componentList);
    }

    // 在主页，只能选择主页的组件
    if (selectedItem?.isHomePage) {
      const layers =
        pageType === 'layer'
          ? layerStore.layers
          : pageInfoMap[selectedItem.appPageId]?.pageConfig?.layerConfig?.layers || [];
      const { comList } = layerStore;
      return layers.map((item) => {
        const arr = comList.filter((v) => v.layerId === item.layerId);
        const layer = {
          title: item.layerName,
          value: item.key,
          layerId: item.layerId,
          selectable: false,
          disabled: true,
          children: mapData(arr),
        };
        return layer;
      });
    }
    // 主页 + 当前页面
    const pages = [homePage, selectedItem];
    return pages.map((page) => {
      // 获取当前页面的图层
      const layers = pageInfoMap[page.appPageId]?.pageConfig?.layerConfig?.layers || [];
      // 当前页组件
      let { comList } = layerStore;
      if (page.isHomePage) {
        // 其他页组件
        comList = pageInfoMap[page.appPageId]?.componentList || [];
      }
      const layersData = layers.map((item) => {
        const arr = comList.filter((v) => v.layerId === item.layerId);
        const layer = {
          title: item.layerName,
          value: item.key,
          layerId: item.layerId,
          selectable: false,
          disabled: true,
          children: mapData(arr),
        };
        return layer;
      });

      return {
        title: page.name,
        value: page.appPageId,
        selectable: false,
        disabled: true,
        children: layersData,
      };
    });
  };

  const treeData = getTreeData();

  const tProps = {
    value: relation,
    onChange: onTreeChange,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '请选择',
    showArrow: true,
    treeDefaultExpandAll: true,
    getPopupContainer: (triggerNode) => triggerNode.parentNode,
  };

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
