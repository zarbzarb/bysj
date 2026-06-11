import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input, Form, Modal, TreeSelect, message, Select } from 'antd';
import { isPlainObject } from 'lodash';
import { useForm } from 'antd/lib/form/Form';
import { ADDCARDINFO, UPDATECARDINFO, CARDPREVIEWIMGURL, FILECOPY } from '@/services/apis/CardApi';
import { getCompListJSONSettings } from '@/Computed/Comp/ExportCompJson';
import { useStore } from '@/hooks';
import { filterDataStore, filterRelatedApi, replaceKey, resetComponentKey } from '@/utils/resetKeys';
import { handlePrint } from '@/components/html2canvas';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import DataI from '@/utils/global-api';
import styles from './index.less';

const { TextArea } = Input;
const { Option } = Select;
const { TreeNode } = TreeSelect;

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { offset: 1, span: 16 },
};

const CardTypeOptions = [
  {
    id: 1,
    name: '标准',
  },
  {
    id: 2,
    name: '小卡',
  },
];
interface CardFormProps {
  successBack: () => void;
  warpRef?: React.Ref<any>;
  list: any[];
}

const CardForm = (props: CardFormProps) => {
  const { editorStore, ossStore, globalStore } = useStore();
  const { screenConfig } = globalStore;
  const { changeKeys: keys } = editorStore;
  const { successBack, warpRef, list } = props;
  const [form] = useForm();
  const isUploadRef = useRef<boolean>(false);
  /**
   * 更新卡片预览图片
   * @param id
   */
  const uploadPic = (id) => {
    const handlePrintHandle = handlePrint(`[data-key='${keys[0]}']`);
    if (handlePrintHandle) {
      handlePrintHandle
        .then(async (base64) => {
          const data = {
            id,
            previewImg: base64,
          };
          const rs = await CARDPREVIEWIMGURL(data);
          if (Number(rs.code) !== 200) {
            message.error(rs.message);
            return;
          }
        })
        .catch((error) => {
          message.error('获取预览图失败！');
        });
    }
  };
  /**
   * 添加卡片信息
   * @param values
   * @param pureJson
   * @param remarkVarInfo
   * @returns
   */
  const addCardInfo = async (values, pureJson, remarkVarInfo) => {
    try {
      const rs = await ADDCARDINFO(values);
      // console.log('rs', rs);
      if (rs && Number(rs.code) === 200) {
        const { cardDbId, cardUid } = rs.data; // 接口调整，长短id都返回，拷贝OSS资源的时候用短id
        const { ossPathInfo } = ossStore;
        const { prefix } = ossPathInfo; // 专门为梧桐空间添加
        const icoScreenPathReg = new RegExp(
          `"\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
            prefix ? prefix.length : 0
          }}\/[^\/]{0,}[\/]{0,1}(screen|card|layer|custom)\/[0-9]+\/[^"]+"`, // 考虑新建的屏没有提交过
          'g',
        );
        const matchedArr = pureJson.match(icoScreenPathReg) || []; // 找出所有的存储路径
        // const pathArr = _.uniqBy(
        //   matchedArr.map((item) => item.replace(/"/g, '')), // 存储路径去重
        // );

        const pathArr = [
          ...new Set(
            matchedArr.map((item) => {
              const matchedPath = item.replaceAll('"', ''); // 存储路径去重
              return matchedPath;
            }),
          ),
        ];
        const filteredPathArr = pathArr.map((path) => {
          const filteredPath = (path as string).replace(
            new RegExp(`\/iocoss\/${window.screenConfig.bucketName}\/`), // 去掉桶名的桶内原始文件存储路径
            '',
          );
          return filteredPath;
        });
        const pathReg = new RegExp(
          `\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
            prefix ? prefix.length : 0
          }}\/(screen|card|layer|custom)\/[0-9]+\/`,
          'g',
        );
        // let moveToPathArr = _.uniqBy(
        //   pathArr.map((item) => {
        //     const moveToPath = item.replace(pathReg, `card\/${cardDbId}\/`); // 桶内目的文件存储路径，卡片使用card文件夹
        //     return moveToPath;
        //   },
        //   ),
        // );

        let moveToPathArr = [
          ...new Set(
            pathArr.map((item) => {
              const moveToPath = (item as string).replace(pathReg, `card\/${cardDbId}/`); // 桶内目的文件存储路径，卡片使用card文件夹
              return moveToPath;
            }),
          ),
        ];

        moveToPathArr = moveToPathArr.map((item) => {
          const res = item.split('/');
          res.pop(); // 桶内目的存储路径
          return res.join('/');
        });
        const copyParams = {
          fileCopyItemList: moveToPathArr.map((item, index) => {
            const param = {
              fromBucket: screenConfig.bucketName,
              fromUrl: filteredPathArr[index], // 以去重后的数组为准，因为存在多个卡片引用同一个资源的情况
              toBucket: screenConfig.bucketName,
              toDiretoryPath: item,
            };
            return param;
          }),
        };

        try {
          const copyRs = await FILECOPY(copyParams);
          if (copyRs && Number(copyRs.code) === 200 && copyRs.data) {
            const idReg = new RegExp(
              `"\/iocoss\/${window.screenConfig.bucketName}[\/]{0,1}[\/0-9a-z]{${
                prefix ? prefix.length : 0
              }}/(screen|card|layer|custom)\/[0-9]+\/`,
              'g',
            );
            const cardData = pureJson.replace(
              idReg,
              `"\/iocoss\/${window.screenConfig.bucketName}${prefix ? `/${prefix}` : ''}\/card\/${cardDbId}\/`, // 修改提交的桶内文件存储路径，卡片使用card文件夹
            );

            const cardInfo = JSON.parse(cardData);
            // 获取key值
            const compKeys = resetComponentKey(cardInfo.componentList);
            // 重置key
            const resetCardData = replaceKey(JSON.stringify(cardInfo.componentList), compKeys);
            cardInfo.componentList = JSON.parse(resetCardData);

            // 提交卡片时删除卡片内部所有组的置顶属性
            DataI.each(cardInfo.componentList, (com) => {
              if (com.classType === 'group' && com.styles.isTop) {
                delete com.styles.isTop;
                delete com.styles.zIndex;
              }
            });

            const data = {
              id: cardUid, // 保存配置信息用长ID
              jsonConfig: escape(JSON.stringify(cardInfo)).split('').reverse().join(''), // 转义后倒序（防止防火墙拦截）
              jsonPureConfig: '11',
              remarkVarInfo: JSON.stringify(remarkVarInfo),
            };
            try {
              const rs1 = await UPDATECARDINFO(data);
              isUploadRef.current = false;
              if (rs1 && Number(rs1.code) === 200) {
                successBack?.();
                message.success('卡片模板提交完成！');
              } else if (rs1) {
                message.error(rs1.message);
              }
            } catch (error) {
              isUploadRef.current = false;
              message.error(error);
            }
            uploadPic(cardUid); // 更新封面图用长ID
          } else {
            if (copyRs) {
              message.error(copyRs.message);
            }
            isUploadRef.current = false;
            return;
          }
        } catch (error) {
          isUploadRef.current = false;
          message.error(error);
        }
      } else {
        if (rs) {
          message.error(rs.message);
        }
        isUploadRef.current = false;
      }
    } catch (error) {
      isUploadRef.current = false;
      message.error(error);
    }
  };

  // 提交卡片需要迁移大屏内的相关资源到卡片
  const onFinish = (values) => {
    // console.log('onFinish', values);
    if (isUploadRef.current) {
      message.warning('正在提交卡片');
      return;
    }

    isUploadRef.current = true;

    const dynSrcIdVec = [];

    window.DataI.each(window.DataI.getComList(keys[0]), (i: any): string | null => {
      if (i.dataset?.category === 'dynamic') dynSrcIdVec.push(i.dataset?.dynamic?.source?.id ?? null);

      if (i?.preAttr?._config?._source === 'dynamic')
        dynSrcIdVec.push(i?.preAttr?._config?.dynamic?.source?.id ?? null);

      if (i.dataset?.category === 'indicator') dynSrcIdVec.push(i.dataset?.indicator?.source?.id ?? null);

      if (i?.preAttr?._config?._source === 'indicator')
        dynSrcIdVec.push(i?.preAttr?._config?.indicator?.source?.id ?? null);

      return null;
    });

    const currentScreenConfig = globalStore.getScreenConfig(false);

    const dynamicApis = dynSrcIdVec
      .map((id) => {
        const { dynamicApis: dynApis = [] } = currentScreenConfig || {};

        const dynApi = dynApis.find((api) => api.id === id);

        return dynApi;
      })
      .filter((api) => isPlainObject(api));

    const comListStr = getCompListJSONSettings(keys);
    const comList = JSON.parse(comListStr);

    window.DataI.each(comList, (com) => {
      // 删除组件身上的screenConfig(避免后续正则匹配会匹配到screenConfig上的字体信息)
      if (com.classType === 'com') {
        if (com.preAttr?._config?.screenConfig) delete com.preAttr._config.screenConfig;
        if (com._config?.screenConfig) delete com._config.screenConfig;
      }
    });

    const cardDataStore = filterDataStore(window.dataStore, comListStr);
    const pureJson = {
      componentList: comList,
      dataStore: cardDataStore,
      relatedApis: filterRelatedApi(JSON.parse(comListStr)),
      screenConfig: {
        baseUrl: screenConfig.baseUrl,
        environment: screenConfig.environment,
        favicon: screenConfig.favicon,
        dynamicApis,
        width: 1920,
        height: 1080,
      },
    };
    // 存放标记变量
    const remarkVarInfo = [];
    cardDataStore.forEach((child) => {
      // 收集标记变量
      const arr = child.children?.filter((item) => item.isMark) || [];
      const copyChild = {
        ...child,
        children: arr,
      };
      remarkVarInfo.push(copyChild);
    });
    const pureJsonStr = JSON.stringify(pureJson);
    addCardInfo(values, pureJsonStr, remarkVarInfo); // 需要支持卡片成组后提交
  };

  const handleSelect = (val, node) => {
    if (node.children?.length > 0) {
      message.warning('请选择末端节点');
      const timer = setTimeout(() => {
        form.setFieldsValue({
          sortId: undefined,
        });
        clearTimeout(timer);
      }, 100);
      return;
    }
  };

  const treeNodeRender = useCallback((data) => {
    return data.map(({ sortName, id, childrenList }) => (
      <TreeNode value={id} title={sortName} key={id}>
        {childrenList && treeNodeRender(childrenList)}
      </TreeNode>
    ));
  }, []);

  return (
    <Form {...layout} ref={warpRef} form={form} className={styles.cardForm} name='uploadCard' onFinish={onFinish}>
      <Form.Item
        label='卡片名称'
        name='cardName'
        rules={[
          {
            required: true,
            message: '请输入卡片名称!',
          },
        ]}
      >
        <Input placeholder='请输入卡片名称' />
      </Form.Item>

      {/* <Form.Item
        label="卡片标识"
        name="cardCode"
        rules={[
          {
            required: true,
            message: '请输入卡片标识!'
          }
        ]}>
        <Input />
      </Form.Item> */}

      <Form.Item
        label='卡片分类'
        name='sortId'
        rules={[
          {
            required: true,
            message: '请选择卡片分类!',
          },
        ]}
      >
        <TreeSelect
          suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
          style={{ width: '100%' }}
          showSearch={true}
          treeNodeFilterProp='title'
          dropdownMatchSelectWidth={false}
          dropdownStyle={{
            maxHeight: 400,
            overflow: 'auto',
          }}
          placeholder='请选择卡片分类，只能选择末端节点'
          onSelect={(val, node) => {
            handleSelect(val, node);
          }}
          allowClear
        >
          {treeNodeRender(list)}
        </TreeSelect>
      </Form.Item>
      <Form.Item name='cardType' label='卡片类型' rules={[{ required: true, message: '请选择卡片类型' }]}>
        <Select
          placeholder='请选择卡片类型'
          dropdownClassName={styles.cardTypeDropdown}
          popupClassName={styles.cardTypeDropdown}
        >
          {CardTypeOptions.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label='备注'
        name='remark'
        rules={[
          {
            required: false,
            message: '请输入卡片备注!',
          },
        ]}
      >
        <TextArea />
      </Form.Item>
    </Form>
  );
};
interface IProps {
  backFn: () => void;
  visible: boolean;
}
const CardUploadModal = (props: IProps) => {
  const { serviceStore } = useStore();
  const { getGategoryList } = serviceStore;
  const { backFn, visible } = props;
  const [list, setList] = useState([]);
  const ref = useRef<HTMLFormElement>(null);
  /**
   * 取消处理
   */
  const cancelHandler = () => {
    if (backFn) {
      backFn();
    }
  };
  /**
   * 确定处理
   */
  const okHandler = () => {
    // console.log('okHandler');
    if (ref.current) {
      ref.current.submit();
    }
  };
  /**
   * 展示时，无数据需要请求自定义卡片分类列表，如果无数据，会不停请求
   */
  useEffect(() => {
    if (visible && list.length === 0) {
      getGategoryList()
        .then((newList) => {
          setList(newList); // 第一次弹框才调用
        })
        .catch(() => {
          message.error('请求自定义卡片分类列表失败');
        });
    }
  }, [visible, list.length, getGategoryList]);

  return (
    <Modal
      getContainer={false}
      destroyOnClose={true}
      className={styles.uploadCard}
      title='提交到卡片列表'
      open={visible}
      onCancel={cancelHandler}
      onOk={okHandler}
    >
      <CardForm successBack={backFn} warpRef={ref} list={list} />
    </Modal>
  );
};

export default CardUploadModal;
