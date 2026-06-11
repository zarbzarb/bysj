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
  TreeSelect,
  Button,
  InputNumber,
} from 'antd';
import { QuestionCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import _, { isArray } from 'lodash';
import { getSysLayerList, queryGisByEs } from '@/services/apis/dataMapApi';
import LargeEdit from '@/components/commons/LargeEdit';
import { babelTransform } from '@/utils/utils';
import DataI from '@/utils/global-api/core';
import { variablesText, mapBaseLayerType } from '@/staticJson/MapBasic';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import VariableRefQuery from './VariableRefQuery';
import VariableRefEsQuery from './VariableRefEsQuery';
// 设置清除变量
import VariableMonitor from './VariableMonitor';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';

import EditorParams from '../../Common/EditorParams';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';
import MapTable from './MapTable';

// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    // 查询图层
    layerCodeSw = 'default',
    layerType,
    layerCodeVariable = '',
    layerCodeVariableExp = 'data',

    // 区域
    searchKeySw = 'default',
    searchKeyVal = {
      type: 'circle',
      coordinates: [116, 39],
      radius: 200000,
    },
    searchKeyVariable = '',
    searchKeyVariableExp = 'data',
    queryType = 'default',
    bufferRadius = 0,

    // 页码
    pageNumSw = 'default',
    pageNumVal = 1,
    pageNumVariable = '',
    pageNumVariableExp = 'data',

    // 每页个数
    pageSizeSw = 'default',
    pageSizeVal = 20,
    pageSizeVariable = '',
    pageSizeVariableExp = 'data',

    // 是否返回数据
    isType = false,
    dataType = 'default',
    queryApiVariable,
    filter, // 过滤条件

    // 显示结果
    isResultData = true,
    // 定位
    isLocation = false,

    // 删除数据
    deleteSpaceVariable,

    // 交互配置
    isFilter = false, // 是否地图互动(过滤)
    filterWay = 'all', // 过滤方式
    isLabel = '', // 是否标注
    isLabelRadio = false,
    latExpression = 'data',
    labelVariable,
    // tableValues = [],
    layerCode, // 图层选择数据后layers会添加一个图层relation_layer_code
    layerCodeVal = [],
    dataParams = [],
    saveParams = [],
  } = item.actionSettings;
  if (dataParams.length === 0) {
    const mapOptions = [
      {
        label: '图层代码',
        mapValName: 'layerCodeLocal',
        value: layerType,
        variable: layerCodeVariable,
        expression: layerCodeVariableExp,
        // eventType:circleQueryLayerType,
        eventType: '2',
        tipMsg: variablesText.spaceTipMsg,
      },

      {
        label: '区域',
        mapValName: 'searchKeyVal',
        value: searchKeyVal,
        variable: searchKeyVariable,
        expression: searchKeyVariableExp,
        eventType: searchKeySw == 'default' ? '1' : '2',
        tipMsg: variablesText.spacePolygonTipMsg,
      },
      {
        label: '页码',
        mapValName: 'pageNumVal',
        value: pageNumVal,
        variable: pageNumVariable,
        expression: pageNumVariableExp,
        eventType: pageNumSw == 'default' ? '1' : '2',
      },
      {
        label: '每页个数',
        mapValName: 'pageSizeVal',
        value: pageSizeVal,
        variable: pageSizeVariable,
        expression: pageSizeVariableExp,
        eventType: pageSizeSw == 'default' ? '1' : '2',
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

const MapSpaceQuery = ({ comp, parentIdx, actionIdx, idx, mapKey }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const [layerListArr, setLayerListArr] = useState([]);
  const { Option } = Select;
  const {
    // 查询图层
    layerCodeSw = 'default',
    layerType = [],
    layerCodeVariable = '',
    layerCodeVariableExp = 'data',

    // 区域
    searchKeySw = 'default',
    searchKeyVal = {
      type: 'circle',
      coordinates: [116.38859237461351, 39.91506397945804],
      radius: 2000,
    },
    searchKeyVariable = '',
    searchKeyVariableExp = 'data',
    queryType = 'default',
    bufferRadius = 0,

    // 页码
    pageNumSw = 'default',
    pageNumVal = '1',
    pageNumVariable = '',
    pageNumVariableExp = 'data',

    // 每页个数
    pageSizeSw = 'default',
    pageSizeVal = '20',
    pageSizeVariable = '',
    pageSizeVariableExp = 'data',

    // 是否返回数据
    isType = false,
    dataType = 'default',
    queryApiVariable,
    filter, // 过滤条件

    // 显示结果
    isResultData = true,
    // 定位
    isLocation = false,

    // 删除数据
    deleteSpaceVariable,

    // 交互配置
    isFilter = false, // 是否地图互动(过滤)
    filterWay = 'all', // 过滤方式
    isLabel = false, // 是否标注
    isLabelRadio = false,
    latExpression = 'data',
    labelVariable,
    // tableValues = [],
    layerCode, // 图层选择数据后layers会添加一个图层relation_layer_code
    layerCodeVal = [],
    dataParams = [],
    saveParams = [],
  } = querys;

  // 保存编辑参数
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

  const queryTypeOpts = [
    {
      label: '默认',
      value: 'default',
    },
    {
      label: '缓冲范围',
      value: 'buffer',
    },
  ];

  useEffect(() => {
    // let mapKey = item.actionSettings.mapKey;
    // 获取业务图层列表
    getSysLayerList()
      .then(({ data, success, message: msg }) => {
        if (!success) {
          return message.error(msg);
        }
        const { records } = data;
        const layerListObj = {};
        const layerConfigObj = {};
        records.forEach((item) => {
          const sortId = item.sortName || '默认分类';
          if (layerListObj.hasOwnProperty(sortId)) {
            layerListObj[sortId].push({
              title: item.layerName,
              value: `layer#${item.layerUid}`,
            });
          } else {
            layerListObj[sortId] = [
              {
                title: item.layerName,
                value: `layer#${item.layerUid}`,
              },
            ];
          }
          layerConfigObj[item.layerUid] = item.jsonConfig || ''; // 废弃：返回jsonConfig导致请求太慢
        });
        const layerListArrTmp = [];
        Object.keys(layerListObj).forEach((item) => {
          layerListArrTmp.push({
            title: item,
            value: item,
            selectable: false,
            children: layerListObj[item],
          });
        });
        layerListArrTmp.unshift({
          title: '地图引擎',
          value: '地图引擎',
          selectable: false,
          children: getAllLayerCode(mapKey),
        });
        setLayerListArr(layerListArrTmp);
      })
      .catch((error) => {
        console.error(error, '业务图层获取出错');
      });
  }, [mapKey]);
  const filterMsg =
    '（1）过滤全部数据，则只渲染本次查询结果 （2）过滤所有查询的数据，则会渲染图层自有的数据和本次查询数据，会过滤掉之前的所有类型查询的数据 （3）过滤同类查询，是指每次查询会过滤掉相同类型的查询之前渲染的数据，不同类型的查询可以相互叠加，比如图层查询和范围查询';
  const getAllLayerCode = (comkey) => {
    const code = [];
    const mapCom = DataI.getComList(mapKey);
    const foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
    foundationPlan?.layers.forEach((v) => {
      if (mapBaseLayerType.includes(v.type)) {
        code.push({
          title: v.name,
          value: `local#${v.key}#${v.instance.compAttr.relation_layer_code}`,
        });
      }
    });
    return code;
  };

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

  const layerKeys = {
    mapKey,
    layerCode: layerType,
    layerCodeSw,
    dataParams: item.actionSettings.dataParams,
  };

  const layerCodeMsg = '格式：layerCode/layerKey，例["platform_375bb5b0_default", "platform_375bb5b0_default"]';
  const TooltipCircle =
    '圆形区格式:{coordinates: [116.40474273971459, 39.88957851877437, 1000],radius:500,type:"circle"}; 矩形和多边形区域格式：{coordinates: [[116.41657434303343, 39.93337515133109, 1000],[116.40474273971459, 39.88957851877437, 1000],[116.35350885391898, 39.90924839972355,1000],[116.34027332784443, 39.93254757913646,1000]], type:"polygon"}';
  const toolQueryData =
    '数据结构：[{layerCode:"cim_platform_20221118182355381509846513483776",features:[{bbox: [116.38575, 39.93253, 116.38575, 39.93253],coordinates: [116.38575, 39.93253] ,fields: {osm_id: "269491228", fclass: "attraction", name: "荷花市场"} , id: "2",type: "point"}]}]';
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          查询类型
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Select
            style={{ width: '100%' }}
            defaultValue={queryType}
            placeholder='查询类型'
            options={queryTypeOpts}
            onChange={(evt) => {
              changeFieldValues('queryType', evt);
            }}
          />
        </Col>
      </Row>
      {queryType == 'buffer' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            缓冲范围
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <InputNumber
              value={bufferRadius}
              min={0}
              step={1}
              onChange={(value) => {
                changeFieldValues('bufferRadius', value);
              }}
            />
          </Col>
        </Row>
      )}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>图层代码</span>
          {/* <Tooltip title={layerCodeMsg}>
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
              <TreeSelect
                multiple
                treeCheckable
                treeDefaultExpandAll
                maxTagCount={2}
                style={{ width: '100%' }}
                value={isArray(layerListArr) && layerListArr.length > 0 ? layerType : []}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder='请选择图层'
                onChange={(evt) => {
                  console.log('evt*', evt);
                  changeFieldValues('layerType', evt);
                }}
                treeData={layerListArr}
                showArrow
                suffixIcon={
                  isArray(layerListArr) && layerListArr.length > 0 ? null : (
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
            initParams={dataParams?.slice(layerCodeSw === 'default' ? 1 : 0, 4)}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row>
      <MapTable dataParams={dataParams?.slice(layerCodeSw === 'default' ? 1 : 0, 4) || []}></MapTable>

      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>区域</span>
          <Tooltip title={TooltipCircle}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
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
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}></Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <LargeEdit
                language='json'
                value={searchKeyVal}
                onChange={(evt) => {
                  changeFieldValues('searchKeyVal', evt);
                }}
              />
            </Col>
          </Row>
        </>
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
          是否返回数据
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
      {isType && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>数据类型</span>
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('dataType', evt.target.value);
                }}
                value={dataType}
              >
                <Radio className={styles.radioLable} value='default'>
                  详细数据
                </Radio>
                <Radio className={styles.radioLable} value='varible'>
                  统计数据
                </Radio>
              </Radio.Group>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>数据存储到</span>
            </Col>
            <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <EditorParams
                filterUpdateType={[2, 3]}
                editorType='setQuery'
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
                layerKeys={layerKeys}
                action={action}
              />
            </Col>
          </Row>

          <MapTable dataParams={saveParams || []} editorType='post'></MapTable>

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              查看变量结构
            </Col>
            <Col flex='186px' className={styles.fieldInput}>
              <Tooltip title={toolQueryData}>
                <Button>查看</Button>
              </Tooltip>
            </Col>
          </Row>
        </>
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          显示查询结果
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isResultData}
            onChange={(evt) => {
              changeFieldValues('isResultData', evt);
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          定位
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isLocation}
            onChange={(evt) => {
              changeFieldValues('isLocation', evt);
            }}
          />
        </Col>
      </Row>

      {/* 设置清除变量 */}
      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>设置清除变量</span>
          <Tooltip title={'格式：0表示清除，例："0"'}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='180px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <EditorParams
            editorType='get'
            initParams={dataParams}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row> */}
      <VariableMonitor variable={deleteSpaceVariable} name='deleteSpaceVariable' updateField={changeFieldValues} />

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

      {/* <Collapse onChange={(evt) => {}}>
        <Panel header={'互动配置'}>
          <Row className={styles.field} align="middle">
            <Col flex="auto" className={styles.fieldLabel}>
              <span className="margin-right-6">过滤</span>
              <Tooltip title={filterMsg}>
                <QuestionCircleOutlined
                  style={{ fontSize: '14px', color: '#3fb5d2' }}
                />
              </Tooltip>
            </Col>
            <Col
              flex="206px"
              className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isFilter}
                onChange={(evt) => {
                  changeFieldValues('isFilter', evt);
                }}
              />
            </Col>
          </Row>
          {isFilter && (
            <Row className={styles.field} align="middle">
              <Col flex="auto" className={styles.fieldLabel}>
                过滤方式
              </Col>
              <Col
                flex="206px"
                className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Radio.Group
                  onChange={(evt) => {
                    changeFieldValues('filterWay', evt.target.value);
                  }}
                  value={filterWay}>
                  <Radio className={styles.radioLable} value={'all'}>
                    全部数据
                  </Radio>
                  <Radio className={styles.radioLable} value={'query'}>
                    所有查询
                  </Radio>
                  <Radio className={styles.radioLable} value={'same'}>
                    同类查询
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
          )}
          <Row className={styles.field} align="middle">
            <Col flex="auto" className={styles.fieldLabel}>
              标注
            </Col>
            <Col
              flex="206px"
              className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isLabel}
                onChange={(evt) => {
                  changeFieldValues('isLabel', evt);
                }}
              />
            </Col>
          </Row>
          {isLabel && (
            <Row className={styles.field} align="middle">
              <Col flex="auto" className={styles.fieldLabel}>
                <span className="margin-right-8">启用类型</span>
                <Tooltip title="直接启用表示直接启用标注，变量决定表示可以根据外部变量设置来决定是否真正启用标识，表达式返回值为0时标识启用，其他所有值表示不启用">
                  <QuestionCircleOutlined
                    style={{ fontSize: '14px', color: '#3fb5d2' }}
                  />
                </Tooltip>
              </Col>
              <Col
                flex="206px"
                className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Radio.Group
                  onChange={(evt) => {
                    changeFieldValues('isLabelRadio', evt.target.value);
                  }}
                  value={isLabelRadio}>
                  <Radio className={styles.radioLable} value={false}>
                    直接启用
                  </Radio>
                  <Radio className={styles.radioLable} value={true}>
                    变量决定
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
          )}
          {isLabelRadio && (
            <VariableRef
              expression={latExpression}
              variable={labelVariable}
              name={'label'}
              updateField={changeFieldValues}
            />
          )}
        </Panel>
      </Collapse> */}
    </div>
  );
};

export default MapSpaceQuery;
