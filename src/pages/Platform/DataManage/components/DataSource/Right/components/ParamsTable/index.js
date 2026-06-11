import React from 'react';
import { Row, Col, Table, Popover, Input, Tooltip } from 'antd';
import EditInput from '../EditInput';
import { produce } from 'immer';
import s from './index.less';
import SortTree from '@/components/StoreTree';
import { QuestionCircleOutlined } from '@ant-design/icons';

const RefContent = (props) => {
  const { item, index, onChange, dataSource } = props;

  // const ref = useRef();

  const resetInputValue = () => {
    // ref.current.value = 'data';
  };

  return (
    <div>
      <Row>
        <Col span={8}>引入变量</Col>
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
        <Col span={8}>
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
  const { onChange, value } = props;
  const onChangeValue = (v, i) => {
    const newV = produce(value, (draft) => {
      draft[i].status = v !== draft[i].defaultValue;
      draft[i].example = v;
    });
    onChange(newV);
  };
  const onRefer = () => {};
  const onReset = (i) => {
    const newV = produce(value, (draft) => {
      draft[i].status = false;
      draft[i].isRefer = false;
      draft[i].example = draft[i].defaultValue;
    });
    onChange(newV);
  };
  const columns = [
    {
      title: '参数名',
      dataIndex: 'name',
      ellipsis: true,
      width: 90,
    },
    {
      title: '默认值',
      dataIndex: 'example',
      ellipsis: true,
      width: 90,
      render: (text, record, index) => {
        if (record.isRefer) {
          return <span>1111111{text !== undefined ? String(text) : text}</span>;
        }
        // return <EditInput value={text} verify={false} onChange={(v) => onChangeValue(v, index)} />;
        return (
          <EditInput
            value={text != undefined ? String(text) : text}
            verify={false}
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
          return <span>已改</span>;
        }
        return <span>未改</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'active',
      align: 'center',
      width: 70,
      render: (text, record, i) => {
        return (
          <span className={s.handleWrap}>
            <a onClick={() => onReset(i)}>重置</a>
            <Popover
              overlayStyle={{ minWidth: '218px' }}
              getPopupContainer={(triggerNode) => {
                return triggerNode.parentNode;
              }}
              content={<RefContent dataSource={value} onChange={onChange} index={i} item={record} />}
              trigger='click'
              placement='topLeft'
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
      {/* <div className={s.titleWrap}>
        <div className={s.title}>入参配置</div>
      </div> */}
      <Table columns={columns} dataSource={value} pagination={false} bordered rowKey='id' size='small' />
    </div>
  );
}

export default ParamsTable;
