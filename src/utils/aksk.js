import { JSEncrypt } from 'jsencrypt';
import SHA256 from 'crypto-js/sha256';
import Cookies from 'js-cookie';
import { authorization } from '@/services/apis/indicatorApi';

export const getXToken = () => {
  return Cookies.get('aksk-token');
};

// 随机生成 uuid
export const guid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 创建 pwd
 * @param {number} privateKey aksk 文件中的 Java Private Key
 * @param {number} time 过期时间（默认24小时）
 * @returns {string}
 */
const createAKSKPwd = (privateKey, time = 24) => {
  const encrypt = new JSEncrypt();
  encrypt.setPrivateKey(privateKey);
  const _guid = guid();
  const uuid = `${_guid}@${3600 * time}`;
  const pwd = `${uuid}#${encrypt.sign(uuid, SHA256, 'sha256')}`; // 签名
  return pwd;
};

const _fetchXToken = (keyId, privateKey) => {
  const password = createAKSKPwd(privateKey, 12);
  const params = {
    type: 'aksk',
    name: keyId,
    password,
  };
  return authorization(params).then((res) => {
    if (res && res.token) {
      Cookies.set('aksk-token', res.token, { expires: 0.5 });
    }
  });
};

export const fetchXToken = (keyId, privateKey) => {
  if (!keyId || !privateKey) return;

  if (getXToken()) return;

  // 失败重试 3 次
  _fetchXToken(keyId, privateKey).catch((error) => {
    console.error(error);

    _fetchXToken(keyId, privateKey).catch((error) => {
      console.error(error);

      _fetchXToken(keyId, privateKey).catch((error) => {
        console.error(error);
      });
    });
  });
};
