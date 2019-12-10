//解决小数运算浮点数函数（2个数字的(+,-,*,/,%)可用）;
export function cleanFloatingNum(numa, numb, oper) {
  const lena = String(numa).split('.').length > 1 ? String(numa).split('.')[1].length : 0;
  const lenb = String(numb).split('.').length > 1 ? String(numb).split('.')[1].length : 0;
  const lenMax = Math.max(lena, lenb);
  const times = Number('1e' + lenMax);
  let obj = 0;
  if (oper === '*') {
    obj = (Number(numa + 'e' + lenMax) * Number(numb + 'e' + lenMax)) / times / times;
  } else if (oper === '+') {
    obj = (Number(numa + 'e' + lenMax) + Number(numb + 'e' + lenMax)) / times;
  } else if (oper === '-') {
    obj = (Number(numa + 'e' + lenMax) - Number(numb + 'e' + lenMax)) / times;
  } else if (oper === '/') {
    obj = Number(numa + 'e' + lenMax) / Number(numb + 'e' + lenMax);
  } else if (oper === '%') {
    obj = (Number(numa + 'e' + lenMax) % Number(numb + 'e' + lenMax)) / times;
  }
  return obj;
}

/**
 * 时间格式化
 * @param value
 * @param fmt
 * @returns {*}
 */
export function formatDate(value, fmt) {
  var regPos = /^\d+(\.\d+)?$/;
  if (regPos.test(value)) {
    //如果是数字
    let getDate = new Date(value);
    let o = {
      'M+': getDate.getMonth() + 1,
      'd+': getDate.getDate(),
      'h+': getDate.getHours(),
      'm+': getDate.getMinutes(),
      's+': getDate.getSeconds(),
      'q+': Math.floor((getDate.getMonth() + 3) / 3),
      S: getDate.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (getDate.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
      }
    }
    return fmt;
  } else {
    //TODO
    value = value.trim();
    return value.substr(0, fmt.length);
  }
}

/**
 * 触发 window.resize
 */
export function triggerWindowResizeEvent() {
  let event = document.createEvent('HTMLEvents');
  event.initEvent('resize', true, true);
  event.eventType = 'message';
  window.dispatchEvent(event);
}

/**
 * 过滤对象中为空的属性
 * @param obj
 * @returns {*}
 */
export function filterObj(obj) {
  if (!(typeof obj == 'object')) {
    return;
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key) && (obj[key] == null || obj[key] == undefined || obj[key] === '')) {
      delete obj[key];
    }
  }
  return obj;
}

/**
 * 随机生成字符串
 * @param length 字符串的长度
 * @param chats 可选字符串区间（只会生成传入的字符串中的字符）
 * @return string 生成的字符串
 */
export function randomString(length, chats) {
  if (!length) length = 1;
  if (!chats) chats = '0123456789qwertyuioplkjhgfdsazxcvbnm';
  let str = '';
  for (let i = 0; i < length; i++) {
    let num = randomNumber(0, chats.length - 1);
    str += chats[num];
  }
  return str;
}

/**
 * 随机生成uuid
 * @return string 生成的uuid
 */
export function randomUUID() {
  let chats = '0123456789abcdef';
  return randomString(32, chats);
}

/**
 * 随机生成数字
 *
 * 示例：生成长度为 12 的随机数：randomNumber(12)
 * 示例：生成 3~23 之间的随机数：randomNumber(3, 23)
 *
 * @param1 最小值 | 长度
 * @param2 最大值
 * @return int 生成后的数字
 */
export function randomNumber() {
  // 生成 最小值 到 最大值 区间的随机数
  const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  if (arguments.length === 1) {
    let [length] = arguments;
    // 生成指定长度的随机数字，首位一定不是 0
    let nums = [...Array(length).keys()].map(i => (i > 0 ? random(0, 9) : random(1, 9)));
    return parseInt(nums.join(''));
  } else if (arguments.length >= 2) {
    let [min, max] = arguments;
    return random(min, max);
  } else {
    return Number.NaN;
  }
}

