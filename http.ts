import axios from 'axios';
import { appConfig } from 'config/app.config';
import Message from 'components/common/Message';
const baseURL = process.env.CREATIVE_URL || appConfig.api;
console.log(baseURL, 'baseURL');

const request = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  transformRequest: [
    data => {
      if (data instanceof FormData) {
        return data;
      }
      return JSON.stringify(data);
    }
  ],
  withCredentials: true
  // xsrfCookieName: ''
  // `transformResponse` allows changes to the response data to be made before
  // it is passed to then/catch
  // transformResponse: [
  //   data => {
  //     // Do whatever you want to transform the data
  //     const res = JSON.parse(data);
  //     return res;
  //   },
  // ],
});

request.interceptors.request.use(
  config => {
    // token
    // config.headers.Authorization = `Bearer ${localStorage.getItem('token') || ''}`;
    // config.headers.Token = `${localStorage.getItem('token') || ''}`;
    return config;
  },
  err => {
    return Promise.reject(err);
  }
);

request.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error && error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 500) {
        const errorMsg = data ? data.message || data.error : 'server error';
        Message.error(errorMsg);
        return Promise.reject(error.response);
      }

      if ([401, 400].includes(status)) {
        // cookie失效，登录失效，返回登录界面
        if (data.code === 401.1) {
          data && data.message && Message.error(data.message);
          window.location.replace(window.location.origin + '/index.html#/login');
        }
      }
    }

    return Promise.reject(error.response);
  }
);

export const http = request;
