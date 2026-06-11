import React from 'react';
import { Select, Row, Col, InputNumber } from 'antd';
// import { DownOutlined, UpOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './index.less';
import { AnimationTypes } from '@/staticJson/AnimationComponentsList';
// const { Panel } = Collapse;
const { Option } = Select;

export default (props) => {
  let { item, idx, refresh } = props;

  // const [count, setCount] = useState(0);

  let isEnd = item.hasEnd;

  return (
    <div>
      <div className={styles.frame}>
        <div key={props.step} className={`${styles.animateStep}`}>
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={6}>
              动画类型
            </Col>
            <Col span={18}>
              <Select
                style={{ height: '32px' }}
                onChange={(value) => {
                  item.animationType = value;
                  let arr = AnimationTypes.filter((item) => item.value == value);
                  item.hasEnd = arr[0] && arr[0].hasEnd;

                  if (item.hasEnd) {
                    item.stopPos = {
                      x: 0,
                      y: 0,
                    };
                  } else {
                    delete item.stopPos;
                  }

                  refresh();
                }}
                value={item.animationType}
                placeholder='请选择动画方式'
              >
                {AnimationTypes.map((animateType, idx) => {
                  return <Option value={animateType.value}>{animateType.name}</Option>;
                })}
              </Select>
            </Col>
          </Row>
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={6}>
              时长(s)
            </Col>
            <Col span={18}>
              <InputNumber
                value={item.duration}
                min={0}
                onBlur={(evt) => {
                  item.duration = evt.target.value - 0;
                  refresh();
                }}
                onStep={(evt) => {
                  item.duration = evt;
                  refresh();
                }}
                placeholder={'请输入'}
              />
            </Col>
          </Row>
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={6}>
              延迟(s)
            </Col>
            <Col span={18}>
              <InputNumber
                onBlur={(evt) => {
                  item.delay = evt.target.value - 0;
                  refresh();
                }}
                onStep={(evt) => {
                  item.delay = evt;
                  refresh();
                }}
                value={item.delay}
                placeholder={'请输入'}
                min={0}
              />
            </Col>
          </Row>

          {isEnd && (
            <Row className={styles.animteRow}>
              <Col className={styles.label} span={6}>
                结束位置
              </Col>
              <Col span={18}>
                <span className={styles.unitText}>x：</span>
                <InputNumber
                  className={styles.endInput}
                  onBlur={(evt) => {
                    item.stopPos.x = evt.target.value - 0 || 0;
                    refresh();
                  }}
                  onStep={(evt) => {
                    item.stopPos.x = evt;
                    refresh();
                  }}
                  value={item.stopPos.x}
                />
                <span className={styles.unitText}>y：</span>
                <InputNumber
                  className={styles.endInput}
                  onBlur={(evt) => {
                    item.stopPos.y = evt.target.value - 0 || 0;
                    refresh();
                  }}
                  onStep={(evt) => {
                    item.stopPos.y = evt;
                    refresh();
                  }}
                  value={item.stopPos.y}
                />
              </Col>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
};
