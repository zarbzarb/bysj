import React, { Component } from 'react';
import fetch from '@/services/xhr/fetch';
import { inject, observer } from 'mobx-react';
import { TreeSelect, Tooltip, Button, Select, Radio, Checkbox, InputNumber, AutoComplete, Collapse } from 'antd';
import LargeEdit from '@/components/commons/LargeEdit';
import { defaultLayerCode, mapBaseLayer2dType, mapBaseLayerTypes } from '@/staticJson/MapBasic';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { setStoreProps } from '@/utils/dataStoreUtils';
import {
  handleActionSettings,
  replaceLayersEventKey,
  getAllLayers,
  getCurrentGroup,
  getCurrentGroupReverse,
  renderGroupNode,
} from '@/utils/gisCommonUtils';
import VariableRef from './VariableRef';

import styles from './index.less';

const { TreeNode } = TreeSelect;
const { Option } = Select;
const { Panel } = Collapse;
const { YunliMap, dataStore } = window;
const apiMapMsg = `api图层的请求参数，格式{"type":"", "field":""}`;

@inject('pageTreeStore')
@observer
export default class DataSource extends Component {
  state = {
    source: 'default',
    // sourceCIM: [],
    sourceGIS: [],
    group_id: undefined,
    // count: 0,
    testResult: undefined,
    dataSourceData: [],
    // apiLoad: false,
    relation_layer_code: undefined,
    variable: undefined,
    defaultData: [],
    mapData: [],
    bindVariable: undefined,
    apiParamVar: {
      type: 'default',
      layerType: '', // API_ES/API
      defaultValue: {},
      dataVariable: '',
      dataExpression: '',
      updateApiType: false,
      updateApiTime: 10,
    },
    // v8.3新增过滤参数
    // id_key: 'adcode',
    // idParamVar: {
    //   type: 'default',
    //   defaultValue: 100000,
    //   dataVariable: '',
    //   dataExpression: '',
    // },
    pid_key: 'padcode',
    pidParamVar: {
      type: 'default',
      defaultValue: 100000,
      dataVariable: '',
      dataExpression: '',
    },
    preLayerCode: undefined,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let {
      relation_layer_code,
      group_id,
      source,
      bindVariable,
      apiParamVar = {
        type: 'default',
        layerType: '',
        defaultValue: {},
        dataVariable: '',
        dataExpression: '',
        updateApiType: false,
        updateApiTime: 10,
      },
      // v8.3新增过滤参数
      // id_key = 'adcode',
      // idParamVar = {
      //   type: 'default',
      //   defaultValue: 100000,
      //   dataVariable: '',
      //   dataExpression: '',
      // },
      pid_key = 'padcode',
      pidParamVar = {
        type: 'default',
        defaultValue: 100000,
        dataVariable: '',
        dataExpression: '',
      },
    } = this.props.CompInstance.compAttr;

    const { englishName } = this.props.data;

    if (!apiParamVar.updateApiType) {
      apiParamVar.updateApiType = false;
    }
    if (!apiParamVar.updateApiType) {
      apiParamVar.updateApiTime = 10;
    }
    const { /*cimSource,*/ timeAndSpace } = window.screenConfig.environment;

    if (!!relation_layer_code) {
      this.getLayerFirstItem(relation_layer_code); // 查看变量结构
    }
    const dataSourceData = [];
    dataSourceData.push({ label: '内置数据', value: 'default' });
    // v7.5 删除cimSource 修改timeAndSpace名称
    // if (cimSource) {
    //   dataSourceData.push({ label: '引用CIM地理资源', value: 'cim' });
    //   this.cimLayers(); // cim环境获取数据
    // }

    // if (timeAndSpace) {
    dataSourceData.push({
      label: /*'引用时空地理资源'*/ '时空数据',
      value: 'gispublic',
    });
    this.loadLayers(); // 其他环境获取数据
    // }
    // dataSourceData.push({ label: '引用变量', value: 'useVariable' });
    this.setState({
      dataSourceData,
      source,
      group_id,
      relation_layer_code,
      bindVariable,
      apiParamVar,
      // v8.3新增过滤参数
      // id_key,
      // idParamVar,
      pid_key,
      pidParamVar,
      preLayerCode: relation_layer_code,
    });
    //v8.3新增GL板块图
    if (englishName === 'MapGLPlateLayer') {
      defaultLayerCode[2].layerCode = 't_gis_area';
    } else {
      defaultLayerCode[2].layerCode = 'default_edit_layer';
    }
    this.setState({ defaultData: defaultLayerCode });
    // window.screenConfig.environment?.cimSource
    //   ? this.cimLayers() //cim环境获取数据
    //   : this.loadLayers(); //其他环境获取数据
  }
  // v7.5 删除cim
  // async cimLayers() {
  //   // this.setState({
  //   //   apiLoad: true
  //   // });
  //   // 请求cim图层列表
  //   let rs = await GETAllINFO();
  //   if (rs && rs.data) {
  //     this.setState({
  //       sourceCIM: rs.data
  //     });
  //   }
  // }

