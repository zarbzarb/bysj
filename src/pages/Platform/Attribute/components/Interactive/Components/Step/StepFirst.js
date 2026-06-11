import React, { useState, memo, Fragment } from 'react';
import { Button, Collapse, Row, Col, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StepSecond from './StepSecond';
import SelectDom from './Select';
// import styles from './index.less';
// v6.18
import { Actions } from '@/staticJson/AnimationComponentsList';
import Header from '../Header';

const { Panel } = Collapse;

export default memo((props) => {
  let { currentEvent, currentComponet, changeFresh, filterClick, isScreenConfig, type, idx } = props;
  let [count, setCount] = useState(0);
  let [monitoringKey, setMonitoringKey] = useState((currentEvent[0] && currentEvent[0].animateKey) || '');

  let [flag, setFlag] = useState(currentEvent[0] && currentEvent[0].animateKey ? true : false);
  const ActionChange = (item, e) => {
    item.type = e;
    setCount(count + 1);
  };

  const addAnimateEvent = () => {
    currentEvent.push({});
    setCount(count + 1);
  };

  return (
    <Collapse key='key0' defaultActiveKey={['1']}>
      <Panel
        header={
          <Header
            idx={idx}
            currentComponet={currentComponet}
            changeFresh={changeFresh}
            filterClick={filterClick}
            type={type}
            monitoringKey={monitoringKey}
          />
        }
        key='1'
      >
        {type == 'monitoringEvent' && !flag ? (
          <Row>
            <Col span={6}>监听key</Col>
            <Col span={18}>
              <Input
                placeholder='请输入要监听的key'
                value={monitoringKey}
                onChange={(e) => setMonitoringKey(e.target.value)}
                onBlur={() => setFlag(true)}
              />
            </Col>
          </Row>
        ) : (
          currentEvent.map((animateItem, index) => {
            if (animateItem == null) {
              return <Fragment />;
            } else {
              let filterAction = Actions.filter((item) => item.value == animateItem.type);
              let copyAnimationTypeList = JSON.parse(JSON.stringify(Actions));
              copyAnimationTypeList.splice(1, copyAnimationTypeList.length - 1);
              if (filterAction.length == 0) {
                return (
                  <SelectDom
                    key={index}
                    data={isScreenConfig ? copyAnimationTypeList : Actions}
                    placeholder={'请选择'}
                    value={animateItem.type || undefined}
                    handleChange={(e) => ActionChange(animateItem, e)}
                    defaultOpen={true}
                  />
                );
              } else {
                return (
                  <StepSecond
                    key={index}
                    idx={index}
                    monitoringKey={monitoringKey || null}
                    animateItem={animateItem} //现在的动画
                    currentEvent={currentEvent}
                    currentComponet={currentComponet}
                    deleteItem={(v) => {
                      currentEvent.splice(v, 1);
                      setCount(count + 1);
                    }}
                  />
                );
              }
            }
          })
        )}
        <Button type='primary' className='addAnimateEvent' onClick={addAnimateEvent} icon={<PlusOutlined />}>
          添加
        </Button>
      </Panel>
    </Collapse>
  );
});
