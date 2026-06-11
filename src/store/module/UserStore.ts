import { makeAutoObservable, runInAction } from 'mobx';
import * as InfoApis from '@/services/apis/userApi';

// const TOKEN_CODE = 'special_tackling';

export default class UserStore {
  rootStore = null;

  userName = '';

  loginState = true;

  logineject = false;

  userInfo = null;

  constructor(rootStore) {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo !== null) {
      this.userInfo = JSON.parse(userInfo);
    }
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  loginerr = () => {
    runInAction(() => {
      this.logineject = false;
    });
  };

  keydowmCode = (e, data) => {
    if (Number(e.keyCode) === 13) {
      this.login(data);
    }
  };

  keydowmUser = (e, data) => {
    if (Number(e.keyCode) === 13 && data.passwd) {
      this.login(data);
    }
  };

  login = (data) => {
    const { loginName = '', password = '' } = data;
    // userName += "@" + TOKEN_CODE
    return InfoApis.LOGIN({
      loginName,
      password,
    }).then((rs) => {
      if (Number(rs.code) === 200) {
        localStorage.setItem('userInfo', JSON.stringify(rs.data));
        localStorage.setItem('authToken', rs.data.token);
      } else {
        runInAction(() => {
          this.logineject = true;
        });
      }
      return rs;
    });
  };

  showLoginTip = () => {
    runInAction(() => {
      this.logineject = true;
    });
  };

  setState = (bool) => {
    this.loginState = bool;
  };
}
