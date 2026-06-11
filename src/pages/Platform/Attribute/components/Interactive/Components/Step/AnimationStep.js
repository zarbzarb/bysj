import React, { useState, memo } from 'react';
import { Row, Col, InputNumber } from 'antd';
import { DownOutlined, UpOutlined, DeleteOutlined } from '@ant-design/icons';
import SelectDom from './Select';
import PosInput from '../posInput';
import styles from './index.less';
import { AnimationComponentsList } from '@/staticJson/AnimationComponentsList';

export default memo(
  (props) => {
    let { currentAnimateQueue, animateItem, deleteStepItem, alignText, posAlign } = props;
    const [count, setCount] = useState(0);
    const [putWayVal, setPutWayVal] = useState(false);
    let animateData = AnimationComponentsList.filter((item) => {
      return item.animationType == animateItem.type || item.animationType == 'both';
    });
    const putWay = () => {
      setPutWayVal(!putWayVal);
    };
    const onChange = (val, e) => {
      currentAnimateQueue[val] = e;
      if (val == 'animationType') {
        let arr = AnimationComponentsList.filter((item) => item.value == e);
        currentAnimateQueue['hasEnd'] = arr[0] && arr[0].hasEnd;
      }
      setCount(count + 1);
    };
    return (
      <div className={styles.frame}>
        <div key={props.step} className={`${styles.animateStep} ${putWayVal ? styles.hiddenStep : ''}`}>
          <div>
            <span className='point'></span>动画步骤{props.step}{' '}
            {!putWayVal ? <DownOutlined onClick={putWay} /> : <UpOutlined onClick={putWay} />}
            <DeleteOutlined
              title='删除'
              className='putWay deleteIcon'
              onClick={() => {
                deleteStepItem(props.step);
              }}
            />{' '}
            <span className='putWay' onClick={putWay}>
              {putWayVal ? '展开' : '收起'}
            </span>
          </div>
          <Row>
            <Col span={6}>动画类型</Col>
            <Col span={18}>
              <SelectDom
                data={animateData}
                placeholder={'请选择'}
                value={currentAnimateQueue.animationType || undefined}
                handleChange={(e) => onChange('animationType', e)}
              />
            </Col>
          </Row>
          <Row>
            <Col span={6}>时长(s)</Col>
            <Col span={18}>
              <InputNumber
                min={0}
                placeholder={'请输入'}
                value={currentAnimateQueue.duration || ''}
                onChange={(e) => onChange('duration', e)}
              />
            </Col>
          </Row>
          <Row>
            <Col span={6}>延迟(s)</Col>
            <Col span={18}>
              <InputNumber
                placeholder={'请输入'}
                value={currentAnimateQueue.delay || ''}
                min={0}
                onChange={(e) => onChange('delay', e)}
              />
            </Col>
          </Row>
          {currentAnimateQueue.hasEnd ? (
            <Row>
              <Col span={6}>{`结束位置${alignText}`}</Col>
              <Col span={18}>
                <PosInput
                  value={currentAnimateQueue.stopPos}
                  onChange={(e) => onChange('stopPos', e)}
                  posAlign={posAlign}
                />
              </Col>
            </Row>
          ) : null}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.step == nextProps.step) {
      return true;
    }
    return false;
  },
);
