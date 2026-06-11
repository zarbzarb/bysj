/**
 * 等值线面图组件的数据源
 */

import React, { Component } from 'react';
import { TreeSelect, Row, Col, Radio, Select, Input } from 'antd';
import fetch from '@/services/xhr/fetch';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import LargeEdit from '@/components/commons/LargeEdit';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { getAllLayers, getCurrentGroup, renderGroupNode } from '@/utils/gisCommonUtils';
import VariableRef from './VariableRef';
import styles from './index.less';
import { Line, Modal } from '@yl/datai-ui';
import { babelTransform } from '@/utils/utils';
const { TreeNode } = TreeSelect;
const { Option } = Select;
// 内置数据行政区划的 layerCode
const system_region_layer_code = 't_gis_area'; // 默认数据源
// let { Line, Modal } = window.dataqUi;

let dataSourceData = [
  { label: '内置数据', value: 'inner' },
  //{ label: /*'引用时空地理资源'*/ '时空数据', value: 'gispublic' },
  // { label: '引用CIM地理资源', value: 'cim' },
  { label: '引用变量', value: 'variableRef' },
];
@inject('controlStore', 'pageTreeStore')
@observer
export default class DataSource extends Component {
  constructor(props) {
    super(props);
    this.CompInstance = this.props.CompInstance;
    const { _source, config, compAttr } = this.props.CompInstance;
    this.state = {
      fullScreenVisible: false,
      config: {
        ...config,
      },
      compAttr: { ...compAttr },
      // source: 'default',
      // sourceCIM: [],
      sourceGIS: [],
      dataSourceData: [],
      sourceType: 'inner',
      filters: [],
      _data: [],
      evenFn: null,
      visible: false,
      regionTreeData: [],
      // curLayers: [],
      count: 0,
    };
    dataSourceData = [
      { label: '内置数据', value: 'inner' },
      { label: '引用变量', value: 'variableRef' },
    ];
  }

  componentDidMount() {
    let { config, compAttr } = this.props.CompInstance;
    const { cimSource, timeAndSpace } = window.screenConfig.environment;
    //console.log('componentDidMount***', this.props.CompInstance);
    let layerCode = system_region_layer_code;
    if (config._source == 'cim' || config._source == 'gispublic') {
      // v7.5 修改数据源
      if (config._source == 'cim') {
        this.changeConfig('gispublic', '_source', true);
      }
      layerCode = compAttr.relation_layer_code;
    } else if (config._source == 'variableRef') {
      let variableData = this.getExpDataByKey(compAttr['boundingVariable'], compAttr['boundingExpression']);
      layerCode = variableData?.layerCode;
    }
    if (timeAndSpace) {
      let gisOption = {
        label: /*'引用时空地理资源'*/ '时空数据',
        value: 'gispublic',
      };
      let insertIndex = dataSourceData.length - 1;
      dataSourceData.splice(insertIndex, 0, gisOption);
    }
    // v7.5 删除cim数据源
    // if (cimSource) {
    //   let cimOption = { label: '引用CIM地理资源', value: 'cim' };
    //   let insertIndex = dataSourceData.length - 1;
    //   dataSourceData.splice(insertIndex, 0, cimOption);
    // }
    this.handleRegionTreeData(layerCode);
    this.loadLayers(config._source);
  }
  getExpDataByKey(variable, expression) {
    let data = getDataByKey(variable);
    data = babelTransform(expression, data); // 运行时ES6转ES5
    return data;
  }

