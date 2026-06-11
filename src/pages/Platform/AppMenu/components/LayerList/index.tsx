import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import LayerManagement from '../LayerManagement';
import CompTree from '../CompTree';
import styles from './index.less';

/*
 * @Author: 赵晶晶
 * 图层与组件列表
 */
interface IProps {
  onContextMenu: (e) => void; // 显示右键菜单
}

let currentItemDragStartClientX = 0; // 鼠标距离左侧视口的距离

const LayerList = (props: IProps) => {
  const { globalStore, editorStore } = useStore();
  const { bigScreenType } = globalStore;
  const { editModePaths } = editorStore;
  const { onContextMenu } = props;
  const [groupInnerLine, setGroupInnerLine] = useState(null); // 组件移动到组内展示的底部的线
  const groupRef = useRef(null); // 当前目标组

  // 是否支持图层管理，卡片和二级编辑不支持图层管理
  const isSupportLayerManage = bigScreenType !== 'card' && editModePaths.length === 0;

  const GroupInnerFn = (e, targetItem) => {
    const childNodes = [...e.target.childNodes];
    const bottomPartLine: HTMLElement | undefined | any = childNodes.find((item: any) =>
      item.classList.contains('bottom-part-line'),
    );

    const moveSite = targetItem.classType === 'group' && currentItemDragStartClientX > 90 && 'childNode';
    groupRef.current = e.target;
    if (
      moveSite === 'childNode' && // 如果移动到组内，则显示组内线
      bottomPartLine
    ) {
      e.target.classList.remove('drag-up', 'drag-down');
      setGroupInnerLine(bottomPartLine);
      bottomPartLine.style.display = 'block';
      bottomPartLine.style.bottom = '-3px';
    }
  };

  const clearGroupInnerLine = () => {
    if (groupInnerLine) {
      groupInnerLine.style.display = 'none';
      groupInnerLine.style.bottom = 0;
      setGroupInnerLine(null);
    }
  };

  const onDrop = (e) => {
    if ((window as any).dropCallback) {
      // 当 targetDatasetItem 存在时，目标是 targetDatasetItem， 当不存在时，则目标是容器，应当放在容器的第一个树层级的最后一位
      const targetDatasetItem = e.target.dataset.item;
      (window as any).dropCallback(targetDatasetItem || 'com-change-com-layer', currentItemDragStartClientX, e);
      // (window as any).dropCallback = null;
    }
    clearGroupInnerLine();
  };

  const onDragOver = (e) => {
    currentItemDragStartClientX = e.clientX;
    const dataItem = e.target.dataset.item;
    if (dataItem) {
      if (dataItem === 'com-operation-sort') {
        // 拖动到置顶的位置
      } else {
        const { key } = JSON.parse(dataItem);
        const targetItem = window.DataI.getComponentByKey(key);
        GroupInnerFn(e, targetItem);
      }
    }
  };

  // 拖拽时鼠标移出目标元素时在目标元素上触发
  const dragleave = () => {
    clearGroupInnerLine();
  };

  groupRef.current && groupRef.current.classList.remove('drag-up', 'drag-down');

  return (
    <div className={styles.layerListContainer} onDrop={onDrop} onDragLeave={dragleave} onDragOver={onDragOver}>
      {/* 图层列表管理 */}
      {isSupportLayerManage && <LayerManagement />}
      {/* 组件列表 */}
      <CompTree onContextMenu={onContextMenu} bigScreenType={bigScreenType} />

      <div style={{ height: 30 }} />
    </div>
  );
};

export default observer(LayerList);
