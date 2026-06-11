import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, TreeSelect, Button } from 'antd';
import _ from 'lodash';
import classNames from 'classnames';
import useStore from '@/hooks/useStore';
import { getPageList, getPageInfo } from '@/services/apis/appPageApi';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import successIcon from '@/assets/icon/success.png';
import { getCurrentAction, setCurrentAction } from '../../../utils';
import { parsePageTreeData, parsePageJsonConfig } from './utils';
import ModalEditorParams from './ModalEditorParams';
import styles from './index.less';

const RemoteEvent = ({ comp, parentIdx, idx }) => {
  const { globalStore } = useStore();
  const { remoteControlledAppId } = globalStore.remoteControllInfo;

  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  // if (item?.actionSettings?.compKey) {
  //   const v = getComponent(item.actionSettings.compKey);
  //   if (!v && pageInfoMap[item.actionSettings.appPageId]) {
  //     item.actionSettings.compKey = '';
  //   }
  // }

  const [pageTreeData, setPageTreeData] = useState([]); // 操作页面数据（树）
  const [compTreeData, setCompTreeData] = useState([]); // 触发事件数据（树）
  const compTreeDataCache = useRef({}); // 触发事件数据缓存（映射表）
  const compTreeLeafNodes = useRef({}); // 触发事件叶子节点缓存（映射表）
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

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

  const getPageDetail = (pageId) => {
    // if (compTreeDataCache.current[pageId]) {
    //   setCompTreeData(compTreeDataCache.current[pageId]);
    //   return;
    // }

    const params = {
      appId: remoteControlledAppId,
      appPageId: pageId,
      version: 'dev',
    };
    getPageInfo(params)
      .then((res) => {
        if (res?.data?.jsonConfig) {
          const { treeData, eventCache } = parsePageJsonConfig(res.data.jsonConfig);
          setCompTreeData(treeData);
          compTreeDataCache.current[pageId] = treeData;
          compTreeLeafNodes.current = eventCache;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handlePageChange = (val) => {
    getPageDetail(val);

    updateEventSettings();
    item.actionSettings.appPageId = val;
    item.actionSettings.eventKey = '';
    item.actionSettings.dataParams = [];
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleCompChange = (value, node) => {
    updateEventSettings();
    item.actionSettings.eventKey = value;
    item.actionSettings.dataParams = [];
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const saveParams = (arr) => {
    console.log(arr, 'arr');
    updateEventSettings();
    item.actionSettings.dataParams = arr;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    setVisible(false);
  };

  useEffect(() => {
    if (remoteControlledAppId) {
      getPageList(remoteControlledAppId, { version: 'dev' })
        .then((res) => {
          if (res?.data?.sysAppPageRefVOList) {
            const treeData = parsePageTreeData(res.data.sysAppPageRefVOList);
            setPageTreeData(treeData);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    if (item.actionSettings.appPageId) {
      getPageDetail(item.actionSettings.appPageId);
    }
  }, []);

  const eventName = item.actionSettings.eventKey ? item.actionSettings.eventKey.split('__')[1] : '';
  const eventFullPath = item.actionSettings.eventKey
    ? compTreeLeafNodes.current[item.actionSettings.eventKey]?.path
    : '';

  return (
    <div className={styles.updateDataContainer}>
      <Row>
        <Col className={styles.label} span={7}>
          操作页面
        </Col>
        <Col span={17}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            showSearch
            style={{ width: 211 }}
            treeData={pageTreeData}
            value={item.actionSettings.appPageId}
            onChange={handlePageChange}
            dropdownStyle={{
              maxHeight: 400,
              overflow: 'auto',
            }}
            placeholder='请选择'
            treeDefaultExpandAll
            treeNodeFilterProp='label'
          />
        </Col>
      </Row>
      <Row className={styles.dataSourceValueRow}>
        <Col className={styles.label} span={7}>
          触发事件
        </Col>
        <Col span={17}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            showSearch
            style={{ width: 211 }}
            treeData={compTreeData}
            value={item.actionSettings.eventKey}
            onSelect={handleCompChange}
            placeholder='请选择'
            treeDefaultExpandAll
            treeNodeFilterProp='label'
          />
          <span style={{ color: 'gray', fontSize: 12 }}>{eventFullPath}</span>
        </Col>
      </Row>
      {eventName === 'changeValue' && (
        <Row className={styles.dataSourceValueRow}>
          <Col className={styles.label} span={7}>
            参数
          </Col>
          <Col span={17}>
            <Button
              className={classNames(
                styles.editorParamsBtn,
                styles.conditionBtn,
                item?.actionSettings?.dataParams?.length > 0 && styles.success,
              )}
              type='primary'
              onClick={() => setVisible(true)}
            >
              编辑参数
              {item?.actionSettings?.dataParams?.length > 0 && (
                <img className={styles.successIcon} src={successIcon} alt='条件' />
              )}
            </Button>
          </Col>
        </Row>
      )}

      {/* 编辑参数弹框 */}
      {visible && (
        <ModalEditorParams
          // customComps={customComps}
          visible={visible}
          comp={comp} // 当前绑定交互的组件
          action={item}
          eventSetting={eventSettings[parentIdx]}
          onOk={(arr) => {
            saveParams(arr);
          }}
          onCancel={() => {
            setVisible(false);
          }}
        />
      )}
    </div>
  );
};

export default RemoteEvent;
