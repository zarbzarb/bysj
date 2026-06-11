import React, { Fragment, useState } from 'react';
import { Row, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './index.less';
// import MobxGet from '@/utils/MobxGet';

export default (props) => {
  const { idx = -1, filterClick, type, monitoringKey, currentComponet, changeFresh } = props;

  // let store = MobxGet('InterActiveStore');
  const [visiable, setVisiable] = useState();
  const genExtra = (type) => (
    <DeleteOutlined
      title='删除'
      className={styles.deleteOut}
      onClick={(event) => {
        event.stopPropagation();
        if (idx == -1) {
          delete currentComponet.eventSetings[type];
        } else {
          currentComponet.eventSetings[type].splice(idx, 1);
        }
        changeFresh();
      }}
    />
  );

  // const enableHandler = (e) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   store.toggleSelectVisiable(idx);
  // };

  // const toggleVisiable = () => {
  //   let bool = !visiable;
  //   setVisiable(bool);
  // };

  return (
    <Fragment>
      <Row>
        <Col span={12}>{filterClick[0].name + ' ' + (type == 'monitoringEvent' ? monitoringKey : '')}</Col>
        <Col span={12} className='right'>
          {genExtra(filterClick[0].value)}
        </Col>
      </Row>
    </Fragment>
  );
};
