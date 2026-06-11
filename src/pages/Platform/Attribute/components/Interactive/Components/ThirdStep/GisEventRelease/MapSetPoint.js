import React, { useState, useEffect } from 'react';
import { Row, Col, TreeSelect, Tooltip, Button, Radio, InputNumber, Switch } from 'antd';
import { observer } from 'mobx-react';
import _ from 'lodash';
import add from '@/assets/newIcon/add.png';
import { QuestionCircleOutlined } from '@ant-design/icons';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
import { getImageUrl } from '@/utils/utils';
import { useStore } from '@/hooks';
import CustomUploadImage from '@/components/commons/CustomUploadImage';
import { variablesText } from '@/staticJson/MapBasic';
import styles from './index.less';
import VariableRefEsQuery from './VariableRefEsQuery';
import VariableMonitor from './VariableMonitor';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import MapTable from './MapTable';
import { getCurrentAction } from '../../../utils';

const { TreeNode } = TreeSelect;

const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode key={variable.key} value={variable.key} title={variable.name} />;
          })}
      </TreeNode>
    );
  });
};

// const { Option } = Select;

// 用来判断是否是地图选点打开的资源管理弹框
let isMapPointImageEditModal = false;
// 本地图片是否打开
let isLocalImage = false;

const paramOptions = [
  {
    label: 'all',
    value: 'all',
  },
  {
    label: 'lng',
    value: 'lng',
  },
  {
    label: 'lat',
    value: 'lat',
  },

  {
    label: 'address',
    value: 'name',
  },
];
// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    addressVariable = '',
    isVariable1 = false,
    isVariable2 = false,
    imgSrcVariable,
    imgSrcVariableExp = 'data',
    imgSizeVariable,
    imgSizeVariableExp = 'data',
    imgSrc = './assets/datai/icons/marker.png',
    scale = 1,
    saveParams = [],
    dataParams = [],
  } = item.actionSettings;
  if (dataParams.length === 0) {
    const mapOptions = [
      {
        label: '图片路径',
        mapValName: 'imgSrc',
        value: imgSrc,
        variable: imgSrcVariable,
        expression: imgSrcVariableExp,
        eventType: '2',
        tipMsg: '格式：图片路径，例："/assets/datai/icons/water_map.jpg',
      },
      {
        label: '图片缩放比例',
        mapValName: 'scale',
        value: scale,
        variable: imgSizeVariable,
        expression: imgSizeVariableExp,
        eventType: '2',
        tipMsg: '格式：缩放比例，例：2',
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  } else if (dataParams[0] && !dataParams[0].tipMsg) {
    dataParams[0].tipMsg = '格式：图片路径，例："/assets/datai/icons/water_map.jpg';
    dataParams[1].tipMsg = '格式：缩放比例，例：2';
  }

  // v8.16: 去掉填写值，合到编辑参数，因此兼容旧屏
  if (!isVariable1) {
    item.actionSettings.dataParams[0].eventType = '2';
    item.actionSettings.dataParams[0].updateType = 1;
    item.actionSettings.dataParams[0].inputVal = imgSrc;
    item.actionSettings.isVariable1 = true;
  }
  if (!isVariable2) {
    item.actionSettings.dataParams[1].eventType = '2';
    item.actionSettings.dataParams[1].updateType = 1;
    item.actionSettings.dataParams[1].inputVal = scale;
    item.actionSettings.isVariable2 = true;
  }

  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'addressVariable',
        value: 'all',
        variable: addressVariable,
        expression: 'data',
        eventType: '2',
        //  tipMsg: variablesText.setPointTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

const MapSetPoint = ({ comp, parentIdx, actionIdx, idx }) => {
  const {
    ossStore,
    controlStore: { toggleDataVisible },
  } = useStore();
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item);
  const [testResult, setTestResult] = useState([]);
  const [querys, setQuerys] = useState(item.actionSettings);
  // 为了重新加载后能记住之前的是否处于下拉展示状态
  const [activeKey, setActiveKey] = useState(
    (isMapPointImageEditModal && ossStore.imageEdit) || isLocalImage ? ['1'] : [],
  );

  const {
    // name,
    // value,
    addressVariable = '',
    // 点样式默认关闭
    pointStyleVisible = false,
    isVariable1 = false,
    isVariable2 = false,
    imgSrcVariable,
    imgSrcVariableExp = 'data',
    imgSizeVariable,
    imgSizeVariableExp = 'data',
    imgSrc = './assets/datai/icons/marker.png',
    scale = 1,
    isLocal = true,
    deleteVariable,
    saveParams = [],
    dataParams = [],
  } = querys;

  // 保存编辑参数
  const handleOk = (value, editorType) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      const type = editorType == 'get' ? 'dataParams' : 'saveParams';
      item.actionSettings[type] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
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

  const onShowState = () => {
    setTestResult(getDataByKey(addressVariable));
  };

  const uploadClickCallback = () => {
    isMapPointImageEditModal = true;
  };

  const handleImageChangeCallback = () => {
    isLocalImage = true;

    setTimeout(() => {
      // 组件重新加载后，恢复初始化值
      isLocalImage = false;
    }, 1000);
  };

  useEffect(() => {
    if (!ossStore.imageEdit && isMapPointImageEditModal) {
      isMapPointImageEditModal = false;
    }
  }, [ossStore.imageEdit]);

  const variableVal = addressVariable;
  const variableField = 'addressVariable';

  const visibleImgSrc = pointStyleVisible
    ? getImageUrl('/assets/datai/icons/visible.svg')
    : getImageUrl('/assets/datai/icons/invisible.svg');

  const headerNode = (
    <span>
      <img
        className={styles.visibleImgIcon}
        src={visibleImgSrc}
        alt=''
        onClick={() => {
          changeFieldValues('pointStyleVisible', !pointStyleVisible);
        }}
      />
      点样式
    </span>
  );

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          点样式
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={pointStyleVisible}
            onChange={(evt) => {
              changeFieldValues('pointStyleVisible', evt);
            }}
          />
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          访问中台服务
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isLocal}
            onChange={(evt) => {
              changeFieldValues('isLocal', evt);
            }}
          />
        </Col>
      </Row>
      {pointStyleVisible && (
        <>
          {/* <Panel key="1" header={headerNode}> */}
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              参数
              {/* <Tooltip title={'格式：图片路径，例："/assets/datai/icons/water_map.jpg"'}>
                <QuestionCircleOutlined
                  style={{
                    fontSize: '14px',
                    color: '#3fb5d2',
                    marginLeft: 4,
                  }}
                />
              </Tooltip> */}
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <EditorParams
                editorType='get'
                initParams={dataParams}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
            {/* <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isVariable1', evt.target.value);
                }}
                value={isVariable1}
              >
                <Radio className={styles.radioLable} value={false}>
                  填写值
                </Radio>
                <Radio className={styles.radioLable} value={true}>
                  数据驱动
                </Radio>
              </Radio.Group>
            </Col> */}
          </Row>
          <Row className={styles.field} align='middle'>
            <MapTable dataParams={dataParams || []}></MapTable>
          </Row>
          {/* {isVariable1 ? (
            <>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  参数
                </Col>
                <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                  <EditorParams
                    editorType='get'
                    initParams={dataParams.slice(0, 1)}
                    comp={comp} // 当前组件
                    eventSetting={eventSettings[parentIdx]} // 当前事件
                    onOk={handleOk}
                  />
                </Col>
              </Row>
            </>
          ) : (
            // 该组件选择图片后会让整个组件重新加载，也就是 state 初始化了
            <CustomUploadImage
              styles={styles}
              label=''
              el={{ classType: 'antd' }}
              value={imgSrc}
              field='imgSrc'
              updateField={(attr, url) => {
                changeFieldValues('imgSrc', url);
              }}
              updateAttr={(attr) => {
                attr && attr.imgSrc && changeFieldValues('imgSrc', attr.imgSrc);
              }}
              uploadClickCallback={uploadClickCallback}
              handleImageChangeCallback={handleImageChangeCallback}
            />
          )} */}
          {/* <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              图片缩放比例
              <Tooltip title='格式：缩放比例，例：2'>
                <QuestionCircleOutlined
                  style={{
                    fontSize: '14px',
                    color: '#3fb5d2',
                    marginLeft: 4,
                  }}
                />
              </Tooltip>
            </Col>
            <Col flex='190px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isVariable2', evt.target.value);
                }}
                value={isVariable2}
              >
                <Radio className={styles.radioLable} value={false}>
                  填写值
                </Radio>
                <Radio className={styles.radioLable} value={true}>
                  数据驱动
                </Radio>
              </Radio.Group>
            </Col>
          </Row> */}
          {/* {isVariable2 ? (
            <>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  参数
                </Col>
                <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                  <EditorParams
                    editorType='get'
                    initParams={dataParams.slice(1, 2)}
                    comp={comp} // 当前组件
                    eventSetting={eventSettings[parentIdx]} // 当前事件
                    onOk={handleOk}
                  />
                </Col>
              </Row>
            </>
          ) : (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel} />
              <Col flex='206px' className={`${styles.fieldInput} ${styles.sizeField}`}>
                <InputNumber
                  style={{ width: 190 }}
                  value={scale}
                  onChange={(value) => {
                    const scale = value || 0;
                    changeFieldValues('scale', scale);
                  }}
                />
              </Col>
            </Row>
          )} */}
        </>
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-4'>数据存储到</span>
          <Tooltip title={'数据结构：{lng:"116",lat:"39",name: "北京"}'}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', marginLeft: 4 }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <EditorParams
            filterUpdateType={[2, 3]}
            editorType='setOther'
            initParams={saveParams}
            paramOptions={paramOptions}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
            showVariableExpression={false}
            action={action}
          />
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <MapTable dataParams={saveParams || []}></MapTable>
      </Row>

      <VariableMonitor variable={deleteVariable} name='deleteVariable' updateField={changeFieldValues} />
    </div>
  );
};

export default observer(MapSetPoint);
