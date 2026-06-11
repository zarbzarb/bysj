import React, { Fragment, useState } from 'react';
import { Row, Col, Select, Input } from 'antd';
import _ from 'lodash';
import { useStore } from '@/hooks';
import SelectPage from '../components/SelectPage';
import s from './index.less';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const { Option } = Select;
const actions = [
  {
    value: '0',
    label: '销毁',
  },
  {
    value: '1',
    label: '暂停',
  },
];

// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item.actionSettings.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const Index = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore: { selectedKey },
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    globalStore: { bigScreenType },
  } = useStore();
  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx), selectedKey); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  const { appPageId } = item.actionSettings;
  const [count, setCount] = useState(0);

  const videoComps = [];
  const getComList = () => {
    let comList = [];
    if (appPageId === selectedKey || !appPageId) {
      // 当前页
      comList = window.componentList || [];
    } else {
      // 跨页面
      if (pageInfoMap[appPageId]) {
        // 如果左侧页面加载过，则用它的，因为可以拿到增删改最新的组件信息
        comList = pageInfoMap[appPageId]?.componentList || [];
      } else if (actionPageInfoMap[appPageId]) {
        // 否则则用自己请求到的
        comList = actionPageInfoMap[appPageId]?.componentList || [];
      }
    }
    return comList;
  };

  const filterVideoCom = (list) => {
    list.forEach((com) => {
      if (com.type === 'UniversalPlayer') {
        // 通用播放器
        videoComps.push(com);
      } else if (com.classType === 'group') {
        filterVideoCom(com.childComList);
      } else if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        com.children.forEach((v) => {
          filterVideoCom(v.AntdChildComponents);
        });
      }
    });
  };
  filterVideoCom(getComList() || []);

  const refresh = () => {
    setCount(count + 1);
  };
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 选择页面
   * @param {*} val
   */
  const handlePageTreeChange = (val, type) => {
    updateEventSettings();
    item.actionSettings.appPageId = val;
    if (type !== 'init') {
      item.actionSettings.compKey = ''; // 切换页面重置操作的组件
      item.actionSettings.actionKey = '';
      executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  // 选择组件
  const compChange = (v) => {
    updateEventSettings();
    item.actionSettings.compKey = v;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  // 选择动作
  const actionsChange = (v) => {
    updateEventSettings();
    // 记录动作
    item.actionSettings.actionKey = v;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  return (
    <>
      <div className={s.sceneInteractionContainer}>
        {/* 选择页面 */}
        {bigScreenType === 'page' && (
          <SelectPage appPageId={item.actionSettings.appPageId} handlePageTreeChange={handlePageTreeChange} />
        )}
        <Row className={s.sceneInteractionValueRow}>
          <Col span={7}>被操作组件</Col>
          <Col span={17} flex='206px'>
            <Select
              style={{ width: '100%' }}
              placeholder='请选择'
              value={item.actionSettings.compKey}
              onChange={compChange}
            >
              {videoComps.map((s) => (
                <Option value={s.key}>{s.name || s.compName}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row className={s.sceneInteractionValueRow}>
          <Col span={7}>选择动作</Col>
          <Col span={17}>
            <Select
              style={{ width: '100%' }}
              placeholder='请选择动作'
              value={item.actionSettings.actionKey}
              options={actions}
              onChange={actionsChange}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Index;
