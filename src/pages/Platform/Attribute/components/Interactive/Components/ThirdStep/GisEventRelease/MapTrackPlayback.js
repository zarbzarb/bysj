import React, { useState, useEffect } from 'react';
import { Row, Col, Radio, Select, TreeSelect, Tooltip, Input, Slider, InputNumber, Collapse, Switch } from 'antd';
import _ from 'lodash';
import { QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import LargeEdit from '@/components/commons/LargeEdit';
import CustomUploadImage from '@/components/commons/CustomUploadImage';
import { Color } from '@yl/datai-ui';
import { findCompOfSameType } from '@/utils/componentUtils';
import { getImageUrl } from '@/utils/utils';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { variablesText } from '@/staticJson/MapBasic';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import VariableRefEsQuery from './VariableRefEsQuery';
import styles from './index.less';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getCurrentAction } from '../../../utils';

const { Option } = Select;
const { Panel } = Collapse;
// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      // 区域类型
      trackPlayPathType = 1,
      trackPlayPath = [
        {
          longitude: 116.381612,
          latitude: 39.87011,
          height: 1000,
          patrolTime: '2022-01-19 16:07:45',
        },
        {
          longitude: 116.437482,
          latitude: 39.86955,
          height: 1000,
          patrolTime: '2022-01-19 16:15:45',
        },
      ],
      trackPlayPathVariable = '',
      trackPlayPathVariableExp = 'data',
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '轨迹数据',
        mapValName: 'trackPlayPath',
        value: trackPlayPath,
        variable: trackPlayPathVariable,
        expression: trackPlayPathVariableExp,
        eventType: trackPlayPathType != 1 ? '2' : '1',
        tipMsg: variablesText.trackPlayTipType,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};
