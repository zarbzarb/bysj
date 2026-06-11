/**
 * 基础图层数据类型
 * 包含：时空数据、静态数据、变量
 */
import React, { Component } from 'react';
import { TreeSelect, Row, Col, Radio, Select, Tooltip, Button } from 'antd';
import fetch from '@/services/xhr/fetch';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import LargeEdit from '@/components/commons/LargeEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getAllLayers, getCurrentGroup, renderGroupNode } from '@/utils/gisCommonUtils';
import { Input, Line, Modal } from '@yl/datai-ui';
import { mapBaseLayer2dType } from '@/staticJson/MapBasic';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';
import VariableRef from './VariableRef';

const { TreeNode } = TreeSelect;
const { Option } = Select;

@inject('editorStore', 'controlStore', 'pageTreeStore')
@observer
export default class DataSource extends Component {
  constructor(props) {
    super(props);
    this.CompInstance = this.props.CompInstance;
    const { config } = this.props.CompInstance;
    const { data } = this.props;
    this.state = {
      englishName: data.englishName,
      fullScreenVisible: false,
      config: {
        ...config,
      },
      source: 'default',
      sourceGIS: [],
      dataSourceData: [],
      sourceType: 'json',
      filters: [],
      _data: [],
      evenFn: null,
      visible: false,
      testResult: undefined,
      // api图层参数信息
      apiParamVar: {
        type: 'default',
        layerType: '', // API_ES
        defaultValue: '',
        dataVariable: '',
        dataExpression: '',
      },
      isMerizationType: false, // 是否需要映射字段
      setLayer: undefined,
    };
  }

  componentDidMount() {
    const { _source, config, compAttr } = this.CompInstance;
    const {
      apiParamVar = {
        type: 'default',
        layerType: '',
        defaultValue: '',
        dataVariable: '',
        dataExpression: '',
      },
    } = compAttr;
    const { /* cimSource, */ timeAndSpace } = window.screenConfig.environment;

    const dataSourceData = [
      { label: '默认数据', value: 'json' },
      { label: '引用变量', value: 'variableRef' },
    ];

    if (timeAndSpace) {
      dataSourceData.push({
        label: /* '引用时空地理资源' */ '时空数据',
        value: 'gispublic',
      });
      this.loadLayers(); // 其他环境获取数据
    }
    this.setState({ dataSourceData, _source, apiParamVar });
    if (config._source == 'cim' || config._source == 'gispublic') {
      this.setState({
        testResult: Array.isArray(config?._data) ? config._data[0] : '', // 兼容data=[]报错问题
      });
    }
  }

  async loadLayers() {
    // 请求时空地理图层列表
    const data = await fetch.get('/gis-platform/gispublic/groups/getAll');
    if (data && data.result) {
      this.setState({
        sourceGIS: data.result,
      });
    }
  }

  closeFullScreen = () => {
    this.setState({
      fullScreenVisible: false,
    });
  };

  changeApiLayerParams(field, value) {
    const { CompInstance } = this.props;
    const { apiParamVar } = this.state;
    const vals = { ...apiParamVar, [field]: value };
    this.CompInstance.mergeConfig({
      apiParamVar: vals,
    });
    this.setState({
      apiParamVar: vals,
    });

    const { relation_layer_code } = CompInstance.compAttr;
    this.getLayerCodeData(relation_layer_code);
  }

  changeValue = (value, field, parentFields = [], index = -1) => {
    const { config } = this.state;
    const parentField = parentFields[0];
    if (parentField) {
      if (index === -1) {
        config[parentField][field] = value;
      } else {
        config[parentField][index][field] = value;
      }
    } else {
      config[field] = value;
    }
    this.setState({
      config,
    });
    // 修复默认数据无法保存问题
    this.CompInstance.defaultData = config;
    this.CompInstance.mergeConfig(config);
    //添加引用关系
    if (field === 'relation_layer_code') {
      this.CompInstance.mergeAttr({
        relation_layer_code: value,
      });
    }
    if (field === 'group_id') {
      this.CompInstance.mergeAttr({
        group_id: value,
      });
    }
  };

  async getLayerCodeData(layerCode) {
    const { isMerizationType } = this.state;
    const yunliMapFn = window.YunliMap || window.YunliMapGL || window.YunliMap3D;
    let reApiParam = {};
    if (isMerizationType) {
      reApiParam = this.setApiParam();
    }
    if (!layerCode) {
      layerCode = this.state.config?.relation_layer_code;
    }
    try {
      const mapData = await yunliMapFn.queryDataInLayer({
        layerCode,
        //   apiParam: reApiParam,
      });
      console.log('mapData', mapData);
      this.setState({
        testResult: mapData[0], // 兼容data=[]报错问题
      });
    } catch (error) {
      console.error(error);
    }
  }

