import React, { useState } from 'react';
import { Row, Col, Tooltip } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import VariableRefEsQuery from './VariableRefEsQuery';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import { variablesText } from '@/staticJson/MapBasic';
import MapTable from './MapTable';
import { getCurrentAction } from '../../../utils';

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const { clickLayerVariable = '', clickLayerVariableExp = 'data', clickLayerVal = {} } = item.actionSettings;
    const mapOptions = [
      {
        label: '渲染图层和数据',
        mapValName: 'clickLayerVal',
        value: clickLayerVal,
        variable: clickLayerVariable,
        expression: clickLayerVariableExp,
        // eventType:circleQueryLayerType,
        eventType: '2',
        tipMsg: variablesText.clickTipMsg,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};
const tipMsg =
  'gis提供的数据，其中必须包含layerCode/layerKey,dataId是对应图层默认配置指定key字段的数据,例：{layerKey:"platform_375bb5b0_default",dataId:"337"}';
// const { Option } = Select;
const MapClickSet = ({ comp, parentIdx, actionIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    // name,
    // value,
    clickLayerVariable = '',
    clickLayerVariableExp = 'data',

    clickDataVariable = '',
    clickDataVariableExp = 'data',
    dataParams,
  } = querys;
  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings['dataParams'] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };
  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings[path] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  const onClose = () => {
    setVisible(false);
  };

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'> 选择图层和数据</span>
          {/* <Tooltip title={tipMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          参数
        </Col>
        <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <EditorParams
            editorType='get'
            initParams={dataParams}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row>
      <MapTable dataParams={dataParams || []}></MapTable>
      {/* <VariableRefEsQuery
        label={'请选择变量'}
        tipMsg={tipMsg}
        previewResult={true}
        variable={clickLayerVariable}
        name={'clickLayerVariable'}
        expression={clickLayerVariableExp}
        updateField={changeFieldValues}
      /> */}
      {/* <Row className={styles.field} align="middle">
        <Col flex="auto" className={styles.fieldLabel}>
          选择数据
        </Col>
      </Row>
      <VariableRefEsQuery
        label={'请选择变量'}
        variable={clickDataVariable}
        name={'clickDataVariable'}
        expression={clickDataVariableExp}
        updateField={changeFieldValues}
      /> */}

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapClickSet;
