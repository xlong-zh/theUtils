class Http {
  _http = null;
  constructor(option = {}) {
    this.init(option);
  }

  init(option) {
    const http = axios.create(option);

    request.interceptors.request.use(
      config => {
        config.headers.Authorization = `Bearer ${localStorage.getItem('token') || ''}`;
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

          if (status === 500) {
            console.error('error');
            return Promise.reject(error.response);
          }
        }

        return Promise.reject(error.response);
      }
    );

    this._http = http;
  }

  _request(method, params, option = {}) {
    const opt = {
      method
    };

    Object.assign(opt, options);

    if (typeof params === 'string') {
      opt.url = `${opt.url}/${params}`;
    } else {
      if (method === 'get') {
        Object.assign(opt, { params });
      } else {
        Object.assign(opt, { data: params });
      }
    }

    return this._http(opt);
  }

  GET(url, params, option = {}) {
    return this._request('get', params, {
      url,
      ...option
    });
  }

  POST(url, params, option = {}) {
    return this._request('post', params, {
      url,
      ...option
    });
  }
}

const http = new Http({ baseURL: '' });

http.GET('/login').then(res => {});
