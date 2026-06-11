import DataICompKit from '@/utils/dataiUtils';
import { Mapper } from '.';

export default {
  selectable: (comp) => [
    {
      title: '进度条',
      key: 'progress',
      children: [{ title: '背景色', key: 'barColor' }],
    },
    {
      title: '文本',
      key: 'text',
      checkable: false,
      disabled: !DataICompKit.getAttr(comp).textVisible,
      children: DataICompKit.getAttr(comp).textVisible
        ? [
            DataICompKit.getAttr(comp).valueVisible
              ? {
                  title: '值文本',
                  key: 'value',
                  children: [
                    { title: '字号', key: 'valueSize' },
                    { title: '字体颜色', key: 'valueColor' },
                    { title: '上边距', key: 'valuePaddingTop' },
                    { title: '下边距', key: 'valuePaddingBottom' },
                    { title: '左边距', key: 'valuePaddingLeft' },
                    { title: '右边距', key: 'valuePaddingRight' },
                  ],
                }
              : undefined,
            DataICompKit.getAttr(comp).unitVisible
              ? {
                  title: '值单位',
                  key: 'unit',
                  children: [
                    { title: '字号', key: 'unitSize' },
                    { title: '字体颜色', key: 'unitColor' },
                    { title: '上边距', key: 'unitPaddingTop' },
                    { title: '下边距', key: 'unitPaddingBottom' },
                    { title: '左边距', key: 'unitPaddingLeft' },
                    { title: '右边距', key: 'unitPaddingRight' },
                  ],
                }
              : undefined,
            DataICompKit.getAttr(comp).titleVisible
              ? {
                  title: '值单位',
                  key: 'title',
                  children: [
                    { title: '字号', key: 'titleSize' },
                    { title: '字体颜色', key: 'titleColor' },
                    { title: '上边距', key: 'titlePaddingTop' },
                    { title: '下边距', key: 'titlePaddingBottom' },
                    { title: '左边距', key: 'titlePaddingLeft' },
                    { title: '右边距', key: 'titlePaddingRight' },
                  ],
                }
              : undefined,
          ].filter(Boolean)
        : undefined,
    },
  ],
  parser: (path, data, comp) => (DataICompKit.getAttr(comp)[path.at(-1)] = data),
} satisfies Mapper;
