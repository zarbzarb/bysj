import React, { Component } from 'react';
import { TreeSelect, Row, Col, Radio } from 'antd';
import { inject, observer } from 'mobx-react';
import _, { cloneDeep } from 'lodash';
import LargeEdit from '@/components/commons/LargeEdit';
import { getDataByKey, removeDataToComp, mapDataToComp } from '@/utils/dataStoreUtils';
import { Input, Line, Modal } from '@yl/datai-ui';
import { babelTransform } from '@/utils/utils';
import VariableRef from './VariableRef';
import styles from './index.less';

import DynamicApi from './Dynamic';
import IndicatorApi from './Indicator';
import MapField from './MapField';
import CompatibleTool from './Compatible';
import MapFieldForDefault from './MapFieldForDefault';

const { TreeNode } = TreeSelect;

// const dataSourceData = [
//   { label: '静态json数据', value: 'json' },
//   { label: '变量引用', value: 'variableRef' }
// ];
// 通过映射字段无法归为统一类型处理的组件
const dataiComps = new Set(['MediaImageBasic', 'MediaImageDynamic', 'ChartGauge']);
// 无动态数据源或暂不兼容动态数据源
// 极坐标堆叠柱状图、文字轮播列表、tab切换组、选择面板
const unDynamicComps = new Set(['ChartPictograph', 'TextCarouseltextlist', 'TextTabsGroup', 'TextTabsSelect']);
// 数据系列和映射无关,不处理数据系列和映射的关联关系
// 动态词云、词云、双Y轴条形图
const unSeries = new Set(['DynamicWordcloud', 'TextWordcloud', 'ChartBarDoubleYCapsule', 'ChartPieChart']);

/**
 * 通过记录 objFirstDynamic 和 objIsDynamic 来判断是否有切换过数据面板，是否有切换数据面板后点击过动态数据，
 * 来区分切换数据源到动态数据时，请求接口，切换tab时，走缓存的数据，不请求接口
 */
let objFirstDynamic = {}; // 当前组件key是否有切换过 样式、数据、交互面板中的 数据tab

let objIsDynamic = {}; // 当前组件是否从数据面板中的数据源别的选项点到动态组件过

@inject('editorStore', 'controlStore', 'pageTreeStore')
@observer
export default class DataSource extends Component {
  constructor(props) {
    super(props);

    const el = this.props.data;
    this.CompInstance = this.props.CompInstance;
    const { config, defaultData } = this.CompInstance;

    this.updateMapField('dynamic');
    this.updateMapField('indicator');
    this.updateMapFieldForDefault();

    let dataset = [];
    if (el.isCustomListChild && config.dynamic?.dataFromParent) {
      // v8.5 自定义列表的子组件，直接使用 dynamic.dataFromParent 中的数据（自定义列表传递过来的数据）
      dataset = [...config.dynamic.dataFromParent];
    }

    this.state = {
      fullScreenVisible: false,
      config: {
        ...config,
      },
      defaultData: { ...defaultData },
      sourceType: 'json',
      filters: [],
      _data: [],
      _mockData: config._mockData ? config._mockData : JSON.parse(JSON.stringify(config._data)),
      evenFn: null,
      visible: false,
      dataset, // 请求的数据
    };

    if (!(this.props.data.key in objFirstDynamic)) {
      objFirstDynamic = {
        ...objFirstDynamic,
        [this.props.data.key]: false,
      };
    }
    if (!(this.props.data.key in objIsDynamic)) {
      objIsDynamic = {
        ...objIsDynamic,
        [this.props.data.key]: false,
      };
    }
  }

  // 离开数据面板时，将切换过动态数据的置为false，这样下次进入当前数据面板就不会调用动态数据接口
  componentWillUnmount() {
    objIsDynamic[this.props.data.key] = false;
  }

