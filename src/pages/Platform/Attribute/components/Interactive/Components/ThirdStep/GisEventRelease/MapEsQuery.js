import React, { useState, useMemo, useEffect } from 'react';
import {
  Input,
  Row,
  Col,
  Select,
  Radio,
  Tooltip,
  Switch,
  // Table,
  Collapse,
  Popover,
  TreeSelect,
} from 'antd';
import produce from 'immer';
import { QuestionCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import _, { isArray } from 'lodash';
import { tableValue, variablesText } from '@/staticJson/MapBasic'; // 初始化时需要的table需要的参数
import SortTree from '@/components/StoreTree'; // 选择变量变量
import { queryGisByEs } from '@/services/apis/dataMapApi';
import { babelTransform } from '@/utils/utils';
import { getRelateMapLayers, getLayersTree } from '@/utils/gisCommonUtils';
import DataI from '@/utils/global-api/core';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import EditInput from './EditInput';
import VariableRefEsQuery from './VariableRefEsQuery';
import VariableRefQuery from './VariableRefQuery';
import VariableRef from './VariableRef';
import styles from './index.less';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Option } = Select;
// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    isLabelRadio = false,
    latExpression = 'data',
    labelVariable,
    layerCodeSw = 'default', // 图层
    layerCodeVariable = '',
    layerCodeVariableExp = 'data',
    searchKeySw = 'default', // 关键字
    searchKeyVariable = '',
    searchKeyVariableExp = 'data',
    pageNumSw = 'default', // 页码
    pageNumVariable = '',
    pageNumVariableExp = 'data',
    pageSizeSw = 'default', // 每页数
    pageSizeVariable = '',
    pageSizeVariableExp = 'data',
    layerType,
    searchKeyVal,
    pageNumVal = 1,
    pageSizeVal = 20,
    label = 0,
    queryApiVariable,
    dataParams = [],
    saveParams = [],
  } = item.actionSettings;
  if (dataParams?.length === 0) {
    const mapOptions = [
      {
        label: '图层代码',
        mapValName: 'layerCodes',
        value: layerType,
        variable: layerCodeVariable,
        expression: layerCodeVariableExp,
        // eventType: layerCodeSw != 'default' ? '2' : '1',
        eventType: '2',
        tipMsg: variablesText.mapEsTipMsg,
      },

      {
        label: '关键字',
        mapValName: 'keyWord',
        value: searchKeyVal,
        variable: searchKeyVariable,
        expression: searchKeyVariableExp,
        eventType: searchKeySw != 'default' ? '2' : '1',
      },
      {
        label: '页码',
        mapValName: 'pageNum',
        value: pageNumVal,
        variable: pageNumVariable,
        expression: pageNumVariableExp,
        eventType: pageNumSw != 'default' ? '2' : '1',
      },
      {
        label: '每页个数',
        mapValName: 'pageSize',
        value: pageSizeVal,
        variable: pageSizeVariable,
        expression: pageSizeVariableExp,
        eventType: pageSizeSw != 'default' ? '2' : '1',
      },
      {
        label: '标注启用标识',
        mapValName: 'label',
        value: label,
        variable: labelVariable,
        expression: latExpression,
        eventType: isLabelRadio ? '2' : '1',
        tipMsg: variablesText.labelTipMsg,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'queryApiVariable',
        value: 'all',
        variable: queryApiVariable,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

const RefContent = (props) => {
  const { item, index, onChange, dataSource } = props;

  // const ref = useRef();

  const resetInputValue = () => {
    // ref.current.value = 'data';
  };

  return (
    <div>
      <Row>
        <Col span={7}>引入变量</Col>
        <Col span={16}>
          <SortTree
            value={item.example}
            onChange={(value, text) => {
              const newV = produce(dataSource, (draft) => {
                // draft[index].status = v !== draft[i].defaultValue;
                draft[index].example = text.toString();
                draft[index].isRefer = true;
                draft[index].exampleValue = value;
                draft[index].exampleExpression = 'data';
                resetInputValue();
              });
              onChange(newV);
            }}
          />
        </Col>
      </Row>
      <Row className='margin-top-8'>
        <Col span={7}>
          <span className='margin-right-6'>表达式</span>
          <Tooltip title='表达式可以对依赖的变量数据进行属性的选择或者过滤，默认变量ref为data，例：data.userName'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col span={16}>
          <Input
            value={item.exampleExpression}
            onChange={(evt) => {
              const newV = produce(dataSource, (draft) => {
                draft[index].exampleExpression = evt.target.value;
              });
              onChange(newV);
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

const MapEsQuerySet = ({ comp, parentIdx, actionIdx, idx, mapType, mapKey }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    // name,
    // value,
    isVariable = false,
    expression = 'data',
    layerType, // 图层
    tableValues = [],
    variable,
    isType = false, // 是否返回几何
    isLocation = false, // 是否地图定位
    isFilter = false, // 是否地图互动(过滤)
    filterWay = 'all',
    filter, // 过滤条件
    layerCode, // 图层选择数据后layers会添加一个图层relation_layer_code
    queryApiVariable, // 保存数据变量
    isLabelRadio = false,
    isLabel = false, // 是否标注
    expressionLabel,
    variableLabel,
    latExpression = 'data',
    labelVariable,

    layerCodeSw = 'default', // 图层
    layerCodeVal = [],
    layerCodeVariable = '',
    layerCodeVariableExp = 'data',
    searchKeySw = 'default', // 关键字
    searchKeyVal = '',
    searchKeyVariable = '',
    searchKeyVariableExp = 'data',
    pageNumSw = 'default', // 页码
    pageNumVal = '1',
    pageNumVariable = '',
    pageNumVariableExp = 'data',
    pageSizeSw = 'default', // 每页数
    pageSizeVal = '20',
    pageSizeVariable = '',
    pageSizeVariableExp = 'data',
    dataParams = [],
    saveParams = [],
  } = querys;

  const filterMsg =
    '（1）过滤全部数据，则只渲染本次查询结果 （2）过滤所有查询的数据，则会渲染图层自有的数据和本次查询数据，会过滤掉之前的所有类型查询的数据 （3）过滤同类查询，是指每次查询会过滤掉相同类型的查询之前渲染的数据，不同类型的查询可以相互叠加，比如图层查询和范围查询';
  // 获取地图对应的图层数据

  // 获取地图对应的图层数据
  const getLayerList = useMemo(() => {
    const arrTmp = getLayersTree(window.componentList, mapKey);
    return arrTmp;
  }, [mapType]);

  const getLayerCode = (layerTypes) => {
    const code = [];
    /* let mapCom = DataI.getComList(mapKey);
    let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
    foundationPlan?.layers?.forEach((v) => {
      if (mapEnglistNameArr.includes(v.englishName)) {
        if (layerTypes.includes(v.key)) {
          code.push(v.instance.compAttr.relation_layer_code);
        }
      }
    }); */
    getLayerList?.forEach((item) => {
      item?.children?.forEach((val) => {
        if (layerTypes.includes(val.value)) {
          code.push(val.layerCode);
        }
      });
    });
    // changeFieldValues('layerCodeVal', code);
    item.actionSettings.layerCodeVal = code;
    // return code;
  };

  // const getAllLayerCode = (layerTypes) => {
  //   let code = [];
  //   window.componentList.forEach((item) => {
  //     if (mapType == item.englishName) {
  //       item.layers.forEach((v) => {
  //         if (mapEnglistNameArr.includes(v.englishName)) {
  //           code.push(v.instance.compAttr.relation_layer_code);
  //         }
  //       });
  //     }
  //   });
  //   changeFieldValues('layerCodeAll', code);
  //   // return code;
  // };

  const handleTestCallback = (callback) => {
    const queryParam = {};
    const layerCodeTmp =
      layerCodeSw == 'default' ? layerCodeVal : getExpDataByKey(layerCodeVariable, layerCodeVariableExp);
    // 不选图层默认查询全部
    queryParam.layerCodes = Array.isArray(layerCodeTmp) && layerCodeTmp.length > 0 ? layerCodeTmp : [];
    queryParam.keyWord =
      searchKeySw == 'default' ? searchKeyVal : getExpDataByKey(searchKeyVariable, searchKeyVariableExp);
    queryParam.pageNum = pageNumSw == 'default' ? pageNumVal : getExpDataByKey(pageNumVariable, pageNumVariableExp);
    queryParam.pageSize =
      pageSizeSw == 'default' ? pageSizeVal : getExpDataByKey(pageSizeVariable, pageSizeVariableExp);

    queryGisByEs(queryParam)
      .then(({ data, success, message: msg }) => {
        if (!success) {
          return message.error(msg);
        }
        const { result } = data;
        callback(data);
      })
      .catch((error) => {
        console.error(error, '地图查询出错');
      });
  };
  const getExpDataByKey = (variable, expression) => {
    let data = getDataByKey(variable);
    // const fn = new Function('data', 'expression');
    data = babelTransform(expression, data); // 运行时ES6转ES5
    return data;
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
  // 保存输入默认值将对应的数据
  const onChangeValue = (v, i) => {
    const newV = produce(tableValues.length > 0 ? tableValues : tableValue, (draft) => {
      draft[i].status = v !== draft[i].defaultValue;
      draft[i].example = v;
    });
    onChange(newV);
  };
  const onReset = (i) => {
    const newV = produce(tableValues.length > 0 ? tableValues : tableValue, (draft) => {
      draft[i].status = false;
      draft[i].isRefer = false;
      draft[i].example = draft[i].defaultValue;
    });
    onChange(newV);
  };
  // 保存数据
  const onChange = (item) => {
    changeFieldValues('tableValues', item);
  };

  // 保存编辑参数imt
  const handleOk = (value, editorType) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      const type = editorType == 'get' ? 'dataParams' : 'saveParams';
      if (type === 'saveParams') {
        item.actionSettings[type] = value;
      }
      if (type === 'dataParams') {
        for (let data of value) {
          const idx = item.actionSettings[type].findIndex((v) => v.mapValName === data.mapValName);
          item.actionSettings[type][idx] = data;
        }
      }
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  const onRefer = () => {};
  const columns = [
    {
      title: '参数名',
      dataIndex: 'name',
      ellipsis: true,
      width: 90,
    },
    {
      title: '默认值',
      dataIndex: 'example',
      ellipsis: true,
      width: 90,
      render: (text, record, index) => {
        if (record.isRefer) {
          return <span>{text !== undefined ? String(text) : text}</span>;
        }
        // return <EditInput value={text} verify={false} onChange={(v) => onChangeValue(v, index)} />;
        return (
          <EditInput
            value={text != undefined ? String(text) : text}
            verify={false}
            onChange={(v) => onChangeValue(v, index)}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 40,
      render: (text, record, index) => {
        if (record.isRefer) {
          return <span>引用</span>;
        }
        if (text) {
          return <span>已改</span>;
        }
        return <span>未改</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'active',
      width: 70,
      render: (text, record, i) => {
        return (
          <span className={styles.handleWrap}>
            <a onClick={() => onReset(i)}>重置</a>
            <Popover
              content={
                <RefContent dataSource={tableValues || tableValue} onChange={onChange} index={i} item={record} />
              }
              trigger='click'
              placement='bottomRight'
            >
              <a onClick={onRefer}>引用</a>
            </Popover>
          </span>
        );
      },
    },
  ];
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>图层代码</span>
          {/* <Tooltip title='关联的图层如果layerCode相同将会自动过滤掉,如: [default_edit_layer_point]'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('layerCodeSw', evt.target.value);
            }}
            value={layerCodeSw}
          >
            <Radio className={styles.radioLable} value='default'>
              选择
            </Radio>
            <Radio className={styles.radioLable} value='varible'>
              数据驱动
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {
        layerCodeSw == 'default' && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel} />
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              {/* <Select
              mode="multiple"
              style={{ width: '100%' }}
              defaultValue={layerType}
              placeholder="请选择图层"
              onChange={(evt) => {
                console.log('evt*', evt);
                changeFieldValues('layerType', evt);
                getLayerCode(evt);
              }}>
              {mapQueryList.map((item) => (
                <Option value={item.key}>{item.name}</Option>
              ))}
            </Select> */}

              <TreeSelect
                multiple
                treeCheckable
                treeDefaultExpandAll
                maxTagCount={2}
                style={{ width: '100%' }}
                value={isArray(getLayerList) && getLayerList.length > 0 ? layerType : []}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder='请选择图层'
                onChange={(evt) => {
                  // handleLayerChange
                  // console.log(evt, 'layerType');
                  getLayerCode(evt);
                  changeFieldValues('layerType', evt);
                }}
                treeData={getLayerList}
                showArrow
                suffixIcon={
                  isArray(getLayerList) && getLayerList.length > 0 ? null : (
                    <LoadingOutlined style={{ color: '#fff' }} />
                  )
                }
              />
            </Col>
          </Row>
        )
        // : (
        //   <VariableRefEsQuery
        //     variable={layerCodeVariable}
        //     filter={filter}
        //     isType={isType}
        //     layerCode={layerCode}
        //     name={'layerCodeVariable'}
        //     expression={layerCodeVariableExp}
        //     updateField={changeFieldValues}
        //   />
        // )
      }

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          参数
        </Col>
        <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <EditorParams
            editorType='get'
            initParams={dataParams?.slice(layerCodeSw == 'default' ? 1 : 0, 4)}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row>

      <MapTable dataParams={dataParams?.slice(layerCodeSw == 'default' ? 1 : 0, 4) || []}></MapTable>

      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>关键字</span>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('searchKeySw', evt.target.value);
            }}
            value={searchKeySw}
          >
            <Radio className={styles.radioLable} value={'default'}>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value={'varible'}>
              引用变量
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {searchKeySw == 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Input
              value={searchKeyVal}
              onChange={(evt) => {
                changeFieldValues('searchKeyVal', evt.target.value);
              }}
            />
          </Col>
        </Row>
      ) : (
        <VariableRefEsQuery
          variable={searchKeyVariable}
          filter={filter}
          isType={isType}
          layerCode={layerCode}
          name={'searchKeyVariable'}
          expression={searchKeyVariableExp}
          updateField={changeFieldValues}
        />
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>页码</span>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('pageNumSw', evt.target.value);
            }}
            value={pageNumSw}
          >
            <Radio className={styles.radioLable} value={'default'}>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value={'varible'}>
              引用变量
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {pageNumSw == 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Input
              value={pageNumVal}
              onChange={(evt) => {
                changeFieldValues('pageNumVal', evt.target.value);
              }}
            />
          </Col>
        </Row>
      ) : (
        <VariableRefEsQuery
          variable={pageNumVariable}
          filter={filter}
          isType={isType}
          layerCode={layerCode}
          name={'pageNumVariable'}
          expression={pageNumVariableExp}
          updateField={changeFieldValues}
        />
      )}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>每页个数</span>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('pageSizeSw', evt.target.value);
            }}
            value={pageSizeSw}
          >
            <Radio className={styles.radioLable} value={'default'}>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value={'varible'}>
              引用变量
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {pageSizeSw == 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Input
              value={pageSizeVal}
              onChange={(evt) => {
                changeFieldValues('pageSizeVal', evt.target.value);
              }}
            />
          </Col>
        </Row>
      ) : (
        <VariableRefEsQuery
          variable={pageSizeVariable}
          filter={filter}
          isType={isType}
          layerCode={layerCode}
          name={'pageSizeVariable'}
          expression={pageSizeVariableExp}
          updateField={changeFieldValues}
        />
      )} */}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          是否返回几何
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isType}
            onChange={(evt) => {
              changeFieldValues('isType', evt);
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>数据存储到</span>
        </Col>
        <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <EditorParams
            filterUpdateType={[2, 3]}
            editorType='setOther'
            initParams={saveParams}
            // paramOptions={[
            //   {
            //     label: 'all',
            //     value: 'all',
            //   },
            // ]}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
            showVariableExpression={false}
            layerKeys={{ mapKey, layerCode: layerType, layerCodeSw, dataParams: item.actionSettings.dataParams }}
            action={action}
          />
        </Col>
      </Row>

      <MapTable dataParams={saveParams || []} editorType='post'></MapTable>

      {/* <VariableRefQuery
        variable={queryApiVariable}
        filter={filter}
        isType={isType}
        layerCode={layerCode}
        name={'queryApiVariable'}
        onTestCallback={handleTestCallback}
        updateField={changeFieldValues}
      /> */}

      <Collapse onChange={(evt) => {}}>
        <Panel header='互动配置'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-6'>过滤</span>
              <Tooltip title={filterMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Switch
                checked={isFilter}
                onChange={(evt) => {
                  changeFieldValues('isFilter', evt);
                }}
              />
            </Col>
          </Row>
          {isFilter && (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                过滤方式
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <Radio.Group
                  onChange={(evt) => {
                    changeFieldValues('filterWay', evt.target.value);
                  }}
                  value={filterWay}
                >
                  <Radio className={styles.radioLable} value='all'>
                    全部数据
                  </Radio>
                  <Radio className={styles.radioLable} value='query'>
                    所有查询
                  </Radio>
                  <Radio className={styles.radioLable} value='same'>
                    同类查询
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
          )}
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>标注</span>
              {/* <Tooltip title='参数里启用标识为0时标识启用，其他所有值表示不启用'>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip> */}
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Switch
                checked={isLabel}
                onChange={(evt) => {
                  changeFieldValues('isLabel', evt);
                }}
              />
            </Col>
          </Row>
          {isLabel && (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                <span className='margin-right-8'>启用类型</span>
                {/* <Tooltip title='直接启用表示直接启用标注。如数据驱动，参数里启用标识为0时标识启用，其他所有值表示不启用'>
                  <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
                </Tooltip> */}
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <Radio.Group
                  onChange={(evt) => {
                    changeFieldValues('isLabelRadio', evt.target.value);
                  }}
                  value={isLabelRadio}
                >
                  <Radio className={styles.radioLable} value={false}>
                    直接启用
                  </Radio>
                  <Radio className={styles.radioLable} value={true}>
                    数据驱动
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
          )}
          {isLabel && isLabelRadio && (
            <>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  参数
                </Col>
                <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                  <EditorParams
                    editorType='get'
                    initParams={dataParams?.slice(4)}
                    comp={comp} // 当前组件
                    eventSetting={eventSettings[parentIdx]} // 当前事件
                    onOk={handleOk}
                  />
                </Col>
              </Row>
              <MapTable dataParams={dataParams?.slice(4) || []}></MapTable>
            </>
            // <VariableRef
            //   expression={latExpression}
            //   variable={labelVariable}
            //   name={'label'}
            //   updateField={changeFieldValues}
            // />
          )}
        </Panel>
      </Collapse>
    </div>
  );
};

export default MapEsQuerySet;