const MapTrackPlayback = ({ comp, parentIdx, actionIdx, idx, mapType }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const [layerListArr, setLayerListArr] = useState([]);
  const [desListArr, setDesListArr] = useState([]);
  const [videoListArr, setVideoListArr] = useState([]);
  const [compTreeData, setCompTreeData] = useState([]);

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings.dataParams = value;
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
    const desArr = findCompOfSameType('Descriptions', window.componentList);
    const videoArr = findCompOfSameType('UniversalPlayer', window.componentList);
    setDesListArr(
      desArr.map((item) => {
        return { label: item.name, value: item.key };
      }),
    );
    setVideoListArr(
      videoArr.map((item) => {
        return { label: item.name, value: item.key };
      }),
    );
    setCompTreeData(handleCompTreeData());
  }, []);

  const {
    trackPlayPathType = 1,
    trackPlayPath = [
      {
        longitude: 116.381612,
        latitude: 39.87011,
        height: 1000,
        patrolTime: '2022-01-19 16:07:45',
      },
      {
        longitude: 116.437482,
        latitude: 39.86955,
        height: 1000,
        patrolTime: '2022-01-19 16:15:45',
      },
    ],
    trackPlayPathVariable = '',
    trackPlayPathVariableExp = 'data',

    trackPlayBeginImg = getImageUrl('/assets/datai/gis/playBegin.png'),
    trackPlayEndImg = getImageUrl('/assets/datai/gis/playEnd.png'),
    trackPlayStartImg = getImageUrl('/assets/datai/gis/playStart.png'),
    trackPlayPauseImg = getImageUrl('/assets/datai/gis/playPause.png'),
    trackPlayStopImg = getImageUrl('/assets/datai/gis/playStop.png'),
    trackPlayCloseImg = getImageUrl('/assets/datai/gis/playClose.png'),
    trackPlayDriveImg = getImageUrl('/assets/datai/gis/playDrive.png'),

    offsetX = 0,
    offsetY = 0,
    rotation = 90,

    trackPlayLineType = 1,
    trackPlayLine = 'none',
    trackPlayLineColor = '#F90',
    trackPlayLineWidth = 1,

    isLocationZoom = true, // 是否地图定位
    isAutoPlayBack = false, // 是否自动播放
    playBackWay = 1, // 播放方式
    playBackSpeed = 200,
    playBackTimes = 200,
    isDesLinkage = false,
    isVideoLinkage = false,
    desComKey,
    desComDataType = 'muti',
    singleContentTextField,
    mutiTitleTextField,
    mutiLabelTextField = [],
    mutiContentTextField = [],
    videoComKey,
    videoComSyncTime = 10,
    isHoverWin = false,
    hoverOffsetX = 0,
    hoverOffsetY = 0,
    hoverCompKey = '',
    isClickWin = false,
    clickOffsetX = 0,
    clickOffsetY = 0,
    clickCompKey = '',
    iconPanel = [],
    dataParams = [],
  } = querys;

  const border_dash_list = [
    {
      img: getImageUrl('/assets/datai/dashLine_img/img16_none.png'),
      value: 'none',
    },
    { img: getImageUrl('/assets/datai/dashLine_img/img15_5.png'), value: '16' },
  ];
  const border_fillDash_list = [
    {
      img: getImageUrl('/assets/datai/dashLine_img/img_cross.png'),
      value: 'cross',
    },
  ];

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
    // refresh();
  };

  const handleTrackPlayPathTypeChange = (e) => {
    changeFieldValues('trackPlayPathType', e.target.value);
  };
  const handleTrackLineTypeChange = (e) => {
    changeFieldValues('trackPlayLineType', e.target.value);
    changeFieldValues('trackPlayLine', '');
  };
  const handleTrackPlayLineChange = (val) => {
    changeFieldValues('trackPlayLineWidth', val);
  };
  const handlePlayBackWayChange = (e) => {
    changeFieldValues('playBackWay', e.target.value);
  };

  const onClose = () => {
    setVisible(false);
  };
  const changPanelKey = (keys) => {
    changeFieldValues('iconPanel', keys);
  };
  const handleCompTreeData = () => {
    if (!window.componentList) return [];
    const mapData = (data) => {
      return data.map((item) => {
        const obj = {
          title: item.name || item.compName,
          value: item.key,
          layerId: item.layerId,
        };
        if (item.childComList) {
          const arr = mapData(item.childComList);
          obj.children = arr;
        }
        return obj;
      });
    };
    // TODO 8.0 layerConfig
    const { layerConfig = {} } = window.screenConfig || {};
    return (layerConfig?.layers || [])
      .map((item) => {
        const obj = {
          title: item.layerName,
          value: item.key,
          layerId: item.layerId,
          selectable: false,
          disabled: false,
          children: mapData(
            window.componentList
              .filter((v) => v.layerId === item.layerId)
              .filter(
                (item) =>
                  !['MapFoundationPlan', 'Map3DFoundationPlan', 'MapGlFoundationPlan'].includes(item.englishName),
              ),
          ),
        };
        return obj;
      })
      .filter((comp) => comp.children.length > 0);
  };

  const genExtra = () => {
    <SettingOutlined
      onClick={(event) => {
        // If you don't want click extra trigger collapse, you can prevent this:
        event.stopPropagation();
      }}
    />;
  };

  const trackMsg = `例[
      {
        longitude: 116.381612,
        latitude: 39.87011,
        height: 1000, //单位为米
        patrolTime: '2022-01-19 16:07:45',
        "扩展字段":"value"
      },
      {
        longitude: 116.437482,
        latitude: 39.86955,
        height: 1000,
        patrolTime: '2022-01-19 16:15:45',
        "扩展字段":"value"
      }
    ]`;

  const labelFieldMsg = `例[
    "字段1",
    "字段2",
    "字段3",
    "字段4",
    "字段5"
  ]`;

  const border_list = trackPlayLineType == 1 ? border_dash_list : border_fillDash_list;
  const map3dTypeFlag = mapType.includes('3D');

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          轨迹数据
          <Tooltip title={trackMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group onChange={handleTrackPlayPathTypeChange} value={trackPlayPathType}>
            <Radio value={1}>默认值</Radio>
            <Radio value={2}>数据驱动</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {trackPlayPathType == 1 ? (
        <Row className={styles.field} align='middle'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <LargeEdit
                value={trackPlayPath}
                onChange={(evt) => {
                  changeFieldValues('trackPlayPath', evt);
                }}
              />
            </Col>
          </Row>
        </Row>
      ) : (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            参数
          </Col>
          <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <EditorParams
              editorType='get'
              initParams={dataParams}
              comp={comp} // 当前组件
              eventSetting={eventSettings[parentIdx]} // 当前事件
              onOk={handleOk}
            />
          </Col>
        </Row>
        // <VariableRefEsQuery
        //   label='请选择变量'
        //   variable={trackPlayPathVariable}
        //   name='trackPlayPathVariable'
        //   expression={trackPlayPathVariableExp}
        //   updateField={changeFieldValues}
        // />
      )}
      <Collapse
        expandIconPosition='right'
        onChange={(evt) => {
          changPanelKey(evt);
        }}
        defaultActiveKey={iconPanel}
      >
        <Panel header='图标配置' key='iconset'>
          <CustomUploadImage
            styles={styles}
            label='起点图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayBeginImg}
            field='trackPlayBeginImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayBeginImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayBeginImg && changeFieldValues('trackPlayBeginImg', attr.trackPlayBeginImg);
            }}
          />
          <CustomUploadImage
            styles={styles}
            label='终点图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayEndImg}
            field='trackPlayEndImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayEndImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayEndImg && changeFieldValues('trackPlayEndImg', attr.trackPlayEndImg);
            }}
          />
          <CustomUploadImage
            styles={styles}
            label='开始图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayStartImg}
            field='trackPlayStartImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayStartImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayStartImg && changeFieldValues('trackPlayStartImg', attr.trackPlayStartImg);
            }}
          />
          <CustomUploadImage
            styles={styles}
            label='暂停图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayPauseImg}
            field='trackPlayPauseImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayPauseImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayPauseImg && changeFieldValues('trackPlayPauseImg', attr.trackPlayPauseImg);
            }}
          />
          <CustomUploadImage
            styles={styles}
            label='停止图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayStopImg}
            field='trackPlayStopImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayStopImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayStopImg && changeFieldValues('trackPlayStopImg', attr.trackPlayStopImg);
            }}
          />
          <CustomUploadImage
            styles={styles}
            label='关闭图标'
            el={{ classType: 'antd', changeImageFlag: true }}
            value={trackPlayCloseImg}
            field='trackPlayCloseImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayCloseImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayCloseImg && changeFieldValues('trackPlayCloseImg', attr.trackPlayCloseImg);
            }}
          />
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              水平位置偏移量
            </Col>
            <Col flex='180px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                placeholder='请输入'
                value={offsetX}
                onChange={(evt) => {
                  changeFieldValues('offsetX', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              垂直位置偏移量
            </Col>
            <Col flex='180px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                placeholder='请输入'
                value={offsetY}
                onChange={(evt) => {
                  changeFieldValues('offsetY', evt);
                }}
              />
            </Col>
          </Row>
          <CustomUploadImage
            styles={styles}
            label='行驶图标'
            el={{ classType: 'antd' }}
            value={trackPlayDriveImg}
            field='trackPlayDriveImg'
            updateField={(attr, url) => {
              changeFieldValues('trackPlayDriveImg', url);
            }}
            updateAttr={(attr) => {
              attr && attr.trackPlayDriveImg && changeFieldValues('trackPlayDriveImg', attr.trackPlayDriveImg);
            }}
          />
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              行驶默认角度
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                placeholder='请输入'
                value={rotation}
                onChange={(evt) => {
                  changeFieldValues('rotation', evt);
                }}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>
      <Collapse expandIconPosition='right' onChange={() => {}}>
        <Panel header='线段样式'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              填充类型
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group onChange={handleTrackLineTypeChange} value={trackPlayLineType}>
                <Radio value={1}>色块</Radio>
                {mapType && !mapType.includes('3D') && <Radio value={2}>模板</Radio>}
              </Radio.Group>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              线段类型
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Select
                style={{ width: '100%' }}
                value={trackPlayLine}
                placeholder='请选择类型'
                onChange={(evt) => {
                  changeFieldValues('trackPlayLine', evt);
                }}
              >
                {border_list.map((item) => (
                  <Option value={item.value}>
                    {' '}
                    <img src={item.img} alt='' style={{ width: '100%', height: '20px' }} />
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              颜色
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Color
                value={trackPlayLineColor}
                onChange={(value) => {
                  changeFieldValues('trackPlayLineColor', value);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              线宽
            </Col>
            <Col span={10}>
              <Slider
                min={1}
                max={50}
                onChange={handleTrackPlayLineChange}
                value={typeof trackPlayLineWidth === 'number' ? trackPlayLineWidth : 0}
              />
            </Col>
            <Col span={6}>
              <InputNumber
                min={1}
                max={50}
                style={{ margin: '0 2px', width: '60px' }}
                value={trackPlayLineWidth}
                onChange={handleTrackPlayLineChange}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      <Collapse expandIconPosition='right' onChange={(evt) => {}}>
        <Panel header='互动配置'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              定位&缩放
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Switch
                checked={isLocationZoom}
                onChange={(evt) => {
                  changeFieldValues('isLocationZoom', evt);
                }}
              />
            </Col>
          </Row>

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              自动播放
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Switch
                checked={isAutoPlayBack}
                onChange={(evt) => {
                  changeFieldValues('isAutoPlayBack', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              播放方式
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group onChange={handlePlayBackWayChange} value={playBackWay}>
                <Radio value={1}>匀速</Radio>
                <Radio value={2}>按时间</Radio>
              </Radio.Group>
            </Col>
          </Row>
          {playBackWay == 1 ? (
            <Row className={styles.field}>
              <Col flex='auto' className={styles.fieldLabel}>
                速度
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <InputNumber
                  min={1}
                  value={playBackSpeed}
                  onChange={(evt) => {
                    changeFieldValues('playBackSpeed', evt);
                  }}
                />
              </Col>
            </Row>
          ) : (
            <Row className={styles.field}>
              <Col flex='auto' className={styles.fieldLabel}>
                播放倍速
              </Col>
              <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <InputNumber
                  min={1}
                  value={playBackTimes}
                  onChange={(evt) => {
                    changeFieldValues('playBackTimes', evt);
                  }}
                />
              </Col>
            </Row>
          )}
        </Panel>
      </Collapse>

      <Collapse collapsible={isDesLinkage} expandIconPosition='right' onChange={(evt) => {}}>
        <Panel
          header={
            <div>
              <Switch
                checked={isDesLinkage}
                onChange={(evt) => {
                  changeFieldValues('isDesLinkage', evt);
                }}
              />
              <span style={{ marginLeft: '5px' }}>数据联动</span>
            </div>
          }
        >
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              选择组件
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Select
                style={{ width: '100%' }}
                value={desComKey}
                placeholder='请选择类型'
                onChange={(evt) => {
                  changeFieldValues('desComKey', evt);
                }}
              >
                {desListArr.map((item) => (
                  <Option value={item.value}>{item.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          {/* <Row className={styles.field} align="middle">
            <Col flex="auto" className={styles.fieldLabel}>
              数据方案
            </Col>
            <Col
              flex="206px"
              className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(e) =>
                  changeFieldValues('desComDataType', e.target.value)
                }
                value={desComDataType}>
                <Radio value={'single'}>单一来源</Radio>
                <Radio value={'muti'}>多来源</Radio>
              </Radio.Group>
            </Col>
          </Row>
          {desComDataType == 'single' && (
            <Row className={styles.field} align="middle">
              <Col flex="auto" className={styles.fieldLabel}>
                contentText映射字段
              </Col>
              <Col
                flex="156px"
                className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Input
                  value={singleContentTextField}
                  onChange={(evt) => {
                    changeFieldValues(
                      'singleContentTextField',
                      evt.target.value
                    );
                  }}
                />
              </Col>
            </Row>
          )} */}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              标题字段
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Input
                value={mutiTitleTextField}
                onChange={(evt) => {
                  changeFieldValues('mutiTitleTextField', evt.target.value);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              label字段
              <Tooltip title={labelFieldMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <LargeEdit
                value={mutiLabelTextField}
                onChange={(evt) => {
                  changeFieldValues('mutiLabelTextField', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              内容字段
              <Tooltip title={labelFieldMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <LargeEdit
                value={mutiContentTextField}
                onChange={(evt) => {
                  changeFieldValues('mutiContentTextField', evt);
                }}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>
      <Collapse expandIconPosition='right' onChange={(evt) => {}}>
        <Panel
          header={
            <div>
              <Switch
                checked={isVideoLinkage}
                onChange={(evt) => {
                  changeFieldValues('isVideoLinkage', evt);
                }}
              />
              <span style={{ marginLeft: '5px' }}>视频联动</span>
            </div>
          }
        >
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              选择组件
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Select
                style={{ width: '100%' }}
                value={videoComKey}
                placeholder='请选择类型'
                onChange={(evt) => {
                  changeFieldValues('videoComKey', evt);
                }}
              >
                {videoListArr.map((item) => (
                  <Option value={item.value}>{item.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              同步时间
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                min={1}
                value={videoComSyncTime}
                formatter={(value) => `${value}s`}
                parser={(value) => value.replace('s', '')}
                onChange={(evt) => {
                  changeFieldValues('videoComSyncTime', evt);
                }}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      <Collapse expandIconPosition='right' onChange={(evt) => {}}>
        <Panel
          header={
            <div>
              <Switch
                checked={isHoverWin}
                onChange={(evt) => {
                  changeFieldValues('isHoverWin', evt);
                }}
              />
              <span style={{ marginLeft: '5px' }}>鼠标悬停</span>
            </div>
          }
        >
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              水平偏移量
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                value={hoverOffsetX}
                onChange={(evt) => {
                  changeFieldValues('hoverOffsetX', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              垂直偏移量
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                value={hoverOffsetY}
                onChange={(evt) => {
                  changeFieldValues('hoverOffsetY', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              弹窗对应组件
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <TreeSelect
                style={{ width: '192px' }}
                className='yl-comp-field-content'
                treeData={compTreeData}
                value={hoverCompKey}
                onChange={(value) => {
                  changeFieldValues('hoverCompKey', value);
                }}
                showCheckedStrategy='TreeSelect.SHOW_ALL'
                placeholder='请选择'
                showArrow={true}
                treeDefaultExpandAll={true}
                dropdownStyle={{
                  background: '#03050a',
                  border: '1px solid #3fb5d2',
                  zIndex: 9999,
                }}
                virtual={false}
                suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      <Collapse expandIconPosition='right' onChange={(evt) => {}}>
        <Panel
          header={
            <div>
              <Switch
                checked={isClickWin}
                onChange={(evt) => {
                  changeFieldValues('isClickWin', evt);
                }}
              />
              <span style={{ marginLeft: '5px' }}>鼠标单击</span>
            </div>
          }
        >
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              水平偏移量
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                value={clickOffsetX}
                onChange={(evt) => {
                  changeFieldValues('clickOffsetX', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              垂直偏移量
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <InputNumber
                value={clickOffsetY}
                onChange={(evt) => {
                  changeFieldValues('clickOffsetY', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              弹窗对应组件
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <TreeSelect
                suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                style={{ width: '192px' }}
                className='yl-comp-field-content'
                treeData={compTreeData}
                value={clickCompKey}
                onChange={(value) => {
                  changeFieldValues('clickCompKey', value);
                }}
                showCheckedStrategy='TreeSelect.SHOW_ALL'
                placeholder='请选择'
                showArrow={true}
                treeDefaultExpandAll={true}
                dropdownStyle={{
                  background: '#03050a',
                  border: '1px solid #3fb5d2',
                  zIndex: 9999,
                }}
                virtual={false}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default observer(MapTrackPlayback);