  async loadLayers() {
    // 请求时空地理图层列表
    let data = await fetch.get('/gis-platform/gispublic/groups/getAll');
    if (data && data.result) {
      this.setState({
        sourceGIS: data.result,
      });
    }
  }

  renderNode(children = []) {
    return children.map((variableGroup, idx) => {
      return (
        <TreeNode disabled value={variableGroup.key} title={variableGroup.name}>
          {variableGroup.children &&
            variableGroup.children.map((variable, index) => {
              return <TreeNode value={variable.key} title={variable.name}></TreeNode>;
            })}
        </TreeNode>
      );
    });
  }

  async getLayerFirstItem(layerCode, dataType) {
    const { bindVariable } = this.state;
    const yunliMapFn = window.YunliMap || window.YunliMapGL || window.YunliMap3D;
    try {
      yunliMapFn
        .queryDataInLayer({
          layerCode,
          pageNum: 1,
          pageSize: 1,
        })
        .then((data) => {
          const testResult = data[0]?.props; //兼容data=[]报错问题
          this.setState({
            testResult,
          });
          if (dataType && bindVariable) {
            setStoreProps(bindVariable, testResult, 'defaultType', 'map');
          }
        });
    } catch (e) {
      console.error(e);
    }
  }

  resetMapEventLayerCode = (opts = {}) => {
    const { preVal, nextVal } = opts;
    if (preVal == nextVal || nextVal == '') {
      return;
    }
    const compList = window.componentList || [];
    replaceLayersEventKey({
      compList,
      callback: (actionSettings) => {
        handleActionSettings({ preVal, nextVal, actionSettings });
      },
    });
  };

  changeApiLayerParams(field, value) {
    const { CompInstance } = this.props;
    const { apiParamVar } = this.state;
    const vals = { ...apiParamVar, [field]: value };
    CompInstance.mergeAttr({
      apiParamVar: vals,
    });
    this.setState({
      apiParamVar: vals,
    });
  }

  // changeIdParams(field, value) {
  //   const { CompInstance } = this.props;
  //   const { idParamVar } = this.state;
  //   const vals = { ...idParamVar, [field]: value };
  //   CompInstance.mergeAttr({
  //     idParamVar: vals,
  //   });
  //   this.setState({
  //     idParamVar: vals,
  //   });
  // }

  changePidParams(field, value) {
    const { CompInstance } = this.props;
    const { pidParamVar } = this.state;
    const vals = { ...pidParamVar, [field]: value };
    CompInstance.mergeAttr({
      pidParamVar: vals,
    });
    this.setState({
      pidParamVar: vals,
    });
  }

  // v7.5支持模糊搜索
  filterOption = (input, option) => {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().includes(input.toLowerCase()) : false;
  };

