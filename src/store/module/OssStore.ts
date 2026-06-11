/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:20:41
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-10-17 16:21:22
 * OSS资源管理模块数据状态
 */
import { makeAutoObservable, toJS } from 'mobx';
// import ServiceStore from './ComponentStore/ServiceStore';
// import ComStore from './ComStore';
// import { getComponentByCurrentLayerList } from '@/utils/configPageUtils';
import uuid from 'short-uuid';
import _ from 'lodash';

import { GetQueryString } from '@/utils/BrowserUtils';
import { pySort } from '@/utils/pySort';
import * as resourceVirtualFolder from '@/services/apis/resourceVirtualFolder';
import { BusinessType } from '@/services/apis/resourceVirtualFolder/createOrUpdate';

const getComponent = window.DataI.getComponentByKey;
class OssStore {
  rootStore;

  currentCompAttr;

  currentField;

  legendPosition;

  imageEdit = false;

  currentCompInstance;

  ossPathInfo = {
    bucketName: '',
    path: '',
    prefix: '',
  };

  originFileList = []; // 原始文件列表，用于搜索

  fileList = []; // 文件列表

  folderList: Record<string, any>[] = []; // 文件夹

  currentFolder: Record<string, any> = {}; // 选中文件

  // 名称查询
  searchName = '';

  // 上传时间降序等类型查询
  searchValue = '0';

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  createOrUpdateVFolder = async (name: string, resourceCatalog: 'images' | 'media' | 'other', id?: string) => {
    let businessType = BusinessType.Page;

    switch (this.rootStore.GlobalStore.bigScreenId) {
      case 'page': {
        businessType = BusinessType.Page;
        break;
      }
      case 'layer': {
        businessType = BusinessType.Layer;
        break;
      }
      case 'card': {
        businessType = BusinessType.Card;
        break;
      }

      default: {
        break;
      }
    }

    return resourceVirtualFolder.createOrUpdate({
      businessId: this.rootStore.GlobalStore.bigScreenId,
      businessType,
      name,
      id,
      resourceCatalog,
    });
  };

  deleteVFolder = resourceVirtualFolder.delete;

  dragFilesToVFolder = resourceVirtualFolder.dragFiles;

  getAllFilesAndVFolder = async (filesType: 'images' | 'media' | 'other') => {
    return resourceVirtualFolder.getAllResources(
      this.rootStore.GlobalStore.bigScreenId,
      `/${this.ossPathInfo.path}/${filesType}`,
    );
  };

  setSearchName = (name) => {
    this.searchName = name;
  };

  setSearchValue = (val) => {
    this.searchValue = val;
  };

  setFileList = (fileList) => {
    this.fileList = fileList;
  };

  setOriginFileList = (fileList) => {
    this.originFileList = fileList;
  };

  setCurrentFolder = (folder) => {
    this.currentFolder = folder;
  };

  showImage = (item, CompInstance = null, compAttr = null, field = null) => {
    if (this.folderList.length > 0) {
      const data = {
        pathStr: this.folderList[0].url,
      };
      this.getFiles(data);
    }
    this.imageEdit = item;
    this.currentCompAttr = compAttr;
    this.currentField = field || 'backgroundUrl';
    this.legendPosition = field;
    this.setCurrentCompInstance(CompInstance, this.currentField);
  };

  getImageList = async (file: File) => {
    const isUploads = {
      isChangeName: false,
      noUploads: false,
      fileUrl: '',
    };

    const rs = await this.getFileList({
      bucketName: window.screenConfig.bucketName,
      pathStr: `/${this.ossPathInfo.path}/images`,
    });

    const folderList = rs || [];

    for (const item of folderList) {
      const { size, name, url } = item;

      if (name === file.name && size !== file.size) {
        isUploads.isChangeName = true;
        continue;
      }

      if (name === file.name && size === file.size) {
        isUploads.noUploads = true;
        isUploads.fileUrl = `/iocoss/${window.screenConfig.bucketName}/${url}`;
      }
    }

    return isUploads;
  };

  setUploadFileName = (file: File): string => {
    const { name } = file;
    const filesName = `${name.slice(0, Math.max(0, name.lastIndexOf('.')))}-${uuid.generate()}${name.slice(
      Math.max(0, name.lastIndexOf('.')),
    )}`;
    return filesName;
  };

