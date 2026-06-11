import React, { Fragment, useState } from 'react';
import { Row, Col, Input } from 'antd';

export default (props) => {
  const { eventInfo, changeEventKeyHandler } = props;
  const [eventKey, setEventKey] = useState(eventInfo.eventKey);
  const changeHandler = (evt) => {
    setEventKey(evt.target.value);
  };
  const blurHandler = () => {
    changeEventKeyHandler(eventKey);
  };
  return (
    <Fragment>
      <Row>
        <Col span={6}>监听key</Col>
        <Col span={18}>
          <Input
            defaultValue={eventKey}
            placeholder='请输入要监听的key'
            onChange={changeHandler}
            onBlur={blurHandler}
          />
        </Col>
      </Row>
    </Fragment>
  );
};