  setApiParam = () => {
    const { type, layerType, defaultValue, dataVariable, dataExpression } =
      this.props.CompInstance.compAttr.apiParamVar || {};
    let reApiParam;
    if (layerType == 'API') {
      if (type == 'default') {
        reApiParam = defaultValue;
      } else if (type == 'variableRef') {
        const expression = dataExpression || 'data';
        const fn = new Function('data', `return ${expression}`);
        const variableValue = fn(window.getDataByKey(dataVariable));
        reApiParam = variableValue;
      }
    }
    return reApiParam;
  };

  renderNode = (children = []) => {
    return children.map((variableGroup, idx) => {
      return (
        <TreeNode disabled value={variableGroup.key} title={variableGroup.name}>
          {variableGroup.children &&
            variableGroup.children.map((variable, index) => {
              return <TreeNode value={variable.key} title={variable.name} />;
            })}
        </TreeNode>
      );
    });
  };

  filterOption(input, option) {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().includes(input.toLowerCase()) : false;
  }

  // v7.5支持模糊搜索
  filterTreeNode(input, treeNode) {
    if (typeof treeNode.title === 'string') {
      return treeNode.title.toLowerCase().includes(input.toLowerCase());
    }
    if (typeof treeNode.name === 'string') {
      return treeNode.name.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  }

  render() {
    const { config, sourceGIS, dataSourceData, testResult, apiParamVar, isMerizationType } = this.state;
    const { pageTreeStore } = this.props;
    const { type: mapType, englishName } = this.props.data;
    const { fullScreenVisible } = this.state;
    let featureType;
    switch (englishName) {
      case 'MapGlBuildingLayerNew': {
        featureType = ['polygon'];
        break;
      }
      case 'MapGlGeoFencingNew':
      case 'Map3DGeoFencing':
        featureType = ['linestring', 'polygon'];
        break;

      case 'MapGlHeatMapNew': {
        featureType = ['point'];
        break;
      }
      default: {
        break;
      }
    }
    const props = {
      styles,
      config,
      changeValue: this.changeValue,
    };
    let layer_groups = [];
    let layers = [];

    if (config._source === 'cim' || config._source === 'gispublic') {
      layer_groups = sourceGIS;
    }
    const group = getCurrentGroup(layer_groups, config.group_id);
    if (group) {
      layers = getAllLayers(group).filter((sub) => {
        return !featureType || featureType.includes(sub.featureType);
      });
    }

    const apiParamVarProps = {
      styles,
      config: {
        _variable: apiParamVar.dataVariable,
        _expression: apiParamVar.dataExpression,
      },
      changeValue: (value, field) => {
        const reField = field == '_variable' ? 'dataVariable' : 'dataExpression';
        this.changeApiLayerParams(reField, value);
        pageTreeStore.setPageInfoStep(1);
      },
    };
    const map2Dflag = mapBaseLayer2dType.includes(mapType);
    const defaultValue = config._data;
    return (
      <div className='yl-comp-config antd-dark ' style={{ minHeight: '100%' }}>
        {this.props.children}
        {!isMerizationType && (
          <>
            <Row className={`${styles.field} margin-top-8`} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                字段映射状态
              </Col>
            </Row>

            {config._api.map((item, key) => {
              return (
                <Row className={styles.field} align='middle'>
                  <Col flex='auto' className={styles.fieldLabel}>
                    {item.field}
                  </Col>
                  <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                    <Input
                      onChange={(v) => {
                        this.changeValue(v, 'mapField', ['_api'], key);
                      }}
                      data-index={key}
                      data-parent-field='_api'
                      data-field='mapField'
                      value={item.mapField}
                    />
                  </Col>
                </Row>
              );
            })}
          </>
        )}
        <Line className='marginBottom8 marginTop4' />
        <Row className={`${styles.field} margin-top-8`} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            数据源
          </Col>
        </Row>
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            数据源类型
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Select
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              placeholder='请选择'
              style={{ width: '100%' }}
              // v7.5 删除cim资源
              value={config._source === 'cim' ? 'gispublic' : config._source}
              onChange={(v) => {
                this.changeValue(v, '_source');
                this.changeValue(undefined, 'group_id');
                this.changeValue(undefined, 'relation_layer_code');
              }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {dataSourceData.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </Col>
        </Row>

        {/** 设置变量值信息 */}
        {config._source == 'variableRef' && <VariableRef {...props} />}

        {(config._source == 'cim' || config._source == 'gispublic') && (
          <>
            <div className='yl-comp-text-field'>
              <div className='yl-comp-field-label'>选择数据</div>
              <div className='yl-comp-field-content row' style={{ width: '206px' }}>
                <div className='col' style={{ width: '49%' }}>
                  <TreeSelect
                    suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                    showSearch={true}
                    filterTreeNode={this.filterTreeNode}
                    defaultValue={config.group_id}
                    placeholder='请选择'
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    popupClassName='custom-tree-select'
                    style={{ width: '100%' }}
                    dropdownStyle={{
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                    virtual={false}
                    onChange={(v) => {
                      console.log('v', v);
                      this.changeValue(v, 'group_id');
                      this.changeValue(undefined, 'relation_layer_code');
                    }}
                  >
                    {renderGroupNode(layer_groups)}
                  </TreeSelect>
                </div>
                <div className='col' style={{ width: '49%' }}>
                  <Select
                    suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                    showSearch={true}
                    filterOption={this.filterOption}
                    placeholder='请选择'
                    style={{ width: '100%' }}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    value={config.relation_layer_code}
                    onChange={(v, other) => {
                      this.changeValue(v, 'relation_layer_code');
                      this.setState({ setLayer: v });
                      this.getLayerCodeData(v);
                      this.changeApiLayerParams('layerType', other.layerType);
                    }}
                  >
                    {layers.map((item) => {
                      return (
                        <Option value={item.layerCode} layerType={item.layerType}>
                          {item.layerName}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </div>
            </div>

            <Row className={`${styles.field} margin-top-8`} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                查看变量结构
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`} style={{ display: 'flex' }}>
                <Tooltip
                  autoAdjustOverflow={true}
                  destroyTooltipOnHide={true}
                  placement='bottom'
                  title={
                    <div style={{ width: '240px' }}>
                      <LargeEdit language='json' value={testResult} fullScreenVisible={false} />
                    </div>
                  }
                >
                  <Button type='primary'>查看</Button>
                </Tooltip>
              </Col>
            </Row>
          </>
        )}

        {map2Dflag && apiParamVar.layerType.includes('API') && config._source == 'gispublic' && (
          <>
            <div className='yl-comp-text-field'>
              <div className='yl-comp-field-label'>
                <span className='margin-right-8'>api请求参数</span>
                <Tooltip title="api图层的请求参数，格式{type:'', field:''}">
                  <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                </Tooltip>
              </div>
              <div className='yl-comp-field-content'>
                <Radio.Group
                  onChange={(evt) => {
                    this.changeApiLayerParams('type', evt.target.value);
                    pageTreeStore.setPageInfoStep(1);
                  }}
                  value={apiParamVar.type}
                >
                  <Radio style={{ fontSize: '12px' }} value='variableRef'>
                    引用
                  </Radio>
                  <Radio style={{ fontSize: '12px' }} value='default'>
                    默认值
                  </Radio>
                </Radio.Group>
              </div>
            </div>
            {apiParamVar.type == 'default' && (
              <div className='yl-comp-text-field'>
                <LargeEdit
                  value={apiParamVar.defaultValue}
                  container={() => document.querySelector('#app')}
                  onChange={(evt) => {
                    this.changeApiLayerParams('defaultValue', evt);
                    pageTreeStore.setPageInfoStep(1);
                  }}
                />
              </div>
            )}
            {apiParamVar.type == 'variableRef' && <VariableRef {...apiParamVarProps} />}
          </>
        )}

        {/* 默认数据 */}
        {config._source == 'json' && (
          <>
            {/* <Line className='marginBottom8' /> */}
            <Row className={`${styles.field} margin-top-8`} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                数据响应结果
              </Col>
            </Row>
            <div className='yl-comp-text-field'>
              <LargeEdit
                onChange={(value) => {
                  this.changeValue(value, '_data');
                }}
                container={() => document.querySelector('#app')}
                value={defaultValue}
              />
            </div>
          </>
        )}
        {/* <DataManage visible={visible} onClose={this.onClose} type={'1'} /> */}
        {fullScreenVisible && false && <Modal getContainer={false} closeHandler={this.closeFullScreen} />}
      </div>
    );
  }
}