  /**
   * 获取文件在 OSS 存储的 url 或者上传文件并返回 url
   * @param file 待上传的文件
   *
   * @returns 文件在 OSS 存储的 url
   *
   * ## Error
   * - 无法上传文件或无法获取上传文件结果
   *
   * ## Example
   * @example
   * const url = await ossStore.GetImageFileUrlOrUpload(file);
   *
   * url // => "/iocoss/oss-etl-bucket/7505d64a54e06...80/images/未标题-1.png"
   */
  GetImageFileUrlOrUpload = async (file: File): Promise<string> => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('type', '1');

    formData.append('bucketName', this.ossPathInfo.bucketName);
    formData.append('directoryPaths', `${this.ossPathInfo.path}/images`);

    const isNameObj = await this.getImageList(file);

    if (isNameObj.isChangeName) formData.append('newFileName', this.setUploadFileName(file));

    if (isNameObj.noUploads) return isNameObj.fileUrl;

    const rs = await this.rootStore.ServiceStore.uploadFiles(formData);

    if (rs.code !== '200') throw new Error('Cannt upload file or unable to get upload result');

    return `/iocoss/${window.screenConfig.bucketName}/${rs.data.url}`;
  };

  uploadImage = async (file: File, CompInstance, compAttr, pointType) => {
    let type = 'datai';
    // 1. 判断组件类型
    type = CompInstance.el && CompInstance.el.classType === 'antd' ? 'antd' : 'datai';
    // CustomUploadImage组件不进行setCurrentCompInstance
    const isUpdateCurIns = CompInstance?.el?.changeImageFlag !== false;

    const currentFolderPath = this.ossPathInfo;
    const formData = new FormData();
    const isNameObj = await this.getImageList(file); // 判断是否添加图片

    formData.append('file', file);
    formData.append('type', '1');
    formData.append('bucketName', currentFolderPath.bucketName);
    formData.append('directoryPaths', `${currentFolderPath.path}/images`);

    if (isNameObj.isChangeName) {
      // 修改文件名，
      const renameFile = this.setUploadFileName(file);
      formData.append('newFileName', renameFile);
    }

    if (isNameObj.noUploads) {
      if (type === 'datai') {
        // v7.6.0 updateCustomStyle优先级最高，uploadImageCb其次，
        // 想要uploadImageCb有效，需要将updateCustomStyle置空
        // 为支持回退，去掉 backgroundUrl赋值
        if (CompInstance.updateCustomStyle) {
          CompInstance.updateCustomStyle(compAttr, isNameObj.fileUrl);
        } else if (compAttr.uploadImageCb) {
          compAttr.uploadImageCb(isNameObj.fileUrl, compAttr.legendPosition);
        }
      } else if (CompInstance.updateField) CompInstance.updateField(compAttr, isNameObj.fileUrl);
    } else {
      const rs = await this.rootStore.ServiceStore.uploadFiles(formData);

      if (rs.code === '200') {
        const url = `/iocoss/${window.screenConfig.bucketName}/${rs.data.url}`;
        if (type === 'datai') {
          if (!isUpdateCurIns && CompInstance.updateCustomStyle) {
            CompInstance.updateCustomStyle(compAttr, url);
          } else if (compAttr.uploadImageCb) {
            compAttr.uploadImageCb(url, compAttr.legendPosition);
          }

          /** antd 类型组件 调用updateField更新 */
        } else if (CompInstance.updateField) CompInstance.updateField(compAttr, url);
      }
      // 异步
      if (isUpdateCurIns) this.setCurrentCompInstance(CompInstance, pointType);
    }

    if (isUpdateCurIns) this.setCurrentCompInstance(CompInstance, pointType);
  };

  setImageSize = (CompInstance, imgUrl) => {
    this.currentCompAttr = CompInstance.compAttr;
    const img = new Image();
    // v7.7.0 兼容URL图片组件
    img.src = imgUrl || CompInstance.compAttr.backgroundUrl;
    img.addEventListener('load', () => {
      const { EditorStore } = this.rootStore;
      const key = toJS(EditorStore.changeKeys)[0];
      const item = getComponent(key);

      const width = `${img.width}px`;
      const height = `${img.width}px`;

      if (item.styles.width === width && item.styles.height === height) return;
      window.executeCommand(
        'updateAttr',
        item,
        {
          width,
          height,
        },
        'styles',
      );
    });
  };

  setIsUploads = () => {
    // this.isUploads = {};
  };

  setCurrentCompInstance = (data: any, mapType?: any) => {
    this.currentCompInstance = data;
    // 兼容点图层上传图片渲染多次问题
    if (mapType) {
      return;
    }
    this.rootStore.EditorStore.forceUpdateAttr();
  };

  closeImageEdit = () => {
    this.imageEdit = false;
    this.searchName = '';
    this.searchValue = '0';
  };

  getFolderList = async () => {
    // 获取文件夹
    return this.getFileList({
      pathStr: `/${this.ossPathInfo.path}`,
    }).then((folderList) => {
      this.folderList = folderList as typeof this.folderList;

      const data = {
        pathStr: folderList[0].url,
      };

      if (folderList) [this.currentFolder] = folderList;

      // 获取image文件列表
      this.getFiles(data);

      return new Promise((resolve, reject) => {
        resolve({
          ossPathInfo: this.ossPathInfo,
          folderList,
        });
      });
    });
  };

  getFileList = async (
    data: { bucketName?: string; pathStr?: string } = {},
  ): Promise<{ dir: boolean; name: string; size: number; url: string }[] | null | false | undefined> => {
    const rs = await this.rootStore.ServiceStore.getListObject(data);

    const createPathRs = await this.rootStore.ServiceStore.createPagePath({
      pageId: GetQueryString('id'),
    });

    if (createPathRs.code !== '200') return rs.code === '200' ? rs.data : undefined;

    const rs2 = await this.rootStore.ServiceStore.getListObject(data);
    if (rs2.code !== '200') return false;

    return rs2.data;
  };

  getFiles = (data = {}) => {
    return this.getFileList(data).then((fileList) => {
      const f = fileList
        ? fileList.map((item) => ({ ...item, url: `/iocoss/${window.screenConfig.bucketName}/${item.url}` }))
        : [];
      this.originFileList = f;
      this.onSearch(); // 按查询条件返回
      return fileList;
    });
  };

  uploadFile = (data = {}) => {
    return this.rootStore.ServiceStore.uploadFiles(data);
  };

  changeImage = (data) => {
    this.setCurrentCompInstance(data);
  };

  setOssPathInfo = (data) => {
    this.ossPathInfo = data;
    const { path = '' } = this.ossPathInfo;
    const pathReg = new RegExp('(.+)[/]{0,1}(screen|card|layer|custom)/\\d+', 'g');
    const matches = pathReg.exec(path);
    if (matches && matches.length > 0) {
      const prefix = matches[1];
      this.ossPathInfo.prefix = prefix && prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    }
  };

  onSearch = () => {
    switch (this.searchValue) {
      case '0':
      case '1': {
        return this.searchTime(this.searchName, this.searchValue);
      }
      case '2':
      case '3': {
        return this.searchNameHandler(this.searchName, this.searchValue);
      }
      default: {
        break;
      }
    }
  };

  searchNameFn = (name, fileList) => {
    fileList = [...fileList];
    if (name !== '') {
      return fileList.filter((item) => {
        return item.name.includes(name); // v8.10：改成可匹配后缀
        // const str = item.name.split('.');
        // str.pop();
        // return str[0] && str[0].includes(name);
      });
    }
    return fileList;
  };

  searchTime = (searchNameParams, searchValueParams) => {
    let newFileList = this.searchNameFn(searchNameParams, this.originFileList);
    newFileList = newFileList.sort((a, b) => {
      if (this.searchValue === '0') {
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
      }
      return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
    });
    this.setFileList(newFileList);
  };

  searchNameHandler = (searchNameParams, searchValueParams) => {
    const newFileList = this.searchNameFn(searchNameParams, this.originFileList);
    let pyArr = [];
    for (const val of pySort(newFileList)) {
      pyArr.push(...val.data);
    }
    if (this.searchValue === '3') {
      pyArr = pyArr.reverse();
    }
    // 去重
    pyArr = _.uniqWith(pyArr, _.isEqual);
    // console.log(pyArr);
    this.setFileList(pyArr);
  };

  uploadFont = async (file, name) => {
    const {
      VersionStore: { apiVersion },
    } = this.rootStore;
    const formData = new FormData();
    formData.append('appId', this.rootStore.GlobalStore.bigScreenId);
    formData.append('file', file);
    formData.append('name', name);
    formData.append('path', `${this.ossPathInfo.path}/other`);
    if (apiVersion) formData.append('version', apiVersion);

    // console.log('开始上传', file, name);
    const rs = await this.rootStore.ServiceStore.uploadFont(formData);
    return rs.code === '200' ? Promise.resolve(rs.data) : console.error(rs);
  };
}

export default OssStore;
