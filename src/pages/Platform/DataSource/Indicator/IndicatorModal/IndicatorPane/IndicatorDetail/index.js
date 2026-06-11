import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { getDimensionValues } from '@/services/apis/indicatorApi';
import styles from './index.less';
import Collapse from '../components/Collapse';

const { Option } = Select;

// 指标详情
const IndicatorDetail = ({ currentIndicatorInfo }) => {
  const [form] = Form.useForm();

  const [dimensionValuesEntities, setDimensionValuesEntities] = useState({}); // 维度实体信息

  const [visible1, setVisible1] = useState(true);
  const [visible2, setVisible2] = useState(true);
  const [visible3, setVisible3] = useState(true);

  const bindingParams = useMemo(() => {
    if (!currentIndicatorInfo?.bindings) return [];
    const res = [];
    Object.keys(currentIndicatorInfo.bindings).forEach((key) => {
      if (key === 'time') {
        res.push(
          {
            name: '开始时间(_start)',
            value: '-',
          },
          {
            name: '结束时间(_end)',
            value: '-',
          },
        );
      } else {
        // res.push({
        //   name: key,
        //   value: currentIndicatorInfo.bindings[key]
        // });
      }
    });
    return res;
  }, [currentIndicatorInfo]);

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

  useEffect(() => {
    if (currentIndicatorInfo) {
      // 自动拉取所有一级的（没有 parentId）枚举型维度信息
      const ids = currentIndicatorInfo.dimensions.filter((v) => v.type === 1 && v.parentId === null).map((v) => v.id);
      // console.log({ dimensions }, { ids });
      if (ids.length > 0) {
        fetchDimensionValues(ids.join(','));
      }
    }

    // 切换指标时，清空详情里面的表单
    form.resetFields();
  }, [currentIndicatorInfo, fetchDimensionValues, form]);

  const handleFieldChange = useCallback(
    (val, id) => {
      const children = currentIndicatorInfo.dimensions.filter((v) => v.parentId === id && v.type === 1);
      if (children.length > 0) {
        // 如果有下级维度，自动拉取下级维度的数据（级联选择器）
        const ids = children.map((v) => v.id);
        fetchDimensionValues(ids.join(''), val);

        // 清空下级维度已选择的值
        const values = {};
        children.forEach((v) => {
          values[v.binding] = undefined;
        });
        form.setFieldsValue(values);
      }
    },
    [currentIndicatorInfo, fetchDimensionValues, form],
  );

  return (
    <div className={styles.IndicatorDetail}>
      <Collapse title='指标明细：' visible={visible1} onCollapse={(bool) => setVisible1(bool)}>
        <div className={styles.contentBox}>
          <div className={styles['title-box']}>
            <div className={styles.subTitle}>指标名称：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.friendlyName || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>指标英文名：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.name || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>提供方：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.responsibleOrganizationName || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>责任人：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.responsiblePersonName || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>数据源类型：</div>
            <div className={styles.subText}>
              {currentIndicatorInfo?.dataSourceType
                ? currentIndicatorInfo?.dataSourceType
                : currentIndicatorInfo?.dataSourceId === 0
                ? '模拟数据源'
                : '- -'}
            </div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>指标所在数据源：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.dataSourceName || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>指标所在数据表：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.bindings?.table || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>计量单位：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.dataUnit || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>更新频率：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.updateCycle || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>数据来源：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.dataFrom || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>指标定义：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.definition || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>业务含义：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.businessRule || '- -'}</div>
          </div>

          <div className={styles['title-box']}>
            <div className={styles.subTitle}>预警规则：</div>
            <div className={styles.subText}>{currentIndicatorInfo?.warningRule || '- -'}</div>
          </div>
        </div>
      </Collapse>
      {currentIndicatorInfo && (
        <>
          <Collapse title='维度：' visible={visible2} onCollapse={(bool) => setVisible2(bool)}>
            <Form form={form} name='indicatorDetail' preserve={false}>
              <table>
                <tr>
                  <th>名称</th>
                  <th width={150}>值</th>
                </tr>
                {currentIndicatorInfo &&
                  currentIndicatorInfo.dimensions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.friendlyName}({item.name})
                      </td>
                      <td>
                        {item.type === 1 ? (
                          <Form.Item name={item.binding}>
                            <Select
                              getPopupContainer={(triggerNode) => triggerNode.parentNode}
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
                          <Form.Item name={item.binding}>
                            <Input />
                          </Form.Item>
                        )}
                      </td>
                    </tr>
                  ))}
              </table>
            </Form>
          </Collapse>

          <Collapse title='参数：' visible={visible3} onCollapse={(bool) => setVisible3(bool)}>
            <table>
              <tr>
                <th>名称</th>
                <th width={150}>值</th>
              </tr>
              {bindingParams.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </table>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default IndicatorDetail;