  onClose = () => {
    const { changeTabsHandler } = this.props.ControlStore;
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

  // 获取动态数据对应 series
  getSeries = () => {
    const el = this.props.data;
    if (el.type === '@yl/datai-com-chart-column-rainbow') {
      // 彩虹柱状图组件需要特殊处理
      const { series } = this.CompInstance.compAttr;
      if (series[0].isSubAble) {
        return [...series, {}];
      }
      return series;
    }
    return (
      this.CompInstance.compAttr.series ||
      this.CompInstance.compAttr.dataSeries ||
      this.CompInstance.compAttr.markLineData ||
      []
    );
  };

  // todo: 这个方法改变数据源的逻辑需要重新好好整理下
  changeValue = (value, field, parentFields = [], index = 0) => {
    if (field === 'dynamic') {
      objFirstDynamic[this.props.data.key] = true;
    }
    // const {
    //   DataMapStore: { apiListDataResources, dataSetsListDataResources }
    // } = this.props;
    const {
      pageTreeStore: { setPageInfoStep },
    } = this.props;

    const { config, defaultData } = this.state;
    const oldConfig = _.cloneDeep(config);

    if (field === '_source') {
      // 没改变数据类型
      if (config[field] === value) {
        return;
      }
      // 数据为变量引用
      if (value === 'variableRef') {
        config._data = [];
      } else if (value === 'json') {
        // 数据为默认json
        config._data = config._mockData;
        defaultData._data = config._mockData;
        this.CompInstance.updateDefaultData(defaultData);
      } else if (value === 'dynamic' || value === 'indicator') {
        config._data = [];
        // 数据为动态数据
        if (CompatibleTool.isXYSChart(this.CompInstance.config)) {
          // 默认的系列数
          const series = this.getSeries();
          const configDynamic = {
            apis: [], // 选择过的api列表
            seriesType: 1, // 系列类型，默认1，2的时候使用dataMap2和dimensionMap2
            dataMap: [
              {
                key: 'x',
                name: 'x轴',
              },
              ...series.map((ser, idx) => {
                return {
                  key: `series${idx}`,
                  name: `系列${idx + 1}`,
                };
              }),
            ],
            dimensionMap: [
              {
                dataMapKey: 'x',
                col: 'x',
                row: [],
              },
              ...series.map((ser, idx) => {
                return {
                  dataMapKey: `series${idx}`,
                  col: `series${idx}`,
                  row: [],
                };
              }),
            ],
            dataMap2: [
              {
                key: 'x',
                name: 'x轴',
              },
              {
                key: 's',
                name: '系列',
              },
              {
                key: 'y',
                name: '值',
              },
            ],
            dimensionMap2: [
              {
                dataMapKey: 'x',
                col: 'x',
                row: [],
              },
              {
                dataMapKey: 's',
                col: 's',
                row: [],
              },
              {
                dataMapKey: 'y',
                col: 'y',
                row: [],
              },
            ],
            reserved: [
              {
                key: 'data-key',
                col: 'x',
                row: [],
                name: '保留值',
              },
            ],
            source: {
              id: '',
              params: [],
              repeat: {
                on: false,
                intervalTime: 60,
              },
            },
          };
          if (!config.dynamic) {
            config.dynamic = { ...configDynamic };
          }
          if (!config.indicator) {
            config.indicator = { ...configDynamic };
          }
        } else if (CompatibleTool.isNVChart(this.CompInstance.config) && !dataiComps.has(this.props.data.englishName)) {
          const configDynamic = {
            apis: [], // 选择过的api列表
            dataMap: [
              {
                key: 'x',
                name: '系列',
              },
              {
                key: 'series0',
                name: '值',
              },
            ],
            dimensionMap: [
              {
                dataMapKey: 'x',
                col: 'x',
                row: [],
              },
              {
                dataMapKey: 'series0',
                col: 'series0',
                row: [],
              },
            ],
            reserved: [
              {
                key: 'data-key',
                col: 'x',
                row: [],
                name: '保留值',
              },
            ],
            source: {
              id: '',
              params: [],
              repeat: {
                on: false,
                intervalTime: 60,
              },
            },
          };
          if (!config.dynamic) {
            config.dynamic = { ...configDynamic };
          }
          if (!config.indicator) {
            config.indicator = { ...configDynamic };
          }
        } else {
          // config.dynamic = {
          //   apis: [], //选择过的api列表
          //   dataMap: [
          //     // {
          //     //   key: 'x',
          //     //   name: '系列'
          //     // },
          //     // {
          //     //   key: 'series0',
          //     //   name: '值'
          //     // }
          //   ],
          //   dimensionMap: [
          //     // {
          //     //   dataMapKey: 'x',
          //     //   col: 'x',
          //     //   row: []
          //     // },
          //     // {
          //     //   dataMapKey: 'series0',
          //     //   col: 'series0',
          //     //   row: []
          //     // }
          //   ],
          //   reserved: [
          //     {
          //       key: 'data-key',
          //       col: 'x',
          //       row: [0, 1, 2, 3, 4, 5],
          //       name: '保留值'
          //     }
          //   ],
          //   source: {
          //     id: '',
          //     params: [],
          //     repeat: {
          //       on: false,
          //       intervalTime: 1000
          //     }
          //   }
          // };
        }
      }
      config._mockData = this.state._mockData;
    }

    if (parentFields.length === 0 || parentFields[0] === undefined) {
      config[field] = value;
      this.setState({
        config: {
          ...config,
          [field]: value,
        },
        defaultData,
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
      config._mockData = value;

      if (this.CompInstance.chart && value.length === 0) {
        this.CompInstance.chart.clear();
      }

      // 更新默认数据
      defaultData._data = cloneDeep(value);
      this.CompInstance.updateDefaultData(defaultData);

      this.CompInstance.syncData(value);
      this.CompInstance.updateConfig(config);
      this.setState({
        config: { ...config },
        _data: value,
        _mockData: value,
        defaultData,
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

    this.CompInstance.regisTransSeriesCb && this.CompInstance.regisTransSeriesCb();

    if (config._source === 'dynamic' || config._source === 'indicator') {
      let compatibleData = [];
      const { dimensionMap } = config[config._source];
      let normaldata = CompatibleTool.dataFieldMapArrayObject(dimensionMap, this.state.dataset);
      console.log('标准格式数据', normaldata);
      const originalData = CompatibleTool.filterDataset(dimensionMap, this.state.dataset);

      if (CompatibleTool.isXYSChart(config)) {
        // x/y/s兼容格式数据
        const dynamic = config[config._source];
        compatibleData =
          dynamic && dynamic.seriesType === 2
            ? CompatibleTool.dataFieldMapArrayObject(dynamic.dimensionMap2, this.state.dataset)
            : CompatibleTool.compatibleXYSFn(normaldata);
      } else if (CompatibleTool.isNVChart(config) && !dataiComps.has(this.props.data.englishName)) {
        // name/value兼容格式数据
        normaldata = this.filterInvalidData(normaldata, originalData);
        compatibleData = CompatibleTool.compatibleNVFn(normaldata);
      } else if (
        config._mockData.every((item) => Array.isArray(item)) // 二维数组
      ) {
        // 嵌套环形图
        compatibleData = CompatibleTool.compatibleDoubleDimensionalArray(normaldata);
      } else if (CompatibleTool.isPolarChart(config)) {
        // 极坐标
        normaldata = this.filterInvalidData(normaldata, originalData);
        compatibleData = CompatibleTool.compatiblePolarChart(normaldata);
      } else if (CompatibleTool.isRadarChart(config)) {
        // 雷达图
        normaldata = this.filterInvalidData(normaldata, originalData);
        compatibleData = CompatibleTool.compatibleRadarChart(normaldata);
      }
      // else if (CompatibleTool.isTreeChart(config)) {
      //   // 兼容矩形树图
      //   compatibleData = CompatibleTool.compatibleTreemapChart(normaldata);
      // }
      else {
        // 数组对象类型(ArrayObject): 新旧数据结构一致、映射字段一致
        compatibleData = normaldata;
      }
      console.log('兼容格式数据', compatibleData);
      this.CompInstance.setOriginalData(originalData); // v8.6 保存接口原始数据

      if (Array.isArray(compatibleData)) {
        if (compatibleData.length === 0 && this.CompInstance && this.CompInstance.chart) {
          this.CompInstance.chart.clear();
        }
        this.CompInstance.setData(compatibleData);
      } else {
        this.CompInstance.setData(compatibleData);
        console.error(this, compatibleData, '依赖的数据格式化后不符合数组格式');
      }
    }

    this.listenData(oldConfig, config);
    setPageInfoStep(1);
    this.props.editorStore.forceUpdateLayout();
  };

  // 去除无x轴的数据
  filterInvalidData = (normaldata, originalData) => {
    const res = [];
    normaldata.forEach((item, index) => {
      if (item.x !== undefined) {
        res.push(item);
      } else {
        originalData.splice(index, 1);
      }
    });
    return res;
  };

  listenData = (oldConfig, config) => {
    if (config._source === 'json' || config._source === 'dynamic' || config._source === 'indicator') return;

    if (
      _.eq(oldConfig._source, config._source) &&
      _.eq(oldConfig._variable, config._variable) &&
      _.eq(oldConfig.variableDataMap, config.variableDataMap)
    ) {
      return;
    }
    const { data: item } = this.props;
    if (typeof item.refresh === 'function') item.refresh();

    this.getData();
  };

  /**
   * 获取变量的数据
   */
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

  renderNode = (children = []) => {
    return children.map((variableGroup) => {
      return (
        <TreeNode disabled key={variableGroup.key} value={variableGroup.key} title={variableGroup.name}>
          {variableGroup.children &&
            variableGroup.children.map((variable) => {
              return <TreeNode key={variable.key} value={variable.key} title={variable.name} />;
            })}
        </TreeNode>
      );
    });
  };

  syncData = () => {
    this.CompInstance && this.CompInstance.asyncData(null, (rs) => {});
  };
  // showModalEdit = () => {
  //   this.props.DataMapStore.showModal();
  // };

  updateDynamicData = (dataset, setting, field = 'dynamic') => {
    this.setState(
      {
        dataset,
      },
      () => {
        this.changeValue(setting, field);
      },
    );
  };

  // 通过系列更新映射
  updateMapField(source = 'dynamic') {
    if (!this.CompInstance.config[source]) return;
    if (unSeries.has(this.props.data.englishName)) return;
    const { config } = this.CompInstance;
    const series = this.getSeries();
    if (!Array.isArray(series) || series.length === 0) return;
    config[source] = {
      ...config[source],
      dataMap: [
        {
          key: 'x',
          name: 'x轴',
        },
        ...series.map((ser, idx) => {
          return {
            key: config[source].dataMap[idx + 1]?.key ?? `series${idx}`,
            name: config[source].dataMap[idx + 1]?.name ?? `系列${idx + 1}`,
          };
        }),
      ],
      dimensionMap: [
        config[source].dimensionMap[0], // x轴
        ...series.map((ser, idx) => {
          return {
            dataMapKey: `series${idx}`,
            col: config[source].dimensionMap[idx + 1]?.col ?? `series${idx}`,
            row: config[source].dimensionMap[idx + 1]?.row ?? [],
          };
        }),
      ],
    };
  }

  // 更新静态数据源的映射关系
  updateMapFieldForDefault() {
    const { config } = this.CompInstance;

    if (CompatibleTool.isXYSChart(config)) {
      const { _dataMap } = config;
      const { series } = this.CompInstance.compAttr;

      // 新增 _dataMap 字段，并根据“系列"个数，自动更新配置项条数
      const dataMap = [];
      if (_dataMap) {
        dataMap.push({
          name: 'x轴',
          field: 'x',
          mapField: _dataMap[0].mapField || 'x',
          row: _dataMap[0].row || [],
          state: true,
        });
      } else {
        dataMap.push({ name: 'x轴', field: 'x', mapField: 'x', row: [], state: true });
      }
      if (Array.isArray(series)) {
        for (const [i, element] of series.entries()) {
          if (_dataMap) {
            dataMap.push({
              name: `系列${i + 1}`,
              field: `series${i}`,
              mapField: _dataMap[i + 1]?.mapField || element.serieName || '',
              row: _dataMap[i + 1]?.row || [],
              state: true,
            });
          } else {
            dataMap.push({
              name: `系列${i + 1}`,
              field: `series${i}`,
              mapField: element.serieName || '',
              row: [],
              state: true,
            });
          }
        }
      }
      config._dataMap = dataMap;
    }
  }

  render() {
    const { config, visible, dataset, defaultData, fullScreenVisible } = this.state;
    const el = this.props.data;
    const isCustomListChild = el.isCustomListChild && config.dynamic?.dataFromParent;

    const props = {
      styles,
      config,
      changeValue: this.changeValue,
    };

    // const defaultValue = config._source === 'json' ? config._data : this.state._data;
    const defaultValue = config._source === 'json' ? defaultData._data : this.state._data;
    const showIndicator = window.sessionStorage.getItem('showIndicator') === 'true';
    return (
      <div className='yl-comp-config antd-dark '>
        {/* {this.props.children} */}
        <Line className='marginBottom8 marginTop4' />
        {/* <Row className={styles.field + ' margin-top-8'} align="middle">
          <Col flex="auto" className={styles.fieldLabel}>
            数据源
          </Col>
        </Row> */}
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel} style={{ paddingLeft: '12px' }}>
            数据源
          </Col>
          <Col className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Radio.Group
              size='small'
              onChange={(evt) => {
                objIsDynamic[this.props.data.key] = evt.target.value === 'dynamic';
                this.changeValue(evt.target.value, '_source');
              }}
              value={config._source}
            >
              <Radio className={styles.radioLable} value='json'>
                静态
              </Radio>
              {/* v7.8.0 新增动态数据 */}
              {/* unDynamicComps 无动态数据源组件  */}
              {!unDynamicComps.has(this.props.data.englishName) && (
                <Radio className={styles.radioLable} value='dynamic'>
                  {isCustomListChild ? '父组件数据' : '动态'}
                </Radio>
              )}
              <Radio className={styles.radioLable} value='variableRef'>
                变量
              </Radio>
              {/* v7.11 新增指标数据 */}
              {/* unDynamicComps 无动态数据源组件  */}
              {!unDynamicComps.has(this.props.data.englishName) && showIndicator && !isCustomListChild && (
                <Radio className={styles.radioLable} value='indicator'>
                  指标
                </Radio>
              )}
            </Radio.Group>
          </Col>
        </Row>

        {/** 设置变量值信息 */}
        {config._source === 'variableRef' && <VariableRef {...props} />}

        {config._source === 'json' && (
          <>
            {/* <Line className="marginBottom8" /> */}
            <div className='yl-comp-text-field row'>
              <div className='yl-comp-field-label'>数据响应结果</div>
            </div>
            <div className='yl-comp-text-field'>
              <LargeEdit
                container={() => document.querySelector('#app')}
                onChange={(value) => {
                  config._source === 'json' && this.changeValue(value, '_data');
                }}
                value={defaultValue}
              />
            </div>
          </>
        )}

        {config._source === 'dynamic' && config.dynamic && (
          <>
            {!isCustomListChild && (
              <DynamicApi
                comName={this.props.comName}
                config={config}
                dataset={dataset}
                updateDynamicData={this.updateDynamicData}
                isDynamic={objIsDynamic[this.props.data.key]}
                firstDynamic={objFirstDynamic[this.props.data.key]}
                elKey={this.props.data.key}
                compInstance={this.props.CompInstance}
                englishName={this.props.data.englishName}
              />
            )}
            <MapField key='dynamic' config={config} dataset={dataset} updateDynamicData={this.updateDynamicData} />
          </>
        )}

        {config._source === 'indicator' && config.indicator && (
          <>
            <IndicatorApi
              compInstance={this.props.CompInstance}
              englishName={this.props.data.englishName}
              comName={this.props.comName}
              config={config}
              dataset={dataset}
              updateDynamicData={this.updateDynamicData}
            />
            <MapField
              key='indicator'
              config={config}
              dataset={dataset}
              updateDynamicData={this.updateDynamicData}
              isIndicator={true}
            />
          </>
        )}

        {config._source !== 'dynamic' && config._source !== 'indicator' && (
          <MapFieldForDefault
            config={config}
            category={config._source}
            defaultValue={defaultValue}
            changeValue={this.changeValue}
            CompInstance={this.CompInstance}
            englishName={this.props.data.englishName}
          />
        )}

        {fullScreenVisible && false && <Modal getContainer={false} closeHandler={this.closeFullScreen} />}
      </div>
    );
  }
}
