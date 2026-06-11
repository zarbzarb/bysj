import React, { Component } from 'react';
import { Col, Row, message, Input, Space, Switch } from 'antd';
import classNames from 'classnames';
import { trim } from 'lodash';
import type { PropsParamsType } from 'Src/types/CompType';
import { listerAttrWraperScroll } from '@/utils/componentUtils';
import { Store } from '@/store/index';
import EllipsisMiddle from '@/components/commons/EllipsisMiddle';
import ErrorBoundary from '@/components/ErrorBoundary';
import s from './index.less';

const { editorStore: EditorStore, pageTreeStore } = Store;

type IState = {
  comName: string;
  createFlag: boolean;
  showFlag: boolean;
};
export default class index extends Component<PropsParamsType, IState> {
  scrollEle = null;

  // inputRef: RefObject<any>;

  constructor(props: PropsParamsType) {
    super(props);
    const { el } = this.props;
    this.state = {
      comName: el.compName || el.name,
      createFlag: el.createFlag === undefined ? true : el.createFlag, // 创建
      showFlag: el.showFlag === undefined ? true : el.showFlag, // 显示
    };
    // this.inputRef = createRef();
  }

  static getDerivedStateFromProps(nextProps: PropsParamsType) {
    const { el } = nextProps;
    return {
      comName: el.compName || el.name,
      createFlag: el.createFlag === undefined ? true : el.createFlag, // 创建
      showFlag: el.showFlag === undefined ? true : el.showFlag, // 显示
    };
  }

  componentDidMount() {
    // 滚动时关闭下拉面板
    this.scrollEle.addEventListener('scroll', listerAttrWraperScroll);
  }

  componentWillUnmount() {
    this.scrollEle.removeEventListener('scroll', listerAttrWraperScroll);
    // const { forceUpdateLayer } = EditorStore;
    // const { el } = this.props;
    // const { comName } = this.state;
    // if (this.inputRef.current.input) {
    //   const { value } = this.inputRef.current.input;
    //   console.log('输入框的值是:', value);
    //   if (comName !== value) {
    //     if (!value) {
    //       message.error('组件名称不能为空!');
    //       return;
    //     }
    //     el.name = value;
    //     el.compName = value;
    //     forceUpdateLayer();
    //     pageTreeStore.setPageInfoStep(1);
    //   }
    // }
  }

  renderError = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50px',
      }}
    >
      组件属性配置面板发生异常!
    </div>
  );

  render() {
    const { styles, el, StylePage } = this.props;
    const { forceUpdateLayer } = EditorStore;

    const { comName, createFlag, showFlag } = this.state;

    const item = el;

    return (
      <div className={styles.demo} data-name='scrollAttr'>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            <Space>
              初始创建
              <Switch
                checked={createFlag}
                onChange={(value) => {
                  if (value) {
                    item.showFlag = showFlag; // 确保两个属性同时出现
                  } else {
                    item.showFlag = false;
                    this.setState({ showFlag: false });
                  }
                  item.createFlag = value;
                  this.setState({ createFlag: value });
                  forceUpdateLayer();
                  pageTreeStore.setPageInfoStep(1);
                }}
              />
            </Space>
          </Col>
          <Col flex='auto' className={styles.fieldLabel}>
            <Space>
              初始显示
              <Switch
                checked={showFlag}
                onChange={(value) => {
                  if (!createFlag) {
                    return;
                  }
                  item.createFlag = true; // 确保两个属性同时出现

                  item.showFlag = value;
                  this.setState({ showFlag: value });
                  forceUpdateLayer();
                  pageTreeStore.setPageInfoStep(1);
                }}
              />
            </Space>
          </Col>
        </Row>

        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            key
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <EllipsisMiddle suffixCount={8}>{el.key}</EllipsisMiddle>
          </Col>
        </Row>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            名字
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <Input
              // ref={this.inputRef}
              onChange={(evt) => {
                const val = trim(evt.target.value);
                if (!val) {
                  message.error('组件名称不能为空!');
                  return;
                }
                item.name = val;
                item.compName = val;
                this.setState({ comName: val });
                forceUpdateLayer();
                pageTreeStore.setPageInfoStep(1);
              }}
              value={comName}
              // defaultValue={comName}
              // onBlur={(evt) => {
              //   const val = trim(evt.target.value);
              //   if (comName !== val) {
              //     if (!val) {
              //       message.error('组件名称不能为空!');
              //       return;
              //     }
              //     item.name = val;
              //     item.compName = val;
              //     this.setState({ comName: val });
              //     forceUpdateLayer();
              //     pageTreeStore.setPageInfoStep(1);
              //   }
              // }}
            />
          </Col>
        </Row>
        <div
          className={classNames(styles.demo, s.wrap)}
          ref={(ele) => {
            this.scrollEle = ele;
          }}
        >
          <ErrorBoundary
            onError={(error, errInfo) => {
              console.error(`组件${item.key}配置面板发生错误`, error, errInfo);
            }}
            fallback={this.renderError()}
          >
            <StylePage {...this.props} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}
