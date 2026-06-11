import React, { Component, createRef } from 'react';
import { Col, Row, Input, Slider, InputNumber, Space, Switch, message } from 'antd';
import { trim } from 'lodash';
import { Store } from '@/store/index';
import CustomStylePanelFormConfig from '@/components/CustomStylePanelFormConfig';
import shortUUID from 'short-uuid';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GroupInputNumber } from '@yl/datai-ui';

const { editorStore, pageTreeStore } = Store;
/**
 * 自定义组件样式配置
 */
export default class index extends Component {
  // inputRef;

  constructor(props) {
    super(props);
    const { el } = this.props;
    this.state = {
      createFlag: el.createFlag === undefined ? true : el.createFlag, // 创建
      showFlag: el.showFlag === undefined ? true : el.showFlag, // 显示
    };
    // this.inputRef = createRef();
  }

  componentWillUnmount() {
    // const { forceUpdateLayer } = editorStore;
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

  render() {
    const { styles, el, updateAttr, styleProps, translate } = this.props;
    const item = el;
    const { forceUpdateLayer } = editorStore;
    const { createFlag, showFlag } = this.state;
    const [x, y] = translate;

    const configuration = (() => {
      const conf = window?.[el.customCode]?.Initial?.config?.configuration;

      if (!conf) return null;

      let ctrlConf;

      const fn = (transConf) => {
        return Object.fromEntries(
          transConf.map(({ field, ...ctrl }) => {
            if (ctrl?.type === 'collapse') ctrl.value = fn(ctrl.value);

            return [field ?? `错误声明字段或未声明字段_${shortUUID().new().toString()}`, ctrl];
          }),
        );
      };

      try {
        ctrlConf = fn(conf);
      } catch {
        return null;
      }

      return ctrlConf;
    })();

    return (
      <div className={`yl-comp-config ${styles.demo}`}>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            <Space>
              初始创建
              <Switch
                size='small'
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
                size='small'
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
            {el.key}
          </Col>
        </Row>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            组件标识
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <Input disabled placeholder='请输入' value={el.customCode} />
          </Col>
        </Row>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            名字
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <Input
              // ref={this.inputRef}
              placeholder='请输入'
              defaultValue={el.name || el.compName}
              onChange={(evt) => {
                const val = trim(evt.target.value);
                if (!val) {
                  message.error('组件名称不能为空!');
                  return;
                }
                item.name = val;
                item.compName = val;
                forceUpdateLayer();
                pageTreeStore.setPageInfoStep(1);
              }}
              // onBlur={(evt) => {
              //   const val = trim(evt.target.value);
              //   const comName = el.name || el.compName;
              //   if (comName !== val) {
              //     if (!val) {
              //       message.error('组件名称不能为空!');
              //       return;
              //     }
              //     item.name = val;
              //     item.compName = val;
              //     forceUpdateLayer();
              //     pageTreeStore.setPageInfoStep(1);
              //   }
              // }}
            />
          </Col>
        </Row>

        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            尺寸
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <GroupInputNumber
              value={styleProps}
              fields={['width', 'height']}
              onChange={(value, field) => {
                updateAttr(field, value ?? styleProps[field]);
              }}
            />
          </Col>
        </Row>

        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            位置
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <GroupInputNumber
              resultType='object'
              fields={['x', 'y']}
              value={{ x: translate[0], y: translate[1] }}
              onChange={(value) => {
                updateAttr('transform', `translate(${value.x ?? translate[0]}px, ${value.y ?? translate[1]}px)`);
              }}
            />
          </Col>
        </Row>

        <Row className={styles.field} style={{ display: 'flex', alignItems: 'center' }}>
          <Col flex='auto' className={styles.fieldLabel}>
            透明度
          </Col>
          <Col
            flex='213px'
            className={`${styles.fieldInput} ${styles.opacityField}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Slider
              min={0}
              max={100}
              defaultValue={styleProps.opacity}
              style={{ marginLeft: 0 }}
              onChange={(value) => {
                updateAttr('opacity', value);
              }}
            />
            <InputNumber
              min={0}
              max={100}
              value={styleProps.opacity}
              onChange={(value) => {
                updateAttr('opacity', value);
              }}
            />
          </Col>
        </Row>

        {configuration && (
          <ErrorBoundary
            onError={(err, errorInfo) =>
              console.error('自定义组件配置面板发生错误, 组件:', this.props.el, err, errorInfo)
            }
          >
            <CustomStylePanelFormConfig
              config={configuration}
              defaultValue={el?.props?.configuration}
              onChange={(v) => {
                window.executeCommand('updateField', el, 'configuration', v);
              }}
              styles={styles}
            />
          </ErrorBoundary>
        )}
      </div>
    );
  }
}
