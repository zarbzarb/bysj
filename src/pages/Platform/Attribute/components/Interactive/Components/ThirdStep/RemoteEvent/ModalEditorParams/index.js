import React, { useState, useEffect, useRef } from 'react';
import { Modal, Table, Select, Input, Row, Col, message } from 'antd';
import shortId from 'short-uuid';
import _ from 'lodash';
import { toJS } from 'mobx';
import { useStore } from '@/hooks';
import StoreTree from '@/components/StoreTree';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { getDataiBasicChartType, passCurrentValueComps, compDataOptions } from '@/utils/common';
import iconBtnSuccess from '@/assets/newIcon/dataSource/btn_sucess.png';
import iconBtnWarn from '@/assets/newIcon/dataSource/btn_warn.png';
import { compatibleChartDynamic } from '../../RefreshDataSource/util';
import ModalDataSwitch from '../../../Common/ModalDataSwitch';
import { getOriginalDataFields, groupDataItemOptions } from '../../utils';
import {
  unDynamicComps,
  noDataSourceConfigComps,
  interactivelyPassInValue,
  customOptinsComps,
} from '../../../Common/common';
import CompTree from '../CompTree';
import styles from '../index.less';

const getComponent = window.DataI.getComponentByKey;

const initUpdateTypeOptions = [
  { label: '手动输入', value: 1 },
  { label: '组件数据', value: 2 },
  { label: '变量', value: 3 },
  // { label: '交互传入值', value: 4 },
];

// v8.5.1 添加选项
const selectedValueOptions = [
  { label: '当前选中值', value: 1 },
  { label: '默认数据', value: 0 },
];

const initParam = {
  key: shortId.generate(),
  // 参数项
  paramType: '',
  paramItemId: undefined,
  paramName: '',
  // 更新方式
  updateType: 1,
  // 手动输入的值
  inputVal: undefined,
  // 选择的组件
  compKey: undefined,
  // 是否当前选中值
  isSelected: 1,
  // 组件选中的数据项
  compDataItem: undefined,
  // 组件数据项列表
  compDataItemOptions: [],
  // 交互传入值
  interactDataItem: undefined,
  // 交互传入值选项列表
  interactDataItemOptions: [],
  // 变量
  variableKey: undefined,
  // 是否数据格式转换 0：不需要转，1：旧格式需要转，2： 转后正确
  dataSwitch: 0,
  dataSwitchContent: {
    code: `//请将返回值以retun方式返回
return ""`,
    dimensionMap: [],
  },
};

