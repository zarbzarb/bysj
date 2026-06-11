import React, { Fragment } from 'react';
import {
  Tooltip,
  // Input,
  // Radio,
  // Switch,
  Row,
  Col,
  // TreeSelect,
  // Collapse
} from 'antd';
import LargeEdit from '@/components/commons/LargeEdit';
// import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
// import { validDefaultValueType } from 'AntdLibs/common/Validate/validateDefault';

// const { TreeNode } = TreeSelect;
// const { Panel } = Collapse;
// const renderNode = (children = []) => {
//   return children.map((variableGroup, idx) => {
//     return (
//       <TreeNode disabled value={variableGroup.key} title={variableGroup.name}>
//         {variableGroup.children &&
//           variableGroup.children.map((variable, index) => {
//             return (
//               <TreeNode value={variable.key} title={variable.name}></TreeNode>
//             );
//           })}
//       </TreeNode>
//     );
//   });
// };
const Variable = (props) => {
  let { el, styles, updateField } = props;
  let { defaultValue } = el.dataset;
  return (
    <Fragment>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>默认值设置</span>
          <Tooltip title='默认值主要用于对当前变量依赖及表达式失败时，自动填补，也可用于非引用数据默认值'>
            <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <LargeEdit
            value={defaultValue}
            onChange={(evt) => {
              updateField('defaultValue', evt);
            }}
          />
        </Col>
      </Row>
    </Fragment>
  );
};

export default Variable;
