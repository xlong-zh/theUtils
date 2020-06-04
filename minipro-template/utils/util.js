const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
// 时间格式化
const formatDate = (value, fmt) => {
  let getDate = new Date(value);
  let opt = {
    'Y+': getDate.getFullYear().toString(),
    'M+': (getDate.getMonth() + 1).toString(),
    'D+': getDate.getDate().toString(),
    'h+': getDate.getHours().toString(),
    'm+': getDate.getMinutes().toString(),
    's+': getDate.getSeconds().toString(),
  };
  for (let k in opt) {
    let ret = new RegExp('(' + k + ')').exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
    }
  }
  return fmt;
};

module.exports = {
  formatTime,
  formatDate
}
