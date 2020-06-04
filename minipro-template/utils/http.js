const { baseUrl, COOKIE_KEY, TOKEN_KEY } = require('../consts/index');
const app = getApp();
const header = {
  Cookie: wx.getStorageSync(COOKIE_KEY) || null,
  'X-Access-Token': wx.getStorageSync(TOKEN_KEY) || null,
  // 'content-type': 'application/x-www-form-urlencoded'
}
const HttpAction = (method, url, argu = null, config = { noLoading: false }) => {
  return new Promise((resolve, reject) => {
    if (config.noLoading) {
      wx.showLoading({
        title: '正在加载'
      })
    }
    wx.request({
      method: method,
      url: baseUrl + url,
      header: header,
      data: argu,
      success(res) {
        if (res.data.code == 401) {
          app.freshenStatus();
          return;
        }
        if (res.data.code == 0) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail(e) {
        reject(e)
      },
      complete() {
        if (config.noLoading) {
          wx.hideLoading();
        }
      }
    })
  })
}
module.exports = {
  HttpAction
}

