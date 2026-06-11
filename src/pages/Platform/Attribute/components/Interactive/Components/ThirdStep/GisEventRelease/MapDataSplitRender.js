import React, { useState, useEffect } from 'react';

import { Input, Row, Col, Button, AutoComplete, Checkbox, TreeSelect } from 'antd';
import { DropPanel, Tabs, InputNumber, Select } from '@yl/datai-ui';
import _ from 'lodash';
import DataI from '@/utils/global-api/core';
import { operatorOptions } from '@/staticJson/AnimationComponentsList';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import fetch from '@/services/xhr/fetch';
import { getAllLayers, getCurrentGroup, renderGroupNode, getCurrentGroupReverse } from '@/utils/gisCommonUtils';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';

const { Option } = Select;

const MapDataSplitRender = ({ comp, parentIdx, actionIdx, idx, mapKey, mapType }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  const [querys, setQuerys] = useState(item.actionSettings);
  const [curIndex, setCurIndex] = useState(0);
  const [mapCurIndex, setMapCurIndex] = useState(0);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [layer_groups, setLayer_groups] = useState([]);
  const [layers, setLayers] = useState([]);
  const [mapQueryList, setMapQueryList] = useState([]);
  const [mapAllList, setMapAllList] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    group_id = '',
    featureType = '',
    relation_layer_code = '',
    updateApiType = false,
    updateApiTime = 10,
    mapList = [
      {
        key: 123456,
        label: '图层1',
        layerKey: '',
        statusList: [
          {
            key: 123456,
            label: '状态1',
            rules: [],
          },
        ],
      },
    ],
  } = querys;

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
    }
  };

  // 添加状态
  const handleAdd = () => {
    const { statusList } = mapList[mapCurIndex];
    statusList.push({
      key: Date.now(), // 状态key值
      label: `条件${statusList.length + 1}`, // 状态名
      rules: [],
    });
    changeFieldValues('mapList', [...mapList]);
    setCurIndex(statusList.length - 1);
  };

  // 删除状态
  const handleRemove = (targetIndex) => {
    const { statusList } = mapList[mapCurIndex];
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

    changeFieldValues('mapList', [...mapList]);
    setCurIndex(currentIndex);
  };

  // 激活状态
  const handleActive = (index) => {
    setCurIndex(index);
  };

  // 更新状态值 parentField 为一级，index/field为二级，rules用到， value为值
  const changeConditionVal = (curIndex, value, parentField, index, field) => {
    if (curIndex < 0) {
      mapList[mapCurIndex][parentField] = value;
    } else {
      const { statusList } = mapList[mapCurIndex];
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
    }

    changeFieldValues('mapList', [...mapList]);
    setCurIndex(curIndex);
  };

  // 新增规则
  const addRule = (parentIndex, ruleList) => {
    ruleList.push({
      key: Date.now(),
      field: null, // 数据项 _api 取值用mapField
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

  useEffect(() => {
    const getData = async () => {
      const data = await fetch.get('/gis-platform/gispublic/groups/getAll');
      if (data && data.result) {
        setLayer_groups(data.result); // 组
        getLayerList(group_id, data.result); //
        changeLayerList(featureType);
        setLoading(true);
      }
    };
    getData();
    getMapOptions(relation_layer_code);
    changeFieldValues('compKey', comp.key);
  }, []);
  // 获取数据集合
  const getLayerList = (group_id, data) => {
    let datas = layer_groups;
    if (data && data.length > 0) {
      datas = data;
    }
    let group = getCurrentGroup(datas, group_id);
    if (data) {
      group = getCurrentGroupReverse(datas, relation_layer_code);
      if (group) {
        const { fid } = group;
        if (group_id !== fid) {
          group_id = fid;
        }
      }
    }
    const s = getAllLayers(group);
    setLayers(s);
    changeFieldValues('group_id', group_id);
  };

  // 模糊搜索
  const filterTreeNode = (input, treeNode) => {
    if (typeof treeNode.title === 'string') {
      return treeNode.title.toLowerCase().includes(input.toLowerCase());
    }
    if (typeof treeNode.name === 'string') {
      return treeNode.name.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  // v7.5支持模糊搜索 const filterOption = (
  const filterOption = (input, option) => {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().includes(input.toLowerCase()) : false;
  };

  // 添加状态
  const mapHandleAdd = () => {
    setMapLists();
    mapList.push({
      key: Date.now(),
      label: `图层${mapList.length + 1}`,
      statusList: [
        {
          key: Date.now(),
          label: '条件1',
          rules: [],
        },
      ],
    });
    changeFieldValues('mapList', [...mapList]);
    setMapCurIndex(mapList.length - 1);
  };

  // 删除状态
  const mapHandleRemove = (targetIndex) => {
    let removeKey;
    if (mapList.length === 1) {
      // 最后一条删除时，新增一条空的状态
      removeKey = mapList[0].layerKey;
      mapList[0].statusList = [
        {
          key: Date.now(),
          label: '条件1',
          rules: [],
        },
      ];
    } else {
      removeKey = mapList[targetIndex].layerKey;
      mapList.splice(targetIndex, 1);
    }
    let currentIndex = mapCurIndex;
    if (targetIndex <= currentIndex) {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    }
    // 删除图层添加到图层list中

    if (removeKey) {
      mapAllList.forEach((item) => {
        if (removeKey === item.key) {
          setMapQueryList([...mapQueryList, item]);
        }
      });
    }

    const mapLists = mapList.map((v, index) => {
      v.label = `图层${index + 1}`;
      return v;
    });
    changeFieldValues('mapList', [...mapLists]);
    setMapCurIndex(currentIndex);
  };

  const setMapLists = (curIndex) => {
    // console.log('curIndex', curIndex);
    const selMapKey = (curIndex != undefined && mapList[curIndex].layerKey) || undefined;
    const selKeys = new Set(mapList.map((v) => v.layerKey));
    const noSelKeys = [];
    mapAllList.forEach((item) => {
      if (!selKeys.has(item.key) || item.key == selMapKey) {
        noSelKeys.push(item);
      }
    });
    // console.log('点击', selMapKey, noSelKeys, mapAllList);
    setMapQueryList(noSelKeys);
  };
  // 激活状态
  const mapHandleActive = (index) => {
    setMapCurIndex(index);
    setCurIndex(0);
    // 去掉选中的图层
    setMapLists(index);
  };

  // 根据选择图层数据过滤对应图层
  const changeLayerList = (featureType) => {
    let englishName = []; // "MapHotmap",  "Map3DHeatMapLayer"
    if (featureType == 'point') {
      englishName = [
        'BasePointLayer',
        'BasePointLayer3D',
        'Map2DPointPolymerization',
        'Map3DPointPolymerization',
        'MapGlBasePointLayer',
      ];
    } else if (featureType == 'linestring') {
      englishName = ['BasePolylineLayer', 'BasePolylineLayer3D', 'MapGlBasePolylineLayer'];
    } else if (featureType == 'polygon') {
      englishName = ['BasePolygonLayer', 'BasePolygonLayer3D', 'MapGLBasePolygonLayer'];
    }

    const result = [];
    const mapCom = DataI.getComponentByKey(mapKey);
    mapCom.layers?.forEach((v) => {
      if (englishName.includes(v.englishName)) {
        result.push(v);
      }
    });
    setMapAllList(result);
  };
  useEffect(() => {
    mapAllList && setMapLists(0);
  }, [mapAllList]);
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span>选择数据</span>
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            showSearch={true}
            filterTreeNode={filterTreeNode}
            value={loading ? group_id : '加载中...'}
            placeholder='请选择'
            style={{ width: '100%' }}
            dropdownStyle={{
              maxHeight: 400,
              overflow: 'auto',
            }}
            onChange={(v) => {
              getLayerList(v);
            }}
          >
            {renderGroupNode(layer_groups)}
          </TreeSelect>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel} />
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Select
            showSearch={true}
            filterOption={filterOption}
            placeholder='请选择'
            style={{ width: '100%' }}
            // getPopupContainer={(triggerNode) => triggerNode.parentNode}
            value={
              loading
                ? relation_layer_code
                  ? layers.find((item) => item.layerCode === relation_layer_code)
                    ? relation_layer_code
                    : '图层不存在'
                  : relation_layer_code
                : '加载中...'
            }
            onChange={(v, other) => {
              changeFieldValues('relation_layer_code', v);
              const layerData = layers.find((item) => item.layerCode === v);
              if (layerData) {
                changeFieldValues('featureType', layerData.featureType);
                changeLayerList(layerData.featureType);
              }
              getMapOptions(v);
            }}
          >
            {layers.map((item, key) => {
              return (
                <Option value={item.layerCode} key={key} layerType={item.layerType} featureType={item.featureType}>
                  {item.layerName}
                </Option>
              );
            })}
          </Select>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          自动刷新
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Checkbox
            checked={updateApiType}
            onChange={(v) => {
              changeFieldValues('updateApiType', v.target.checked);
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          自动刷新请求间隔
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <InputNumber
            suffix='s'
            min={10}
            className={styles.updateTwoInput}
            style={{ width: '100%' }}
            value={updateApiTime}
            onChange={(v) => {
              changeFieldValues('updateApiTime', v);
            }}
          />
        </Col>
      </Row>

      <div className='yl-comp-text-field comp-drop-panel'>
        <DropPanel
          title='图层'
          // prohibitHandler={() => {
          //   changeFieldValues(true, 'isStatus');
          // }}
          // prohibitState={undefined}
          // plusState={true}
          // delState={true}
          // plusHandler={mapHandleAdd}
          // delHandler={mapHandleRemove}
        >
          <div className='yl-comp-text-field'>
            <Tabs
              onChange={mapHandleActive}
              tabIndex={mapCurIndex}
              tabs={mapList.map((condition) => {
                return condition.label;
              })}
              plusState={true}
              delState={true}
              plusHandler={mapHandleAdd}
              delHandler={mapHandleRemove}
            >
              {mapList.map((mapCondition, mapIndex) => {
                const { statusList } = mapCondition;
                return (
                  <div key={mapCondition.key} style={{ width: '300px' }}>
                    <div className='yl-comp-text-field' style={{ display: 'flex' }}>
                      <div className='yl-comp-field-label'>选择图层</div>
                      <div className='yl-comp-field-content row'>
                        <Select
                          style={{ width: '100%' }}
                          defaultValue={mapCondition.layerKey}
                          placeholder='请选择图层'
                          onChange={(evt) => {
                            changeConditionVal(-1, evt, 'layerKey');
                          }}
                        >
                          {mapQueryList.map((item) => (
                            <Option value={item.key}>{item.name}</Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className='yl-comp-text-field comp-drop-panel'>
                      <DropPanel
                        title='过滤条件'
                        // prohibitHandler={() => {
                        //   changeFieldValues(true, 'isStatus');
                        // }}
                        // prohibitState={undefined}
                        // plusState={true}
                        // delState={true}
                        // plusHandler={handleAdd}
                        // delHandler={handleRemove}
                      >
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
                                    <div className='yl-comp-field-label'>条件名称</div>
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
                                            {operatorOptions.map((item) => (
                                              <Option value={item.value}>{item.label}</Option>
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
                                              changeConditionVal(
                                                parentIndex,
                                                evt.target.value,
                                                'rules',
                                                index,
                                                'value',
                                              );
                                            }}
                                            value={rule.value}
                                            style={{ height: '24px' }}
                                          />
                                          <span style={{ textAlign: 'center' }}>值</span>
                                        </div>
                                        {/* 删除按钮 */}
                                        <Button
                                          size='small'
                                          style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: '#A1AEB3',
                                            paddingTop: '0px',
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
                                </div>
                              );
                            })}
                          </Tabs>
                        </div>
                      </DropPanel>
                    </div>
                  </div>
                );
              })}
            </Tabs>
          </div>
        </DropPanel>
      </div>

      {/* 过滤系列 */}
      {/* <div className='yl-comp-text-field comp-drop-panel'>

      </div> */}
    </div>
  );
};

export default MapDataSplitRender;