const Index = (props) => {
  const { visible, onOk, onCancel, comp, action, eventSetting } = props;
  const { globalStore } = useStore();
  const switchComp = useRef();
  const [updateTypeOptions, setUpdateTypeOptions] = useState(initUpdateTypeOptions);
  const [params, setParams] = useState([_.cloneDeep(initParam)]); // 默认有一条空的
  const [paramItemTreeData, setParamItemTreeData] = useState([{ label: '选中值', value: 'changeValue' }]);
  const [switchVisible, setSwitchVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState({});

  // 添加交互传入值
  const changeUpdateTypeOptions = () => {
    interactivelyPassInValue(comp, eventSetting.eventType, () => {
      const newArr = [...initUpdateTypeOptions];
      let labelName = '选中值';
      if (comp.type === 'Input' || comp.type === 'NewInput') {
        labelName = '输入值';
      }
      newArr.push({ label: labelName, value: 4 });
      setUpdateTypeOptions(newArr);
    });
  };

  const okHandler = () => {
    onOk(params);
  };

  // 获取组件、交互传入项数据项
  const _getCompDataItemOptions = (selectedComp, item) => {
    console.log(selectedComp, 'selectedComp');
    const v = selectedComp;
    let options = [];
    if (
      item.updateType === 4 && // 特殊事件
      eventSetting.eventType === 'clickLegend'
    ) {
      // 单击图例
      options = [{ label: '图例名称', value: 'value' }];
    } else if (customOptinsComps[v.type]) {
      // 如果特殊组件
      const myOptions = customOptinsComps[v.type];
      if (v.type === 'DatePicker') {
        // 时间选择器
        return v.props.isRangePicker ? myOptions[1] : myOptions[0];
      }
      return myOptions;
    } else if (v.type === 'Table') {
      options = compDataOptions(v.key, 'mapField'); // 监听事件使用 mapField, 方便复用更新数据交互设置数据项值逻辑
    } else {
      options = compDataOptions(v.key);
    }
    console.log('options==>', options);
    return options;
    // console.log(selectedComp, 'selectedComp');
    // let options = [];
    // const v = selectedComp;
    // let selectedDynamic;
    // let dataset;
    // let category;
    // let defaultData;
    // let defaultValue;

    // if (v.type === 'LayerLegend') {
    //   // 图层图例
    //   options = v.props.dataSourceSet.dynamic.dataMap.map((temp) => ({
    //     label: temp.name,
    //     value: temp.key,
    //   }));
    //   return options;
    // }

    // if (v && v.classType === 'antd' && v.dataset) {
    //   dataset = v.dataset;
    //   defaultValue = dataset.defaultValue;
    //   if (dataset.dynamic) {
    //     // 存在说明有动态数据，静态数据也使用动态数据的数据项（统一这样取值的时候方便些）
    //     category = dataset.category;
    //     selectedDynamic = dataset.dynamic;
    //   } else {
    //     category = dataset.isVariable ? 'variableRef' : 'json';
    //   }
    // }
    // if (v && v.classType === 'com' && v.instance?.config) {
    //   compatibleChartDynamic(v.instance?.config, v.instance, v); // datai 默认没有（选中动态数据才有）所以需要初始化 dynamic
    //   dataset = v.instance.config;
    //   defaultValue = dataset._data || dataset._mockData;
    //   category = dataset._source;
    //   if (!unDynamicComps.has(v.englishName) && dataset.dynamic) {
    //     // 存在说明有动态数据，静态数据也使用动态数据的数据项（统一这样取值的时候方便些）
    //     selectedDynamic = dataset.dynamic;
    //   }
    // }

    // if (dataset) {
    //   if (category === 'json') {
    //     defaultData = defaultValue;
    //   } else if (category === 'variableRef') {
    //     defaultData = getDataByKey(dataset.variable || dataset._variable);
    //   }
    // }
    // if (
    //   item.updateType === 4 && // 特殊事件
    //   eventSetting.eventType === 'clickLegend'
    // ) {
    //   // 单击图例
    //   return [{ label: '图例名称', value: 'value' }];
    // }

    // // else if (!hasVariableEvents.includes(eventSetting.eventType)) { // 没有绑定变量的事件无交互传入数据项
    // //   return [];
    // // }
    // // 如果特殊组件
    // if (customOptinsComps[v.type]) {
    //   const myOptions = customOptinsComps[v.type];
    //   if (v.type === 'DatePicker') {
    //     // 时间选择器
    //     return v.props.isRangePicker ? myOptions[1] : myOptions[0];
    //   }
    //   return myOptions;
    // }
    // if (selectedDynamic) {
    //   if (category !== 'dynamic' && category !== 'indicator' && !Array.isArray(defaultData)) {
    //     // 旧格式需要转换
    //     item.dataSwitch = 1;
    //     switchComp.current = v;
    //   } else {
    //     item.dataSwitch = 0;
    //     // 有动态数据源类型的组件(不一定选中动态数据)使用动态数据的属性项(数据项)
    //     // if (selectedDynamic.seriesType === 2) {
    //     //   const { compAttr, config } = v.instance;
    //     //   // eslint-disable-next-line unicorn/prefer-set-has
    //     //   const realSeries = config._data.map((d) => d.s);
    //     //   options.push({ label: 'x轴', value: 'x' });
    //     //   compAttr.series.forEach((s, i) => {
    //     //     // if (s.serieName && realSeries.includes(s.serieName)) {
    //     //     options.push({
    //     //       label: `系列${i + 1}`,
    //     //       value: s.serieName,
    //     //     });
    //     //     // }
    //     //   });
    //     //   console.log(options, 'options');
    //     // } else
    //     options = optionsFn(v, selectedDynamic, item.updateType);
    //     if (
    //       item.updateType === 4 &&
    //       v.classType === 'com' &&
    //       getDataiBasicChartType({ englishName: v.englishName }).isBarChart && // 条形图表交互传入值没存 x 轴数据，需过滤掉
    //       options.length > 0 &&
    //       options[0].label === 'x轴'
    //     ) {
    //       options.shift();
    //     }
    //     return options;
    //   }
    // } else {
    //   // 无动态数据，即默认值或变量或无数据源
    //   // 1、无数据源的组件没有数据项
    //   if (
    //     Array.isArray(defaultValue) &&
    //     (defaultValue.length === 0 || Object.keys(defaultValue[0]).length === 0 || noDataSourceConfigComps.has(v.type))
    //   ) {
    //     return [];
    //   }
    //   // 2、默认值或变量则使用默认值的属性项
    //   if (Array.isArray(defaultValue) && defaultValue[0] && Object.keys(defaultValue[0]).length > 0) {
    //     // options = Object.keys(defaultValue[0]).map((d) => ({
    //     //   label: d,
    //     //   value: d,
    //     // }));
    //     if (v.classType === 'com') {
    //       options = v.instance?.config._api.map((temp) => ({
    //         label: temp.name,
    //         value: temp.mapField,
    //       }));
    //     } else if (v.classType === 'antd') {
    //       if (v.type === 'Calendar') {
    //         // 日历卡片
    //         const keys = Object.keys(v.dataset.defaultValue[0]);
    //         options = keys.map((key) => ({
    //           label: key,
    //           value: key,
    //         }));
    //         return options;
    //       }
    //       options = v.dataset._api.map((temp) => ({
    //         label: temp.name,
    //         value: temp.mapField,
    //       }));
    //     }
    //     console.log(options, 'options');
    //     return options;
    //   }
    //   if (!Array.isArray(defaultData)) {
    //     // 没有动态数据且是旧格式的组件没有
    //     console.warn('没有动态数据且是旧格式的组件不支持');
    //   }
    // }
    // return [];
  };

  const getCompDataItemOptions = (selectedComp, item, isInteraction = false) => {
    const options = _getCompDataItemOptions(selectedComp, item);
    // 点击图例和嵌套环形图，交互传入值，不展示接口数据字段
    const ignoreOriginalOptions =
      (isInteraction && eventSetting.eventType === 'clickLegend') ||
      (isInteraction && comp.englishName === 'ChartNestRing');
    if (ignoreOriginalOptions) return options;
    const originalOptions = getOriginalDataFields(selectedComp, toJS(globalStore.screenConfig));
    return [...options, ...originalOptions];
  };

  // 选择更新方式
  const updateTypeChange = (val, item) => {
    item.updateType = val;
    item.compKey = undefined;
    item.compDataItem = undefined;
    item.compDataItemOptions = [];
    item.dataSwitch = 0;
    item.dataSwitchContent = {
      code: `//请将返回值以retun方式返回
return ""`,
      dimensionMap: [],
    };
    if (val === 4) {
      const options = getCompDataItemOptions(comp, item, true);
      item.interactDataItemOptions = options;
    }
    setParams([...params]);
  };

  // 手动输入
  const inputChange = (e, item) => {
    const { value } = e.target;
    item.inputVal = value;
    setParams([...params]);
  };

  // 选择组件
  const changeRefComp = (val, item) => {
    item.compKey = val;
    item.dataSwitch = 0;
    item.dataSwitchContent = {
      code: `//请将返回值以retun方式返回
return ""`,
      dimensionMap: [],
    };
    const selectedComp = getComponent(val);
    const options = getCompDataItemOptions(selectedComp, item);
    console.log(options, 'options');
    item.compDataItemOptions = options;
    // v8.5.1 添加当前选中值选项；
    item.isSelected = 1;
    item.compDataItem = undefined;
    setParams([...params]);
  };

  // v8.5.1 选择是否当前选中值
  const compIsSelectedChange = (val, item) => {
    item.isSelected = val;
    setParams([...params]);
  };

  // 选择组件数据
  const compDataItemChange = (val, item) => {
    item.compDataItem = val;
    setParams([...params]);
  };

  // 选择交互区域值
  const interactDataItemChange = (val, item) => {
    item.interactDataItem = val;
    setParams([...params]);
  };

  // 选择变量
  const changeVariable = (val, item) => {
    item.variableKey = val;
    setParams([...params]);
  };

  const showDataSwitch = (item) => {
    if (!switchComp.current) {
      switchComp.current = item.updateType === 2 && item.compKey ? getComponent(item.compKey) : comp;
    }
    setSwitchVisible(true);
    setCurrentItem(item);
  };

  const cancelDataSwitch = () => {
    setSwitchVisible(false);
  };

  const confirmDataSwitch = (codeData, param, dynamic) => {
    let options = [];
    if (Array.isArray(codeData)) {
      options = dynamic.dataMap.map((d) => ({
        label: d.name,
        value: d.key,
      }));
    }
    if (param.updateType === 2) {
      param.compDataItemOptions = options;
    } else if (param.updateType === 4) {
      param.interactDataItemOptions = options;
    }
    setSwitchVisible(false);
  };

  const getPopupContainer = () => document.querySelector('.edit-container');

  useEffect(() => {
    if (visible) {
      changeUpdateTypeOptions();
      if (action.actionSettings.dataParams?.length) {
        const oldParams = action.actionSettings.dataParams;
        // 再次打开弹窗时，更新组件数据和交互传入值可选项
        if (oldParams[0].updateType === 2 && oldParams[0].compKey) {
          const selectedComp = getComponent(oldParams[0].compKey);
          console.log(selectedComp, 'selectedComp', oldParams);
          if (selectedComp) {
            const options = getCompDataItemOptions(selectedComp, oldParams[0]);
            // console.log(options, 'options');
            oldParams[0].compDataItemOptions = options;
            const index = options.findIndex((item) => oldParams[0].compDataItem === item.value);
            if (index === -1) {
              oldParams[0].compDataItem = '';
            }
          } else {
            oldParams[0].compKey = undefined;
            oldParams[0].compDataItem = undefined;
            oldParams[0].compDataItemOptions = [];
          }
        } else if (oldParams[0].updateType === 4) {
          const options = getCompDataItemOptions(comp, oldParams[0], true);
          oldParams[0].interactDataItemOptions = options;
          const index = options.findIndex((item) => oldParams[0].interactDataItem === item.value);
          if (index === -1) {
            oldParams[0].interactDataItem = '';
          }
        }

        setParams([...oldParams]);
      }
    }
  }, [visible, action]);

  const columns = [
    {
      title: '数据项',
      width: 200,
      render: (text, item, i) => {
        return (
          <div style={{ display: 'flex' }}>
            {text.required && <span style={{ color: '#ff4d4f', paddingTop: '8px' }}>*</span>}
            <Select
              getPopupContainer={getPopupContainer}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 250, overflow: 'auto' }}
              value='changeValue'
              options={paramItemTreeData}
            />
          </div>
        );
      },
    },
    {
      title: '数据来源',
      width: 500,
      render: (text, item, i) => {
        // v8.5.1 添加是否显示当前选中值选项判断条件
        let hasType = false;
        if (item.compKey) {
          const selectedComp = getComponent(item.compKey);
          if (selectedComp) {
            hasType = passCurrentValueComps.has(selectedComp.type);
          }
        }
        return (
          <Row>
            <Col span={7}>
              <Select
                placeholder='请选择更新方式'
                getPopupContainer={getPopupContainer}
                style={{
                  width: 150,
                }}
                value={item.updateType}
                onChange={(val) => updateTypeChange(val, item)}
                options={updateTypeOptions}
              />
            </Col>
            <Col span={17} style={{ left: 2 }}>
              {item.updateType === 1 && (
                <Input
                  placeholder='请输入更改数据'
                  style={{ height: '100%' }}
                  value={item.inputVal}
                  onChange={(val) => inputChange(val, item)}
                />
              )}
              {item.updateType === 2 && (
                <Row>
                  <Col span={10}>
                    <CompTree
                      // customComps={customComps}
                      comp={comp}
                      type='compData' // 不能选择图层和组
                      relation={item.compKey}
                      onTreeChange={(val) => changeRefComp(val, item)}
                      getPopupContainer={getPopupContainer}
                    />
                  </Col>
                  <Col span={14}>
                    {/* v8.5.1 添加是否当前选中值 */}
                    {hasType && (
                      <Select
                        placeholder=''
                        getPopupContainer={getPopupContainer}
                        style={{
                          marginLeft: 2,
                          width: 106,
                        }}
                        value={item.isSelected !== undefined ? item.isSelected : 1}
                        onChange={(val) => compIsSelectedChange(val, item)}
                        options={selectedValueOptions}
                      />
                    )}
                    <Select
                      placeholder='请选择组件的数据'
                      getPopupContainer={getPopupContainer}
                      style={{
                        marginLeft: 2,
                        width: hasType ? 106 : 216,
                      }}
                      value={item.compDataItem}
                      onChange={(val) => compDataItemChange(val, item)}
                      options={groupDataItemOptions(item.compDataItemOptions)}
                    />
                    {item.dataSwitch > 0 ? (
                      <img
                        className={styles.switchIcon}
                        src={item.dataSwitch === 1 ? iconBtnWarn : iconBtnSuccess}
                        onClick={() => showDataSwitch(item)}
                        alt=''
                      />
                    ) : null}
                  </Col>
                </Row>
              )}
              {item.updateType === 3 && (
                <StoreTree
                  value={item.variableKey}
                  onChange={(val) => changeVariable(val, item)}
                  getPopupContainer={getPopupContainer}
                />
              )}
              {item.updateType === 4 && (
                <>
                  <Select
                    placeholder='请选择交互区域的值'
                    getPopupContainer={getPopupContainer}
                    style={{
                      width: '320px',
                    }}
                    // dropdownStyle={{
                    //   maxHeight: 200,
                    // }}
                    value={item.interactDataItem}
                    onChange={(val) => interactDataItemChange(val, item)}
                    options={groupDataItemOptions(item.interactDataItemOptions)}
                  />
                  {item.dataSwitch > 0 ? (
                    <img
                      className={styles.switchIcon}
                      src={item.dataSwitch === 1 ? iconBtnWarn : iconBtnSuccess}
                      onClick={() => showDataSwitch(item)}
                      alt=''
                    />
                  ) : null}
                </>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  return (
    <Modal
      className='antd-dark'
      getContainer={getPopupContainer}
      maskClosable={false}
      title='编辑参数'
      width={900}
      open={visible}
      onOk={okHandler}
      onCancel={onCancel}
    >
      <Table
        className={styles.editorParamsTable}
        pagination={false}
        dataSource={params}
        columns={columns}
        scroll={params.length > 8 ? { y: 320 } : null}
        bordered
      />
      {switchVisible && (
        <ModalDataSwitch
          visible={switchVisible}
          param={currentItem}
          comp={switchComp.current}
          onOk={confirmDataSwitch}
          onCancel={cancelDataSwitch}
        />
      )}
    </Modal>
  );
};

export default Index;