  // v7.5支持模糊搜索
  filterTreeNode = (input, treeNode) => {
    console.log('input', input);
    console.log('treeNode', treeNode);
    if (typeof treeNode.title === 'string') {
      return treeNode.title.toLowerCase().includes(input.toLowerCase());
    }
    if (typeof treeNode.name === 'string') {
      return treeNode.name.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  render() {
    let {
      source,
      group_id,
      sourceGIS,
      testResult,
      dataSourceData,
      bindVariable,
      apiParamVar,
      // v8.3新增adcodeParamVar参数
      // id_key,
      // idParamVar,
      pid_key,
      pidParamVar,
      relation_layer_code,
      defaultData,
      // mapData,
    } = this.state;
    const { pageTreeStore } = this.props;
    const { englishName, type: mapType } = this.props.data;
    let featureType = undefined;
    if (
      englishName.includes('BasePointLayer') ||
      englishName === 'BaseGifLayer3D' ||
      englishName === 'BaseGifLayer2D'
    ) {
      featureType = 'point';
    } else if (englishName.includes('BasePolylineLayer')) {
      featureType = 'linestring';
    } else if (englishName.includes('BasePolygonLayer') || englishName === 'MapGLPlateLayer') {
      featureType = 'polygon';
    }
    let layer_groups = [];
    let layers = [];
    if (source === 'cim') {
      source = 'gispublic';
    }
    layer_groups = sourceGIS;
    let group = getCurrentGroupReverse(layer_groups, relation_layer_code);
    if (group) {
      const { fid } = group;
      if (group_id !== fid) {
        this.setState({ group_id: fid });
      }
      layers = getAllLayers(group).filter((sub) => {
        return !featureType || sub.featureType === featureType;
      });
    } else {
      group = getCurrentGroup(layer_groups, group_id); // 用户选分组再到图层走这里
      if (group) {
        layers = getAllLayers(group).filter((sub) => {
          return !featureType || sub.featureType === featureType;
        });
      }
    }
    if (!source) {
      source = 'default';
    }
    const apiParamVarProps = {
      styles,
      config: {
        _variable: apiParamVar.dataVariable,
        _expression: apiParamVar.dataExpression,
      },
      changeValue: (value, field) => {
        let reField = field == '_variable' ? 'dataVariable' : 'dataExpression';
        this.changeApiLayerParams(reField, value);
        pageTreeStore.setPageInfoStep(1);
      },
    };
    let apiMapFlag = mapBaseLayer2dType.includes(mapType);
    let loopMapFlag = mapBaseLayerTypes.includes(mapType);
    //v8.3新增GL板块图
    let glPlateFlag = '@yl/datai-com-map-gl-plate-layer' === mapType;
    // const idParamVarProps = {
    //   styles,
    //   config: {
    //     _variable: idParamVar.dataVariable,
    //     _expression: idParamVar.dataExpression,
    //   },
    //   changeValue: (value, field) => {
    //     let reField = field == '_variable' ? 'dataVariable' : 'dataExpression';
    //     this.changeIdParams(reField, value);
    //     pageTreeStore.setPageInfoStep(1);
    //   },
    // };
    const pidParamVarProps = {
      styles,
      config: {
        _variable: pidParamVar.dataVariable,
        _expression: pidParamVar.dataExpression,
      },
      changeValue: (value, field) => {
        let reField = field == '_variable' ? 'dataVariable' : 'dataExpression';
        this.changePidParams(reField, value);
        pageTreeStore.setPageInfoStep(1);
      },
    };
    let { CompInstance } = this.props;

    // group_id = group_id || this.getGroupId(relation_layer_code, layers);
    console.log(apiParamVar, 'pidParamVar-----------');
    return (
      <div className='yl-comp-config antd-dark ' style={{ minHeight: '100%' }}>
        <div className='yl-comp-text-field'>
          <div className='yl-comp-field-label'>数据源选择</div>
          <div className='yl-comp-field-content row'>
            <Select
              placeholder='请选择'
              style={{ width: '100%' }}
              value={source}
              onChange={(v) => {
                console.log('=======', v);
                CompInstance.mergeAttr({
                  source: v,
                  group_id: undefined,
                  relation_layer_code: '',
                });
                this.setState({
                  source: v,
                  group_id: undefined,
                  relation_layer_code: undefined,
                });
                if (v === 'default') {
                  this.changeApiLayerParams('layerType', '');
                }
                pageTreeStore.setPageInfoStep(1);
              }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {dataSourceData.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </div>
        </div>
        {/* {source == 'useVariable' && (
          <div className="yl-comp-text-field">
            <div className="yl-comp-field-label">绑定变量到</div>
            <div className="yl-comp-field-content">
              <TreeSelect
                value={variable}
                onChange={(val) => {
                  // console.log(val, '------=======');
                  let data = getDataByKey(val);
                  // console.log(data, 'kkkkkkkkkkk');
                  CompInstance.mergeAttr({
                    data: data,
                    relation_layer_code: undefined
                  });
                  this.setState({ count: ++this.state.count });
                }}
                showCheckedStrategy="TreeSelect.SHOW_ALL"
                className="yl-comp-field-content row">
                {this.renderNode(window.dataStore)}
              </TreeSelect>
            </div>
          </div>
        )} */}
        {source == 'default' && (
          <div className='yl-comp-text-field'>
            <div className='yl-comp-field-label'>选择数据</div>
            <div className='yl-comp-field-content row'>
              <div className='col' style={{ width: '49%' }}>
                <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  placeholder='请选择'
                  style={{ width: '100%' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  value={relation_layer_code}
                  onChange={(v) => {
                    console.log('v');
                    CompInstance.mergeAttr({
                      relation_layer_code: v, // 选中值需要保存到后台
                    });
                    this.setState({
                      relation_layer_code: v,
                    });
                    if (!!v) {
                      this.getLayerFirstItem(v); // 查看变量结构
                      this.resetMapEventLayerCode({
                        preVal: this.state.preLayerCode,
                        nextVal: v,
                      });
                      this.setState({ preLayerCode: v });
                    }
                    // this.changeApiLayerParams('layerType', 'API');
                    pageTreeStore.setPageInfoStep(1);
                  }}
                >
                  {defaultData.map((item) => {
                    return <Option value={item.layerCode}>{item.layerName}</Option>;
                  })}
                </Select>
              </div>
            </div>
          </div>
        )}
        {(source == 'cim' || source == 'gispublic') && (
          <div className='yl-comp-text-field'>
            <div className='yl-comp-field-label'>选择数据</div>
            <div className='yl-comp-field-content row'>
              <div className='col' style={{ width: '49%' }}>
                {/* <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  placeholder="请选择"
                  style={{ width: '100%' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  value={group_id}
                  onChange={(v) => {
                    CompInstance.mergeAttr({
                      group_id: v,
                      relation_layer_code: undefined
                    });
                    this.setState({
                      group_id: v,
                      relation_layer_code: undefined
                    });
                  }}>
                  {layer_groups.map((item) => {
                    return <Option value={item.fid}>{item.groupName}</Option>;
                  })}
                </Select> */}
                <TreeSelect
                  showSearch={true}
                  filterTreeNode={this.filterTreeNode}
                  // value={group_id && group ? group_id : '分类不存在'}
                  value={group_id ? (group ? group_id : '分类不存在') : group_id}
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
                    CompInstance.mergeAttr({
                      group_id: v,
                      relation_layer_code: undefined,
                    });
                    this.setState({
                      group_id: v,
                      relation_layer_code: undefined,
                    });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                  treeDefaultExpandedKeys={[group_id]}
                >
                  {renderGroupNode(layer_groups)}
                </TreeSelect>
              </div>
              <div className='col' style={{ width: '49%' }}>
                <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  placeholder='请选择'
                  style={{ width: '100%' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  value={
                    relation_layer_code
                      ? layers.find((item) => item.layerCode === relation_layer_code)
                        ? relation_layer_code
                        : '图层不存在'
                      : relation_layer_code
                  }
                  onChange={(v, other) => {
                    CompInstance.mergeAttr({
                      relation_layer_code: v, // 选中值需要保存到后台
                    });
                    this.setState({
                      relation_layer_code: v,
                    });
                    if (!!v) {
                      this.getLayerFirstItem(v, 'defaultType'); // 查看变量结构
                      this.resetMapEventLayerCode({
                        preVal: this.state.preLayerCode,
                        nextVal: v,
                      });
                      this.setState({ preLayerCode: v });
                      CompInstance.compAttr.type == 'TileLayer' &&
                        CompInstance.updateWMSCb &&
                        CompInstance.updateWMSCb({
                          relation_layer_code: v,
                          group_id: CompInstance.compAttr.group_id, //处理乱码问题
                        });
                    }
                    this.changeApiLayerParams('layerType', other.layerType);
                    pageTreeStore.setPageInfoStep(1);
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
        )}

        <div className='yl-comp-text-field'>
          <div className='yl-comp-field-label'>
            <span className='margin-right-8'>将数据绑定到</span>
            <Tooltip title='选择某一图层数据后，会将该图层的样例数据绑定到指定变量中'>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip>
          </div>
          <div className='yl-comp-field-content'>
            <TreeSelect
              style={{ width: '100%' }}
              allowClear
              value={bindVariable}
              showSearch
              treeNodeFilterProp='title'
              onChange={(val) => {
                CompInstance.mergeAttr({
                  bindVariable: val,
                });
                this.setState({
                  bindVariable: val,
                });
                if (!!val) {
                  setStoreProps(val, testResult, 'defaultType', 'map');
                }
                pageTreeStore.setPageInfoStep(1);
              }}
              showCheckedStrategy='TreeSelect.SHOW_ALL'
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {this.renderNode(window.dataStore)}
            </TreeSelect>
          </div>
        </div>
        {/* 已移动到样式配置 */}
        <div className='yl-comp-text-field'>
          <div className='yl-comp-field-label'>查看变量结构</div>
          <div className='yl-comp-field-content'>
            <Tooltip
              autoAdjustOverflow={true}
              destroyTooltipOnHide={true}
              placement='bottom'
              title={
                <div style={{ width: '240px' }}>
                  <LargeEdit language={'json'} value={testResult} fullScreenVisible={false} />
                </div>
              }
            >
              <Button type='primary'>查看</Button>
            </Tooltip>
          </div>
        </div>

        {glPlateFlag && (
          <Collapse onChange={() => {}} expandIconPosition='end'>
            <Panel
              // header='过滤参数'
              header={
                <>
                  <span className='margin-right-8'>过滤图层数据</span>
                  <Tooltip title='指定过滤字段后，图层渲染时仅渲染符合过滤的板块'>
                    <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                  </Tooltip>
                </>
              }
            >
              {/* <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>
                  <span className='margin-right-8'>指定id字段</span>
                </div>
                <div className='yl-comp-field-content'>
                  <AutoComplete
                    popupClassName='certain-category-search-dropdown'
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    size='smalll'
                    style={{ width: '100%' }}
                    value={id_key}
                    options={
                      testResult &&
                      Object.keys(testResult).map((key) => {
                        return { label: key, value: key };
                      })
                    }
                    onChange={(value) => {
                      CompInstance.mergeAttr({
                        id_key: value,
                      });
                      this.setState({
                        id_key: value,
                      });
                      pageTreeStore.setPageInfoStep(1);
                    }}
                    onSelect={(value) => {
                      CompInstance.mergeAttr({
                        id_key: value,
                      });
                      this.setState({
                        id_key: value,
                      });
                      pageTreeStore.setPageInfoStep(1);
                    }}
                  />
                </div>
              </div>

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>
                  <span className='margin-right-8'>数据类型</span>
                </div>
                <div className='yl-comp-field-content'>
                  <Radio.Group
                    onChange={(evt) => {
                      this.changeIdParams('type', evt.target.value);
                      pageTreeStore.setPageInfoStep(1);
                    }}
                    value={idParamVar.type}
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
              {idParamVar.type == 'default' && (
                <div className='yl-comp-text-field'>
                  <LargeEdit
                    value={idParamVar.defaultValue}
                    container={() => document.querySelector('#app')}
                    onChange={(evt) => {
                      this.changeIdParams('defaultValue', evt);
                      pageTreeStore.setPageInfoStep(1);
                    }}
                  />
                </div>
              )}
              {idParamVar.type == 'variableRef' && <VariableRef {...idParamVarProps} />} */}

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>
                  <span className='margin-right-8'>指定过滤字段</span>
                </div>
                <div className='yl-comp-field-content'>
                  <AutoComplete
                    popupClassName='certain-category-search-dropdown'
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    size='smalll'
                    style={{ width: '100%' }}
                    value={pid_key}
                    options={
                      testResult &&
                      Object.keys(testResult).map((key) => {
                        return { label: key, value: key };
                      })
                    }
                    onChange={(value) => {
                      CompInstance.mergeAttr({
                        pid_key: value,
                      });
                      this.setState({
                        pid_key: value,
                      });
                      pageTreeStore.setPageInfoStep(1);
                    }}
                    onSelect={(value) => {
                      CompInstance.mergeAttr({
                        pid_key: value,
                      });
                      this.setState({
                        pid_key: value,
                      });
                      pageTreeStore.setPageInfoStep(1);
                    }}
                  />
                </div>
              </div>

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>
                  <span className='margin-right-8'>数据类型</span>
                </div>
                <div className='yl-comp-field-content'>
                  <Radio.Group
                    onChange={(evt) => {
                      this.changePidParams('type', evt.target.value);
                      pageTreeStore.setPageInfoStep(1);
                    }}
                    value={pidParamVar.type}
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
              {pidParamVar.type == 'default' && (
                <div className='yl-comp-text-field'>
                  <LargeEdit
                    value={pidParamVar.defaultValue}
                    container={() => document.querySelector('#app')}
                    onChange={(evt) => {
                      this.changePidParams('defaultValue', evt);
                      pageTreeStore.setPageInfoStep(1);
                    }}
                  />
                </div>
              )}
              {pidParamVar.type == 'variableRef' && <VariableRef {...pidParamVarProps} />}
            </Panel>
          </Collapse>
        )}

        {apiMapFlag && apiParamVar.layerType.includes('API') && (
          <>
            <div className='yl-comp-text-field'>
              <div className='yl-comp-field-label'>
                <span className='margin-right-8'>api请求参数</span>
                <Tooltip title={apiMapMsg}>
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
                  language={'json'}
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
            {loopMapFlag && (
              <>
                <div className='yl-comp-text-field'>
                  <div flex='210px' className='yl-comp-field-label'>
                    <span className='margin-right-6'>自动刷新</span>
                    {/* <Tooltip title="api图层的请求参数，格式{type:'', field:''}">
                      <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                    </Tooltip> */}
                  </div>
                  <div className='yl-comp-field-content'>
                    <Checkbox
                      checked={apiParamVar.updateApiType}
                      onChange={(v) => {
                        this.changeApiLayerParams('updateApiType', v.target.checked);
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                    <span className={styles.updateStyle}>自动刷新请求</span>
                    <InputNumber
                      min={10}
                      className={styles.updateTwoInput}
                      style={{ width: '50px' }}
                      value={apiParamVar.updateApiTime}
                      onChange={(v) => {
                        this.changeApiLayerParams('updateApiTime', v);
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                    <span className={styles.updateMs}>秒一次</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }
}
