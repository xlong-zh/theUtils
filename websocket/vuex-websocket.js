import Vue from 'vue';
// import store from '@/store/';
// import { ACCESS_TOKEN } from '@/store/mutation-types';

const websocketStore = {
  state: {
    websock: null,
    websocketTimer: null,
    eventlist: [],
    results: { data: '', adId: '', total: '', finish: 'close' }
  },
  getters: {
    onEvent(state) {
      return function(method) {
        let arrlist = state.eventlist;
        return arrlist;
      };
    },
    websocValue: state => (state.results && state.results.data ? state.results.data : 0),
    websocTotal: state => (state.results && state.results.total ? state.results.total : 0),
    websocAdId: state => (state.results && state.results.adId ? state.results.adId : ''),
    websocFinish: state => (state.results && state.results.finish ? state.results.finish : 'close')
  },
  mutations: {
    WEBSOCKET_INIT(state, url) {
      const _this = this;
      state.websock = new WebSocket(url);
      //开始连接
      state.websock.onopen = function() {
        console.log('websocket连接成功地址：', url);
        //发送心跳包
        state.websocketTimer = setInterval(function() {
          console.log('ws发送心跳！');
          let heart = {
            type: 5,
            jsonData: '心跳包'
            // 'X-Access-Token': Vue.ls.get(ACCESS_TOKEN)
            // sd: new Date(),
          };
          state.websock.send(JSON.stringify(heart));
        }, 20000);
      };
      //接受消息
      state.websock.onmessage = function(callBack) {
        console.log('ws接收！', callBack);
        const datas = JSON.parse(callBack.data);
        // if (!datas.success && datas.code === 9) {
        //   clearInterval(state.websocketTimer);
        //   state.websock.close();
        //   setTimeout(() => {
        //     const websocTheUrl = `${window._CONFIG['domianURL'].replace('http', 'ws')}/socket/server/${Vue.ls.get(
        //       ACCESS_TOKEN
        //     ) || 'null'}`;
        //     store.dispatch('WEBSOCKET_INIT', websocTheUrl);
        //   }, 3000);
        //   return;
        // }
        if (datas.code === 5) {
          console.log('收到服务器心跳包！');
          return;
        }
        if (datas.code === 1) {
          state.results = Object.assign({}, state.results, datas.result);
          console.log(state.results, '收到服务器消息');
        }
      };
      //错误
      state.websock.οnerrοr = function(e) {
        // clearInterval(state.websocketTimer);
        // console.log('ws错误!');
        // console.log(e);
        // //失败重连
        // state.websock.close();
        // const websocTheUrl = `${window._CONFIG['domianURL'].replace('http', 'ws')}/socket/server/${Vue.ls.get(
        //   ACCESS_TOKEN
        // ) || 'null'}`;
        // store.dispatch('WEBSOCKET_INIT', websocTheUrl);
      };
      //关闭
      state.websock.onclose = function(e) {
        clearInterval(state.websocketTimer);
        console.log('ws关闭！');
        console.log(e);
      };
    },
    //发送消息
    WEBSOCKET_SEND(state, p) {
      p.sd = new Date();
      p.type = 1;
      console.log('ws发送！', p);
      state.websock.send(JSON.stringify(p));
    },
    //设置进度条显示状态
    SET_FINISH_OPEN: (state, data) => {
      state.results.finish = data;
    }
  },
  actions: {
    WEBSOCKET_INIT({ commit }, url) {
      commit('WEBSOCKET_INIT', url);
    },
    WEBSOCKET_SEND({ commit }, p) {
      commit('WEBSOCKET_SEND', p);
    }
  }
};
export default websocketStore;

// const websocTheUrl = `${window._CONFIG['domianURL'].replace('http', 'ws')}/socket/server/${Vue.ls.get(
//   ACCESS_TOKEN
// ) || 'null'}`;
// store.dispatch('WEBSOCKET_INIT', websocTheUrl);

// this.$store.dispatch('WEBSOCKET_SEND', {
//   adId: this.modalparams.adId,
//   total: this.barTotalNum,
//   jsonData: '发送数据'
// });