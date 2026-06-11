import React, { forwardRef, useState, useMemo, useCallback, useImperativeHandle } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, AutoComplete } from 'antd';
// import CustomDatePicker from './CustomDatePicker';
import { useMount } from 'ahooks';
import cls from 'classnames';
import { getDimensionValues } from '@/services/apis/indicatorApi';
import styles from './index.less';

const { Option } = Select;

const descOptionList = [
  { label: '是', value: true },
  { label: '否', value: false },
];

const timeFormatOptions = [
  { label: '年/月/日 时:分:秒', value: 'YYYY/MM/DD HH:mm:ss' },
  { label: '年-月-日 时:分:秒', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '年/月/日', value: 'YYYY/MM/DD' },
  { label: '年-月-日', value: 'YYYY-MM-DD' },
  { label: '年月日', value: 'YYYYMMDD' },
  { label: '时:分:秒', value: 'HH:mm:ss' },
  { label: '年', value: 'YYYY' },
  { label: '月', value: 'M' },
  { label: '日', value: 'D' },
];

// 请求参数表单
const ParamsForm = forwardRef(function ParamsForm({ dimensions, needTime, selectedIndicators }, ref) {
  const [form] = Form.useForm();

  const [dimensionValuesEntities, setDimensionValuesEntities] = useState({}); // 维度实体信息
  const [fieldTypeMap, setFieldTypeMap] = useState(() => {
    const map = {};
    dimensions.forEach((item) => {
      if (item.type === 2) {
        map[item.name] = 'default';
      }
    });
    return map;
  }); // 字段类型映射，“默认”还是“当前时间”
  const [validateResult, setValidateResult] = useState({}); // 表单校验状态和错误信息

  const ordersOptionList = useMemo(() => {
    const optionList = [];
    dimensions.forEach((item) => {
      optionList.push({ label: item.friendlyName, value: item.name });
    });
    selectedIndicators.forEach((item) => {
      optionList.push({ label: item.title, value: item.id });
    });
    optionList.push({ label: '业务时间', value: '__time' });
    return optionList;
  }, [dimensions, selectedIndicators]);

  const fetchDimensionValues = useCallback(async (id, parentName) => {
    try {
      const params = {
        format: 'raw', // 返回数据格式:raw/raw_merged/general/general_merged
        id, // 维度ID集合，必选，可以传递多个
        parentName, // 父维度值Name，可选，当获取联动维度中某一级节点下的所有子项，传递父值Name即可
      };
      const res = await getDimensionValues(params);

      const map = {};
      res.forEach((v) => {
        if (map[v.name]) {
          map[v.name].push(v);
        } else {
          map[v.name] = [v];
        }
      });

      setDimensionValuesEntities((prev) => ({
        ...prev,
        ...map,
      }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useMount(() => {
    // 自动拉取所有一级的（没有 parentId）枚举型维度信息
    const ids = dimensions.filter((v) => v.type === 1 && v.parentId === null).map((v) => v.id);
    // console.log({ dimensions }, { ids });
    if (ids.length > 0) {
      fetchDimensionValues(ids.join(','));
    }
  });

  const handleFieldChange = useCallback(
    (val, id) => {
      const children = dimensions.filter((v) => v.parentId === id && v.type === 1);
      if (children.length > 0) {
        // 如果有下级维度，自动拉取下级维度的数据（级联选择器）
        const ids = children.map((v) => v.id);
        fetchDimensionValues(ids.join(''), val);

        // 清空下级维度已选择的值
        const values = {};
        children.forEach((v) => {
          values[v.name] = undefined;
        });
        form.setFieldsValue(values);
      }
    },
    [dimensions, fetchDimensionValues, form],
  );

  const handleFieldTypeChange = useCallback(
    (val, name) => {
      setFieldTypeMap({ ...fieldTypeMap, [name]: val });
      form.setFieldValue(name, val === 'now' ? 'YYYY/MM/DD HH:mm:ss' : '');
      setValidateResult((prev) => ({
        ...prev,
        [name]: {
          validateStatus: 'success',
          errorMsg: null,
        },
      }));
    },
    [fieldTypeMap, form],
  );

  const handleTimeFormatChange = useCallback(
    (name, value) => {
      form.setFieldValue(name, value);

      const val = value.trim();
      let result = {
        validateStatus: 'success',
        errorMsg: null,
      };
      if (fieldTypeMap[name] === 'now' && val) {
        const pattern = /YY|[DHMms]/;
        if (!pattern.test(val)) {
          result = {
            validateStatus: 'error',
            errorMsg: '请输入正确的时间格式',
          };
        }
      }

      setValidateResult((prev) => ({
        ...prev,
        [name]: result,
      }));
    },
    [fieldTypeMap, form],
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        hasError: () => {
          for (const key in validateResult) {
            if (validateResult[key].validateStatus === 'error') {
              return true;
            }
          }
          return false;
        },
        getFieldsValue: () => {
          const values = form.getFieldsValue();
          Object.keys(values).forEach((key) => {
            if (fieldTypeMap[key] === 'now') {
              const val = values[key].trim();
              values[key] = `{Date@${val}}`;
            }
          });
          return values;
        },
        setFieldsValue: (values) => {
          const pattern = /^{Date@(.+)}$/;
          const map = {};
          dimensions.forEach((item) => {
            if (item.type === 2) {
              const match = pattern.exec(values[item.name]);
              map[item.name] = match !== null ? 'now' : 'default';
              if (match !== null) {
                values[item.name] = match[1];
              }
            }
          });
          setFieldTypeMap(map);
          form.setFieldsValue(values);
        },
      };
    },
    [dimensions, fieldTypeMap, form, validateResult],
  );

  return (
    <div className={styles.paramsForm}>
      <Form form={form} initialValues={{ _desc: true }} name='paramsForm' preserve={false}>
        <table>
          <tr>
            <th>参数名</th>
            <th width='60%'>值</th>
          </tr>
          {dimensions.map((item) => (
            <tr key={item.id}>
              <td>
                {item.friendlyName}({item.name})
              </td>
              <td>
                {item.type === 1 ? (
                  <Form.Item name={item.name}>
                    <Select
                      getPopupContainer={() => document.querySelector('.indicator-pane')}
                      allowClear
                      onChange={(val) => handleFieldChange(val, item.id)}
                    >
                      {dimensionValuesEntities[item.name] &&
                        dimensionValuesEntities[item.name].map((v) => (
                          <Option key={v.id} value={v.value}>
                            {v.value}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Select
                      value={fieldTypeMap[item.name]}
                      getPopupContainer={() => document.querySelector('.indicator-pane')}
                      onChange={(val) => handleFieldTypeChange(val, item.name)}
                      style={{ width: 90, marginRight: 8 }}
                    >
                      <Option value='default'>默认</Option>
                      <Option value='now'>当前时间</Option>
                    </Select>

                    <Form.Item
                      name={item.name}
                      style={{ flex: 1 }}
                      validateStatus={validateResult[item.name]?.validateStatus || 'success'}
                      help={validateResult[item.name]?.errorMsg}
                    >
                      {fieldTypeMap[item.name] === 'now' ? (
                        <AutoComplete
                          options={timeFormatOptions}
                          getPopupContainer={() => document.querySelector('.indicator-pane')}
                          style={{ width: '100%' }}
                          placeholder='请指定时间格式'
                          onChange={(val) => handleTimeFormatChange(item.name, val)}
                        />
                      ) : (
                        <Input style={{ width: '100%', height: 27, lineHeight: 27 }} autocomplete='off' />
                      )}
                    </Form.Item>
                  </div>
                )}
              </td>
            </tr>
          ))}
          <tr className={cls({ hidden: !needTime })}>
            <td>开始时间(_start)</td>
            <td>
              <Form.Item name='_start'>
                <DatePicker
                  showTime
                  placeholder='请选择时间'
                  placement='topLeft'
                  getPopupContainer={() => document.querySelector('.indicator-pane')}
                />
              </Form.Item>
            </td>
          </tr>
          <tr className={cls({ hidden: !needTime })}>
            <td>结束时间(_end)</td>
            <td>
              <Form.Item name='_end'>
                <DatePicker
                  showTime
                  placeholder='请选择时间'
                  placement='topLeft'
                  getPopupContainer={() => document.querySelector('.indicator-pane')}
                />
              </Form.Item>
            </td>
          </tr>
          <tr>
            <td>排序顺序(_orders)</td>
            <td>
              <Form.Item name='_orders'>
                <Select
                  mode='multiple'
                  allowClear
                  placeholder='请选择'
                  options={ordersOptionList}
                  getPopupContainer={() => document.querySelector('.indicator-pane')}
                  maxTagCount='responsive'
                />
              </Form.Item>
            </td>
          </tr>
          <tr>
            <td>是否降序(_desc)</td>
            <td>
              <Form.Item name='_desc'>
                <Select options={descOptionList} getPopupContainer={() => document.querySelector('.indicator-pane')} />
              </Form.Item>
            </td>
          </tr>
          <tr>
            <td>条数限制(_limit)</td>
            <td>
              <Form.Item name='_limit'>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </td>
          </tr>
        </table>
      </Form>
    </div>
  );
});

export default ParamsForm;
