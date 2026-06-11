import React, { useEffect, useState, Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect, Button } from 'antd';
import add from '@/assets/newIcon/add.png';
import styles from '../index.less';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
import LargeEdit from '@/components/commons/LargeEdit';
import { encode } from 'js-base64';
import { useStore } from '@/hooks';

const { TreeNode } = TreeSelect;
const { YunliMap } = window;
// const { Panel } = Collapse;
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode key={variable.key} value={variable.key} title={variable.name}></TreeNode>;
          })}
      </TreeNode>
    );
  });
};
const Variable = (props) => {
  let { variable, updateField, filter, layerCode, isType, onTestCallback, name, isGetFeature = true, title } = props;
  const [status, setStatus] = useState(0);
  const [testResult, setTestResult] = useState();
  const [variables, setVariables] = useState();
  const [expressions, setExpressions] = useState('data');
  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  //回显添加对应的id,表达式
  useEffect(() => {
    // setExpressions(expression || 'data');
    setVariables(variable);
  }, [variables, expressions, variable]);
  //通过数据id获取对应的数据
  const testAjaxHandler = () => {
    setStatus(1);
    setTestResult(undefined);
    let mapInstanceFn = window.YunliMap;
    if (!mapInstanceFn) {
      mapInstanceFn = window.YunliMap3D;
    }
    try {
      mapInstanceFn.getFeatureByFilter({
        layerCode: layerCode,
        // cqlfilter: filter,
        cqlFilterEncrypt: encode(filter), // 广东需求，安全性处理
        needPolygon: isType,
        callback: (data) => {
          setStatus(2);
          setTestResult(data);
        },
      });
    } catch (e) {
      console.error(e);
    }
  };
  /**
   * 请求接口获取
   */
  const handleTestAjax = () => {
    if (typeof onTestCallback != 'function') {
      testAjaxHandler();
    } else {
      setStatus(1);
      setTestResult(undefined);
      onTestCallback((data) => {
        setStatus(2);
        setTestResult(data);
      });
    }
  };
  return (
    <Fragment>
      <Row className={styles.field + ' ' + styles.treeStyles} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          {title ? title : '数据存储到'}
        </Col>
        <Col flex='206px' style={{ display: 'flex' }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <TreeSelect
            showSearch
            defaultValue={variable}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              updateField(name, evt);
              isGetFeature && updateField('layerCodes', layerCode);
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ marginLeft: '5px', marginTop: '5px' }}
            onClick={(value) => {
              toggleDataVisible();
            }}
          >
            <img src={add} />
          </a>
        </Col>
      </Row>
      {isGetFeature && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            查看变量结构
          </Col>
          <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Button type='primary' ghost onClick={handleTestAjax} style={{ marginRight: '12px' }}>
              测试接口返回值
            </Button>
            {status == 1 && <span>编译中</span>}
            {status == 2 && testResult && (
              <Tooltip
                destroyTooltipOnHide={true}
                overlayClassName={styles.dataShowTooltip}
                placement='topLeft'
                title={
                  <div style={{ width: '240px' }}>
                    <LargeEdit language={'json'} value={testResult} />
                  </div>
                }
              >
                <span>查看结果</span>
              </Tooltip>
            )}
          </Col>
        </Row>
      )}
      {/* <DataManage type={'1'} /> */}
    </Fragment>
  );
};

export default Variable;
