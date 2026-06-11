import React, { useState, useCallback, useEffect } from 'react';
// import { message } from 'antd';
// import MonacoEditor from 'react-monaco-editor';
import MonacoEditor from './components/LazyMonacoEditor';

export default (props) => {
  const { code, op, changeValue, codeType } = props;
  const [value, setValue] = useState(code);
  const changeHandler = useCallback(
    (value) => {
      // %E4%B8%AD%E5%8F%B0%E6%B5%8B%E8%AF%95/%E4%B8%AD%E6%96%87%E8%A7%86%E9%A2%91%E5%9C%B0%E5%9D%80-test.mp4
      // %E4%B8%AD 一个中文字符
      const reg = /((%[A-Z]\d)|(%[A-Z][A-Z])|(%\d\d)){3,}/g; // 判断是否包含编码字符
      if (reg.test(value)) {
        value = decodeURI(value);
      }
      setValue(value);
      changeValue(value);
    },
    [changeValue],
  );
  const editorDidMount = useCallback((editor, monaco) => {
    editor && editor.focus();
  }, []);

  useEffect(() => {
    setValue(code);
  }, [code]);
  // const okHandler = useCallback(() => {
  //   let data;
  //   try {
  //     data = JSON.parse(value);
  //   } catch (e) {}
  //   if (!Array.isArray(data) && codeType == 'json') {
  //     message.error('当前数据源格式应为数组对象格式，请核验代码结构！', 5);
  //     return;
  //   } else {
  //     onOk(data);
  //     onCancel();
  //   }
  // }, [codeType, value]);

  return (
    <MonacoEditor
      height='400px'
      onClick={() => {}}
      language='javascript'
      theme='vs-dark'
      value={value}
      options={op}
      onChange={changeHandler}
      editorDidMount={editorDidMount}
    />
  );
};
