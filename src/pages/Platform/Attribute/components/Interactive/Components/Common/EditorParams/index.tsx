/**
 * 编辑参数：注入数据或者传数据出去
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Table, Modal, Row, Col, Select, Input, Tooltip } from 'antd';
import { cloneDeep } from 'lodash';
import shortId from 'short-uuid';
import { toJS } from 'mobx';
import classNames from 'classnames';
// import { observer } from 'mobx-react';
import { paramType } from '@/types/platform/attribute';
import { useStore } from '@/hooks';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { passCurrentValueComps, compDataOptions } from '@/utils/common';
import iconBtnAdd from '@/assets/newIcon/dataSource/btn_add.png';
import iconBtnDel from '@/assets/newIcon/dataSource/btn_delete.png';
import iconBtnSuccess from '@/assets/newIcon/dataSource/btn_sucess.png';
import iconBtnWarn from '@/assets/newIcon/dataSource/btn_warn.png';
import successIcon from '@/assets/icon/success.png';
import StoreTree from '@/components/StoreTree';
import { variablesText } from '@/staticJson/MapBasic';
import { QuestionCircleOutlined } from '@ant-design/icons';
import CompTree from '../../ThirdStep/components/CompTree';
import { compatibleChartDynamic, getMapOptions } from '../../ThirdStep/RefreshDataSource/util';
import { getOriginalDataFields, groupDataItemOptions } from '../../ThirdStep/utils';

import {
  unDynamicComps,
  customOptinsComps,
  noDataSourceConfigComps,
  interactivelyPassInValue,
  getInitParam,
} from '../common';
import ModalDataSwitch from '../ModalDataSwitch';
import VariableModal from '../VariableModal';
import styles from './index.less';

// const { confirm } = Modal;

const getComponent = window.DataI.getComponentByKey;

type IProps = {
  initParams: paramType[]; // 参数列表数据
  paramOptions?: { label: string; value: string | number; disabled?: boolean }[]; // 参数项下拉列表
  editorType?: string; // get-表示数据来源获取值，set-表示数据目标设置值
  filterUpdateType?: number[]; // 过滤 updateType 列表
  onOk: (p: paramType[], t: string) => void;
  className?: string;
  comp: any;
  eventSetting: any;
  showVariableExpression?: boolean; // 是否显示变量表达式开关
  callFrom?: string;
  layerKeys: any; // 图层key
  action: any;
};

const initUpdateTypeOptions = [
  { label: '手动输入', value: 1 },
  { label: '组件数据', value: 2 },
  { label: '变量', value: 3 },
];
const initAllOptions = [{ label: '变量', value: 3 }];

// v8.5.1 添加选项
const selectedValueOptions = [
  { label: '当前选中值', value: 1 },
  { label: '默认数据', value: 0 },
];

const Index: React.FC<IProps> = (props) => {
  const {
    className,
    initParams,
    paramOptions,
    onOk,
    editorType = 'get',
    comp,
    eventSetting,
    filterUpdateType,
    showVariableExpression = true,
    callFrom,
    layerKeys,
    action,
  } = props;
  const { globalStore } = useStore();
  const switchComp = useRef();
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState([]); // 加这个 state 转一道是为了支持组件可以动态增加参数的情况
  const [saveParams, setSaveParams] = useState([]); // 记录弹框保存后的参数(最后结果)
  const [updateTypeOptions, setUpdateTypeOptions] = useState(initUpdateTypeOptions);
  const [switchVisible, setSwitchVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [expressionVisible, setExpressionVisible] = useState(false);
  const [expressionItem, setExpressionItem] = useState({});
  const [paramItemTreeData, setParamItemTreeData] = useState(paramOptions);

  const showEditorParams = async () => {
    setVisible(true);
    if (editorType === 'setQuery') {
      // 主要是获取查询参数其他交互paramOptions
      const data: any = await getMapOptions(layerKeys, comp, action);
      const tree = data.map((item: any) => {
        item.disabled = initParams.some((temp) => temp.paramItemId === item.value);
        return item;
      });
      setParamItemTreeData(tree);
    }
  };

  // 动态获取更新方式列表
  const changeUpdateTypeOptions = () => {
    let arr = [...initUpdateTypeOptions];
    if (filterUpdateType && filterUpdateType.length > 0) {
      arr = arr.filter((a) => filterUpdateType.includes(a.value));
    }
    // 是否增加交互传入值
    interactivelyPassInValue(comp, eventSetting.eventType, () => {
      // 有交互传入值的就会执行该回调
      if ((filterUpdateType && filterUpdateType.includes(4)) || !filterUpdateType) {
        let labelName = '选中值';
        if (comp.type === 'Input' || comp.type === 'NewInput') {
          labelName = '输入值';
        }

        arr.push({ label: labelName, value: 4 });
      }
    });
    setUpdateTypeOptions(arr);
  };

  // 新增参数
  const addParam = () => {
    const obj = getInitParam();
    obj.key = shortId.generate();
    obj.updateType = 3;
    params.push(obj);
    setParams([...params]);
  };

  // 获取组件、交互传入项数据项
  const _getCompDataItemOptions = (selectedComp: any, item: paramType) => {
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
    } else if (callFrom === 'listenEvent' || v.type === 'Table') {
      options = compDataOptions(v.key, 'mapField'); // 监听事件使用 mapField, 方便复用更新数据交互设置数据项值逻辑
    } else {
      options = compDataOptions(v.key);
    }
    // console.log('options==>', options);
    return options;
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

  // 选择参数项
  const paramItemChange = (val: string | number, item: any) => {
    item.paramItemId = val;
    item.paramType = val;
    item.paramName = val;
    const options = [...paramItemTreeData];
    // 选过的数据项不能再次选中
    options.forEach((temp) => {
      temp.disabled = params.some((p) => p.paramItemId === temp.value);
    });
    setParamItemTreeData(options);
  };

  // 选择更新方式
  const updateTypeChange = (val: number, item: paramType) => {
    item.updateType = val;
    item.compKey = undefined;
    item.compDataItem = undefined;
    item.compDataItemOptions = [];
    item.variableKey = '';
    item.dataSwitch = 0;
    item.dataSwitchContent = {
      code: `//请将返回值以retun方式返回
return ""`,
      dimensionMap: [],
    };
    if (val === 4) {
      // 交互传入值
      const options = getCompDataItemOptions(comp, item, true);
      item.interactDataItemOptions = options;
    }
    setParams([...params]);
  };

  // 手动输入
  const inputChange = (e: any, item: paramType) => {
    item.inputVal = e.target.value;
    setParams([...params]);
  };

  // 组件数据选择组件
  const changeRefComp = (val: string, item: paramType) => {
    item.compKey = val;
    item.dataSwitch = 0;
    item.dataSwitchContent = {
      code: `//请将返回值以retun方式返回
return ""`,
      dimensionMap: [],
    };
    const selectedComp = getComponent(val);
    const options = getCompDataItemOptions(selectedComp, item);
    item.compDataItemOptions = options;
    item.compDataItem = undefined;
    // v8.5.1 添加当前选中值选项；
    item.isSelected = 1;
    setParams([...params]);
  };

  // v8.5.1 选择是否当前选中值
  const compIsSelectedChange = (val: number, item: paramType) => {
    item.isSelected = val;
    setParams([...params]);
  };

  // 选择组件数据项
  const compDataItemChange = (val: string, item: paramType) => {
    item.compDataItem = val;
    setParams([...params]);
  };

  // 选择交互区域值
  const interactDataItemChange = (val: string, item: paramType) => {
    item.interactDataItem = val;
    setParams([...params]);
  };

  // 选择变量
  const changeVariable = (val: string, item: paramType) => {
    item.variableKey = val;
    setParams([...params]);
  };

  const deleteItem = (item: paramType) => {
    if (item.paramItemId) {
      // 删除当前item时，已选中的数据项后续可以再选
      const options = [...paramItemTreeData];
      for (const temp of options) {
        if (temp.value === item.paramItemId) {
          temp.disabled = false;
          break;
        }
      }
      setParamItemTreeData(options);
    }
    if (params.length === 1) {
      // 最后一条只清空内容
      const obj = getInitParam();
      setParams([obj]);
    } else {
      const arr = params.filter((v) => v !== item);
      setParams(arr);
    }
  };

  const showDataSwitch = (item: paramType) => {
    if (!switchComp.current) {
      switchComp.current = item.updateType === 2 && item.compKey ? getComponent(item.compKey) : comp;
    }
    setSwitchVisible(true);
    setCurrentItem(item);
  };

  const showExpressionModal = (item: paramType) => {
    setExpressionVisible(true);
    setExpressionItem(item);
  };

  const cancelDataExp = () => {
    setExpressionVisible(false);
  };

  const cancelDataSwitch = () => {
    setSwitchVisible(false);
  };

  const confirmDataSwitch = (codeData: any, param: paramType, dynamic: any) => {
    let options = [];
    if (Array.isArray(codeData)) {
      options = dynamic.dataMap.map((d: any) => ({
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

  // 确定
  const okHandler = () => {
    // const empty = params.some((p) => !p.paramItemId);
    // if (empty) {
    //   return message.warning('参数项不能为空');
    // }
    setSaveParams([...params]);
    onOk(params, editorType);
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      changeUpdateTypeOptions();

      const dataParams = cloneDeep(initParams);
      if (dataParams.length > 0) {
        // eslint-disable-next-line unicorn/no-lonely-if
        if (dataParams[0].updateType === 2 && dataParams[0].compKey) {
          const selectedComp = getComponent(dataParams[0].compKey);
          // console.log(selectedComp, 'selectedComp');
          if (selectedComp) {
            const options = getCompDataItemOptions(selectedComp, dataParams[0]);
            dataParams[0].compDataItemOptions = options; // 刷新组件数据的选项列表
            const index = options.findIndex((item) => item.value === dataParams[0].compDataItem);
            if (index === -1) {
              dataParams[0].compDataItem = '';
            }
          } else {
            dataParams[0].compKey = undefined;
            dataParams[0].compDataItem = undefined;
            dataParams[0].compDataItemOptions = [];
          }
        } else if (dataParams[0].updateType === 4) {
          const options = getCompDataItemOptions(comp, dataParams[0], true);
          dataParams[0].interactDataItemOptions = options;
          const index = options.findIndex((item) => dataParams[0].interactDataItem === item.value);
          if (index === -1) {
            dataParams[0].interactDataItem = '';
          }
        }
      }
      setParams(dataParams);
    }
    setSaveParams([...initParams]);
  }, [visible]);

  const getPopupContainer = () => document.querySelector('.edit-container') as HTMLElement;
  const columns: any = [
    {
      title: '参数项',
      width: 200,
      render: (text: string, item: paramType) => {
        return (
          <div style={{ display: 'flex' }}>
            {paramItemTreeData ? (
              <Select
                getPopupContainer={getPopupContainer}
                style={{
                  width: '100%',
                }}
                value={item.paramItemId}
                dropdownStyle={{
                  maxHeight: 250,
                  overflow: 'auto',
                }}
                placeholder='请选择'
                onChange={(val, label) => paramItemChange(val, item)}
                options={paramItemTreeData}
              />
            ) : (
              <>
                <Input
                  value={item.paramName}
                  disabled
                  style={{
                    width: '100%',
                    height: 28,
                  }}
                />
                {item.tipMsg && (
                  <Tooltip
                    placement='top'
                    color='#454141'
                    getPopupContainer={() => document.body}
                    overlayStyle={{ zIndex: 2001 }}
                    title={item.tipMsg}
                  >
                    <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', padding: '0 4px' }} />
                  </Tooltip>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      title: () => {
        return (
          <>
            {editorType === 'get' ? (
              <span>
                数据来源
                {/* <Tooltip
                  placement='top'
                  color='#454141'
                  getPopupContainer={() => document.body}
                  overlayStyle={{ zIndex: 2001 }}
                  title={variablesText.mapDataType}
                >
                  <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', padding: '0 4px' }} />
                </Tooltip> */}
              </span>
            ) : (
              <span>数据目标</span>
            )}
          </>
        );
      },
      width: 500,
      render: (text: string, item: paramType) => {
        let type = false;
        let { updateType } = item;
        if (paramItemTreeData && item.paramItemId === 'all') {
          type = true;
          updateType = 3;
        }
        // v8.5.1 添加是否显示当前选中值选项判断条件
        let hasType = false;
        if (item.compKey) {
          const selectedComp = getComponent(item.compKey);
          if (selectedComp) {
            hasType = passCurrentValueComps.has(selectedComp.type);
          }
        }
        const compTreeType = callFrom === 'ListenBrowserEvent' ? 'listenEvent' : callFrom || 'compData';
        return (
          <Row>
            <Col span={7}>
              <Select
                placeholder='请选择更新方式'
                getPopupContainer={getPopupContainer}
                style={{
                  width: 150,
                }}
                value={updateType}
                onChange={(val) => updateTypeChange(val, item)}
                options={type ? initAllOptions : updateTypeOptions}
              />
            </Col>
            <Col span={17} style={{ left: 2 }}>
              {updateType === 1 && (
                <Input
                  placeholder='请输入更改数据'
                  style={{ height: '100%' }}
                  value={item.inputVal}
                  onChange={(val) => inputChange(val, item)}
                />
              )}
              {updateType === 2 && (
                <Row>
                  <Col span={10}>
                    <CompTree
                      type={compTreeType} // 不能选择图层和组
                      relation={item.compKey}
                      onTreeChange={(val: string) => changeRefComp(val, item)}
                      getPopupContainer={getPopupContainer}
                    />
                  </Col>
                  <Col span={14}>
                    {/* v8.5.1 添加是否当前选中值 只有获取值时需要选中值，set不需要 */}
                    {hasType && editorType === 'get' ? (
                      <Select
                        placeholder=''
                        getPopupContainer={getPopupContainer}
                        style={{
                          marginLeft: 2,
                          width: 106,
                        }}
                        value={item.isSelected === undefined ? 1 : item.isSelected}
                        onChange={(val) => compIsSelectedChange(val, item)}
                        options={selectedValueOptions}
                      />
                    ) : null}
                    <Select
                      placeholder='请选择组件的数据'
                      getPopupContainer={getPopupContainer}
                      style={{
                        marginLeft: 2,
                        width: hasType ? 106 : 216,
                      }}
                      // dropdownStyle={{
                      //   maxHeight: 200,
                      // }}
                      value={item.compDataItem}
                      onChange={(val) => compDataItemChange(val, item)}
                      options={groupDataItemOptions(item.compDataItemOptions)}
                    />
                    {item.dataSwitch > 0 && editorType === 'get' ? (
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
              {/* 变量 */}
              {updateType === 3 && (
                <>
                  <StoreTree
                    style={{
                      width: '320px',
                    }}
                    value={item.variableKey}
                    onChange={(val) => changeVariable(val, item)}
                    getPopupContainer={getPopupContainer}
                  />
                  {showVariableExpression && (
                    <img
                      className={styles.switchIcon}
                      src={item.dataSwitch === 1 ? iconBtnWarn : iconBtnSuccess}
                      onClick={() => showExpressionModal(item)}
                      alt=''
                    />
                  )}
                </>
              )}
              {updateType === 4 && (
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
                  {item.dataSwitch > 0 && editorType === 'get' ? (
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
    {
      title: '操作',
      align: 'center',
      width: 100,
      render: (text: string, item: paramType, i: number) => {
        return (
          <>
            {i === params.length - 1 ? (
              <img
                className={styles.operationIcon}
                style={{ marginRight: 10 }}
                src={iconBtnAdd}
                alt=''
                onClick={addParam}
              />
            ) : null}
            <img className={styles.operationIcon} src={iconBtnDel} alt='' onClick={() => deleteItem(item)} />
          </>
        );
      },
    },
  ];

  if (editorType === 'get' || editorType === 'set' || (paramItemTreeData && paramItemTreeData.length === 1)) {
    columns.splice(2, 1);
  }

  const showSuccessIcon = useMemo(() => {
    return saveParams.some((item) => {
      let bool = false;
      if (item.updateType === 1 && item.inputVal) bool = true;
      if (item.updateType === 2 && item.compKey && item.compDataItem) bool = true;
      if (item.updateType === 3 && item.variableKey) bool = true;
      if (item.updateType === 4 && item.interactDataItem) bool = true;
      return bool;
    });
  }, [saveParams]);

  return (
    <div className={className}>
      <Button
        className={classNames(styles.editorParamsBtn, showSuccessIcon && styles.success)}
        type='primary'
        onClick={showEditorParams}
      >
        编辑参数
        {showSuccessIcon && <img className={styles.successIcon} src={successIcon} alt='suceess' />}
      </Button>

      {visible && (
        <Modal
          className='antd-dark'
          getContainer={getPopupContainer}
          maskClosable={false}
          keyboard={false}
          title='编辑参数'
          width={900}
          open={visible}
          onOk={okHandler}
          onCancel={() => setVisible(false)}
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

          {expressionVisible && (
            <VariableModal
              visible={expressionVisible}
              param={expressionItem}
              onOk={cancelDataExp}
              onCancel={cancelDataExp}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default Index;
