const hasPermission = {
  install(Vue, options) {
    console.log(options);
    Vue.directive('has', {
      inserted: (el, binding, vnode) => {
        console.log('页面权限控制----');
        //节点权限处理，如果命中则不进行全局权限处理
        if (!filterNodePermission(el, binding, vnode)) {
          filterGlobalPermission(el, binding, vnode);
        }
      }
    });
  }
};
//自动获取焦点
const focusPermission = {
  install(Vue, options) {
    console.log(options);
    Vue.directive('focus', {
      // 当被绑定的元素插入到 DOM 中时……
      inserted: function(el) {
        // 聚焦元素
        el.focus();
      }
    });
  }
};
// 拖拽组件
const dragPermission = {
  install(Vue, options) {
    console.log(options);
    Vue.directive('drag', {
      // 指令的定义
      inserted: function(el, binding, vnode) {
        vnode = vnode.elm;
        //阻止事件冒泡
        el.onmousedown = event => {
          if (event.target.className !== 'my_dialog_title') {
            return;
          }
          event.stopPropagation();

          // (clientX, clientY)点击位置距离当前可视区域的坐标(x，y)
          // offsetLeft, offsetTop 距离上层或父级的左边距和上边距

          // 获取鼠标在弹窗中的位置
          let mouseX = event.clientX - el.offsetLeft;
          let mouseY = event.clientY - el.offsetTop;

          // 绑定移动和停止函数
          document.onmousemove = event => {
            let left, top;

            // 获取新的鼠标位置(event.clientX, event.clientY)
            // 弹窗应该在的位置(left, top)
            left = event.clientX - mouseX;
            top = event.clientY - mouseY;

            // offsetWidth、offsetHeight 当前元素的宽度
            // innerWidth、innerHeight 浏览器可视区的宽度和高度

            // 获取弹窗在页面中距X轴的最小、最大 位置,减去偏移位置
            let minX = -el.offsetWidth / 2 + 100;
            let maxX = window.innerWidth + el.offsetWidth / 2 - 100;
            if (left <= minX) {
              left = minX;
            } else if (left >= maxX) {
              left = maxX;
            }

            // 获取弹窗在页面中距Y轴的最小、最大 位置,减去偏移位置
            let minY = el.offsetHeight / 2;
            let maxY = window.innerHeight + el.offsetHeight / 2 - 100;
            if (top <= minY) {
              top = minY;
            } else if (top >= maxY) {
              top = maxY;
            }
            // 赋值移动
            el.style.left = left + 'px';
            el.style.top = top + 'px';
          };
          document.onmouseup = () => {
            document.onmousemove = document.onmouseup = null;
          };
        };
        window.onresize = () => {
          el.style.left = '50%';
          el.style.top = '50%';
        };
      }
    });
  }
};
export { hasPermission, focusPermission, dragPermission };
