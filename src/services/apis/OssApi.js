import { get, post } from '@/services/xhr/fetch';
// import { getUserId } from '@/utils/sessionOperation';

const DOWNLOAD_SCREEN_OSS_URL = '/api/storage/datamigration/v1/addTask'; // 大屏提交对应的Storage资源迁移
// const OSS_TASK_LIST_URL = '/api/datai/staticResources/listZip';

export const DOWNLOADSCREENOSS = (data) => {
  return post(DOWNLOAD_SCREEN_OSS_URL, data);
};

// export const GETOSSTASKLIST = () => {
//   return get(OSS_TASK_LIST_URL, {
//     userId: getUserId()
//     // objectPath: "/iocoss/default/screen/"
//   });
// };
