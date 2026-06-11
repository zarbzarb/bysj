import React from 'react';
import { Row, Col, Table, Popover, Input, Tooltip, Select } from 'antd';
import EditInput from '../EditInput';
import { produce } from 'immer';
// immer的更新则只改变更新的部分结构
import s from './index.less';
import SortTree from '@/components/StoreTree';
import { QuestionCircleOutlined } from '@ant-design/icons';
const boolOptions = [
  { label: 'true', value: true },
  { label: 'false', value: false },
];
const { Option } = Select;
const RefContent = (props) => {
  // item 当前行数据 index 行号 dataSource 整个列表数据 onChange 值修改
  const { item, index, onChange, dataSource } = props;

  // const ref = useRef();

  const resetInputValue = () => {
    // ref.current.value = 'data';
  };

  return (
    <div>
      <Row>
        <Col span={7}>引入变量</Col>
        <Col span={16}>
          <SortTree
            value={item.example}
            onChange={(value, text) => {
              const newV = produce(dataSource, (draft) => {
                //draft[index].status = v !== draft[i].defaultValue;
                draft[index].example = text.toString();
                draft[index].isRefer = true;
                draft[index].exampleValue = value;
                draft[index].exampleExpression = 'data';
                resetInputValue();
              });
              onChange(newV);
            }}
          />
        </Col>
      </Row>
      <Row className='margin-top-8'>
        <Col span={7}>
          <span className='margin-right-6'>表达式</span>
          <Tooltip title='表达式可以对依赖的变量数据进行属性的选择或者过滤，默认变量ref为data，例：data.userName'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col span={16}>
          <Input
            value={item.exampleExpression}
            onChange={(evt) => {
              const newV = produce(dataSource, (draft) => {
                draft[index].exampleExpression = evt.target.value;
              });
              onChange(newV);
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

function ParamsTable(props) {
  // 参数列表值value， 修改函数onChange
  const { onChange, value } = props;
  // 修改默认值
  const onChangeValue = (v, i) => {
    const newV = produce(value, (draft) => {
      // console.log(draft, '99999999');
      // immer的更新则只改变更新的部分结构
      draft[i].status = v !== draft[i].defaultValue;
      draft[i].example = v;
    });
    onChange(newV);
  };
  // 引用操作
  const onRefer = () => {};
  // 重置操作
  const onReset = (i) => {
    const newV = produce(value, (draft) => {
      draft[i].status = false;
      draft[i].isRefer = false;
      draft[i].example = draft[i].defaultValue;
    });
    onChange(newV);
  };
  // 列描述数据对象
  const columns = [
    {
      title: '参数名', // 列头显示文字（函数用法 3.10.0 后支持）
      dataIndex: 'name', // 列数据在数据项中对应的路径，支持通过数组查询嵌套路径
      ellipsis: true, //超过宽度将自动省略，暂不支持和排序筛选一起使用。设置为 true 或 { showTitle?: boolean } 时，表格布局将变成 tableLayout="fixed"。
      width: 90, // 列宽度
      render: (text, record, index) => {
        if (record.required) {
          return (
            <>
              <span style={{ color: '#ff4d4f', paddingTop: '8px' }}>*</span>
              <span>{text}</span>
            </>
          );
        }
        return <span>{text}</span>;
      },
    },
    {
      title: '默认值',
      dataIndex: 'example',
      ellipsis: true,
      width: 90,
      render: (text, record, index) => {
        // 生成复杂数据的渲染函数，参数分别为当前行的值，当前行数据，行索引
        if (record.isRefer) {
          return <span>{text !== undefined ? String(text) : text}</span>;
        }
        if (record.type === 'boolean') {
          return (
            <Select value={Boolean(text)} onChange={(v) => onChangeValue(v, index)}>
              {boolOptions.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          );
        }
        return (
          <EditInput
            value={text}
            verify={false} // 数据校验，是否必须
            onChange={(v) => onChangeValue(v, index)}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 40,
      render: (text, record, index) => {
        if (record.isRefer) {
          return <span>引用</span>;
        }
        if (text) {
          // status 为true
          return <span>已改</span>;
        }
        return <span>未改</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'active',
      width: 70,
      render: (text, record, i) => {
        return (
          <span className={s.handleWrap}>
            <a onClick={() => onReset(i)}>重置</a>
            <Popover
              content={<RefContent dataSource={value} onChange={onChange} index={i} item={record} />}
              trigger='click'
              placement='bottomRight'
            >
              <a onClick={onRefer}>引用</a>
            </Popover>
          </span>
        );
      },
    },
  ];
  return (
    <div>
      <div className={s.titleWrap}>
        <div className={s.title}>入参配置</div>
      </div>
      <Table
        columns={columns} // 表格列的配置描述
        dataSource={value} // 数据数组
        pagination={false} // 分页器，参考配置项或 pagination 文档，设为 false 时不展示和进行分页
        bordered // 是否展示外边框和列边框
        rowKey='id' // 表格行 key 的取值，可以是字符串或一个函数
        size='small'
      />
    </div>
  );
}

export default ParamsTable;
