import React, { useState } from 'react';
import { Row, Col, Radio } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { getCurrentAction } from '../../../utils';

const compatible = (item, is3DMap) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const mapOptions = [
      {
        label: '经度',
        mapValName: 'longitude',
        value: 116,
      },
      {
        label: '纬度',
        mapValName: 'lat',
        value: 39,
      },
      {
        label: '俯仰角',
        mapValName: 'pitch',
        value: is3DMap ? -30 : 30,
        tipMsg: `取值范围：0～${is3DMap ? '-' : ''}85`,
      },
      {
        label: is3DMap ? '中心距离(米)' : '层级',
        mapValName: 'range',
        value: is3DMap ? 10000 : 5,
      },
      {
        label: '旋转速度(秒/圈)',
        mapValName: 'duration',
        value: 3,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapLookAt = ({ comp, parentIdx, actionIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  const is3DMap = action.actionSettings.mapType.indexOf('3D') > -1 ? true : false;
  compatible(item, is3DMap); // 数据初始化
  console.log(item.actionSettings.dataParams, '123456qwe');
  const [lookAt, setLookAt] = useState(item.actionSettings);
  const { rotationMode = 1, dataParams = [] } = lookAt;

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    //删除报错问题
    if (item != undefined && item.actionType != '') {
      item.actionSettings['dataParams'] = value;
      setLookAt({ ...item.actionSettings });
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
    //删除报错问题
    if (item != undefined && item.actionType != '') {
      item.actionSettings[path] = value;
      setLookAt({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          旋转方向
        </Col>
        <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('rotationMode', evt.target.value);
            }}
            value={rotationMode}
          >
            <Radio className={styles.radioLable} value={1}>
              顺时针
            </Radio>
            {/* {mapType !== 'Map3DFoundationPlan' && ( */}
            <Radio className={styles.radioLable} value={-1}>
              逆时针
            </Radio>
            {/* )} */}
          </Radio.Group>
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
    </div>
  );
};

export default MapLookAt;
