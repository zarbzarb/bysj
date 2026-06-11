import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { Switch, Input, Row, Col, Radio, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import StoreTree from '@/components/StoreTree';
import styles from './index.less';
import _ from 'lodash';

const Index = ({ item, refresh }) => {
  const [actionSettings, setActionSettings] = useState(item.actionSettings);

  const {
    // eventKey,
    // eventType,
    // eventValue,
    variableKey,
    // gisType = undefined,
    // mapKey = undefined,
    mapConfig = {},
  } = actionSettings;
  const {
    layerName = '',
    legendCode = '',
    // variable = '',
    // visible = 'visible',
    visibleChecked = true,
    visibleStatus = true,
    layerCodeChecked = true,
    filterChecked = true,
    legendFilter = undefined,
  } = mapConfig;
  // const { Option } = Select;

  const visibleOpts = [
    {
      label: '显示',
      value: true,
    },
    {
      label: '隐藏',
      value: false,
    } /*,
    {
      label: '切换',
      value: 'change'
    }*/,
  ];
  useEffect(() => {
    if (!mapConfig.hasOwnProperty('visibleChecked')) {
      item.actionSettings.mapConfig['visibleChecked'] = true;
      item.actionSettings.mapConfig['visibleStatus'] = true;
    }
    if (!mapConfig.hasOwnProperty('layerCodeChecked')) {
      item.actionSettings.mapConfig['layerCodeChecked'] = true;
    }
    if (!mapConfig.hasOwnProperty('filterChecked')) {
      item.actionSettings.mapConfig['filterChecked'] = true;
    }
    let tempState = _.cloneDeep(item.actionSettings);
    setActionSettings(tempState);
  }, []);
  // const mapComponents = useMemo(() => {
  //   let arrTmp = [];
  //   window.componentList.forEach((item) => {
  //     let obj = {
  //       label: item.name || item.compName,
  //       value: item.key
  //     };
  //     if (item.classType == 'customMap') {
  //       arrTmp.push(obj);
  //     }
  //   });
  //   //console.log('arrTmp**', arrTmp);
  //   return arrTmp;
  // }, [window.componentList]);

  const changeFieldValue = (value, path) => {
    let field = path.split('.');
    if (field.length == 1) {
      let fieldItem1 = field[0];
      item.actionSettings[fieldItem1] = value;
    } else if (field.length == 2) {
      let fieldItem1 = field[0];
      let fieldItem2 = field[1];
      item.actionSettings[fieldItem1][fieldItem2] = value;
    }
    let tempState = _.cloneDeep(item.actionSettings);
    setActionSettings(tempState);
    //refresh();
  };
  const tooltipMsg = [
    '选择变量：选择的变量可以注入到过滤条件作为查询条件',
    "过滤条件：填写sql语法where语句之后内容，如：type='1' and address LIKE #{data.userName}。",
    '其中#{data.userName}是注入的变量，data是变量引用名称，userName变量中的具体内容',
  ];
  const { TextArea } = Input;
  return (
    <Fragment>
      <div className={styles.mapSetContainer}>
        <Row className={styles.mapSetRow}>
          <Col className={styles.label} span={7}>
            图层编码
          </Col>
          <Col span={17}>
            <Input
              defaultValue={layerName}
              onBlur={(evt) => {
                changeFieldValue(evt.target.value, 'mapConfig.layerName');
              }}
              placeholder='请输入要操作的图层编码'
            />
          </Col>
        </Row>
        <Row className={styles.mapSetRow}>
          <Col className={styles.label} span={12}>
            <Switch
              style={{ marginRight: '5px' }}
              checked={visibleChecked}
              onChange={(val) => {
                changeFieldValue(val, 'mapConfig.visibleChecked');
              }}
            />
            显隐操作
          </Col>
        </Row>

        {visibleChecked && (
          <Row className={styles.mapSetRow}>
            <Col className={styles.label} span={7}></Col>
            <Col span={17}>
              <Radio.Group
                options={visibleOpts}
                onChange={(evt) => {
                  changeFieldValue(evt.target.value, 'mapConfig.visibleStatus');
                }}
                value={visibleStatus}
                optionType='button'
              />
            </Col>
          </Row>
        )}

        <Row className={styles.mapSetRow}>
          <Col className={styles.label} span={12}>
            <Switch
              style={{ marginRight: '5px' }}
              checked={layerCodeChecked}
              onChange={(val) => {
                changeFieldValue(val, 'mapConfig.layerCodeChecked');
              }}
            />
            显示图例
          </Col>
        </Row>
        {layerCodeChecked && (
          <Row className={styles.mapSetRow}>
            <Col className={styles.label} span={7}>
              图例编码
            </Col>
            <Col span={17}>
              <Input
                defaultValue={legendCode}
                onBlur={(evt) => {
                  changeFieldValue(evt.target.value, 'mapConfig.legendCode');
                }}
                placeholder='请输入图例编码，逗号分割'
              />
            </Col>
          </Row>
        )}
        <Row className={styles.mapSetRow}>
          <Col className={styles.label} span={12}>
            <Switch
              style={{ marginRight: '5px' }}
              checked={filterChecked}
              onChange={(val) => {
                changeFieldValue(val, 'mapConfig.filterChecked');
              }}
            />
            是否过滤
            <Tooltip
              title={
                <div>
                  {tooltipMsg.map((item) => {
                    return (
                      <span>
                        {item}
                        <br />
                      </span>
                    );
                  })}
                </div>
              }
            >
              <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
            </Tooltip>
          </Col>
        </Row>
        {filterChecked && (
          <>
            <Row className={styles.mapSetRow}>
              <Col className={styles.label} span={7}>
                选择变量
              </Col>
              <Col span={17}>
                <StoreTree
                  value={variableKey}
                  onChange={(val) => {
                    changeFieldValue(val, 'variableKey');
                  }}
                />
              </Col>
            </Row>
            <Row className={styles.mapSetRow}>
              <Col className={styles.label} span={7}>
                过滤条件
              </Col>
              <Col span={17}>
                <TextArea
                  defaultValue={legendFilter}
                  placeholder='支持变量注入'
                  onBlur={(evt) => {
                    changeFieldValue(evt.target.value, 'mapConfig.legendFilter');
                  }}
                  rows={3}
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </Fragment>
  );
};

export default Index;
