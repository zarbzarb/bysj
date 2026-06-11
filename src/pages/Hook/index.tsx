import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DndContext, PointerSensor, useSensor } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import Editor from '@/components/commons/JSEdit';
import { Tabs, Modal, Input, Form, message } from 'antd';
import './index.less';
import '@/styles/index.global.less';
import { useStore } from '@/hooks';

const { confirm } = Modal;

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

type tabType = {
  key: string;
  title: string;
  content: string;
  closable?: boolean;
};

// v8.12: 可拖拽 tab
const DraggableTabNode = ({ className, ...props }) => {
  const { isEdit, title, onInputChange, onDoubleClick, onInputBlur } = props;
  const inputRef = useRef(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-node-key'],
    disabled: title === 'main', // main 页签禁用拖动
  });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: title === 'main' ? 'initial' : 'move',
    zIndex: isDragging ? props?.style?.zIndex ?? 0 + 10 : props?.style?.zIndex ?? 1,
  };

  useEffect(() => {
    if (isEdit && inputRef.current) inputRef.current.focus();
  }, [isEdit]);

  if (isEdit) {
    props.children.props.children = (
      <Input ref={inputRef} style={{ width: '100px' }} value={title} onChange={onInputChange} onBlur={onInputBlur} />
    );
  }
  return React.cloneElement(props.children, {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
    onDoubleClick,
  });
};

