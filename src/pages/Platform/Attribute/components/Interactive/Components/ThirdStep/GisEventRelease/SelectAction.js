import React from 'react';
import { Select } from 'antd';
import { gisEventType } from '@/staticJson/AnimationComponentsList';

import _ from 'lodash';
import styles from './index.less';
import { getCurrentAction, transformGroupOptions } from '../../../utils';

const { Option, OptGroup } = Select;

const SelectAction = ({ mapType, refresh, comp, parentIdx, actionIdx, idx }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const actions = action.actionSettings.mapAction;
  const item = actions[idx];
  // 选择地图交互类型
  let gisEventList = _.cloneDeep(gisEventType);
  // 卡片编辑,不支持地图交互
  if (window.pageTypes === 'card') {
    gisEventList = [];
  }
  // 三维暂时屏蔽部分地图交互（热力线渲染）
  // 二维不支持（水位升降、粒子特效）
  if (mapType) {
    let disableActions = [];
    switch (mapType) {
      case 'MapFoundationPlan': {
        disableActions = ['mapDynamicWater', 'mapParticleEffects', 'mapLookAt'];
        break;
      }
      case 'MapGlFoundationPlan': {
        disableActions = ['mapDynamicWater', 'mapParticleEffects'];
        break;
      }
      case 'Map3DFoundationPlan': {
        // disableActions = ['mapFlyAnimate'];
        break;
      }
      default: {
        break;
      }
    }

    disableActions.forEach((actionType) => {
      const actionIndex = gisEventList.findIndex((um) => um.value === actionType);
      if (actionIndex > -1) {
        gisEventList.splice(actionIndex, 1);
      }
    });
  }
  /**
   * 每个交互只能选一次，选完之后，则禁止选择
   */
  const actionTypeList = new Set(
    actions.map((um) => {
      return um.actionType;
    }),
  );
  gisEventList.forEach((event) => {
    if (actionTypeList.has(event.value)) {
      event.disabled = true;
    } else {
      event.disabled = false;
    }
  });

  const changeHandler = (value) => {
    const index = gisEventList.findIndex((um) => um.value === value);
    const obj = _.cloneDeep(gisEventList[index]);
    delete obj.disabled;
    item.actionType = value;
    item.actionSettings = obj;
    item.isActive = true; // 添加动作默认展开

    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

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

  const groupOptions = transformGroupOptions(gisEventList) || [];
  console.log('groupOptions', groupOptions);
  return (
    <div className={styles.selectAction}>
      {/* v8.6.0 交互的下拉框改为下拉输入框，支持模糊搜索 */}
      <Select
        showSearch
        onChange={changeHandler}
        filterOption={filterOption}
        placeholder='请选择交互类型'
        size='small'
        className={styles.select}
      >
        {/* {gisEventList.map((ac, index) => (
          <Option value={ac.value} key={index} disabled={ac.disabled}>
            {ac.name}
          </Option>
        ))} */}
        {groupOptions.map((group, index) => (
          <OptGroup label={<span className={styles.OptGroup}>{group.title}</span>} key={`group_${index}`}>
            {group.options.map((option, optionIdx) => (
              <Option
                value={option.value}
                className={styles.Option}
                key={`group_${index}_option_${optionIdx}`}
                disabled={option.disabled}
              >
                {option.name}
              </Option>
            ))}
          </OptGroup>
        ))}
      </Select>
    </div>
  );
};

export default SelectAction;
