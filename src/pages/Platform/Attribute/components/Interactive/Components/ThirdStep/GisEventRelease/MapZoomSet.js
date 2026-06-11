import React, { useState } from 'react';
import { Row, Col, Radio, InputNumber } from 'antd';
// import StoreTree from '@/components/StoreTree';
import styles from './index.less';
import _ from 'lodash';
import VariableRef from './VariableRef';
import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const { isVariable = false, zoom = undefined, expression = 'data', variable = undefined } = item.actionSettings;
    const mapOptions = [
      {
        label: '缩放级别',
        mapValName: 'zoom',
        value: zoom,
        variable,
        expression,
        eventType: isVariable ? '2' : '1',
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapZoomSet = ({ comp, parentIdx, actionIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [zooms, setZooms] = useState(item.actionSettings);
  const { isVariable = false, zoom = undefined, expression = 'data', variable = undefined, dataParams = [] } = zooms;

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings['dataParams'] = value;
      setZooms({ ...item.actionSettings });
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
      setZooms({ ...item.actionSettings });
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
      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          缩放级别
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('isVariable', evt.target.value);
            }}
            value={isVariable}
          >
            <Radio className={styles.radioLable} value={false}>
              默认值
            </Radio>
            <Radio className={styles.radioLable} value={true}>
              引用变量
            </Radio>
          </Radio.Group>
        </Col>
      </Row> */}

      {/* {isVariable && ( */}
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
      <Row className={styles.field} align='middle'>
        <MapTable dataParams={dataParams || []}></MapTable>
      </Row>

      {/* )} */}

      {/**设置变量值信息 */}
      {/* {isVariable && (
        <VariableRef expression={expression} variable={variable} name={'zoom'} updateField={changeFieldValues} />
      )} */}

      {/**设置默认值信息 */}
      {/* {!isVariable && (
        <Row className={styles.field}>
          <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel}></Col>
          <Col className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <InputNumber
              max={18}
              min={1}
              step='0.1'
              defaultValue={zoom}
              onBlur={(evt) => {
                changeFieldValues('zoom', evt.target.value);
              }}
              placeholder='填写范围: 1-18'
            />
          </Col>
        </Row>
      )} */}
    </div>
  );
};

export default MapZoomSet;
