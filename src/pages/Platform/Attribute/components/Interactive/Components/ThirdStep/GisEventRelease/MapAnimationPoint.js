import React, { useState, useMemo, useEffect } from 'react';

import { Input, Row, Col, Button, Tooltip, Switch, AutoComplete } from 'antd';
import { DropPanel, Tabs, Color, Select, InputNumber } from '@yl/datai-ui';

import _ from 'lodash';
import DataI from '@/utils/global-api/core';
import { mapAnimationType } from '@/staticJson/EditPage';
import { operatorOptions } from '@/staticJson/AnimationComponentsList';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import fetch from '@/services/xhr/fetch';

import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';

const pointTypes = [
  '@yl/datai-com-map-gl-basic-point-layer',
  '@yl/datai-com-map-base-point-layer',
  '@yl/datai-com-map-3D-base-point-layer',
];

const { Option } = Select;

const MapAnimationPoint = ({ comp, parentIdx, actionIdx, idx, mapKey, mapType }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  const [querys, setQuerys] = useState(item.actionSettings);
  const [curIndex, setCurIndex] = useState(0);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [mapAnimations, setMapAnimations] = useState(mapAnimationType);
  const {
    animateType = '样式1',
    layerKey, // 图层
    statusList = [
      {
        key: 123456,
        label: '状态1',
        rules: [
          // {
          //   key: 66789,
          //   field: null,
          //   operator: null,
          //   value: '',
          // },
        ],

        isSelRadar: false,
        maxRadius: mapType === 'Map3DFoundationPlan' ? 1000 : 40,
        cycle: 2000,
        radarColor: 'rgba(100, 227, 249, 1.0)',

        selMaxRadius: mapType === 'Map3DFoundationPlan' ? 1000 : 40,
        selCycle: 2000,
        selRadarColor: 'rgba(100, 227, 249, 1.0)',
      },
    ],
    layerCode,
  } = querys;
  // 获取地图对应的图层数据
  const mapQueryList = useMemo(() => {
    const result = [];
    const mapCom = DataI.getComList(mapKey);
    if (mapCom.length > 0) {
      mapCom[0]?.layers?.forEach((v) => {
        if (pointTypes.includes(v.type)) {
          result.push(v);
        }
      });
    }

    return result;
  }, [window.componentList]);

  const getLayerCode = (layerTypes) => {
    let code;
    let layerCode;
    mapQueryList.forEach((v) => {
      // 删除上一此图层雷达波信息
      if (layerKey == v.key) {
        v.instance.compAttr.radarInfo = null;
      }
      if (v.key == layerTypes) {
        code = v.instance.key;
        layerCode = v.instance.compAttr.relation_layer_code;
        if (v.type === '@yl/datai-com-map-3D-base-point-layer') {
          setMapAnimations([mapAnimationType[0]]);
        }
      }
    });
    item.actionSettings['layerKey'] = code;
    item.actionSettings['layerCode'] = layerCode;
    getMapOptions(layerCode);
    changeFieldValues('layerKey', layerTypes);
  };

  useEffect(() => {
    if (layerCode) {
      getLayerCode(layerKey);
    }
  }, []);

  const getMapOptions = async (layerCode) => {
    let data = await fetch
      .get(`/api/gis/api/field/listFields?layerCode=${layerCode}&needIdGeom=false`)
      .catch((error) => {
        console.error(error);
      });
    data = data && data.data.map(({ name }) => ({ label: name, value: name }));
    setFieldOptions(data);
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
      // mapQueryList.forEach((v) => {
      //   if (layerKey == v.key) {
      //     v.instance.compAttr.radarInfo = item.actionSettings;
      //   }
      // });
    }
  };

  // 添加状态
  const handleAdd = () => {
    statusList.push({
      key: new Date().getTime(), // 状态key值
      label: `状态${statusList.length + 1}`, // 状态名
      rules: [
        // //规则列表
        // {
        //   key: new Date().getTime(),
        //   field: null, //数据项 _api 取值用mapField
        //   operator: null,
        //   value: '',
        // },
      ],
      isSelRadar: false,
      maxRadius: mapType === 'Map3DFoundationPlan' ? 1000 : 40,
      cycle: 2000,
      radarColor: 'rgba(100, 227, 249, 1.0)',

      selMaxRadius: mapType === 'Map3DFoundationPlan' ? 1000 : 40,
      selCycle: 2000,
      selRadarColor: 'rgba(100, 227, 249, 1.0)',
    });
    changeFieldValues('statusList', [...statusList]);
    setCurIndex(statusList.length - 1);
  };

  // 删除状态
  const handleRemove = (targetIndex) => {
    if (statusList.length === 1) {
      // 最后一条删除时，新增一条空的状态
      statusList[0].rules = [
        // {
        //   key: new Date().getTime(),
        //   field: null, //数据项 _api 取值用mapField
        //   operator: null,
        //   value: '',
        // },
      ];
    } else {
      statusList.splice(targetIndex, 1);
    }
    let currentIndex = curIndex;
    if (targetIndex <= curIndex) {
      currentIndex = curIndex > 0 ? curIndex - 1 : 0;
    }

    changeFieldValues('statusList', [...statusList]);
    setCurIndex(currentIndex);
  };

  // 激活状态
  const handleActive = (index) => {
    setCurIndex(index);
  };

  // 更新状态值 parentField 为一级，index/field为二级，rules用到， value为值
  const changeConditionVal = (curIndex, value, parentField, index, field) => {
    console.log('changeConditionVal curIndex', curIndex);
    if (parentField && index !== undefined && field !== undefined) {
      // 更新二级值
      statusList[curIndex][parentField][index][field] = value;
    } else if (parentField) {
      // 更新一级值
      statusList[curIndex][parentField] = value;
    } else {
      // 更新当前整个状态
      statusList[curIndex] = { ...statusList[curIndex], ...value };
    }
    changeFieldValues('statusList', [...statusList]);
    setCurIndex(curIndex);
  };

  // 新增规则
  const addRule = (parentIndex, ruleList) => {
    ruleList.push({
      key: new Date().getTime(),
      field: null, //数据项 _api 取值用mapField
      operator: null,
      value: '',
    });
    changeConditionVal(parentIndex, ruleList, 'rules');
  };

  // 删除规则
  const removeRule = (parentIndex, ruleList, index) => {
    ruleList.splice(index, 1);
    changeConditionVal(parentIndex, ruleList, 'rules');
  };

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span>选择图层</span>
          <Tooltip title='如选择的图层在图层树中，雷达波的显隐由图层树来控制，不存在图层树中则正常交互显示'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Select
            style={{ width: '100%' }}
            defaultValue={layerKey}
            placeholder='请选择图层'
            onChange={(evt) => {
              getLayerCode(evt);
            }}
          >
            {mapQueryList.map((item) => (
              <Option value={item.key} key={item.key}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          雷达波类型
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Select
            style={{ width: '100%' }}
            defaultValue={animateType}
            placeholder='请选择图层'
            onChange={(evt) => {
              // getLayerCode(evt);
              changeFieldValues('animateType', evt);
            }}
          >
            {mapAnimations?.map((item, index) => (
              <Option value={item.value} key={index}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.icon} style={{ width: '16px' }} />
                  <span style={{ paddingLeft: '10px' }}>{item.value}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <div className='yl-comp-text-field comp-drop-panel'>
        <DropPanel
          title='状态'
          // prohibitHandler={() => {
          //   changeFieldValues(true, 'isStatus');
          // }}
          // prohibitState={undefined}
          // isVisible={undefined}
          // onVisibleChange={(visible) => {
          //   changeFieldValues(true, 'isStatus');
          // }}
          // plusState={true}
          // delState={true}
          // plusHandler={handleAdd}
          // delHandler={handleRemove}
        >
          {/* 状态系列 */}
          <div className='yl-comp-text-field'>
            <Tabs
              onChange={handleActive}
              tabIndex={curIndex}
              tabs={statusList.map((condition) => {
                return condition.label;
              })}
              plusState={true}
              delState={true}
              plusHandler={handleAdd}
              delHandler={handleRemove}
            >
              {statusList.map((condition, parentIndex) => {
                return (
                  <div key={condition.key} style={{ width: '300px' }}>
                    <div className='yl-comp-text-field' style={{ display: 'flex' }}>
                      <div className='yl-comp-field-label'>状态名</div>
                      <div className='yl-comp-field-content row'>
                        <Input
                          onChange={(evt) => {
                            changeConditionVal(parentIndex, evt.target.value, 'label');
                          }}
                          value={condition.label}
                        />
                      </div>
                    </div>
                    <div className='yl-comp-text-field' style={{ display: 'flex' }}>
                      <div className='yl-comp-field-label'>定义规则</div>
                      <div className='yl-comp-field-content row' style={{ justifyContent: 'flex-end' }}>
                        <Button
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#A1AEB3',
                          }}
                          size='small'
                          icon={<PlusOutlined />}
                          onClick={() => {
                            // 添加规则
                            addRule(parentIndex, condition.rules);
                          }}
                        />
                      </div>
                    </div>
                    {condition.rules.map((rule, index) => {
                      return (
                        <div
                          key={`condition-${index}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            marginBottom: '10px',
                          }}
                        >
                          <span
                            style={{
                              marginLeft: '8px',
                              marginRight: '8px',
                            }}
                          >
                            且
                          </span>
                          <div
                            style={{
                              marginRight: '8px',
                              width: '80px',
                              flex: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}
                          >
                            <AutoComplete
                              popupClassName='certain-category-search-dropdown'
                              getPopupContainer={(triggerNode) => triggerNode.parentNode}
                              size='smalll'
                              style={{ width: '100%' }}
                              value={rule.field}
                              options={fieldOptions}
                              onChange={(value) => {
                                changeConditionVal(parentIndex, value, 'rules', index, 'field');
                              }}
                              onSelect={(value) => {
                                changeConditionVal(parentIndex, value, 'rules', index, 'field');
                              }}
                            />

                            <span
                              style={{
                                textAlign: 'center',
                              }}
                            >
                              数据项
                            </span>
                          </div>
                          <div
                            style={{
                              marginRight: '8px',
                              width: '80px',
                              flex: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}
                          >
                            <Select
                              style={{ width: '100%' }}
                              defaultValue={rule.operator}
                              // placeholder='请选择图层'
                              onChange={(value) => {
                                changeConditionVal(parentIndex, value, 'rules', index, 'operator');
                              }}
                            >
                              {operatorOptions.map((item, index) => (
                                <Option value={item.value} key={`option-${index}`}>
                                  {item.label}
                                </Option>
                              ))}
                            </Select>
                            <span
                              style={{
                                textAlign: 'center',
                              }}
                            >
                              运算符
                            </span>
                          </div>
                          {/* 值 */}
                          <div
                            style={{
                              marginRight: '8px',
                              width: '80px',
                              flex: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}
                          >
                            <Input
                              id={`${rule.key}-rule-value`}
                              onChange={(evt) => {
                                changeConditionVal(parentIndex, evt.target.value, 'rules', index, 'value');
                              }}
                              value={rule.value}
                              // style={{ height: '28px' }}
                            />
                            <span
                              style={{
                                textAlign: 'center',
                                marginTop: '4px',
                              }}
                            >
                              值
                            </span>
                          </div>
                          {/* 删除按钮 */}
                          <Button
                            size='small'
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#A1AEB3',
                              paddingTop: '3px',
                            }}
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              // 删除规则
                              removeRule(parentIndex, condition.rules, index);
                            }}
                          />
                        </div>
                      );
                    })}
                    <>
                      <div className='yl-comp-text-field' style={{ display: 'flex' }}>
                        <div className='yl-comp-field-label'>默认样式</div>
                      </div>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          半径
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <InputNumber
                            min={0}
                            // max={300}
                            style={{ margin: '0 2px' }}
                            value={condition.maxRadius}
                            onChange={(val) => {
                              changeConditionVal(parentIndex, val, 'maxRadius');
                            }}
                          />
                        </Col>
                      </Row>

                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          扩散时间
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <InputNumber
                            min={300}
                            style={{ margin: '0 2px' }}
                            value={condition.cycle}
                            suffix='ms'
                            onChange={(val) => {
                              changeConditionVal(parentIndex, val, 'cycle');
                              // changeFieldValues('cycle', val);
                            }}
                          />
                        </Col>
                      </Row>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          颜色
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <Color
                            value={condition.radarColor}
                            onChange={(value) => {
                              changeConditionVal(parentIndex, value, 'radarColor');
                            }}
                          />
                        </Col>
                      </Row>
                    </>
                    <Row className={styles.field} align='middle'>
                      <Col flex='auto' style={{ marginLeft: '16px' }}>
                        <span>高亮样式</span>
                        <Tooltip title='点图层点击悬浮生效的样式'>
                          <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
                        </Tooltip>
                      </Col>
                      <Col flex='198px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                        <Switch
                          checked={condition.isSelRadar}
                          onChange={(evt) => {
                            changeConditionVal(parentIndex, evt, 'isSelRadar');
                          }}
                        />
                      </Col>
                    </Row>
                    {condition.isSelRadar && (
                      <>
                        <Row className={styles.field}>
                          <Col flex='auto' className={styles.fieldLabel}>
                            半径
                          </Col>
                          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                            <InputNumber
                              min={0}
                              //max={300}
                              style={{ margin: '0 2px' }}
                              value={condition.selMaxRadius}
                              onChange={(val) => {
                                changeConditionVal(parentIndex, val, 'selMaxRadius');
                              }}
                            />
                          </Col>
                        </Row>

                        <Row className={styles.field}>
                          <Col flex='auto' className={styles.fieldLabel}>
                            扩散时间
                          </Col>
                          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                            <InputNumber
                              min={300}
                              style={{ margin: '0 2px' }}
                              value={condition.selCycle}
                              suffix='ms'
                              onChange={(val) => {
                                changeConditionVal(parentIndex, val, 'selCycle');
                              }}
                            />
                          </Col>
                        </Row>
                        <Row className={styles.field}>
                          <Col flex='auto' className={styles.fieldLabel}>
                            颜色
                          </Col>
                          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                            <Color
                              value={condition.selRadarColor}
                              onChange={(value) => {
                                changeConditionVal(parentIndex, value, 'selRadarColor');
                              }}
                            />
                          </Col>
                        </Row>
                      </>
                    )}
                  </div>
                );
              })}
            </Tabs>
          </div>
        </DropPanel>
      </div>
    </div>
  );
};

export default MapAnimationPoint;
