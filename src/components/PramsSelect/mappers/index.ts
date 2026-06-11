import { TreeSelectProps } from 'antd/es/tree-select';
import _ from 'lodash';
import Text from './Text';
import DataiComProgressBar from './datai-com-progress-bar';

type Selectable = ({ title: string; key: string | number; children?: Selectable; checkable?: boolean } & Optional<
  Omit<TreeSelectProps['treeData'], 'children' | 'value'>
>)[];

export type Mapper = {
  selectable: (comp: any) => Selectable;
  parser: (path: (string | number)[], data: any, comp: any) => void;
};

export type FilterFn = (opt: TreeSelectProps['treeData'][number], idx: number) => boolean;
export type ExtendsFn = (
  opt: TreeSelectProps['treeData'][number],
  idx: number,
) => Optional<TreeSelectProps['treeData'][number]>;

const fold2Path = (
  selectable: Selectable,
  parentKeys: (string | number)[] = [],
  filterFn?: FilterFn,
  extendsFn?: ExtendsFn,
): TreeSelectProps['treeData'] => {
  const mapTo = selectable.map(({ key, children, ...rest }) => ({
    ...rest,
    value: JSON.stringify([...parentKeys, key]),
    children: children ? fold2Path(children, [...parentKeys, key], filterFn, extendsFn) : undefined,
    selectable: rest.checkable ?? (children ? false : undefined),
  }));

  const filted = filterFn ? mapTo.filter((element, idx) => filterFn(element, idx)) : mapTo;

  return extendsFn ? filted.map((element, idx) => _.merge(element, extendsFn(element, idx))) : filted;
};

const EXPORT_CONFIG = {
  Text,
  'datai-com-progress-bar': DataiComProgressBar,
};

export default Object.fromEntries(
  Object.entries(EXPORT_CONFIG).map(([k, { parser, selectable }]) => [
    k,
    {
      parser,
      selectable: (comp, filterFn?: FilterFn, extendsFn?: ExtendsFn) =>
        fold2Path(selectable(comp), [], filterFn, extendsFn),
    },
  ]),
);
