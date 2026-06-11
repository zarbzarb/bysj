import React, { useState } from 'react';
import { Divider, Tooltip, Switch } from 'antd';

import {
  leftTopAlignEvent,
  rightBotAlignEvent,
  centerAlignEvent,
  checkCanAlign,
  equallySpaced,
} from '@/EventHandlers/HeaderOperationEvent';
import { useStore } from '@/hooks';
import { observer } from 'mobx-react';
import { GetQueryString } from '@/utils/BrowserUtils';

import bottomAlignIcon from '@/assets/newIcon/operationIcon/BottomAlign.svg';
import bottomAlignDisableIcon from '@/assets/newIcon/operationIcon/BottomAlignDisable.svg';
import rowAlignIcon from '@/assets/newIcon/operationIcon/RowAlign.svg';
import rowAlignDisableIcon from '@/assets/newIcon/operationIcon/RowAlignDisable.svg';
import leftAlignIcon from '@/assets/newIcon/operationIcon/LeftAlign.svg';
import leftAlignDisableIcon from '@/assets/newIcon/operationIcon/LeftAlignDisable.svg';
import columnsAlignIcon from '@/assets/newIcon/operationIcon/ColumnsAlign.svg';
import columnsAlignDisableIcon from '@/assets/newIcon/operationIcon/ColumnsAlignDisable.svg';
import rightAlignIcon from '@/assets/newIcon/operationIcon/RightAlign.svg';
import rightAlignDisableIcon from '@/assets/newIcon/operationIcon/RightAlignDisable.svg';
import topAlignIcon from '@/assets/newIcon/operationIcon/TopAlign.svg';
import topAlignDisableIcon from '@/assets/newIcon/operationIcon/TopAlignDisable.svg';
import undoActIcon from '@/assets/newIcon/operationIcon/undoActive.svg';
import redoActIcon from '@/assets/newIcon/operationIcon/redoActive.svg';
import equallySpacedRowsIcon from '@/assets/newIcon/operationIcon/EquallySpacedRows.svg';
import equallySpacedRowsDisableIcon from '@/assets/newIcon/operationIcon/EquallySpacedRowsDisable.svg';
import evenlySpacedColumnsIcon from '@/assets/newIcon/operationIcon/EvenlySpacedColumns.svg';
import evenlySpacedColumnsDisableIcon from '@/assets/newIcon/operationIcon/EvenlySpacedColumnsDisable.svg';
import undoIcon from '@/assets/newIcon/operationIcon/undo.svg';
import redoIcon from '@/assets/newIcon/operationIcon/redo.svg';
import HocConfigProvider from '@/components/commons/HocConfigProvider';
import LocatingComp from './LocatingComp';
import FilterConfig from './FilterConfig';
import styles from './index.less';

const HocFilterConfig = HocConfigProvider(FilterConfig); // 增加暗黑主题

