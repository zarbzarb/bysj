import React, { useState } from 'react';
import { Row, Col, TreeSelect, Tree } from 'antd';
import _ from 'lodash';
import ReactJson from 'react-json-view';
import { getDataByKey } from '@/utils/dataStoreUtils';
import '../index.less';

const { TreeNode } = TreeSelect;

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
const VariableTree = () => {
  const [state, setState] = useState();
  let data = _.cloneDeep(window.dataStore);
  data.forEach((vl, idx) => {
    vl.title = vl.name;
    vl.children &&
      vl.children.forEach((child) => {
        child.title = child.name;
      });
  });

  let isJson = typeof state == 'object';

  return (
    <Row>
      <Col>
        <Tree
          onSelect={(evt) => {
            let key = evt[0];
            if (key) {
              setState(getDataByKey(key)); // 根据key获取全局变量的值
            } else {
              setState();
            }
          }}
          defaultExpandAll={true}
          treeData={data}
        />
      </Col>
      <Col>
        {!isJson && state && <div className='log_dataShow'>{state || '--'}</div>}
        {isJson && state && <ReactJson name={false} displayDataTypes={false} src={state} theme='monokai' />}
      </Col>
    </Row>
  );
};

export default VariableTree;
