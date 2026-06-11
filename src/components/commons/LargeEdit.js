import React, { Component } from 'react';
import { message } from 'antd';
// import MonacoEditor from 'react-monaco-editor';
import { FullscreenOutlined } from '@ant-design/icons';
// import { createKeyName } from '@/utils/random';
// import $, { type } from 'jquery';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import styles from './edit.less';
import MonacoEditor from './components/LazyMonacoEditor';
import ModalEdit from './components/ModalEdit';

export default class JSEdit extends Component {
  constructor(props) {
    super(props);
    this.language = props.language || 'javascript';
    this.editor = null;
    this.state = {
      count: 0,
      code: this.props.value,
      visible: false,
    };
    this.onBlur = throttle(this.onBlur, 300);
    this.emptyHandler = throttle(this.emptyHandler, 300);
  }

  componentDidMount() {
    const { mode } = this.props;
    if (mode === 'full-screen') {
      window.addEventListener('blur', this.onBlur);
      window.addEventListener('keydown', this.keyDownSave);
    }
  }
  componentWillUnmount() {
    // 自动调用保存会在无感知的状态下更新数据到回退栈中
    // this.onBlur();
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('keydown', this.keyDownSave);
  }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   console.log({ nextProps });
  //   if (nextProps.value !== this.props.value) {
  //     this.setState({
  //       code: nextProps.value,
  //     });
  //   }
  // }

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.code) {
      return {
        code: props.value,
      };
    }
    return null;
  }

  onBlur = (code) => {
    if (!code) {
      code = this.state.code;
    }
    // const { code } = this.state;
    const { screenId } = this.props;
    this.props.onChange && this.props.onChange(code, screenId);
  };
  keyDownSave = (e) => {
    if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      this.onBlur();
    }
  };
  editorDidMount = (editor, monaco) => {
    editor.onDidBlurEditorText(() => {
      this.onBlur();
    });
    this.editor = editor;

    // 编辑器默认聚焦会导致撤销候重做时自动执行一步更新编辑器中的数据操作,此现象主要集中在地图交互中引用的变量框
    // editor.focus();
  };
  changeValue = (newValue, e) => {
    this.setState({
      code: newValue,
    });
  };
  saveCode = (value) => {
    if (value == undefined) {
      message.error('JavaScript语法错误，请检查代码格式!');
      return;
    }
    const { screenId } = this.props;
    this.props.onChange && this.props.onChange(value, screenId);
    this.setState({
      code: value,
    });
    this.toggleVisible();
  };
  onChange = (newValue) => {
    this.setState({
      code: newValue,
    });
  };
  emptyHandler = (newValue) => {
    const reg = /((%[A-Z]\d)|(%[A-Z][A-Z])|(%\d\d)){3,}/g; // 判断是否包含编码字符
    if (reg.test(newValue)) {
      newValue = decodeURI(newValue);
    }
    let valuesCode;
    if (newValue == undefined) {
      return;
    }
    try {
      valuesCode = JSON.parse(newValue);
    } catch (e) {
      message.error('格式错误，请按照原文本框内格式填写');
      return;
    }
    this.setState({
      code: valuesCode,
    });
    this.onBlur(valuesCode);
  };

  toggleVisible = () => {
    this.setState({
      visible: !this.state.visible,
    });
  };
  render() {
    const {
      className = '',
      title,
      container = false,
      codeType,
      options = {},
      fullScreenVisible = true,
      mode = 'form',
      height = 'calc(100vh - 56px)',
      readOnly = false,
    } = this.props;
    const { code, visible } = this.state;
    const op = {
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: readOnly,
      cursorStyle: 'line',
      automaticLayout: false,
      ...options,
    };
    return (
      <div className={styles.largeEdit}>
        <div>
          {fullScreenVisible ? <FullscreenOutlined onClick={this.toggleVisible} className={styles.fullIcon} /> : null}
          <MonacoEditor
            height='250px'
            language={this.language}
            theme='vs-dark'
            value={JSON.stringify(code, null, '\t')}
            options={op}
            onChange={this.emptyHandler}
            editorDidMount={this.editorDidMount}
          />
        </div>

        {visible && (
          <ModalEdit
            container={container}
            visible={visible}
            onOk={this.saveCode}
            code={JSON.stringify(code, null, '\t')}
            op={op}
            codeType={codeType}
            changeValue={this.emptyHandler}
            onCancel={this.toggleVisible}
            language={this.language}
          />
        )}
      </div>
    );
  }
}

JSEdit.propTypes = {
  mode: PropTypes.oneOf(['form', 'full-screen']),
};