  // 通过图层获取行政区划数据
  handleRegionTreeData(relation_layer_code) {
    let _this = this;
    try {
      let mapInstance;
      if (window.YunliMap) {
        mapInstance = window.YunliMap;
      } else if (window.YunliMap3D) {
        mapInstance = window.YunliMap3D;
      }

      if (relation_layer_code) {
        //toggleRegionTreeLoaded(false);
        mapInstance
          .queryDataInLayer({
            layerCode: relation_layer_code,
            // cqlfilter: '1=1',
            cqlFilterEncrypt: window.btoa('1=1'), // 广东需求，安全性处理
            returnGeometry: false,
            //sortField: '',
            sortMethod: 'asc',
          })
          .then((data) => {
            _this.setState({
              regionTreeData: data.map(({ props: { adcode, padcode, name, has_child } }) => ({
                id: adcode,
                pId: padcode,
                value: adcode,
                title: name,
                isLeaf: has_child == 0,
                //disabled: has_child == 0
              })),
            });
            //toggleRegionTreeLoaded(true);
          });
      } else {
        this.setState({ regionTreeData: [] });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 获取图层列表
  loadLayers(type) {
    let _this = this;
    async function fetchData() {
      // 请求时空地理图层列表
      if (type === 'gispublic' || type === 'cim') {
        // let data = await fetch.get(
        //   `/gis-platform/gispublic/layers/getByGroup?groupId=static_xingzhengquhua&pageNum=1&pageSize=10000`
        // );
        let data = await fetch.get('/gis-platform/gispublic/groups/getAll');
        if (data && data.result) {
          _this.setState({
            sourceGIS: data.result,
          });
          // let arr = [];
          // data.result.forEach((item) => {
          //   item.layers?.forEach((sub) => {
          //     if (sub.featureType === 'polygon') {
          //       // 时空判断面数据
          //       arr.push(sub);
          //     }
          //   });
          // });
          // _this.setState({ curLayers: arr });
        }
      }
      // else if (type === 'cim') {
      //   // 请求cim图层列表
      //   let rs = await GETAllINFO();
      //   if (rs && rs.data) {
      //     // rs.data.forEach((item) => {
      //     //   if (item.fid == '20002') {
      //     //     // 20002: 行政区划
      //     //     _this.setState({ curLayers: item.layers });
      //     //   }
      //     // });
      //     let arr = [];
      //     rs.data.forEach((item) => {
      //       item.layers?.forEach((sub) => {
      //         if (sub.gisFeatureType === 'polygon') {
      //           // CIM判断面数据
      //           arr.push(sub);
      //         }
      //       });
      //     });
      //     _this.setState({ curLayers: arr });
      //   }
      // }
    }
    fetchData();
  }

  onClose = () => {
    const { changeTabsHandler } = this.props.controlStore;
    this.setState({
      visible: false,
    });
    changeTabsHandler('resources');
  };
  closeFullScreen = () => {
    this.setState({
      fullScreenVisible: false,
    });
  };

  renderNode = (children = []) => {
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
  };

  syncData = () => {
    this.CompInstance && this.CompInstance.asyncData(null, (rs) => {});
  };
  showModalEdit = () => {};
  // 引用变量并更新属性
  changeVarValue = (value, field, prefix) => {
    let { updateAttr, compAttr } = this.props.CompInstance || {};
    let attrField = prefix;
    if (field.indexOf('variable') > -1) {
      attrField = attrField + 'Variable';
    } else {
      attrField = attrField + 'Expression';
    }
    compAttr[attrField] = value;
    this.props.CompInstance.updateAttr(compAttr);
    this.setState({ count: this.state.count + 1 });
  };
  changeConfig = (value, field, updateFlag = false) => {
    let { mergeConfig, config = {} } = this.props.CompInstance || {};
    config[field] = value;
    this.props.CompInstance.mergeConfig(config);
    if (updateFlag) {
      this.setState({ config: { ...config } });
    }
  };
  changeCompAttr = (value, field, updateFlag = false) => {
    let { mergeAttr, updateAttr, compAttr = {} } = this.props.CompInstance || {};
    compAttr[field] = value;
    this.props.CompInstance.mergeAttr(compAttr);
    if (updateFlag) {
      this.setState({ compAttr: { ...compAttr } });
    }
  };
  // v7.5支持模糊搜索
  filterOption(input, option) {
    let val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().indexOf(input.toLowerCase()) >= 0 : false;
  }
  // v7.5支持模糊搜索
  filterTreeNode(input, treeNode) {
    console.log('input', input);
    console.log('treeNode', treeNode);
    if (typeof treeNode.title === 'string') {
      return treeNode.title.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    } else {
      if (typeof treeNode.name === 'string') {
        return treeNode.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      } else {
        return false;
      }
    }
  }
  render() {
    const { config = {}, compAttr: compAttrState, visible } = this.state;
    const { pageTreeStore } = this.props;
    const { group_id, relation_layer_code } = compAttrState;
    const { fullScreenVisible, regionTreeData, /*curLayers*/ sourceGIS } = this.state;
    let layer_groups = [];
    let layers = [];
    layer_groups = sourceGIS;
    let group = getCurrentGroup(layer_groups, group_id);
    if (group) {
      layers = getAllLayers(group).filter((sub) => {
        return sub.featureType === 'polygon';
      });
    }
    let { updateAttr, compAttr } = this.props.CompInstance;

    const {
      interRegion = '110000',
      filterField = 'adcode',
      mappingField = 'value',
      dataType = 'default',
      dataDefaultValue = [
        {
          lon: 116.264693,
          lat: 40.504897,
          value: 5,
        },
        {
          lon: 116.278491,
          lat: 39.989452,
          value: 12,
        },
        {
          lon: 116.496959,
          lat: 40.00095,
          value: 24,
        },
        {
          lon: 116.96379,
          lat: 40.357277,
          value: 33,
        },
      ],
    } = compAttrState;

    const props = {
      styles,
      config: {
        _variable: compAttr['boundingVariable'],
        _expression: compAttr['boundingExpression'],
      },
      changeValue: (value, field) => {
        this.changeVarValue(value, field, 'bounding');
        pageTreeStore.setPageInfoStep(1);
      },
      variableTip: `变量格式如下：{layerCode: "t_gis_area", cqlfilter: "adcode='110102'"}
            其中layerCode为图层的code，cqlfilter为图层的查询条件，按照adcode查询区域数据`,
    };
    const varProps = {
      styles,
      config: {
        _variable: compAttr['dataVariable'],
        _expression: compAttr['dataExpression'],
      },
      changeValue: (value, field) => {
        this.changeVarValue(value, field, 'data');
        pageTreeStore.setPageInfoStep(1);
      },
    };

    let defaultValue = config['_source'] == 'inner' ? config._data : this.state._data;
    return (
      <div className='yl-comp-config antd-dark ' style={{ minHeight: '100%' }}>
        {this.props.children}

        <Line className='marginBottom8 marginTop4' />

        <Row className={styles.field + ' margin-top-8'} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            数据源
          </Col>
        </Row>
        <Row className={styles.field + ' margin-top-8'} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            显示范围
          </Col>
        </Row>
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            数据源类型
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Select
              placeholder='请选择'
              style={{ width: '100%' }}
              // v7.5 删除cim资源
              value={config['_source'] === 'cim' ? 'gispublic' : config['_source']}
              onChange={(v) => {
                this.changeConfig(v, '_source', true);
                this.changeCompAttr(undefined, 'group_id');
                this.changeCompAttr(undefined, 'relation_layer_code');
                this.changeCompAttr('', 'interRegion', true);
                let layercode = v == 'inner' ? system_region_layer_code : undefined;
                this.handleRegionTreeData(layercode);
                this.setState({ sourceGIS: [], regionTreeData: [] });
                this.loadLayers(v);
                pageTreeStore.setPageInfoStep(1);
              }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {dataSourceData.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </Col>
        </Row>
        {/**设置变量值信息 */}
        {config._source == 'variableRef' && <VariableRef {...props} />}
        {(config._source == 'cim' || config._source == 'gispublic') && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              选择数据
            </Col>
            <Col
              flex='206px'
              className={styles.fieldInput + ' ' + styles.antdFieldInput}
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div className='col' style={{ width: '50%' }}>
                <TreeSelect
                  showSearch={true}
                  filterTreeNode={this.filterTreeNode}
                  value={group_id}
                  placeholder='请选择'
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  popupClassName='custom-tree-select'
                  dropdownStyle={{
                    maxHeight: 400,
                    overflow: 'auto',
                  }}
                  virtual={false}
                  style={{ width: '95px' }}
                  onChange={(v) => {
                    console.log('v', v);
                    this.changeCompAttr(v, 'group_id', true);
                    this.changeCompAttr(undefined, 'relation_layer_code', true);
                    this.changeCompAttr('', 'interRegion', true);
                    this.setState({ regionTreeData: [] });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                >
                  {renderGroupNode(layer_groups)}
                </TreeSelect>
              </div>
              <div className='col' style={{ width: '50%' }}>
                <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  placeholder='请选择'
                  // style={{ width: '100%' }}
                  style={{ width: '95px' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  value={relation_layer_code}
                  onChange={(v) => {
                    this.changeCompAttr(v, 'relation_layer_code', true);
                    this.changeCompAttr('', 'interRegion', true);
                    this.handleRegionTreeData(v);
                    this.setState({ regionTreeData: [] });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                >
                  {layers.map((item) => {
                    return <Option value={item.layerCode}>{item.layerName}</Option>;
                  })}
                </Select>
              </div>
            </Col>
          </Row>
          // <div className='yl-comp-text-field'>
          //   <div className='yl-comp-field-label' style={{ flex: 'auto', minWidth: '114px' }}>
          //     选择数据
          //   </div>
          //   <div className='yl-comp-field-content row' style={{ width: '206px' }}>
          //     <div className='col' style={{ width: '49%' }}>
          //       <TreeSelect
          //         showSearch={true}
          //         filterTreeNode={this.filterTreeNode}
          //         value={group_id}
          //         placeholder='请选择'
          //         getPopupContainer={(triggerNode) => triggerNode.parentNode}
          //         dropdownStyle={{
          //           maxHeight: 400,
          //           overflow: 'auto',
          //         }}
          //         style={{ width: '100%' }}
          //         onChange={(v) => {
          //           console.log('v', v);
          //           this.changeCompAttr(v, 'group_id', true);
          //           this.changeCompAttr(undefined, 'relation_layer_code', true);
          //           pageTreeStore.setPageInfoStep(1);
          //         }}
          //       >
          //         {renderGroupNode(layer_groups)}
          //       </TreeSelect>
          //     </div>
          //     <div className='col' style={{ width: '49%' }}>
          //       <Select
          //         showSearch={true}
          //         filterOption={this.filterOption}
          //         placeholder='请选择'
          //         style={{ width: '100%' }}
          //         getPopupContainer={(triggerNode) => triggerNode.parentNode}
          //         value={relation_layer_code}
          //         onChange={(v) => {
          //           this.changeCompAttr(v, 'relation_layer_code', true);
          //           this.handleRegionTreeData(v);
          //           this.setState({ regionTreeData: [] });
          //           pageTreeStore.setPageInfoStep(1);
          //         }}
          //       >
          //         {layers.map((item) => {
          //           return <Option value={item.layerCode}>{item.layerName}</Option>;
          //         })}
          //       </Select>
          //     </div>
          //   </div>
          // </div>
          // <Row className={styles.field} align="middle">
          //   <Col flex="auto" className={styles.fieldLabel}>
          //     选择图层
          //   </Col>
          //   <Col
          //     flex="206px"
          //     className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          //     <Select
          //       showSearch={true}
          //       filterOption={this.filterOption}
          //       placeholder="请选择数据图层"
          //       value={compAttrState.relation_layer_code}
          //       className="yl-comp-field-content row"
          //       onChange={(v) => {
          //         this.changeCompAttr(v, 'relation_layer_code', true);
          //         this.handleRegionTreeData(v);
          //         this.setState({ regionTreeData: [] });
          //       }}
          //       getPopupContainer={(triggerNode) => triggerNode.parentNode}>
          //       {curLayers.map(({ layerName, layerCode }, index) => (
          //         <Option key={index} value={layerCode}>
          //           {layerName}
          //         </Option>
          //       ))}
          //     </Select>
          //   </Col>
          // </Row>
        )}

        {config._source != 'variableRef' && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              选择区域
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <TreeSelect
                treeDataSimpleMode
                showSearch
                className='yl-comp-field-content row'
                placeholder='请选择'
                treeData={regionTreeData}
                value={interRegion}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onChange={(v) => {
                  this.changeCompAttr(v, 'interRegion', true);
                  pageTreeStore.setPageInfoStep(1);
                }}
              />
            </Col>
          </Row>
        )}
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            图层过滤映射字段
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Input
              placeholder='请输入'
              defaultValue='adcode'
              value={filterField}
              onChange={(e) => {
                this.changeCompAttr(e.target.value, 'filterField', true);
                pageTreeStore.setPageInfoStep(1);
              }}
            />
          </Col>
        </Row>
        <Row className={styles.field + ' margin-top-8'} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            样本数据
          </Col>
        </Row>

        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            类型
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Radio.Group
              onChange={(evt) => {
                this.changeCompAttr(evt.target.value, 'dataType', true);
                pageTreeStore.setPageInfoStep(1);
              }}
              value={dataType}
            >
              <Radio className={styles.radioLable} value='variableRef'>
                引用
              </Radio>
              <Radio className={styles.radioLable} value='default'>
                默认值
              </Radio>
            </Radio.Group>
          </Col>
        </Row>

        {dataType == 'default' && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <LargeEdit
                value={dataDefaultValue}
                container={() => document.querySelector('#app')}
                onChange={(evt) => {
                  this.changeCompAttr(evt, 'dataDefaultValue', true);
                  pageTreeStore.setPageInfoStep(1);
                }}
              />
            </Col>
          </Row>
        )}

        {dataType == 'variableRef' && <VariableRef {...varProps} />}

        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            数据映射字段
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Input
              placeholder='请输入'
              defaultValue='count'
              value={mappingField}
              onChange={(e) => {
                this.changeCompAttr(e.target.value, 'mappingField', true);
                pageTreeStore.setPageInfoStep(1);
              }}
            />
          </Col>
        </Row>
        {fullScreenVisible && false && <Modal getContainer={false} closeHandler={this.closeFullScreen} />}
      </div>
    );
  }
}
