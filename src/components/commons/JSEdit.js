/* eslint-disable unicorn/filename-case */
import React, { useState, useLayoutEffect, useRef } from 'react';
import { Input } from 'antd';
// import * as monaco from 'monaco-editor';
// import MonacoEditor from 'react-monaco-editor';
import { FullscreenOutlined } from '@ant-design/icons';
// import { createKeyName } from '@/utils/random';
// import $ from 'jquery';
// import PropTypes from 'prop-types';
// import { throttle } from 'lodash';
import MonacoEditor from './components/LazyMonacoEditor';
import ModalEdit from './components/ModalEdit';

const JSEdit = (props) => {
  const { id, value, screenId } = props;
  const editorRef = useRef(null);
  // const monacoRef = useRef(null);
  // 代码内容
  const [code, setCode] = useState(value);
  const codeRef = useRef(value);
  // form类型，是否打开代码编辑器
  const [visible, setVisible] = useState(false);
  // 失去焦点
  const onBlur = () => {
    if (props.onChange) {
      props.onChange(codeRef.current, screenId);
    }
    // props.onChange && props.onChange(code, screenId);
  };
  /**
   * 编辑器被挂载到 DOM 中之后
   * @param {*} editor 编辑器实例
   * @param {*} monaco monaco 编辑器本身
   */
  const editorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // monacoRef.current = monaco;
    editor.focus();
    const { mode, onRef } = props;
    if (
      mode === 'full-screen' && // hook 页面
      onRef
    ) {
      onRef(editorRef, codeRef);
    }
    // v7.4 优化： 监听 ctrl + s 事件，原来的方式保存会执行多次（一个tab一次）且原生监听该事件的方式有时在 monaco-editor 不灵，故换成代码编辑器插件自带的，
    // 需要注意的是鼠标焦点需要在编辑器上才走这里,否则则走浏览器默认的
    editor.addCommand(
      // eslint-disable-next-line no-bitwise
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        onBlur();
      },
    );
  };
  const changeValue = (newValue, e) => {
    setCode(newValue);
  };

  const saveCode = (val) => {
    const { onChange } = props;
    setCode(val);
    const t = setTimeout(() => {
      onChange?.(val, screenId);
      setVisible(false);
    }, 100);
  };

  const onChange = (newValue) => {
    setCode(newValue);
  };

  const showEditor = () => {
    setVisible(true);
  };
  // 实时获取代码内容，防止截获旧值
  useLayoutEffect(() => {
    codeRef.current = code;
  }, [code]);

  const { codeType = 'code', options = {}, mode = 'form', height = 'calc(100vh - 56px)' } = props;
  const op = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: false,
    ...options,
  };

  if (mode === 'form') {
    return (
      <div style={{ width: '100%', padding: '0 10px' }}>
        <Input
          readOnly
          placeholder='请打开代码编辑器进行编辑'
          suffix={<FullscreenOutlined onClick={showEditor} style={{ cursor: 'pointer', color: '#efefef' }} />}
        />
        {visible && (
          <ModalEdit
            codeType={codeType}
            visible={visible}
            onOk={saveCode}
            code={code}
            op={op}
            changeValue={changeValue}
            onCancel={() => setVisible(false)}
          />
        )}
      </div>
    );
  }
  return (
    <MonacoEditor
      language='javascript'
      theme='vs-dark'
      key={`MonacoEditor-${id}`}
      value={code}
      options={op}
      height={height}
      onChange={onChange}
      editorDidMount={editorDidMount}
    />
  );
};

export default JSEdit;
