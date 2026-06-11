import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { TreeSelect, Row, Col, Select } from 'antd';
import { get } from '@/services/xhr/fetch';
import { getAllLayers, getCurrentGroup, renderGroupNode } from '@/utils/gisCommonUtils';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { encode } from 'js-base64';

import styles from './index.less';

const { Option } = Select;
@inject('pageTreeStore')
@observer
export default class DataSource extends Component {
  constructor(props) {
    super(props);
    this.CompInstance = this.props.CompInstance;
    const { compAttr, config } = this.props.CompInstance;
    this.state = {
      config: {
        ...config,
      },
      sourceGIS: [], // 时空地理图层列表
      dataSourceData: [], // 数据源选项列表
      regionsData: [], // 行政区域树
      regionListLoaded: false, // 行政区域资源加载完成
      adcode: compAttr.adcode, // 选中行政区域
    };
  }

  /**
   * useEffect
   */
  componentDidMount() {
    // 加载行政区划
    this.loadRegions();
    /** 添加时空数据 gispublic 默认数据为default */
    const { timeAndSpace } = window.screenConfig.environment;
    const dataSourceData = [{ label: '内置数据', value: 'default' }];
    if (timeAndSpace) {
      dataSourceData.push({
        label: '时空数据',
        value: 'gispublic',
      });
      this.loadLayers();
    }
    this.setState({ dataSourceData });
  }

  /**
   * 设置config数据
   * @param {*} value
   * @param {*} field
   * @param {*} parentFields
   * @param {*} index
   */
  changeValue = (value, field, parentFields = [], index = -1) => {
    const { pageTreeStore } = this.props;
    pageTreeStore.setPageInfoStep(1);
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
    // 添加引用关系
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

  /**
   * 请求时空地理图层列表
   */
  async loadLayers() {
    const data = await get('/gis-platform/gispublic/groups/getAll');
    if (data && data.result) {
      this.setState({
        sourceGIS: data.result,
      });
    }
  }

  /**
   * 获取所有行政区划
   * @param {*} regionName 有值获取对应值，无值获取全国
   */
  async loadRegions(regionName) {
    try {
      const cqlfilter = regionName ? `name like '%${regionName}%'` : '1=1';
      window.YunliMap.getFeatureByFilter({
        layerCode: 't_gis_area',
        cqlFilterEncrypt: encode(cqlfilter), // 广东需求，安全性处理
        needPolygon: false,
        callback: (data) => {
          this.setState({
            regionListLoaded: true, // 加载行政区域完成
            regionsData: data.map(({ props: { adcode, padcode, name, has_child: hasChild } }) => ({
              id: adcode,
              pId: padcode,
              value: adcode,
              title: name,
              isLeaf: hasChild === 0,
            })),
          });
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

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
    const { CompInstance, pageTreeStore } = this.props;
    const { config, sourceGIS, dataSourceData, regionsData, regionListLoaded, adcode } = this.state;
    // 当前数据源类型
    const { _source: configSource = 'default', group_id: configGroupId } = config;
    const featureType = ['polygon'];
    let layerGroups = [];
    let layers = [];
    // 获取时空地理列表
    if (configSource === 'cim' || configSource === 'gispublic') {
      layerGroups = sourceGIS;
    }
    // 获取当前组的所有图层，并过滤出面图层
    const group = getCurrentGroup(layerGroups, configGroupId);
    if (group) {
      layers = getAllLayers(group).filter((sub) => {
        return !featureType || featureType.includes(sub.featureType);
      });
    }
    return (
      <>
        <Row className={styles.field} align='middle'>
          {/* v8.12 添加数据源支持 */}
          <Col flex='auto' className={styles.fieldLabel}>
            数据源选择
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Select
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              placeholder='请选择'
              style={{ width: '100%' }}
              value={configSource}
              onChange={(v) => {
                this.changeValue(v, '_source');
                this.changeValue(undefined, 'group_id');
                this.changeValue(undefined, 'relation_layer_code');
              }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {dataSourceData.map((item) => {
                return (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>
        {configSource === 'default' && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              选择行政区划
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <TreeSelect
                style={{ width: '100%' }}
                treeDataSimpleMode
                showSearch
                value={regionListLoaded ? adcode : '加载中...'}
                treeNodeFilterProp='title'
                placeholder='请选择行政区划'
                onChange={(val) => {
                  CompInstance.mergeAttr({
                    adcode: val,
                  });
                  this.setState({
                    adcode: val,
                  });
                  pageTreeStore.setPageInfoStep(1);
                }}
                treeData={regionsData}
                // className='yl-comp-field-content row'
              />
            </Col>
          </Row>
        )}
        {(configSource === 'cim' || configSource === 'gispublic') && (
          <>
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                选择数据
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`} style={{ display: 'flex' }}>
                <div className='col' style={{ width: '93px' }}>
                  <TreeSelect
                    suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                    showSearch={true}
                    filterTreeNode={this.filterTreeNode}
                    defaultValue={configGroupId}
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
                    {renderGroupNode(layerGroups)}
                  </TreeSelect>
                </div>
                <div className='col' style={{ width: '93px' }}>
                  <Select
                    suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                    showSearch={true}
                    filterOption={this.filterOption}
                    placeholder='请选择'
                    style={{ width: '100%' }}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    value={config.relation_layer_code}
                    onChange={(v) => {
                      this.changeValue(v, 'relation_layer_code');
                    }}
                  >
                    {layers.map((item) => {
                      return (
                        <Option key={item.layerCode} value={item.layerCode} layerType={item.layerType}>
                          {item.layerName}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </Col>
            </Row>
          </>
        )}
      </>
    );
  }
}