const HookPage = () => {
  // 当前激活tab key
  const [activeKey, setActiveKey] = useState('');
  const activeKeyRef = useRef('');
  // tab选项组
  const [panes, setPanes] = useState([]);
  const panesRef = useRef([]);
  // 新增hook是否可见
  const [addModalVisible, setModalVisible] = useState(false);
  // 存储编辑器对象，key为tab选项key, value为编辑器
  const tabEditor = useRef({});
  const tabEditorCode = useRef({});
  // 使用 Form.useForm hook 返回一个 Form 实例
  const [form] = Form.useForm();

  const {
    serviceStore,
    globalStore: { bigScreenId, appPageId, version },
    hookStore,
  } = useStore();

  useEffect(() => {
    serviceStore.getConfig(); // 设置标题和logo
    hookStore
      .getCodeByScreenId({
        appId: bigScreenId,
        appPageId,
        version,
      })
      .then((rs: any) => {
        const { code, codeId } = hookStore;
        // 循环遍历 code，将 main tab 的 closable 属性设置为 false
        const codeArr = code.map((item: any) => {
          if (item.key === 'main') {
            item.closable = false;
          }
          return item;
        });
        if (rs.code === '200' && (!rs.data || rs.data === '{}' || JSON.stringify(rs.data) === '{}')) {
          // 为空的时候，先保存下 main tab, 然后重新获取 hook 拿到 codeId, 方便后续使用
          hookStore
            .saveOrUpdateCode({
              codeStr: JSON.stringify(code[0]),
              appId: bigScreenId,
              appPageId,
              version,
              codeId,
              type: 'init',
            })
            .then(() => {
              hookStore.getCodeByScreenId({
                appId: bigScreenId,
                appPageId,
                version,
              });
            })
            .catch((error) => console.error(error));
        }
        setActiveKey(code[0]?.key);
        setPanes(codeArr);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {};
  }, []);

  useLayoutEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  useLayoutEffect(() => {
    panesRef.current = panes;
  }, [panes]);

  // 设置焦点在编辑器上
  const editorFocus = (key) => {
    tabEditor.current[key]?.current?.focus();
  };
  // 切换tab选项
  const onChange = (key) => {
    setActiveKey(key);
    editorFocus(key);
  };
  // 关闭新增弹框
  const closeAddModal = () => {
    form.resetFields(); // 置空表单
    setModalVisible(false);
    editorFocus(activeKey);
  };
  // 打开新增弹框
  const add = () => {
    setModalVisible(true);
  };
  // 删除hook
  const remove = (targetKey) => {
    const { deleteTabCode, codeId } = hookStore;
    // 获取删除的tab项
    const removedPane = panes.find((item) => targetKey === item.key);
    confirm({
      getContainer: () => document.querySelector('#hookApp'), // 弹框挂载到编辑模式
      title: `确定删除 ${removedPane?.title || ''} hook脚本?删除后无法恢复！`,
      className: 'del-notice-modal',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        // 获取删除后的tab选项组
        const currentPanes = panes.filter((item) => {
          return targetKey !== item.key;
        });
        // 刷新tab项
        setPanes(currentPanes);
        // 设置main焦点，编辑器获得焦点
        setActiveKey('main');
        editorFocus('main');
        // 删除hook代码
        deleteTabCode(targetKey, codeId);
      },
      onCancel() {
        editorFocus(activeKey);
      },
    });
  };
  // tab选项编辑
  const onEdit = (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      add();
    } else {
      remove(targetKey);
    }
  };
  // 更新hook代码
  const updateCode = (value: tabType) => {
    const { saveOrUpdateCode, codeId } = hookStore;
    saveOrUpdateCode({
      codeStr: JSON.stringify(value),
      appId: bigScreenId,
      appPageId,
      codeId,
      version,
    });
  };

  // 修改保存 update
  const saveConfirm = () => {
    confirm({
      getContainer: () => document.querySelector('#hookApp'), // 弹框挂载到编辑模式
      title: '确定保存当前hook么？',
      className: 'del-notice-modal',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        const curPane = panesRef.current.find((item) => item.key === activeKeyRef.current); // 获取当前tab选项
        const code = tabEditorCode.current[activeKeyRef.current]?.current; // 获取当前编辑器的内容
        if (curPane) {
          // curPane.content = value; // 设置内容值
          curPane.content = code;
          updateCode(curPane);
          setPanes([...panesRef.current]);
          editorFocus(activeKeyRef.current);
        }
      },
      onCancel() {
        editorFocus(activeKeyRef.current);
      },
    });
  };

  // 新增保存
  const addHook = () => {
    form
      .validateFields() // form校验
      .then((values) => {
        const currentPanes = panes;
        const keyList = panes.reduce((pre, cur) => {
          if (cur.key !== 'main') {
            pre.push(cur.key - 0);
          }
          return pre;
        }, []);
        // 新hook key
        const newKey = keyList.length === 0 ? '0' : `${Math.max(...keyList) + 1}`;
        // 新hook 对象
        const obj = { title: values.hookName, content: '', key: newKey };
        // 添加新hook
        currentPanes.push(obj);
        // 刷新tab选项组
        setPanes([...currentPanes]);
        closeAddModal(); // 关闭新增弹框
        updateCode(obj); // 更新hook代码
        editorFocus(activeKey); // 编辑器激活
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 2,
    },
  });

  // v8.12：拖拽结束
  const onDragEnd = ({ active, over }) => {
    if (active.id === 'main' || (over && over.id === 'main')) {
      return message.warning('main 页签是固定第一个，顺序不能被修改');
    }
    Modal.confirm({
      getContainer: () => document.querySelector('#hookApp'), // 弹框挂载到编辑模式
      title: 'hook执行时会按照tab页签顺序执行，是否确定修改顺序?',
      className: 'del-notice-modal',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        if (active.id !== over?.id) {
          const { updateTabOrder, codeId } = hookStore;
          let preTabKey: string;
          const activeIndex = panes.findIndex((i) => i.key === active.id);
          const overIndex = panes.findIndex((i) => i.key === over?.id);
          if (activeIndex > overIndex) {
            // 向左拖动
            preTabKey = panes[overIndex - 1].key;
          } else {
            // 向右拖动
            preTabKey = over.id;
          }
          updateTabOrder({
            id: codeId,
            currentTabKey: active.id,
            preTabKey,
          }).then((res) => {
            if (res.code === '200') {
              setPanes((prev) => {
                return arrayMove(prev, activeIndex, overIndex);
              });
              message.success('顺序修改成功');
            }
          });
        }
      },
      onCancel() {},
    });
  };

  // 双击 tab 编辑
  const handleDoubleClick = (key: string) => {
    if (key === 'main') {
      return message.warning('main 页签名称不能修改');
    }
    panes.forEach((item) => {
      if (item.key === key) {
        item.isEdit = true;
      }
    });
    setPanes([...panes]);
  };

  // 修改tab名称
  const handleChangeTitle = (key: string, e: any) => {
    const val = e.target.value;
    panes.forEach((item) => {
      if (item.key === key) {
        item.title = val;
      }
    });
    setPanes([...panes]);
  };

  // tab 失去焦点
  const handleBlur = (key: string, e) => {
    const val = e.target.value?.trim();
    if (val) {
      const { updateTabName, codeId } = hookStore;
      // 调接口保存名称
      updateTabName({
        id: codeId,
        key,
        name: val,
      }).then((rs) => {
        if (rs?.code === '200') {
          message.success('名称修改成功！');
          panes.forEach((item) => {
            if (item.key === key) {
              item.isEdit = false;
            }
          });
          setPanes([...panes]);
        } else {
          message.error(rs?.message);
        }
      });
    } else {
      message.warning('tab 页签名称不能为空');
      e.target.focus();
    }
  };

  return (
    <div className='antd-dark hook-script'>
      {bigScreenId ? (
        <Tabs
          type='editable-card'
          onChange={onChange}
          activeKey={activeKey}
          onEdit={onEdit}
          items={panes.map((pane, index) => {
            return {
              label: pane.title,
              children: (
                <Editor
                  onRef={(editRef, codeRef) => {
                    tabEditor.current[pane.key] = editRef;
                    tabEditorCode.current[pane.key] = codeRef;
                  }}
                  data-field='code'
                  mode='full-screen'
                  value={pane.content}
                  screenId={bigScreenId}
                  onChange={(value, screenId) => {
                    saveConfirm();
                  }}
                />
              ),
              key: pane.key,
              closable: index !== 0,
            };
          })}
          renderTabBar={(tabBarProps, DefaultTabBar) => (
            <DndContext sensors={[sensor]} onDragEnd={onDragEnd} modifiers={[restrictToHorizontalAxis]}>
              <SortableContext items={panes.map((i) => i.key)} strategy={horizontalListSortingStrategy}>
                <DefaultTabBar {...tabBarProps}>
                  {(node) => {
                    const _pane = panes.find((i) => i.key === node.key);
                    const _isEdit = _pane?.isEdit;
                    return (
                      <DraggableTabNode
                        {...node.props}
                        key={node.key}
                        isEdit={!!_isEdit}
                        title={_pane.title}
                        onDoubleClick={() => handleDoubleClick(String(node.key))}
                        onInputChange={(e) => handleChangeTitle(String(node.key), e)}
                        onInputBlur={(e) => handleBlur(String(node.key), e)}
                      >
                        {node}
                      </DraggableTabNode>
                    );
                  }}
                </DefaultTabBar>
              </SortableContext>
            </DndContext>
          )}
        />
      ) : null}
      {/* 新增hook脚本弹框 */}
      <Modal
        className='image-edit antd-dark'
        title='新增hook脚本'
        open={addModalVisible}
        onCancel={closeAddModal}
        onOk={addHook}
        destroyOnClose
        getContainer={false}
      >
        <Form form={form}>
          <Form.Item label='hook名称' name='hookName' rules={[{ required: true, message: '请输入hook名称' }]}>
            <Input placeholder='请输入hook名称' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HookPage;
