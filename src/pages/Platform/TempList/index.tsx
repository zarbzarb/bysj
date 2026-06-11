/**
 * 模板列表
 */
import React, { FC, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { DragEndPosition } from '@/Computed/PositionComputed';
import { Popconfirm } from 'antd';
import HocConfigProviderTheme from '@/components/commons/HocConfigProvider';
import styles from './index.less';

type IProps = {
  className?: string;
  type?: string; // lib: 左侧组件库，attr: 右侧属性
  parentRef?: any;
  item?: any; // 组件数据
};

const TempList: FC<IProps> = (props) => {
  const { className, type, parentRef, item } = props;
  const { compLibStore, comStore } = useStore();
  const { currentCompTemps, setShowTempListByLib, setShowTempListByAttr, currentComItem } = compLibStore;
  const { addCom } = comStore;

  const [count, setCount] = useState(0);

  const handleMouseLeave = () => {
    setShowTempListByLib(false);
    setShowTempListByAttr(false);
  };

  return (
    <div className={`${styles.tempListWrap} ${className}`} id='tempListWrap' onMouseLeave={handleMouseLeave}>
      <ul>
        {currentCompTemps.map((temp) => {
          return (
            <li
              key={temp.id}
              style={type === 'attr' && item.templateKey === temp.id ? { border: '1px solid #58CAD6' } : {}}
              draggable={type === 'lib'}
              onDragEnd={(evt) => {
                if (type === 'attr') return; // 属性侧打开模板列表不能拖
                if (parentRef.current.limitHandler(currentComItem)) {
                  const position = DragEndPosition({
                    x: evt.clientX,
                    y: evt.clientY,
                  });
                  if (position === undefined) return;
                  addCom(currentComItem, undefined, position, temp.id);
                }
              }}
            >
              {type === 'attr' ? (
                <Popconfirm
                  getPopupContainer={() => document.querySelector('#tempListWrap')}
                  title='提示'
                  description='切换模版时将覆盖当前组件样式，是否确定修改?'
                  onConfirm={() => {
                    window.executeCommand('TemplateCommand', window.DataI.getComponentByKey(item.key), temp.id);
                    item.templateKey = temp.id;
                    setCount(count + 1);
                  }}
                  onCancel={() => {}}
                >
                  <img src={temp.thumbnail} alt='模板图片' />
                </Popconfirm>
              ) : (
                <img
                  src={temp.thumbnail}
                  alt='模板图片'
                  onClick={() => {
                    if (parentRef.current.limitHandler(currentComItem)) {
                      addCom(currentComItem, undefined, undefined, temp.id);
                    }
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default HocConfigProviderTheme(observer(TempList));
