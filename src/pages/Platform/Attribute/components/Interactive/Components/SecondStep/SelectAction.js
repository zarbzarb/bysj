import React, { Fragment, useState } from 'react';
import { Select, Modal } from 'antd';
import { Actions } from '@/staticJson/AnimationComponentsList';
import _ from 'lodash';
import { useStore } from '@/hooks';
import { GetQueryString } from '@/utils/BrowserUtils';
import styles from './index.less';
import {
  animateIn,
  animateOut,
  animateLoop,
  animateSettings,
  variableSettings,
  createToggle,
  visiableToggle,
  eventEmit,
  gisEventEmit,
  sceneInteraction,
  videoInteraction,
  // v6.19 新增全屏显示设置
  fullScreenSetting,
  // v7.4 跳转页面
  jumpPageSetting,
  // v7.9 刷新数据源
  refreshDataSource,
  // v8.3.0 更新数据
  updateData,
  // v8.5.0 触发组件特定动作
  comSpecialAction,
  remoteEvent,
  crossOriginMessage,
} from './settingsData';

const { Option } = Select;

const actionInitJson = {
  animateIn,
  animateOut,
  animateLoop,
  // v6.18 新增动画设置配置
  animateSettings,
  variableSettings,
  createToggle, // 选中值支持创建销毁
  visiableToggle,
  eventEmit,
  gisEventEmit,
  sceneInteraction,
  videoInteraction,
  // v6.19 新增全屏显示
  fullScreen: fullScreenSetting,
  // v7.4 跳转页面设置
  jumpPage: jumpPageSetting,
  // v7.9 刷新数据源
  refreshDataSource,
  // v8.3.0 更新数据
  updateData,
  // v8.5.0 触发组件特定动作
  comSpecialAction,
  remoteEvent,
  crossOriginMessage,
};

// 增加交互时需要设置当前 appPageId 的交互列表
const setAppPageIdActions = new Set(['visiableToggle', 'createToggle', 'refreshDataSource', 'videoInteraction']);

const SelectAction = ({ item: itemSltAct, refresh, type, comp, parentIdx, idx }) => {
  const pageType = GetQueryString('type');
  const { pageTabsStore } = useStore();
  // 卡片模式，地图交互动画不支持
  Actions.forEach((itemAct, index) => {
    if (window.pageTypes === 'card' && itemAct.value === 'gisEventEmit') {
      Actions.splice(index, 1);
    }
  });
  // 选择交互
  const changeHandler = (um) => {
    // item.actionType = um.value;
    // item.actionName = um.label;
    // item.actionSettings = _.cloneDeep(actionInitJson[um.value]);
    // refresh();
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const event = eventSettings[parentIdx];
    const currentActionGroup = event.actionGroup.find((ag) => ag.key === event.selectedKey);
    const item = currentActionGroup.actions[idx];
    item.actionType = um.value;
    item.actionName = um.label;
    item.actionSettings = _.cloneDeep(actionInitJson[um.value]);
    if (um.value === 'jumpPage' && pageType !== 'page' && item.actionSettings.target === '_router') {
      item.actionSettings.target = '_self';
    }
    item.isActive = true;
    if (setAppPageIdActions.has(um.value)) {
      item.actionSettings.appPageId = pageTabsStore.selectedKey; // 添加这些交互的时候默认选中当前页
    }
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const onlineActions = Actions.filter((action) => {
    if (type === 'initialization') {
      const { value } = action;
      // 去掉初始化创建销毁事件，显示隐藏考虑到项目上没有升级不去掉
      return !(value === 'createToggle' || value === 'refreshDataSource');
    }

    return !action.isOffLine;
  });

  /**
   * v8.6.0 支持模糊搜索
   * @param {*} input 输入文本
   * @param {*} option 选项
   * @returns
   */
  const filterOption = (input, option) => {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().includes(input.toLowerCase()) : false;
  };

  return (
    <>
      <div className={styles.selectAction}>
        {/* v8.6.0 交互的下拉框改为下拉输入框，支持模糊搜索 */}
        <Select
          labelInValue
          showSearch
          onChange={changeHandler}
          filterOption={filterOption}
          placeholder='请选择交互类型'
          size='small'
          value={{ value: itemSltAct.actionType, label: itemSltAct.actionName }}
          className={styles.select}
        >
          {onlineActions.map((action) => (
            <Option value={action.value} key={action.value}>
              {action.name}
            </Option>
          ))}
        </Select>
      </div>
    </>
  );
};

export default SelectAction;
