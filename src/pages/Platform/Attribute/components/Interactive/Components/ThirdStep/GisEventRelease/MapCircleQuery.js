import React, { useState, useEffect } from 'react';
import { Row, Col, Radio, Select, TreeSelect, Tooltip, Input, Collapse, Button, Switch } from 'antd';
import _, { isArray } from 'lodash';
import { QuestionCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { getSysLayerList } from '@/services/apis/dataMapApi';
import DataI from '@/utils/global-api/core';
// import ColorPicker from '@/components/ColorPicker';
import { variablesText, mapBaseLayerType } from '@/staticJson/MapBasic';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import VariableRefEsQuery from './VariableRefEsQuery';
import VariableRefQuery from './VariableRefQuery';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import styles from './index.less';
import { Color } from '@yl/datai-ui';
import { getCurrentAction } from '../../../utils';
import VariableMonitor from './VariableMonitor';
import MapTable from './MapTable';

const { Option } = Select;
const { Panel } = Collapse;

// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    // 查询图层
    circleQueryLayerType = 1,
    circleQueryLayer = [],
    circleQueryLayerVariable = '',
    circleQueryLayerVariableExp = 'data',
    // 查询点位
    circleQueryCenterType = 1,
    circleQueryCenter = [116, 39.6],
    circleQueryCenterVariable = '',
    circleQueryCenterVariableExp = 'data',
    // 查询半径
    circleQueryRadiusType = 1,
    circleQueryRadius = 50000,
    circleQueryRadiusVariable = '',
    circleQueryRadiusVariableExp = 'data',
    circleBackground = 'rgba(255,255,255,0.65)',

    isInteract = false,
    isLocation = false, // 是否地图定位
    isFilter = false, // 是否地图互动(过滤)
    isDrag = false,
    filterWay = 'all',
    isLabelRadio = false,
    isLabel = 0, // 是否标注
    circleQueryLabelVariable = '',
    circleQueryLabelVariableExp = 'data',

    isReturnData = false,
    retDataType = 'default',
    queryApiVariable,
    dataParams = [],
    saveParams = [],
  } = item.actionSettings;
  if (dataParams === undefined || dataParams.length === 0) {
    const mapOptions = [
      {
        label: '图层代码',
        mapValName: 'layerCodeLocal',
        value: circleQueryLayer,
        variable: circleQueryLayerVariable,
        expression: circleQueryLayerVariableExp,
        // eventType:circleQueryLayerType,
        eventType: '2',
        tipMsg: variablesText.circleLayersTipMsg,
      },

      {
        label: '查询点位',
        mapValName: 'circleQueryCenter',
        value: circleQueryCenter,
        variable: circleQueryCenterVariable,
        expression: circleQueryCenterVariableExp,
        eventType: circleQueryCenterType,
        tipMsg: variablesText.circlePointTipMsg,
      },
      {
        label: '查询半径',
        mapValName: 'circleQueryRadius',
        value: circleQueryRadius,
        variable: circleQueryRadiusVariable,
        expression: circleQueryRadiusVariableExp,
        eventType: circleQueryRadiusType,
        tipMsg: variablesText.circleRadiusTipMsg,
      },
      {
        label: '标注启用标识',
        mapValName: 'isLabel',
        value: isLabel,
        variable: circleQueryLabelVariable,
        expression: circleQueryLabelVariableExp,
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

const MapCircleQuery = ({ comp, parentIdx, actionIdx, idx, mapType, mapKey }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const [layerListArr, setLayerListArr] = useState([]);

  const {
    // 查询图层
    circleQueryLayerType = 1,
    circleQueryLayer = [],
    circleQueryLayerVariable = '',
    circleQueryLayerVariableExp = 'data',
    // 查询点位
    circleQueryCenterType = 1,
    circleQueryCenter = '',
    circleQueryCenterVariable = '',
    circleQueryCenterVariableExp = 'data',
    // 查询半径
    circleQueryRadiusType = 1,
    circleQueryRadius = '',
    circleQueryRadiusVariable = '',
    circleQueryRadiusVariableExp = 'data',
    circleBackground = 'rgba(255,255,255,0.65)',

    isInteract = false,
    isLocation = false, // 是否地图定位
    isFilter = false, // 是否地图互动(过滤)
    isDrag = false,
    filterWay = 'all',
    isLabelRadio = false,
    isLabel = 0, // 是否标注
    circleQueryLabelVariable = '',
    circleQueryLabelVariableExp = 'data',

    isReturnData = false,
    retDataType = 'default',
    queryApiVariable,
    dataParams = [],
    saveParams = [],
    deleteCircleVariable = '',
  } = querys;
  const filterMsg =
    '（1）过滤全部数据，则只渲染本次查询结果 （2）过滤所有查询的数据，则会渲染图层自有的数据和本次查询数据，会过滤掉之前的所有类型查询的数据 （3）过滤同类查询，是指每次查询会过滤掉相同类型的查询之前渲染的数据，不同类型的查询可以相互叠加，比如图层查询和范围查询';
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
  useEffect(() => {
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
        // console.log('getSysLayerList*****', layerListArrTmp);
      })
      .catch((error) => {
        console.error(error, '业务图层获取出错');
      });
  }, [mapKey]);

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

  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    console.log(path, value, isUpdate);
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

  const handleLayerTypeChange = (e) => {
    changeFieldValues('circleQueryLayerType', e.target.value);
  };
  const handleLayerChange = (val) => {
    changeFieldValues('circleQueryLayer', val);
  };
  const handleCenterTypeChange = (e) => {
    changeFieldValues('circleQueryCenterType', e.target.value);
  };
  const handleCenterChange = (e) => {
    changeFieldValues('circleQueryCenter', e.target.value);
  };
  const handleRadiusTypeChange = (e) => {
    changeFieldValues('circleQueryRadiusType', e.target.value);
  };
  const handleRadiusChange = (e) => {
    changeFieldValues('circleQueryRadius', e.target.value);
  };

  const onClose = () => {
    setVisible(false);
  };
  const layerCodeMsg = '格式：layerCode/layerKey，例["platform_375bb5b0_default", "@com_gTL3SKX9gS5yPDdKXaSidr"]';

  const toolQueryData =
    '数据结构：[{layerCode:"cim_platform_20221118182355381509846513483776",features:[{bbox: [116.38575, 39.93253, 116.38575, 39.93253],coordinates: [116.38575, 39.93253] ,fields: {osm_id: "269491228", fclass: "attraction", name: "荷花市场"} , id: "2",type: "point"}]}]';

  const map3dTypeFlag = mapType.includes('3D');
  console.log('oooo', circleBackground);
  const isLabelType = isLabel != 0;

  const layerKeys = {
    mapKey,
    layerCode: circleQueryLayer,
    layerCodeSw: circleQueryLayerType,
    dataParams: item.actionSettings.dataParams,
  };
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          选择图层
          {/* <Tooltip title={layerCodeMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group onChange={handleLayerTypeChange} value={circleQueryLayerType}>
            <Radio value={1}>选择</Radio>
            <Radio value={2}>数据驱动</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {
        circleQueryLayerType == 1 && (
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel} />
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <TreeSelect
                multiple
                treeCheckable
                treeDefaultExpandAll
                maxTagCount={2}
                style={{ width: '100%' }}
                value={isArray(layerListArr) && layerListArr.length > 0 ? circleQueryLayer : []}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder='请选择图层'
                onChange={handleLayerChange}
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
        //     label={'请选择变量'}
        //     variable={circleQueryLayerVariable}
        //     name={'circleQueryLayerVariable'}
        //     expression={circleQueryLayerVariableExp}
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
            initParams={dataParams?.slice(circleQueryLayerType == 1 ? 1 : 0, 3)}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row>
      <MapTable dataParams={dataParams?.slice(circleQueryLayerType == 1 ? 1 : 0, 3) || []}></MapTable>
      {/* 
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          查询点位
          <Tooltip title={'格式：经纬度，例[116, 39]'}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group onChange={handleCenterTypeChange} value={circleQueryCenterType}>
            <Radio value={1}>填写值</Radio>
            <Radio value={2}>引用变量</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {circleQueryCenterType == 1 ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Input placeholder='请输入查询点位' value={circleQueryCenter} onChange={handleCenterChange} />
          </Col>
        </Row>
      ) : (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={circleQueryCenterVariable}
          name={'circleQueryCenterVariable'}
          expression={circleQueryCenterVariableExp}
          updateField={changeFieldValues}
        />
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          查询半径
          <Tooltip title={'格式：例“5”，单位米'}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group onChange={handleRadiusTypeChange} value={circleQueryRadiusType}>
            <Radio value={1}>填写值</Radio>
            <Radio value={2}>引用变量</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {circleQueryRadiusType == 1 ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Input placeholder='请输入查询半径' value={circleQueryRadius} onChange={handleRadiusChange} />
          </Col>
        </Row>
      ) : (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={circleQueryRadiusVariable}
          name={'circleQueryRadiusVariable'}
          expression={circleQueryRadiusVariableExp}
          updateField={changeFieldValues}
        />
      )} */}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          图层颜色
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Color
            value={circleBackground}
            onChange={(v) => {
              changeFieldValues('circleBackground', v);
            }}
          />
        </Col>
      </Row>

      {/* <Collapse onChange={(evt) => {}}>
        <Panel header={'互动配置'}> */}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <Switch
            checked={isInteract}
            onChange={(evt) => {
              changeFieldValues('isInteract', evt);
            }}
          />
          <span style={{ marginLeft: '5px' }}>地图互动</span>
        </Col>
      </Row>
      {isInteract && (
        <>
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
              标注
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
        </>
      )}
      {isInteract && isLabelType && (
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
      {isInteract && isLabel && isLabelRadio && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              参数
            </Col>
            <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <EditorParams
                editorType='get'
                initParams={dataParams?.slice(3, 4)}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
          </Row>
          <MapTable dataParams={dataParams?.slice(3, 4) || []}></MapTable>
        </>
        // <VariableRefEsQuery
        //   label={'请选择变量'}
        //   variable={circleQueryLabelVariable}
        //   name={'circleQueryLabelVariable'}
        //   expression={circleQueryLabelVariableExp}
        //   updateField={changeFieldValues}
        // />
      )}
      {isInteract && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            范围调整
          </Col>
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Switch
              checked={isDrag}
              onChange={(evt) => {
                changeFieldValues('isDrag', evt);
              }}
            />
          </Col>
        </Row>
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          是否返回数据
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isReturnData}
            onChange={(evt) => {
              changeFieldValues('isReturnData', evt);
            }}
          />
        </Col>
      </Row>
      {isReturnData && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>数据类型</span>
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('retDataType', evt.target.value);
                }}
                value={retDataType}
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
                // paramOptions={paramOptions}
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

          {/* <VariableRefQuery
            variable={queryApiVariable}
            name={'queryApiVariable'}
            updateField={changeFieldValues}
            isGetFeature={false}
          /> */}
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

      <VariableMonitor variable={deleteCircleVariable} name='deleteCircleVariable' updateField={changeFieldValues} />
      {/*  </Panel>
      </Collapse> */}

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapCircleQuery;
