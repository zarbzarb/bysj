import React, { useState } from 'react';
import { Collapse, Row, Input, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './index.less';

const { Panel } = Collapse;

export default (props) => {
  const [refresh, setRefresh] = useState(0);
  const { currentEvent, delHandler, idx } = props;

  const changeValue = (evt) => {
    currentEvent[idx].settings.emitEventName = evt.target.value;
    setRefresh(refresh + 1);
  };

  const deleteHandler = (e) => {
    e.stopPropagation();
    e.preventDefault();
    delHandler(idx);
  };

  return (
    <Collapse key='key2' className={'secondCollapse'}>
      <Panel
        header={
          <div className={styles.header}>
            <span className={styles.left}>事件发布</span>
            <div className={styles.right}>
              <DeleteOutlined title='删除' onClick={deleteHandler} />
            </div>
          </div>
        }
      >
        <Row>
          <Col flex='100px' style={{ lineHeight: '50px', paddingLeft: '8px' }}>
            发布事件key
          </Col>
          <Col flex='1'>
            <Input
              size='large'
              style={{
                width: 'calc(100% - 40px)',
                margin: '10px 20px 10px 20px',
              }}
              onChange={changeValue}
              value={currentEvent[idx] && currentEvent[idx].settings && currentEvent[idx].settings.emitEventName}
              placeHolder='请输入发布事件key'
            />
          </Col>
        </Row>
      </Panel>
    </Collapse>
  );
};
