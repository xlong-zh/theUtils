//app.js
const { HttpAction } = require('utils/http.js');
const { baseUrl, COOKIE_KEY, TOKEN_KEY } = require('consts/index');
App({
  onLaunch: function () {
    this.overShare();
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        this.globalData.code = res.code;
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.loginInfo = res;
              this.globalData.userInfo = res.userInfo;
              if (this.globalData.code) {
                this.giveData(this.globalData.code, res.userInfo, this.globalData.loginInfo);
              } else {
                wx.login({
                  success: res => {
                    this.globalData.code = res.code;
                    this.giveData(this.globalData.code, this.globalData.userInfo, this.globalData.loginInfo);
                  }
                });
              }
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  //传数据给后台(登陆后台)
  giveData(code, userInfo, loginInfo) {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + '/app/user/login',
        data: {
          code: code,
          ...userInfo,
          iv: loginInfo.iv,
          encryptedData: loginInfo.encryptedData,
          signature: loginInfo.signature
        },
        method: 'post',
        success({
          res,
          header
        }) {
          // cookie存入缓存中
          wx.setStorage({
            key: COOKIE_KEY,
            data: header['Set-Cookie']
          })
          that.getUser().then(res => {
            resolve();
          });
        },
        fail(e) {
          wx.showToast({
            title: '登录失败请重新点击头像',
            icon: 'none',
            duration: 1500
          });
          reject(e)
        },
      });
    });
  },
  //获取后台用户信息
  getUser() {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + '/app/user/current',
        data: {},
        method: 'get',
        header: {
          Cookie: wx.getStorageSync(COOKIE_KEY) || null,
        },
        success(res) {
          if (res.data.code == 401) {
            that.freshenStatus();
            return;
          }
          if (res.data.code == 0) {
            this.globalData.userMsg = res.data;
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail(e) {
          wx.showToast({
            title: '登录失败请重新登陆',
            icon: 'none',
            duration: 1500
          });
          reject(e)
        },
      });
    });
  },
  // 更新用户状态，重新拉取cookie或token
  freshenStatus() {
    const that = this;
    wx.showToast({
      title: '登录失效请刷新页面',
      icon: 'none',
      duration: 1500
    });
    wx.login({
      success(res) {
        if (that.globalData.userInfo && Object.keys(that.globalData.userInfo).length) {
          that.giveData(res.code, that.globalData.userInfo, that.globalData.loginInfo);
        } else {
          wx.showToast({
            title: '请先点击头像授权',
            icon: 'none',
            duration: 1500,
            mask: true
          });
        }
      }
    });
  },
  //重写分享方法
  overShare() {
    //监听路由切换
    //间接实现全局设置分享内容
    wx.onAppRoute(function (res) {
      //获取加载的页面
      let pages = getCurrentPages(),
        //获取当前页面的对象
        view = pages[pages.length - 1],
        data;
      if (view) {
        data = view.data;
        // console.log('是否重写分享方法', data.isOverShare);
        if (!data.isOverShare) {
          data.isOverShare = true;
          view.onShareAppMessage = function () {
            //你的分享配置
            return {
              title: '测试全局分享生效',
              path: '/pages/index/index'
            };
          };
        }
      }
    });
  },
  globalData: {
    code: null,
    loginInfo: null,
    userInfo: null,
    userMsg: null,
  }
})