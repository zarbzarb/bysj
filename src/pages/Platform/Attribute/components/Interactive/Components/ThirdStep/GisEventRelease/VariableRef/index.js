import React, { useEffect, useState, Fragment } from 'react';
import {
  Tooltip,
  // Input,
  // Radio,
  // Switch,
  Row,
  Col,
  TreeSelect,
  // Collapse
} from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import add from '@/assets/newIcon/add.png';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import styles from '../index.less';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { variablesText } from '@/staticJson/MapBasic';
import { babelTransform } from '@/utils/utils';
import { useStore } from '@/hooks';

const { TreeNode } = TreeSelect;
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
  let { variable, expression, name, updateField } = props;
  // const [names, setNames] = useState(false);
  const [variables, setVariables] = useState();
  const [expressions, setExpressions] = useState('data');

  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  //回显添加对应的id,表达式
  useEffect(() => {
    setExpressions(expression || 'data');
    setVariables(variable);
  }, [variables, expressions]);

  //通过数据id获取对应的数据
  const testHandler = (evt, expression) => {
    // console.log(evt, expression, variables);
    let data;
    try {
      data = getDataByKey(evt || variables); // 根据key获取全局变量的值
      // if (expression.indexOf('return') < 0) {
      //   expression = `return ${expression}`;
      // }
      data = babelTransform(expression, data); // 运行时ES6转ES5
    } catch (e) {
      data = JSON.stringify(e);
    }
    //定位数据
    updateField(name + '', data);
  };
  return (
    <Fragment>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          {/* 请选择变量 */}
          <span className='margin-right-8'>请选择变量</span>
          {name == 'mapShow' && (
            <Tooltip title={variablesText.mapShowType}>
              <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
            </Tooltip>
          )}
        </Col>
        <Col flex='206px' style={{ display: 'flex' }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <TreeSelect
            showSearch
            defaultValue={variable}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              switch (name) {
                case 'lat':
                  updateField('latVariable', evt);
                  break;
                case 'label':
                  updateField('labelVariable', evt);
                  break;
                case 'renderLayerData':
                  updateField('renderLayerVariable', evt);
                  break;
                case 'mapShow':
                  updateField('mapShowVariable', evt);
                  break;
                default:
                  updateField('variable', evt);
                  break;
              }
              // name == 'lat'
              //   ? updateField('latVariable', evt)
              //   : updateField('variable', evt);
              setVariables(evt);
              // testHandler(evt, expressions);
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ marginLeft: '5px' }}
            onClick={(value) => {
              toggleDataVisible();
            }}
          >
            <img src={add} />
          </a>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>变量表达式</span>
          <Tooltip title={name == 'renderLayerData' ? variablesText.renderText : variablesText.comText}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <ExpressionEdit
            value={expression}
            codeType='javascript'
            onChange={(evt) => {
              let expression = evt;
              if (expressions.indexOf('return') >= 0) {
                expression = expressions.replace('return ', '');
              }
              switch (name) {
                case 'lat':
                  updateField('latExpression', evt);
                  break;
                case 'label':
                  updateField('labelExpression', evt);
                  break;
                case 'renderLayerData':
                  updateField('renderLayerExpression', evt);
                  break;
                case 'mapShow':
                  updateField('mapShowExpression', evt);
                  break;
                default:
                  updateField('expression', evt);
                  break;
              }
              // name == 'lat'
              //   ? updateField('latExpression', expression)
              //   : updateField('expression', expression);
              setExpressions(expression);
              // testHandler(variables, expression);
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <PreviewVariable label='测试' title='预览值' styles={styles} variable={variable} expression={expressions} />
        </Col>
      </Row>
      {/* <DataManage type={'1'} /> */}
    </Fragment>
  );
};

export default Variable;
