import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { getSourceApiInfo, getAipInterfaceFilter } from '@/services/apis/dataManage';
import { strToJson } from '../../utils';
import ParamsTable from '../ParamsTable';

function EditApi(props) {
  const { apiInfo: currentApi, visible, onCancel, onOk, pageId, onParameter, saveParam } = props;
  // const [apiInfo, setApiInfo] = useState({});
  // const [isVisible, setIsVisible] = useState(false);
  const [paramList, setParamList] = useState(saveParam || []); //填写回显数据
  // const [paramList, setParamList] = useState([]);
  useEffect(() => {
    // console.log(currentApi, saveParam, '0000000');
    if (currentApi.interfaceCode && !currentApi.configStatus) {
      getSourceApiInfo({
        iocInterfaceCode: currentApi.interfaceCode, // 换成不变的code
      }).then((sourceApiInfo) => {
        if (!sourceApiInfo.success || !sourceApiInfo.data) return;
        let {
          data: { param, result, method },
        } = sourceApiInfo;
        param = strToJson(param);
        result = strToJson(result, []);
        let paramList = param;
        if (!Array.isArray(param)) {
          if (method.toLocaleLowerCase() === 'get') {
            paramList = param.queryParams || [];
          }
          if (method.toLocaleLowerCase() === 'post') {
            // v7-10-0 按格式获取参数
            let bodyParams = param?.bodyParams || {};
            let config = {};
            let contentType = bodyParams.contentType;
            if (!contentType) {
              let keys = Object.keys(bodyParams);
              if (keys && keys.length > 0) {
                contentType = keys[0];
              }
            }
            if (contentType) {
              config = bodyParams[contentType];
              if (contentType == 'row') {
                paramList = config?.rowParam || [];
              } else {
                paramList = Array.isArray(config) ? config : [];
              }
            } else {
              paramList = [];
            }
            // paramList =
            //   param.bodyParams &&
            //   param.bodyParams.row &&
            //   param.bodyParams.row.rowParam
            //     ? param.bodyParams.row.rowParam
            //     : [];
            if (param?.queryParams || false) {
              const querys = param.queryParams;
              querys.forEach((item) => {
                item.queryFlag = true;
              });
              paramList = paramList.concat(querys); // 添加支持POST请求的query参数
            }
          }
        }
        paramList = paramList.map((item) => {
          item.status = false; // 状态 默认为修改
          item.defaultValue = item.example; // 默认值
          return item;
        });
        setParamList(paramList);
        // if (!Array.isArray(result)) {
        //   message.warning('当前接口返回格式不正确，请检查！'); // 注掉考虑到外部接口不是接口中心的数据格式
        // }
      });
    } else {
      // 接口刷新增加判断
      if (!!currentApi.interfaceCode) {
        getAipInterfaceFilter({
          interfaceCode: currentApi.interfaceCode, // 换成不变的code
          pageId, //页面ID
        }).then(({ success, data, message: msg }) => {
          if (!success) return;
          setParamList(JSON.parse(data.paramsJson));
        });
      }
    }
  }, [currentApi, pageId]);

  // const { interfaceName, url, method } = apiInfo;
  return (
    <Modal
      title='入参配置'
      getContainer={false}
      visible={visible}
      // onOk={onOk}
      // 接口刷新
      onOk={() => onOk(currentApi, '', paramList)}
      onCancel={onCancel}
      closable={false}
    >
      <ParamsTable
        onChange={(value) => {
          setParamList(value);
          onParameter(value);
        }}
        value={paramList}
      />
    </Modal>
  );
}

export default EditApi;
