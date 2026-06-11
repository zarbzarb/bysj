import _ from 'lodash';
import templateManager from '@/theme/TemplateManager';

const setDatai = (instance: Record<string, any>, attr: Record<string, any>) => {
  if (Array.isArray(instance.compAttr.series) && Array.isArray(attr.series) && !attr.seriesOnlyOnce) {
    instance.compAttr.series = instance.compAttr.series.map((ser) => _.merge(ser, attr.series[0]));

    if (attr.series.length > instance.compAttr.series.length)
      attr.series = instance.compAttr.series.map((_ser, idx) => attr.series[idx]);
  }

  if (Array.isArray(instance.compAttr.dataSeries) && Array.isArray(attr.dataSeries) && !attr.seriesOnlyOnce) {
    instance.compAttr.dataSeries = instance.compAttr.dataSeries.map((ser) => _.merge(ser, attr.dataSeries[0]));

    if (attr.dataSeries.length > instance.compAttr.dataSeries.length)
      attr.dataSeries = instance.compAttr.dataSeries.map((_ser, idx) => attr.dataSeries[idx]);
  }
  instance.compAttr = _.omitBy(_.merge(instance.compAttr, { ...attr, seriesOnlyOnce: undefined }), _.isUndefined);
  console.log('instance.compAttr', instance.compAttr);
  instance.mapSourceToData();
};

const setAntd = (comp: Record<string, any>, attr: Record<string, any>) => {
  Object.keys(attr)
    .filter((key) => Object.prototype.hasOwnProperty.call(comp, key))
    .forEach((key) => (comp[key] = _.merge(comp[key], attr[key])));

  comp?.refresh?.();
};

/**
 * @param comp 需要更新的组件, 注意需要先在组件的 `templateKey` 上设置模板
 * @param undoValue 仅用于回退模板应用
 * @returns void
 *
 * # Error Logs
 *
 * 这个组件没有错误抛出, 但是存在不工作情况(均发生在不使用 undoValue 的情况)
 *
 * - 没有合法的 `comp.templateKey`
 *
 * - 无法通过 `comp.templateKey` 找到组件模板
 *
 * - 通过 `comp.templateKey` 找到的组件模板具有错误的 `from` 属性
 *
 * - 组件的 `comp.classType` 是不受支持的类型
 *
 * # Examples
 * @example
 *
 * // 执行数据更新
 * comp.templateKey = templateKey;
 * updateCompMergeWithTemplate(comp);
 *
 * // 撤销数据更新
 * comp.templateKey = undoTemplateKey;
 * updateCompMergeWithTemplate(comp, undoValue);
 */
const updateCompMergeWithTemplate = (comp: Record<string, any>, undoValue?: Record<string, any>): void => {
  console.log(comp, undoValue);

  if (undoValue && comp.classType === 'antd') return setAntd(comp, _.pick(undoValue, ['props', 'styles']));

  if (undoValue && comp.classType === 'com') return setDatai(comp.instance, undoValue.instance.compAttr);

  if (!comp.templateKey) return console.error('组件未设置 templateKey');

  const template = templateManager.templateAttr(comp.templateKey, comp.englishName ?? comp.type);

  if (!template) return console.error('无法找到对应的组件模板');

  if (comp.classType === 'antd' && template.from === 'antd') return setAntd(comp, template.attr);

  if (comp.classType === 'com' && template.from === 'datai') return setDatai(comp.instance, template.attr);

  return console.error('该组件类型不支持模板或错误的模板类型');
};

export default updateCompMergeWithTemplate;
