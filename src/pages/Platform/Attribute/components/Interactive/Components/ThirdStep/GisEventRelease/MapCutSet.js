import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Input, Switch } from 'antd';
import { defaultLayerGl, defaultLayer3d, defaultLayer2d, thirdStandardLayer } from '@/staticJson/MapBasic';
import styles from './index.less';
import _ from 'lodash';
import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import { getCurrentAction } from '../../../utils';

const { Option } = Select;
const MapCutSet = ({ comp, parentIdx, actionIdx, idx, mapType }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  const [gridTileUrl, setGridTileUrl] = useState(item.actionSettings);
  const [baseMap, setBaseMap] = useState([]); // 获取不同的地图不同底图
  const { mapUrl = undefined, thirdLayerType, thirdLayerTypeUrl, gpsCoordTransBool = false } = gridTileUrl;

  useEffect(() => {
    if (mapType == 'MapGlFoundationPlan') {
      setBaseMap(defaultLayerGl);
      // setMapUrl('gridTileUrl');
    } else if (mapType == 'Map3DFoundationPlan') {
      setBaseMap(defaultLayer3d);
      // setMapUrl('defaultLayerType');
    } else {
      setBaseMap(defaultLayer2d);
    }
  }, [mapType]);

  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings[path] = value;
      setGridTileUrl({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };
  let isThirdType = mapUrl === 5 || mapUrl === 'custom';
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          选择底图
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            defaultValue={mapUrl}
            placeholder='请选择底图'
            onChange={(evt) => {
              changeFieldValues('mapUrl', evt);
            }}
          >
            {baseMap.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      {mapUrl === 0 && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            将gps坐标矫正为高德坐标
          </Col>
          <Col flex='136px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Switch
              checked={gpsCoordTransBool}
              onChange={(evt) => {
                changeFieldValues('gpsCoordTransBool', evt);
              }}
            />
          </Col>
        </Row>
      )}
      {isThirdType && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              底图类型
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Select
                style={{ width: '100%' }}
                defaultValue={thirdLayerType}
                placeholder='请选择底图类型'
                onChange={(evt) => {
                  changeFieldValues('thirdLayerType', evt);
                  changeFieldValues('thirdLayerTypeUrl', '');
                }}
              >
                {thirdStandardLayer.map((item) => (
                  <Option value={item.value}>{item.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              底图地址
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Input
                placeholder='底图地址'
                value={thirdLayerTypeUrl}
                onChange={(e) => {
                  changeFieldValues('thirdLayerTypeUrl', e.target.value);
                }}
              />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default MapCutSet;
