import React, { useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react';
import groupIcon from '@/assets/icon/groupIcon.png';
import { LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';
import { hasChildActive } from '@/utils/componentUtils';
import DataI from '@/utils/global-api';
import GroupLayer from './GroupLayer';
import ComponentLayer from './ComponentLayer';
import CustomListLayer from './CustomListLayer';

const getComponent = DataI.getComponentByKey;

interface IProps {
  // isGroup?: boolean;
  // type?: string;
  item: any; // 组件
  keyWord: string;
  parentIndex?: any; // 父祖key
  selectedKeys: any[]; // 选中组件
  keyIndex: number; // 组件的标识序号
  onContextMenu: (e) => void; // 显示右键菜单
  changeInstance: (evt: any, item: any) => void; // 选中组件
  dragEnd: (e: any, i?: any, groupKey?: any) => void; // 拖拽开始
  dragStart: (e: any) => void; // 拖拽结束
  dragCount?: number;
}
const GroupInGroupLayer = (props: IProps) => {
  const { editorStore, pageTreeStore } = useStore();
  const { forceUpdateAttr } = editorStore;
  const { item = {} } = props;
  const {
    onContextMenu,
    selectedKeys,
    changeInstance,
    dragEnd,
    dragStart,
    keyIndex: key,
    parentIndex,
    keyWord,
    // isGroup,
    // type,
    dragCount,
  } = props;
  // 组件是否上锁
  const isLock = item && item.comLock ? item.comLock : false;
  // 组件名称
  const [comName, setComName] = useState(item.compName || item.name || '未知组');
  // 组是否展开
  const [isOpened, setIsOpened] = useState(false);
  // 组件是否编辑
  const [isEdit, setIsEdit] = useState(false);
  // 组件是否不可见  v8.5.0修改状态和注释， comInvisible为true表示组件不可见
  const [isInvisible, setIsInvisible] = useState(item.comInvisible ? item.comInvisible : false);

  /**
   * 组件是否可见处理
   * @param item 组件
   * @param type 显示状态 visible可见 invisible不可见
   */
  const handleVisible = (curItem, curType) => {
    // window.executeCommand('VisibleCommand', [curItem], curType);
    window.executeCommand('VisibleCommand', [getComponent(curItem.key)], curType);
    setIsInvisible(curType === 'invisible');
  };
  const className = useMemo(() => {
    let classActive = '';
    if (selectedKeys.includes(item.key)) {
      classActive = ' changed';
    }
    let openClass = ' ';
    if (isOpened) {
      openClass = 'open';
    }
    if (hasChildActive(selectedKeys, item)) {
      classActive = ' changed';
      openClass = 'open';
    }
    const filterClass =
      !keyWord || item?.compName?.includes(keyWord) || item.name?.includes(keyWord) || item.type?.includes(keyWord)
        ? ''
        : 'not-filter';
    return `com-info group-comp group-child ${classActive} ${openClass} ${filterClass}`;
  }, [isOpened, item, keyWord, selectedKeys, dragCount]);

  const newItem = useMemo(() => {
    const temp = {};
    Object.keys(item).forEach((curKey) => {
      const curType = typeof item[curKey];
      if (curType !== 'function' && curType !== 'object') {
        temp[curKey] = item[curKey];
      }
    });
    return temp;
  }, [item]);

  /**
   * 组件状态发生变化，更新对应状态
   */
  useEffect(() => {
    if (comName !== item.name) {
      setComName(item.name);
    }
  }, [item.name]);

  useEffect(() => {
    if (isInvisible !== item.comInvisible) {
      setIsInvisible(item.comInvisible);
    }
  }, [isInvisible, item.comInvisible]);

  useEffect(() => {
    if (hasChildActive(selectedKeys, item) && !isOpened) {
      setIsOpened(true);
    }
  }, [isOpened, item, selectedKeys]);

  useEffect(() => {
    if (keyWord && item.childComList.length > 0) {
      setIsOpened(true);
    }
  }, [keyWord, item.childComList.length]);

  return (
    <>
      <div
        onClick={(evt) => {
          // 单击组件logo, 选中组件
          changeInstance(evt, item);
        }}
        onDoubleClick={() => {
          // 编辑组件
          setIsEdit(true);
        }}
        onContextMenu={onContextMenu}
        className={className}
        style={{ paddingLeft: `${item.level * 10}px` }}
        key={item.key + key}
        draggable='true'
        data-type='groupInGroup'
        data-id={key}
        data-parent={parentIndex}
        onDragEnd={(e) => dragEnd(e)}
        onDragStart={(e) => dragStart(e)}
        data-item={JSON.stringify(newItem)}
      >
        <div
          onClick={() => {
            // 是否展开
            setIsOpened((preOpen) => {
              return !preOpen;
            });
          }}
          onDoubleClick={(evt) => {
            evt.stopPropagation();
            evt.nativeEvent.stopImmediatePropagation();
          }}
          className='show-child-com'
          data-middleware='com-operable'
        />
        <img alt='' src={groupIcon} data-middleware='com-operable' draggable='false' />
        <div className='com-title' data-middleware='com-operable' title={comName}>
          {isEdit ? (
            // 编辑态组件名称输入框
            <input
              onBlur={(evt) => {
                let curComName = evt.target.value;
                if (curComName === '') {
                  curComName = '未知组';
                }
                // item.name = curComName;
                getComponent(item.key).name = curComName;
                setIsEdit(false);
                setComName(curComName);
                pageTreeStore.setPageInfoStep(1);
              }}
              onKeyDown={(evt) => {
                if (evt.code === 'Enter') {
                  evt.preventDefault();
                  setIsEdit(false);
                  pageTreeStore.setPageInfoStep(1);
                }
              }}
              onChange={(evt) => {
                // 输入框内容发生改变
                const curComName = evt.target.value;
                // item.compName = curComName;
                // item.name = curComName;
                getComponent(item.key).compName = curComName;
                getComponent(item.key).name = curComName;
                setComName(curComName);
                forceUpdateAttr();
              }}
              value={comName}
            />
          ) : (
            <span>{comName}</span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          {/* 组件是否可见 */}
          {isInvisible ? (
            <div className='com-lock  com-eyeinvisible'>
              <EyeInvisibleOutlined
                onClick={() => {
                  // 点击，显示组件
                  handleVisible(item, 'visible');
                }}
                style={{
                  fontSize: '12px',
                  marginRight: '5px',
                  color: '#bfc6ce',
                }}
              />
            </div>
          ) : (
            <div className='com-lock com-eyevisible'>
              <EyeOutlined
                onClick={() => {
                  // 点击，隐藏组件
                  handleVisible(item, 'invisible');
                }}
                style={{
                  fontSize: '12px',
                  marginRight: '5px',
                  color: '#bfc6ce',
                }}
              />
            </div>
          )}
          {isLock ? (
            <div className='com-lock'>
              <LockOutlined
                style={{
                  fontSize: '12px',
                  marginRight: '5px',
                  color: '#bfc6ce',
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
      {/* 组是否展开 */}
      {isOpened &&
        item.childComList.map((vl, idx) => {
          if (vl.classType === 'group') {
            return (
              <GroupLayer
                changeInstance={changeInstance}
                onContextMenu={onContextMenu}
                dragEnd={dragEnd}
                dragStart={dragStart}
                item={vl}
                keyWord={keyWord}
                key={vl.key}
                keyIndex={idx}
                selectedKeys={selectedKeys}
              />
            );
          }
          if (vl?.isDragContainer) {
            return (
              <CustomListLayer
                item={vl}
                keyWord={keyWord}
                key={idx}
                keyIndex={idx}
                selectedKeys={selectedKeys}
                changeInstance={changeInstance}
                dragEnd={dragEnd}
                dragStart={dragStart}
                onContextMenu={onContextMenu}
              />
            );
          }
          return (
            <ComponentLayer
              type='groupInGroupChild'
              changeInstance={changeInstance}
              onContextMenu={onContextMenu}
              dragEnd={dragEnd}
              dragStart={dragStart}
              parentIndex={item.key}
              item={vl}
              key={idx}
              keyIndex={idx}
              selectedKeys={selectedKeys}
            />
          );
        })}
    </>
  );
};
export default observer(GroupInGroupLayer);
