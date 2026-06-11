import React, { useState } from 'react';
import { Input, ConfigProvider, Select, Row, Col, Modal, Button } from 'antd';

const { Option } = Select;

export default (props) => {
  const [refresh, setRefresh] = useState(0);

  const { visiable, closeHandler, item, idx } = props;
  const cancelHandler = () => {
    closeHandler(false);
  };
  let currentSelectItem = item.eventSetings.selected[idx];

  const changeConditionHandler = (value) => {
    currentSelectItem[99] = {
      type: value,
    };
    setRefresh(refresh + 1);
  };
  const changeConditionEqualValue = (evt) => {
    currentSelectItem[99].value = evt.target.value;
    setRefresh(refresh + 1);
  };

  let type, value;
  if (currentSelectItem[99]) {
    type = currentSelectItem[99].type;
    value = currentSelectItem[99].value;
  }

  return (
    <ConfigProvider componentSize={'small'} getPopupContainer={() => document.querySelector('body')}>
      <Modal
        title='选中触发'
        open={visiable}
        onCancel={cancelHandler}
        footer={
          <div>
            <Button onClick={cancelHandler}>取消</Button>
            <Button type='primary' onClick={cancelHandler}>
              确定
            </Button>
          </div>
        }
      >
        <Row>
          <Col span='8'>
            <Select value={type} onChange={changeConditionHandler} placeholder='请选择触发条件' style={{ width: 140 }}>
              <Option value='all'>选中触发</Option>
              <Option value='value'>值等于</Option>
              <Option value='text'>文本等于</Option>
            </Select>
          </Col>
          <Col span='8'>
            {(type == 'value' || type == 'text') && (
              <Input placeholder='请输入等于的条件' value={value} onChange={changeConditionEqualValue} />
            )}
          </Col>
        </Row>
      </Modal>
    </ConfigProvider>
  );
};
