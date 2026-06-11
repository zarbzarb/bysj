/** 热力图 */
import React, { Component, Fragment } from 'react';
import { TreeSelect, Row, Col, Radio, Select, Tooltip, Button } from 'antd';
import fetch from '@/services/xhr/fetch';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import LargeEdit from '@/components/commons/LargeEdit';
import { getDataByKey, removeDataToComp, mapDataToComp } from '@/utils/dataStoreUtils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getAllLayers, getCurrentGroup, renderGroupNode } from '@/utils/gisCommonUtils';
import { Input, Line, Modal } from '@yl/datai-ui';
import { babelTransform } from '@/utils/utils';
import { mapBaseLayer2dType } from '@/staticJson/MapBasic';
import styles from './index.less';
import VariableRef from './VariableRef';

const { TreeNode } = TreeSelect;
const { Option } = Select;
// let Editor = window.dataqUi['Editor'];
// let {
//   Input,
//   // DropPanel,
//   // Select,
//   // Range,
//   // Color,
//   Line,
//   // CheckBox,
//   Modal
// } = window.dataqUi;

// const dataSourceData = [
//   { label: '静态json数据', value: 'json' },
//   { label: '变量引用', value: 'variableRef' }
// ];

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
      // sourceCIM: [],
      sourceGIS: [],
      dataSourceData: [],
      sourceType: 'json',
      filters: [],
      _data: [],
      _mockData: config._mockData ? config._mockData : JSON.parse(JSON.stringify(config._data)),
      evenFn: null,
      visible: false,
      testResult: undefined,
      apiParamVar: {
        type: 'default',
        layerType: '', // API_ES
        defaultValue: '',
        dataVariable: '',
        dataExpression: '',
      },
      isMerizationType: false,
      setLayer: undefined,
    };
  }

  componentDidMount() {
    const { _source, config, compAttr } = this.props.CompInstance;
    const {
      apiParamVar = {
        type: 'default',
        layerType: '',
        defaultValue: '',
        dataVariable: '',
        dataExpression: '',
      },
    } = compAttr;
    const { englishName } = this.state;
    const { /* cimSource, */ timeAndSpace } = window.screenConfig.environment;
    // if (!!relation_layer_code) {
    //   this.getLayerFirstItem(relation_layer_code); // 查看变量结构
    // }
    const dataSourceData = [];
    dataSourceData.push({ label: '默认数据', value: 'json' }, { label: '引用变量', value: 'variableRef' });
    // v7.5 删除cim数据源
    // if (cimSource) {
    //   dataSourceData.push({ label: '引用CIM地理资源', value: 'cim' });
    //   this.cimLayers(); // cim环境获取数据
    // }
    if (timeAndSpace) {
      dataSourceData.push({
        label: /* '引用时空地理资源' */ '时空数据',
        value: 'gispublic',
      });
      this.loadLayers(); // 其他环境获取数据
    }
    this.setState({ dataSourceData, _source, apiParamVar });
    // console.log(config, '00000');
    if (config._source === 'cim' || config._source === 'gispublic') {
      this.setState({
        testResult: Array.isArray(config?._data) ? config._data[0] : '', // 兼容data=[]报错问题
      });
    }

    if (
      config._source === 'gispublic' &&
      (englishName === 'Map2DPointPolymerization' || englishName === 'Map3DPointPolymerization')
    ) {
      this.setState({ isMerizationType: true });
    }

    // this.setState({ defaultData: defaultLayerCode });
  }

  // v7.5 删除cim数据源
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
    const data = await fetch.get('/gis-platform/gispublic/groups/getAll');
    if (data && data.result) {
      this.setState({
        sourceGIS: data.result,
      });
    }
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

    const { relation_layer_code } = CompInstance.compAttr;
    this.getLayerCodeData(relation_layer_code);
  }

  // todo: 这个方法改变数据源的逻辑需要重新好好整理下
  changeValue = (value, field, parentFields = [], index = 0) => {
    const {
      pageTreeStore: { setPageInfoStep },
    } = this.props;

    const { config } = this.state;
    const oldConfig = _.cloneDeep(config);
    if (field === '_source') {
      // 没改变数据类型
      if (config[field] === value) {
        return;
      }
      // 数据为变量引用
      config._data = value === 'variableRef' ? [] : config._mockData;
      config._mockData = this.state._mockData;
    }

    if (parentFields.length === 0 || parentFields[0] === undefined) {
      config[field] = value;
      this.setState({
        config: {
          ...config,
          [field]: value,
        },
      });
    } else {
      const key = parentFields[0];
      config[key][index][field] = value;
      this.setState({
        config,
      });
    }
    // 修改数据
    if (field === '_data') {
      config._initData = value;

      if (this.CompInstance.chart && value.length === 0) {
        this.CompInstance.chart.clear();
      }

      this.CompInstance.syncData(value);
      this.CompInstance.updateConfig(config);
      this.setState({
        _data: value,
      });
    } else {
      // mark
      if (field === '_source') {
        this.setState({
          sourceType: value,
        });
      }
      this.CompInstance.updateConfig(config);
    }

    this.listenData(oldConfig, config);
    this.props.editorStore.forceUpdateLayout();
    setPageInfoStep(1);
    // console.log(value, field, config, '0000000000000');
  };

  listenData = (oldConfig, config) => {
    if (config._source === 'json') return;

    if (
      _.eq(oldConfig._source, config._source) &&
      _.eq(oldConfig._variable, config._variable) &&
      _.eq(oldConfig._api, config._api)
    ) {
      return;
    }
    const comKey = this.props.data.key;
    removeDataToComp(oldConfig._variable, comKey);
    mapDataToComp(config._variable, comKey);

    this.getData();
  };

  getData = () => {
    const { config } = this.state;
    if (config && config._source === 'variableRef' && config._variable !== '') {
      const key = config._variable;
      let data = getDataByKey(key); // 根据key获取全局变量的值
      if (config._expression) {
        try {
          data = babelTransform(config._expression, data); // 运行时ES6转ES5
        } catch (error) {
          console.error(error, '-------');
        }
      }

      if (Array.isArray(data)) {
        if (data.length === 0 && this.CompInstance && this.CompInstance.chart) {
          this.CompInstance.chart.clear();
        }
        this.CompInstance.setData(data);
      } else {
        this.CompInstance.setData(data);
        console.error(this, data, '依赖的数据格式化后不符合数组格式');
      }
    }
  };

  async getLayerCodeData(layerCode) {
    const { isMerizationType, englishName } = this.state;
    let reApiParam = {};
    let yunliMapFn = window.YunliMap;
    if (!yunliMapFn) {
      yunliMapFn = window.YunliMap3D;
    }
    if (isMerizationType) {
      reApiParam = this.setApiParam();
    }
    if (!layerCode) {
      layerCode = this.state.config?.relation_layer_code;
    }
    try {
      yunliMapFn.getFeatureByFilter({
        layerCode,
        apiParam: reApiParam,
        callback: (data) => {
          const hotData = data.map((v) => {
            const { props } = v;
            if (isMerizationType) {
              props.lon = v?.coordinates[0];
              props.lat = v?.coordinates[1];
            }
            return props;
          });
          if (englishName != 'Map2DPointPolymerization') {
            this.changeValue(hotData, '_data');
          }

          this.setState({
            testResult: data[0]?.props, // 兼容data=[]报错问题
          });
        },
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
        <TreeNode disabled value={variableGroup.key} title={variableGroup.name} key={`TreeNode-${idx}`}>
          {variableGroup.children &&
            variableGroup.children.map((variable, index) => {
              return <TreeNode value={variable.key} title={variable.name} key={`TreeNode-${idx}-${index}`} />;
            })}
        </TreeNode>
      );
    });
  };

  syncData = () => {
    this.CompInstance && this.CompInstance.asyncData(null, (rs) => {});
  };

  showModalEdit = () => {};

  // v7.5支持模糊搜索
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
    const {
      config,
      visible,
      // sourceCIM,
      sourceGIS,
      dataSourceData,
      testResult,
      apiParamVar,
      isMerizationType,
    } = this.state;
    const { pageTreeStore } = this.props;
    const { type: mapType } = this.props.data;
    const { fullScreenVisible } = this.state;
    const props = {
      styles,
      config,
      changeValue: this.changeValue,
    };
    let layer_groups = [];
    let layers = [];
    // if (config['_source'] === 'cim') {
    //   layer_groups = sourceCIM;
    // } else if (config['_source'] === 'gispublic') {
    //   layer_groups = sourceGIS;
    // }
    if (config._source === 'cim' || config._source === 'gispublic') {
      layer_groups = sourceGIS;
    }
    // layer_groups.some((item) => {
    //   if (item.fid === config['group_id']) {
    //     layers = [];
    //     item.layers?.forEach((sub) => {
    //       if (sub.featureType === 'point') {
    //         // 时空判断面数据
    //         layers.push(sub);
    //       }
    //     });
    //     // layers = item.layers;
    //     return true;
    //   }
    //   return false;
    // });
    const group = getCurrentGroup(layer_groups, config.group_id);
    if (group) {
      layers = getAllLayers(group).filter((sub) => {
        return sub.featureType === 'point';
      });
    }

    const apiParamVarProps = {
      styles,
      config: {
        _variable: apiParamVar.dataVariable,
        _expression: apiParamVar.dataExpression,
      },
      changeValue: (value, field) => {
        const reField = field === '_variable' ? 'dataVariable' : 'dataExpression';
        this.changeApiLayerParams(reField, value);
        pageTreeStore.setPageInfoStep(1);
      },
    };
    const map2Dflag = mapBaseLayer2dType.includes(mapType);
    // layer_groups.some((item) => {
    //   if (item.fid === config['group_id']) {
    //     layers = getAllLayers(item).filter((sub) => {
    //       return sub.featureType === 'point';
    //     });
    //     return true;
    //   }
    //   return false;
    // });
    const defaultValue = config._source === 'json' ? config._data : this.state._data;
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
                <Row className={styles.field} align='middle' key={`Row-${key}`}>
                  <Col flex='auto' className={styles.fieldLabel}>
                    {item.field}
                  </Col>
                  <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                    <Input
                      onChange={this.changeValue}
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
              {dataSourceData.map((item, index) => {
                return (
                  <Option value={item.value} key={`Option-${index}`}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>

            {/* <Radio.Group
              onChange={(evt) => {
                // console.log(evt);
                // console.log('isVariable', evt.target.value);
                this.changeValue(evt.target.value, '_source');
              }}
              value={config['_source']}>
              <Radio className={styles.radioLable} value="variableRef">
                引用
              </Radio>
              <Radio className={styles.radioLable} value="json">
                默认值
              </Radio>
            </Radio.Group> */}
          </Col>
        </Row>

        {/** 设置变量值信息 */}
        {config._source === 'variableRef' && <VariableRef {...props} />}

        {(config._source === 'cim' || config._source === 'gispublic') && (
          <>
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                选择数据
              </Col>
              <Col
                flex='206px'
                className={`${styles.fieldInput} ${styles.antdFieldInput}`}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <TreeSelect
                  showSearch={true}
                  filterTreeNode={this.filterTreeNode}
                  defaultValue={config.group_id}
                  placeholder='请选择'
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  popupClassName='custom-tree-select'
                  style={{ width: '95px' }}
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
                <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  placeholder='请选择'
                  style={{ width: '95px' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  value={config.relation_layer_code}
                  onChange={(v, other) => {
                    this.changeValue(v, 'relation_layer_code');
                    this.setState({ setLayer: v });
                    this.getLayerCodeData(v);
                    this.changeApiLayerParams('layerType', other.layerType);
                  }}
                >
                  {layers.map((item, index) => {
                    return (
                      <Option value={item.layerCode} layerType={item.layerType} key={`Option-${index}`}>
                        {item.layerName}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
            </Row>

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

        {map2Dflag && apiParamVar.layerType.includes('API') && config._source === 'gispublic' && (
          <>
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                <span className='margin-right-8'>api请求参数</span>
                <Tooltip title="api图层的请求参数，格式{type:'', field:''}">
                  <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                </Tooltip>
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
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
              </Col>
            </Row>
            {apiParamVar.type === 'default' && (
              <Row className={styles.field} align='middle'>
                <LargeEdit
                  value={apiParamVar.defaultValue}
                  container={() => document.querySelector('#app')}
                  onChange={(evt) => {
                    this.changeApiLayerParams('defaultValue', evt);
                    pageTreeStore.setPageInfoStep(1);
                  }}
                />
              </Row>
            )}
            {apiParamVar.type === 'variableRef' && <VariableRef {...apiParamVarProps} />}
          </>
        )}

        {/* {config._source == 'variableRef' && (
          <React.Fragment>
            <div className="yl-comp-text-field">
              <div className="yl-comp-field-label">变量</div>
              <div
                className="yl-comp-field-content"
                style={{ flexWrap: 'nowrap' }}>
                <TreeSelect
                  value={config['_variable']}
                  onChange={(val) => {
                    this.changeValue(val, '_variable');
                  }}
                  showCheckedStrategy="TreeSelect.SHOW_ALL"
                  className="yl-comp-field-content row">
                  {this.renderNode(window.dataStore)}
                </TreeSelect>
                <a
                  style={{ marginLeft: '5px' }}
                  onClick={(value) => {
                    this.setState(({ visible }) => ({
                      visible: !visible
                    }));
                  }}>
                  <img src={add} />
                </a>
              </div>
            </div>
          </React.Fragment>
        )} */}

        {/* {config._source == 'variableRef' && (
          <div className="yl-comp-text-field">
            <div className="yl-comp-field-label">
              表达式
              <Tooltip title="表达式用于对当前变量控制，默认注入值为data，例：data.children。注意：变量表达式设置在编辑页面不一定立即生效，也不会立即监听对应的变量做出值的修改。">
                <QuestionCircleOutlined />
              </Tooltip>
            </div>
            <div className="yl-comp-field-content">
              <Input
                data-field={'_expression'}
                value={config['_expression'] || 'data'}
                onChange={this.changeValue}
                className="yl-comp-field-content row"
              />
            </div>
          </div>
        )}

        {config._source == 'variableRef' && (
          <TestVariable
            label="测试"
            title="预览值"
            variable={config['_variable']}
            expression={config['_expression']}
          />
        )} */}
        {/* 默认数据 */}
        {config._source === 'json' && (
          <>
            {/* <Line className='marginBottom8' /> */}
            <Row className={`${styles.field} margin-top-8`} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                数据响应结果
              </Col>
            </Row>
            <Row className={styles.field} align='middle'>
              <LargeEdit
                onChange={(value) => {
                  config._source === 'json' && this.changeValue(value, '_data');
                }}
                container={() => document.querySelector('#app')}
                value={defaultValue}
              />
            </Row>
          </>
        )}
        {/* <DataManage visible={visible} onClose={this.onClose} type={'1'} /> */}
        {fullScreenVisible && false && <Modal getContainer={false} closeHandler={this.closeFullScreen} />}
      </div>
    );
  }
}
