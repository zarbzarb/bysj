import React, { useEffect, useState, memo } from 'react';
import { Radio, Button, Space, Form, Input, Select, message } from 'antd';
import './index.less';
import $ from 'jquery';
import Draggable from 'react-draggable';
import { CloseOutlined } from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import VariableTree from './VariableTree';
import AllLog from './AllLog';

const { Option } = Select;

const LogApp = ({ visible, toggleConsoleTool, previewLog }) => {
  const [count, setCount] = useState(0);
  const [tabIndex, setTabIndex] = useState('log');
  const [logList, setLogList] = useState(window.logList);

  const changeHandler = (evt) => {
    setTabIndex(evt.target.value);
  };

  let timeCount;
  useEffect(() => {
    if (!window.globalEventEmitter) return;
    const listenFn = () => {
      clearTimeout(timeCount);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeCount = setTimeout(() => {
        setCount(count + 1);
      }, 300);
    };
    window.globalEventEmitter.on('logUpdate', listenFn);
    return () => {
      window.globalEventEmitter.removeListener('logUpdate', listenFn);
    };
  }, [count]);

  useEffect(() => {
    const containerEl = $('.logListContainer');
    // let realContainerEl = $('.logListContainer>div');
    const scrollH = $('.logListContainer>div').height() - $('.logListContainer').height();
    containerEl.scrollTop(scrollH);
  }, [count]);

  useEffect(() => {
    setLogList(window.logList); // REVIEW 清空日志后继续记录新的日志
  }, [logList]);

  const clearLog = () => {
    window.logList.length = 0;
    setLogList([]);
  };

  const onFinish = (values) => {
    const { key, type } = values;
    if (!key) {
      if (type === 'variable') {
        message.warning('请输入变量标识');
      } else if (type === 'component') {
        message.warning('请输入组件key');
      }
      return;
    }
    const list = logList.filter((log) => {
      const { info } = log;
      const { variable } = info;
      if (key === variable) {
        return true;
      }
      return false;
    });
    setLogList(list);
  };

  const [size, setSize] = useState({ width: 600, height: 360 });

  const onResize = (event, { size: sizeOR }) => {
    setSize({ width: sizeOR.width, height: sizeOR.height });
  };

  const [placeholder, setPlaceHolder] = useState('变量标识');

  const onChange = (values) => {
    if (values === 'variable') {
      setPlaceHolder('变量标识');
    } else if (values === 'component') {
      setPlaceHolder('组件key');
    }
  };

  const isHidden = visible ? '' : ' hidden';

  return (
    <Draggable disabled>
      <Resizable height={size.height} width={size.width} onResize={onResize}>
        <div
          className={`antd-dark ${isHidden} log_assist`}
          style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
          <div className='log_headBar '>
            {previewLog ? (
              <Form layout='inline' onFinish={onFinish}>
                <Form.Item name='key'>
                  <Input placeholder={`请输入${placeholder}`} />
                </Form.Item>
                <Form.Item name='type' initialValue='variable'>
                  <Select getPopupContainer={(triggerNode) => triggerNode} onChange={onChange}>
                    <Option value='variable'>变量</Option>
                    <Option value='component'>组件</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type='primary' htmlType='submit'>
                    搜索
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Radio.Group optionType='button' buttonStyle='outline' value={tabIndex} onChange={changeHandler}>
                <Radio.Button value='log'>日志</Radio.Button>
                <Radio.Button value='data'>变量</Radio.Button>
              </Radio.Group>
            )}
            <Space>
              <Button type='primary' onClick={clearLog}>
                清空日志
              </Button>
              <CloseOutlined onClick={toggleConsoleTool} className='log_closeBtn' />
            </Space>
          </div>
          <div className='log_logContainer'>
            {tabIndex === 'log' && (
              <div className='logListContainer'>
                <AllLog len={logList.length} logList={logList} />
              </div>
            )}

            {tabIndex === 'data' && <VariableTree />}
          </div>
        </div>
      </Resizable>
    </Draggable>
  );
};

export default memo(LogApp);
