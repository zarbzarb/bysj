import React, { Fragment, useState, useCallback } from 'react';
import { message, Button, Modal, Space } from 'antd';
// import MonacoEditor from 'react-monaco-editor';
import MonacoEditor from './LazyMonacoEditor';

export default (props) => {
  const { onOk, onCancel, visible, code, op, codeType, tip, container = false, language = 'javascript' } = props;
  const { readOnly } = op;
  const [value, setValue] = useState(code);

  const changeHandler = useCallback((value) => {
    const reg = /((%[A-Z]\d)|(%[A-Z]{2})|(%\d{2})){3,}/g; // 判断是否包含编码字符
    if (reg.test(value)) {
      value = decodeURI(value);
    }
    setValue(value);
  }, []);

  const editorDidMount = useCallback((editor, monaco) => {
    editor && editor.focus();
  }, []);

  const okHandler = useCallback(() => {
    let data;
    if (codeType == 'javascript') {
      onOk(value);
      onCancel();
      return;
    }
    try {
      data = JSON.parse(value);
    } catch {}
    if (!Array.isArray(data) && codeType == 'json') {
      message.error('当前数据源格式应为数组对象格式，请核验代码结构！', 5);
      return;
    }
    onOk(data);
    onCancel();
  }, [codeType, onCancel, onOk, value]);

  return (
    <Modal
      getContainer={() => document.querySelector('#app')}
      zIndex={99999}
      className='antd-dark'
      title='编辑代码'
      width={1000}
      centered
      close
      onCancel={onCancel}
      destroyOnClose={true}
      open={visible}
      keyboard={false}
      footer={
        <>
          <div>
            <Space>
              <Button onClick={onCancel}>取消</Button>
              {!readOnly && (
                <Button type='primary' onClick={okHandler}>
                  确定
                </Button>
              )}
            </Space>
          </div>
        </>
      }
    >
      {tip && (
        <div className='margin-bottom-16'>
          <div>1.仅支持JavaScript表达式，不支持JavaScript语句，如有复杂映射需求，在数据请求映射中处理</div>
          <div>2.当前修改的变量原值以data的参数形式传递进来</div>
          <div>3.可使用data.records、data[0].records取值，也支持三元表达式，字符串、数组方法对数据过滤提取</div>
        </div>
      )}
      <MonacoEditor
        height='400px'
        onClick={() => {}}
        language={language}
        theme='vs-dark'
        value={value}
        options={op}
        onChange={changeHandler}
        editorDidMount={editorDidMount}
      />
    </Modal>
  );
};
