import React, { Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect } from 'antd';
import LargeEdit from '@/components/commons/LargeEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';

const tipComList = [
  'Text',
  'Button',
  'UniversalPlayer', // 通用播放器
  'ColorPicker', // 颜色选择器
];

const tipMessage = {
  VisualSwiper:
    '根据媒体地址判断多媒体类型，图片支持：jpg，jpeg，png，gif；视频支持mp4和rtmp视频流，target是指外链打开方式，支持_blank、_parent、_self、_top为空时则表示不支持外链',
  Text: `支持两种数据类型：字符串和数组对象。默认是字符串，支持的数组对象格式为：
  [
    {
      "text": "string"
    }
  ]`,
  // 指标文本
  Statistic: `支持两种数据类型：对象和数组。默认是对象，支持的数组格式为：
  [
    {
      "label": "",
      "value": 78
    }
  ]`,
  Other: '默认值主要用于对当前变量依赖及表达式失败时，自动填补，也可用于非引用数据默认值',
};
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
  let { el, styles, updateField, dataset } = props;
  let { variable, refDataType, expression, defaultValue } = dataset ? dataset : el.dataset;
  return (
    <Fragment>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>默认值设置</span>
          <Tooltip
            title={
              el.type === 'VisualSwiper' || el.type === 'Statistic'
                ? tipMessage[el.type]
                : tipComList.includes(el.type)
                ? tipMessage.Text
                : tipMessage.Other
            }
          >
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
