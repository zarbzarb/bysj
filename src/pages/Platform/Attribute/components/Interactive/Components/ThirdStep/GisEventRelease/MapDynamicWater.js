import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Input, Divider, message } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import VariableRefEsQuery from './VariableRefEsQuery';
import LargeEdit from '@/components/commons/LargeEdit';
import ColorPicker from '@/components/ColorPicker';
import CustomUploadImage from '@/components/commons/CustomUploadImage';
import { getSysLayerList, getSysLayerListByBatch } from '@/services/apis/dataMapApi';
import { layerTreeLoadLayerType } from '@/staticJson/MapBasic';
import { getImageUrl } from '@/utils/utils';
import DataI from '@/utils/global-api/core';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
import { getCurrentAction } from '../../../utils';

const { Option } = Select;

const MapDynamicWater = ({ comp, parentIdx, actionIdx, idx, mapKey }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const [baseLayerArr, setBaseLayerArr] = useState([]);
  const [sysLayerArr, setSysLayerArr] = useState([]);

  const {
    waterType = 'default',
    waterVal = [
      [116.389965, 39.912106],
      [116.389965, 39.911655],
      [116.385789, 39.911531],
      [116.385266, 39.921488],
      [116.395772, 39.921805],
      [116.396263, 39.911826],
      [116.39202, 39.911773],
      [116.392009, 39.912212],
      [116.395493, 39.912353],
      [116.395104, 39.921344],
      [116.385972, 39.920984],
      [116.386485, 39.912068],
      [116.389918, 39.912157],
    ],
    waterVariable = '',
    waterVariableExp = 'data',
    waterLayer = '',
    sysWaterLayer = '',
    heightType = 'default',
    heightVal = {
      height: 20,
    },
    heightVariable = '',
    heightVariableExp = 'data',
    heightMapField = 'height',
    waterColor = 'rgb(28, 136, 244, 1)',
    waterImg = getImageUrl('/assets/datai/gis/water_map.jpg'),
  } = querys;

  const dataTypeOpts = [
    { label: '默认值', value: 'default' },
    { label: '引用变量', value: 'refer' },
    { label: '地图引擎', value: 'base-map' },
    { label: '业务图层', value: 'sys-map' },
  ];
  const heightTypeOpts = [
    { label: '默认值', value: 'default' },
    { label: '引用变量', value: 'refer' },
  ];

  useEffect(() => {
    getLayerInfo();
  }, []);

  useEffect(() => {
    //获取业务图层列表
    getSysLayerList()
      .then(({ data, success, message: msg }) => {
        if (!success) {
          return message.error(msg);
        }
        let records = data.records;
        let layerArr = [];
        records.forEach((item) => {
          layerArr.push({
            label: item.layerName,
            value: item.layerUid,
          });
          setSysLayerArr(layerArr);
        });
      })
      .catch((err) => {
        console.error(err, '业务图层获取出错');
      });
  }, []);

  const getLayerInfo = () => {
    let polygonArr = [];
    let mapCom = DataI.getComList(mapKey);
    let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
    foundationPlan?.layers?.forEach((v) => {
      if (v.englishName == 'BasePolygonLayer' || v.englishName == 'BasePolygonLayer3D') {
        polygonArr.push({
          label: v.name,
          value: v.instance.compAttr.relation_layer_code,
        });
      }
    });
    setBaseLayerArr(polygonArr);
  };

  const handleLayerChange = (val) => {
    changeFieldValues('waterLayer', val);
    if (waterType == 'sys-map') {
      getSysLayerListByBatch([val]).then(({ data, success }) => {
        if (Array.isArray(data) && data.length > 0) {
          let [englishName, layerCode] = getMaplayerKey(data[0].jsonConfig);
          if (englishName !== 'BasePolygonLayer3D') {
            message.info('该业务图层不包含三维面图层！');
            changeFieldValues('waterLayer', '');
          } else {
            changeFieldValues('sysWaterLayer', layerCode);
          }
        }
      });
    }
  };
  const getMaplayerKey = (config) => {
    if (!config || config.length == 0) {
      return [undefined, undefined];
    }
    let curMap = {};
    let componentList = [];
    let jsconfig = JSON.parse(config);
    componentList = jsconfig.componentList;
    let foundationPlan = componentList.find((componentItem) => {
      return 'MapFoundationPlan' === componentItem.englishName || 'Map3DFoundationPlan' === componentItem.englishName;
    });
    let selLayer = foundationPlan?.layers.find((layer) => {
      return layerTreeLoadLayerType.includes(layer.type);
    });
    return [selLayer?.englishName, selLayer?._attr?.relation_layer_code];
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

  let layerListOption = waterType == 'base-map' ? baseLayerArr : sysLayerArr;
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          区域数据
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={waterType}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('waterType', evt);
              changeFieldValues('waterLayer', '');
            }}
          >
            {dataTypeOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      {waterType == 'default' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <LargeEdit
              value={waterVal}
              onChange={(evt) => {
                changeFieldValues('waterVal', evt);
              }}
            />
          </Col>
        </Row>
      )}
      {waterType == 'refer' && (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={waterVariable}
          name={'waterVariable'}
          expression={waterVariableExp}
          updateField={changeFieldValues}
        />
      )}
      {(waterType == 'base-map' || waterType == 'sys-map') && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            选择图层
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Select
              style={{ width: '100%' }}
              value={waterLayer}
              placeholder='请选择类型'
              onChange={(evt) => {
                handleLayerChange(evt);
              }}
            >
              {layerListOption.map((item) => (
                <Option value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          水位高度
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={heightType}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('heightType', evt);
            }}
          >
            {heightTypeOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      {heightType == 'default' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <LargeEdit
              value={heightVal}
              onChange={(evt) => {
                changeFieldValues('heightVal', evt);
              }}
            />
          </Col>
        </Row>
      )}
      {heightType == 'refer' && (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={heightVariable}
          name={'heightVariable'}
          expression={heightVariableExp}
          updateField={changeFieldValues}
        />
      )}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          字段
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>映射</span>
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>状态</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          height
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={heightMapField}
            onChange={(e) => {
              changeFieldValues('heightMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>可选</span>
        </Col>
      </Row>

      <div style={{ fontSize: '14px', paddingLeft: '28px', marginTop: '5px' }}>水位样式</div>
      <Divider style={{ margin: '2px 0 5px 0' }} />
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          水位颜色
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <ColorPicker
            value={waterColor}
            onChange={(value) => {
              changeFieldValues('waterColor', value);
            }}
          />
        </Col>
      </Row>
      <CustomUploadImage
        styles={styles}
        label={'水位贴图'}
        el={{ classType: 'antd' }}
        value={waterImg}
        field={'waterImg'}
        updateField={(attr, url) => {
          changeFieldValues('waterImg', url);
        }}
        updateAttr={(attr) => {
          attr && attr['waterImg'] && changeFieldValues('waterImg', attr['waterImg']);
        }}
      />

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapDynamicWater;
