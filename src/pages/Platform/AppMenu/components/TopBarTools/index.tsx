import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { isAllowSort } from '@/utils/configPageUtils';
import './index.less';

interface IProps {
  onDragOver: (e) => void;
  onDrop: (e) => void;
}

const TopBarTools = (props: IProps) => {
  const { onDragOver, onDrop } = props;
  const { editorStore } = useStore();
  const { changeKeys, dynamicPanelEditComp, getEditComp, editModePaths } = editorStore;
  /** 获取当前编辑组件 组或者面板，或者无编辑 */
  const editComp = getEditComp(editModePaths);
  let type;
  let parentKey;
  /**
   * 右键编辑的动态面板key
   */
  if (dynamicPanelEditComp) {
    type = 'dynamicPanel';
    parentKey = dynamicPanelEditComp;
  } else if (editComp && (editComp.type === 'DynamicPanel' || editComp.type === 'CollapsePanel')) {
    type = 'dynamicPanel';
    parentKey = editComp.key;
  }
  /**
   * 上移
   * @returns
   */
  const ToTop = () => {
    // 判断组件是否可以上移，必定有选中组件
    if (!isAllowSort(changeKeys, type, parentKey, 'ToTop')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'ToTop');
  };
  /**
   * 上移
   * @returns
   */
  const ToBottom = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'ToBottom')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'ToBottom');
  };
  /**
   * 置顶
   * @returns
   */
  const upSeat = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'UpSeat')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'UpSeat');
  };
  /**
   * 置底
   * @returns
   */
  const nextSeat = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'NextSeat')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'NextSeat');
  };
  return (
    <div>
      <div className='com-operation-sort row' onDragOver={onDragOver} onDrop={onDrop} data-item='com-operation-sort'>
        <div onClick={upSeat} className='pre-tab' title='上移' />
        <div onClick={nextSeat} className='next-tab' title='下移' />
        <div onClick={ToTop} className='top-tab' title='置顶' />
        <div onClick={ToBottom} className='bottom-tab' title='置底' />
      </div>
    </div>
  );
};

export default observer(TopBarTools);