const Operation = () => {
  // console.log('Operation');
  const { editorStore: store, globalStore, pageTreeStore } = useStore();
  const keys = store.changeKeys;

  const pageType = GetQueryString('type');

  const filterPage: Record<string, any> = globalStore.screenConfig.filter;

  const [filterClick, setFilterClick] = useState(false);

  const leftAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    leftTopAlignEvent(keys, 'left');

    // store.forceUpdateLayout();
  };
  const centerAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    centerAlignEvent(keys, 'center');

    // store.forceUpdateLayout();
  };
  const rightAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    rightBotAlignEvent(keys, 'right');

    // store.forceUpdateLayout();
  };
  const topAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    leftTopAlignEvent(keys, 'top');

    // store.forceUpdateLayout();
  };
  const middleAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    centerAlignEvent(keys, 'middle');

    // store.forceUpdateLayout();
  };
  const bottomAlignClick = () => {
    if (!checkCanAlign(keys)) return false;
    rightBotAlignEvent(keys, 'bottom');

    // store.forceUpdateLayout();
  };

  const rowEquallySpaced = () => {
    if (!checkCanAlign(keys) || keys.length <= 2) return false;
    equallySpaced(keys, 'row');
  };
  const columnEquallySpaced = () => {
    if (!checkCanAlign(keys) || keys.length <= 2) return false;
    equallySpaced(keys, 'column');
  };

  const undo = () => {
    if (store.undoStack.length === 0) return;
    window.executeCommand('undo');
  };
  const redo = () => {
    if (store.redoStack.length === 0) return;
    window.executeCommand('redo');
  };
  return (
    <ul className={`${styles.operation} antd-drak`}>
      {/** 定位组件 */}
      <LocatingComp />

      {pageType === 'page' && !globalStore.isMobile && (
        <li className={styles.filterBtn}>
          <span
            onClick={() => {
              if (filterPage.switchVal) {
                setFilterClick(!filterClick);
              }
            }}
          >
            滤镜配置
          </span>
          <Switch
            checked={filterPage && filterPage.switchVal ? filterPage.switchVal : false}
            className={styles.swicth}
            onChange={(e) => {
              if (!e) {
                setFilterClick(false);
              }
              globalStore.updateScreenConfig(e, 'switchVal', ['filter']);
              pageTreeStore.setPageInfoStep(1);
            }}
          />
          {filterClick && filterPage.switchVal && (
            <HocFilterConfig
              setFilterClick={setFilterClick}
              filter={filterPage}
              updateScreenConfig={(value, field, parent) => {
                globalStore.updateScreenConfig(value, field, parent);
                pageTreeStore.setPageInfoStep(1);
              }}
            />
          )}
        </li>
      )}

      <li onClick={leftAlignClick}>
        <Tooltip placement='bottom' title='左对齐'>
          <img alt='' src={checkCanAlign(keys) ? leftAlignIcon : leftAlignDisableIcon} />
        </Tooltip>
      </li>
      <li onClick={centerAlignClick}>
        <Tooltip placement='bottom' title='水平居中'>
          <img alt='' src={checkCanAlign(keys) ? rowAlignIcon : rowAlignDisableIcon} />
        </Tooltip>
      </li>
      <li onClick={rightAlignClick}>
        <Tooltip placement='bottom' title='右对齐'>
          <img alt='' src={checkCanAlign(keys) ? rightAlignIcon : rightAlignDisableIcon} />
        </Tooltip>
      </li>
      <Divider type='vertical' className={styles.divid} />
      <li onClick={topAlignClick}>
        <Tooltip placement='bottom' title='上对齐'>
          <img alt='' src={checkCanAlign(keys) ? topAlignIcon : topAlignDisableIcon} />
        </Tooltip>
      </li>
      <li onClick={middleAlignClick}>
        <Tooltip placement='bottom' title='垂直居中'>
          <img alt='' src={checkCanAlign(keys) ? columnsAlignIcon : columnsAlignDisableIcon} />
        </Tooltip>
      </li>
      <li onClick={bottomAlignClick}>
        <Tooltip placement='bottom' title='下对齐'>
          <img alt='' src={checkCanAlign(keys) ? bottomAlignIcon : bottomAlignDisableIcon} />
        </Tooltip>
      </li>

      <li onClick={rowEquallySpaced}>
        <Tooltip placement='bottom' title='垂直等间距分布'>
          <img
            alt=''
            src={checkCanAlign(keys) && keys.length > 2 ? equallySpacedRowsIcon : equallySpacedRowsDisableIcon}
          />
        </Tooltip>
      </li>
      <li onClick={columnEquallySpaced}>
        <Tooltip placement='bottom' title='水平等间距分布'>
          <img
            alt=''
            src={checkCanAlign(keys) && keys.length > 2 ? evenlySpacedColumnsIcon : evenlySpacedColumnsDisableIcon}
          />
        </Tooltip>
      </li>

      <div style={{ width: '100%' }} />

      <li onClick={undo}>
        <Tooltip placement='bottom' title='回退'>
          <img alt='undo' src={store.undoStack.length === 0 ? undoIcon : undoActIcon} />
        </Tooltip>
      </li>
      <li onClick={redo}>
        <Tooltip placement='bottom' title='前进'>
          <img alt='' src={store.redoStack.length === 0 ? redoIcon : redoActIcon} />
        </Tooltip>
      </li>
    </ul>
  );
};

export default observer(Operation);
