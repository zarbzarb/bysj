import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Radio, Input, Select, Table, Form, Tooltip } from 'antd';
import s from './index.less';
import { QuestionCircleOutlined } from '@ant-design/icons';
// import MonacoEditor from 'react-monaco-editor';
import StoreTree from '@/components/StoreTree';
import TestDataQuery from '@/components/DataHandler/TestDataQuery';
import JSEdit from '@/components/commons/JSEdit';

const FormItem = Form.Item;
const { useForm } = Form;
const RadioGroup = Radio.Group;
// const RadioButton = Radio.Button;
const { TextArea } = Input;

function EditDataMap(props, ref) {
  //item 动作 mapInfo undefined resultList 返参列表  ids saveIds 刷新
  const { item, mapInfo, resultList, ids, saveIds } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = useForm();
  const { setFieldsValue } = form;
  useImperativeHandle(ref, () => ({ ...form }));
  const deepList = useCallback((data = [], parent = undefined) => {
    let result = [];

    if (!Array.isArray(data)) {
      return result;
    }

    result = data.map((item) => {
      if (parent && parent.name === 'data' && parent.description === '数据') {
        item.isTop = true;
      }
      item.parent = parent;
      if (Array.isArray(item.properties)) {
        item.properties = deepList(item.properties, item);
      }
      return item;
    });
    return result;
  }, []);
  useEffect(() => {
    if (ids) {
      setSelectedRowKeys(ids);
    }
    return () => {};
  }, [ids]);
  const dataSource = useMemo(() => deepList(resultList), [resultList, deepList]);
  const columns = [
    {
      title: '字段',
      dataIndex: 'name',
      ellipsis: true,
      width: 168,
      render: (text, record) => {
        const { type, isTop } = record;
        if (!isTop && type.toLocaleLowerCase() === 'array') {
          return (
            <div>
              <span style={{ paddingRight: 8 }}>{text}</span>
              <Tooltip
                placement='top'
                color='#454141'
                title='该字段为数组类型，子字段不允许选择'
                getPopupContainer={() => document.body}
                overlayStyle={{ zIndex: 2001 }}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </div>
          );
        }
        return text;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
  ];
  const isArrayParent = (p) => {
    // 数组类型字段不允许选中

    if (!p) return true;
    let _p = p.parent;
    while (_p) {
      if (_p.type.toLocaleLowerCase() === 'array') {
        return false;
      }
      _p = _p.parent;
    }
    return true;
  };
  const onChangeField = (selectedRowKeys, selectedRows) => {
    setSelectedRowKeys(selectedRowKeys);
    saveIds(selectedRowKeys);
    let [mapInfo] = selectedRows;
    delete mapInfo.children;
    let mP = mapInfo.parent;
    let path = {};
    // 快慢指针
    while (true) {
      if (mP) {
        mP.children = mapInfo;
        mP = mP.parent;
      }
      if (mapInfo.parent) {
        mapInfo = mapInfo.parent;
      } else {
        break;
      }
    }
    path.name = mapInfo.name;
    path.children = {};
    let pathC = path.children;
    mapInfo = mapInfo.children;
    if (!mapInfo) delete path.children;
    while (mapInfo) {
      pathC.name = mapInfo.name;
      mapInfo = mapInfo.children;
      if (mapInfo) {
        pathC.children = {};
        pathC = pathC.children;
      }
    }
    let p = [];
    let _p = path;
    while (_p) {
      p = p.concat(_p.name);
      _p = _p.children;
    }
    p = p.join('.');
    // let ps = p.split('.')[1];
    setFieldsValue({
      path: p,
    });
  };
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
  const commonRules = {
    rules: [{ required: true }],
    // required: false
  };

  const changeCode = (val) => {
    setFieldsValue({ code: val });
  };

  const editForm = {
    config: (
      <FormItem label='选中字段' name='path' {...commonRules}>
        <Select
          placeholder='请选择'
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          style={{
            width: 320,
          }}
          dropdownStyle={{ zIndex: 2000, width: 320 }}
          dropdownMatchSelectWidth={false}
          dropdownRender={() => (
            <div className='antd-dark'>
              <Table
                columns={columns}
                dataSource={dataSource}
                rowKey='id'
                bordered
                pagination={false}
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys,
                  onChange: onChangeField,
                  getCheckboxProps: (record) => ({
                    disabled: !isArrayParent(record),
                  }),
                }}
                childrenColumnName='properties'
                scroll={{
                  y: 300,
                }}
              />
            </div>
          )}
        />
      </FormItem>
    ),
    code: (
      <FormItem label='code' name='code' className={s.code}>
        <JSEdit codeType='javascript' onChange={changeCode} />
        {/* <MonacoEditor
          height="400"
          language="javascript"
          theme="vs-dark"
          options={op}
        /> */}
      </FormItem>
    ),
  };
  const initialValues = {
    type: 'code',
    code: `// 编写函数，变量data为接口的返回值，
// 函数的返回值为最终的过滤器结果，下面是一个例子
return data.data;
`,
  };
  return (
    <div className={s.configMapWrap}>
      <div className={s.formWrap}>
        <Form layou='horizontal' form={form} initialValues={initialValues}>
          <FormItem label='映射方式' name='type'>
            <RadioGroup onChange={() => setSelectedRowKeys([])}>
              <Radio value='config'>配置</Radio>
              <Radio value='code'>代码</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem name='mapName' label='映射名称' {...commonRules}>
            <Input placeholder='请输入' style={{ width: 320 }} />
          </FormItem>
          <FormItem name='variable' label='数据store' {...commonRules}>
            <StoreTree
              style={{ width: 320 }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              dropdownStyle={{ zIndex: 2001 }}
            />
          </FormItem>
          <FormItem name='mapDesc' label='映射描述'>
            <TextArea placeholder='请输入' style={{ width: 320 }} autoSize={{ maxRows: 6, minRows: 2 }} />
          </FormItem>
          <FormItem noStyle shouldUpdate={(prevValues, curValues) => prevValues.type !== curValues.type}>
            {({ getFieldsValue }) => editForm[getFieldsValue().type]}
          </FormItem>

          <FormItem>
            <TestDataQuery item={item} refFormFilter={form} />
          </FormItem>
        </Form>
      </div>
    </div>
  );
}

export default forwardRef(EditDataMap);
