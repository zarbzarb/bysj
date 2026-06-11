// import React, { useEffect, useState } from 'react';
// import { Drawer } from 'antd';
// import { getAipInterfaceFilter, getSourceApiInfo } from '@/services/apis/dataManage';
// import { strToJson } from '../../utils';

// function EditApi(props) {
//   const { apiInfo: currentApi, visible, onClose, pageId } = props;
//   const [apiInfo, setApiInfo] = useState({});
//   useEffect(() => {
//     if (currentApi.id) {
//       Promise.all([
//         getSourceApiInfo({
//           iocInterfaceId: currentApi.id
//         }),
//         getAipInterfaceFilter({
//           pageId,
//           apiId: currentApi.id
//         })
//       ]).then(([sourceApiInfo, apiInfo]) => {
//         if (!sourceApiInfo.success || !apiInfo.success) return;
//         let {
//           data: { param }
//         } = sourceApiInfo;
//         let {
//           data: { paramsJson = '{}', filterJson = '{}' }
//         } = apiInfo;
//         param = strToJson(param);
//         paramsJson = strToJson(paramsJson);
//         filterJson = strToJson(filterJson);
//       });
//     }
//   }, [currentApi, pageId]);

//   const { interfaceName, url, method } = apiInfo;

//   return (
//     <Drawer
//       title={`接口名称: ${interfaceName}`}
//       visible={visible}
//       width="60%"
//       className="antd-dark"
//       onClose={onClose}>
//       <div>
//         <p>接口地址：{url}</p>
//         <p>请求方式：{method}</p>
//       </div>
//     </Drawer>
//   );
// }

// export default EditApi;
