import React, { Component } from 'react';
// import MonacoEditor from 'react-monaco-editor';
import { FullscreenOutlined } from '@ant-design/icons';
import { throttle } from 'lodash';
import styles from './edit.less';
import MonacoEditor from './components/LazyMonacoEditor';
import ModalEdit from './components/ModalEdit';

export default class ExpressionEdit extends Component {
  constructor(props) {
    super(props);
    this.editor = null;
    this.state = {
      count: 0,
      code: this.props.value,
      visible: false,
    };
    // throttle 节流阀
    this.onBlur = throttle(this.onBlur, 300);
  }

  componentWillUnmount() {
    /**
     * 撤销回退方案中，失去焦点会触发一次数据的更新，去掉此处的onBlur事件
     * 直接离开右侧配置栏会触发onDidBlurEditorText事件
     */
    // 离开右侧配置栏时保存代码
    // this.onBlur();
  }

  // 代码编辑器失去焦点时保存代码
  onBlur = () => {
    const { code } = this.state;
    const { screenId } = this.props;
    this.props.onChange && this.props.onChange(code, screenId);
  };

  /**
   * editor 编辑器实例，所有事件都可以在此监听
   */
  editorDidMount = (editor) => {
    // 代码编辑器失去焦点事件
    editor.onDidBlurEditorText(() => {
      this.onBlur();
    });
    this.editor = editor;
    /**
     * 撤销回退方案中，失去焦点会触发一次数据的更新，默认聚焦会引起bug
     */
    // editor.focus();
  };

  saveCode = (value) => {
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

  toggleVisible = () => {
    this.setState({
      visible: !this.state.visible,
    });
  };
  render() {
    const { codeType, container = false } = this.props;
    const { code, visible } = this.state;
    const op = {
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: false,
      minimap: {
        enabled: false,
      },
    };
    return (
      <div className={styles.largeEdit}>
        <div>
          <FullscreenOutlined onClick={this.toggleVisible} className={styles.fullIcon} />
          <MonacoEditor
            ref='monaco'
            height='200px'
            language='javascript'
            theme='vs-dark'
            value={code}
            options={op}
            codeType={codeType}
            onChange={this.onChange}
            editorDidMount={this.editorDidMount}
          />
        </div>

        {visible && (
          <ModalEdit
            container={container}
            visible={visible}
            onOk={this.saveCode}
            code={code}
            op={op}
            tip={true}
            codeType={codeType}
            onChange={this.onChange}
            onCancel={this.toggleVisible}
          />
        )}
      </div>
    );
  }
}
