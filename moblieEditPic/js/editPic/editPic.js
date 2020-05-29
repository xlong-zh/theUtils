(function (window, document) {
  var REGEXP_DATA_URL = /^data:/;
  var REGEXP_DATA_URL_JPEG = /^data:image\/jpeg.*;base64,/;
  var IS_SAFARI_OR_UIWEBVIEW = navigator && /(Macintosh|iPhone|iPod|iPad).*AppleWebKit/i.test(navigator.userAgent);
  var fromCharCode = String.fromCharCode;

  /****************辅助函数********************************************/
  // 获取jpg图片的exif的角度（在ios体现最明显）
  function getOrientation(arrayBuffer) {
    var dataView = new DataView(arrayBuffer);
    var length = dataView.byteLength;
    var orientation;
    var exifIDCode;
    var tiffOffset;
    var firstIFDOffset;
    var littleEndian;
    var endianness;
    var app1Start;
    var ifdStart;
    var offset;
    var i;
    // Only handle JPEG image (start by 0xFFD8)
    if (dataView.getUint8(0) === 0xff && dataView.getUint8(1) === 0xd8) {
      offset = 2;
      while (offset < length) {
        if (dataView.getUint8(offset) === 0xff && dataView.getUint8(offset + 1) === 0xe1) {
          app1Start = offset;
          break;
        }
        offset++;
      }
    }
    if (app1Start) {
      exifIDCode = app1Start + 4;
      tiffOffset = app1Start + 10;
      if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
        endianness = dataView.getUint16(tiffOffset);
        littleEndian = endianness === 0x4949;

        if (littleEndian || endianness === 0x4d4d /* bigEndian */) {
          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002a) {
            firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

            if (firstIFDOffset >= 0x00000008) {
              ifdStart = tiffOffset + firstIFDOffset;
            }
          }
        }
      }
    }
    if (ifdStart) {
      length = dataView.getUint16(ifdStart, littleEndian);

      for (i = 0; i < length; i++) {
        offset = ifdStart + i * 12 + 2;
        if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {
          // 8 is the offset of the current tag's value
          offset += 8;

          // Get the original orientation value
          orientation = dataView.getUint16(offset, littleEndian);

          // Override the orientation with its default value for Safari (#120)
          if (IS_SAFARI_OR_UIWEBVIEW) {
            dataView.setUint16(offset, 1, littleEndian);
          }
          break;
        }
      }
    }
    return orientation;
  }
  // ArrayBuffer对象 Unicode码转字符串
  function getStringFromCharCode(dataView, start, length) {
    var str = '';
    var i;
    for (i = start, length += start; i < length; i++) {
      str += fromCharCode(dataView.getUint8(i));
    }
    return str;
  }
  // base64转ArrayBuffer对象
  function base64ToArrayBuffer(base64, contentType) {
    // contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
    base64 = base64.replace(/^data\:([^\;]+)\;base64,/gim, '');
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
  //获取设备像素比
  function getPixelRatio(context) {
    var backingStore =
      context.backingStorePixelRatio ||
      context.webkitBackingStorePixelRatio ||
      context.mozBackingStorePixelRatio ||
      context.msBackingStorePixelRatio ||
      context.oBackingStorePixelRatio ||
      context.backingStorePixelRatio ||
      1;
    return (window.devicePixelRatio || 1) / backingStore;
  }

  // 排序规则
  function sortFun(a, b) {
    return a.hierarchy - b.hierarchy;
  }
  // 画直线
  function drawDashLine(context, x1, y1, x2, y2, dashLen) {
    // 画虚线
    context.beginPath();
    dashLen = dashLen === undefined ? 5 : dashLen;
    // 得到斜边的总长度
    var beveling = getBeveling(x2 - x1, y2 - y1);
    // 计算有多少个线段
    var num = Math.floor(beveling / dashLen);
    for (var i = 0; i < num; i++) {
      context[i % 2 === 0 ? 'moveTo' : 'lineTo'](x1 + ((x2 - x1) / num) * i, y1 + ((y2 - y1) / num) * i);
    }
    context.stroke();
    function getBeveling(x, y) {
      // 求斜边长度
      return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }
  }
  // 渲染画布
  function rendering(ctx, ele) {
    // 切换画布中心点->旋转画布->切回画布原来中心点// 此时画布已经旋转过
    ctx.translate(ele.x + ele.width / 2, ele.y + ele.height / 2);
    if (ele.mirrorImg) {
      ctx.scale(-1, 1);
    }
    ctx.rotate((ele.rotate / 180) * Math.PI, (ele.rotate / 180) * Math.PI);
    ctx.translate(-(ele.x + ele.width / 2), -(ele.y + ele.height / 2));
    // 放大
    ctx.scale(ele.scale, ele.scale);
    // ctx.setTransform(1, 0.5, -0.5, 1, 30, 10);

    ctx.drawImage(ele.img, ele.x / ele.scale, ele.y / ele.scale); // 不放大x和y
    // 缩回原来大小
    ctx.scale(1 / ele.scale, 1 / ele.scale);
    // 切换画布中心点->旋转画布->切回画布原来中心点// 将画布旋转回之前的角度
    ctx.translate(ele.x + ele.width / 2, ele.y + ele.height / 2);
    ctx.rotate((-ele.rotate / 180) * Math.PI, (-ele.rotate / 180) * Math.PI);
    if (ele.mirrorImg) {
      ctx.scale(-1, 1);
      // ele.mirrorImg = false;
    }
    ctx.translate(-(ele.x + ele.width / 2), -(ele.y + ele.height / 2));
  }
  //时间函数
  function getNowTime() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var d = now.getDate();
    var h = now.getHours();
    var mm = now.getMinutes();
    var s = now.getSeconds();
    var str;
    if (h > 12) {
      h -= 12;
      str = ' PM';
    } else {
      str = ' AM';
    }
    h = h < 10 ? '0' + h : h;
    d = d < 10 ? '0' + d : d;
    m = m < 10 ? '0' + m : m;
    mm = mm < 10 ? '0' + mm : mm;
    s = s < 10 ? '0' + s : s;
    var xy = str + ' ' + h + ':' + mm;
    return xy;
  }
  //获取屏幕比例
  var screenScale = (window.innerWidth || document.documentElement.clientWidth) / 375;
  // 实现jq的offset()函数
  function $offset(ele) {
    var obj = { left: 0, top: 0 };
    (function _offset(ele2) {
      if (ele2.offsetParent) {
        // 有offsetParent的dom则继续算
        obj.left += ele2.offsetLeft;
        obj.top += ele2.offsetTop;
        _offset(ele2.offsetParent);
      }
    })(ele);
    return obj;
  }
  /******************对象函数****************************************/
  // 画布对象
  function Canvas(obj) {
    this.canvas = document.createElement('canvas');
    this.width = obj.box.offsetWidth;
    this.height = obj.box.offsetHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.photos = [];
    this.photoIcons = [];
    this.box = obj.box; // 容器
    this.box.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.bgColor = obj.bgColor || '#fff'; // 背景颜色
    this.bgPhoto = obj.bgPhoto || false; // 背景图
    this.hueScale = 0; // 亮度调节刻度
    this.CusPosition = obj.CusPosition || false; // 定制双指缩放参数
    this.bgPhotoType = false; // 是否有背景图
    this.targetPhoto = null; // target图片
    this.targetPhotoIcon = null; // targetIcon图片
    this.disx = 0; // 触摸点与target图片左边的距离
    this.disy = 0; // 触摸点与target图片上边的距离
    this.isSet = false; // 是否触摸操作点
    this.photoModel = obj.photoModel || 'covered'; // 默认图片载入的模式
    this.model = obj.model || 'autoHierarchy'; // 模式Cascade为添加的图片层级右添加顺序决定，autoHierarchy为层级由选中的图片为最高级
    this.devicRatio = 1; //设备缩放比例
    this.crayonOpen = true;
    this.crayonPhoto = false; // 雪花图
    this.penColor = '#a82d7a';
    this.penSize = 20;
    this.penXY = [];
  }
  Canvas.prototype.init = function (obj) {
    // 初始话创建图片对象
    var self = this;
    self.canvas.style.width = self.width + 'px';
    self.canvas.style.height = self.height + 'px';
    //赋值设备缩放比例
    self.devicRatio = getPixelRatio(this.ctx);
    console.log(self.devicRatio, '设备缩放比');
    //根据设备缩放比例重新赋值canvas宽高
    self.width = self.width * self.devicRatio;
    self.height = self.height * self.devicRatio;
    self.canvas.width = self.canvas.width * self.devicRatio;
    self.canvas.height = self.canvas.height * self.devicRatio;
    // 防止移动端拖动
    self.canvas.style.touchAction = 'none';
    self.canvas.style.WebkitUserSelect = 'none';
    self.canvas.style.WebkitUserDrag = 'none';

    // 对监听的DOM进行一些初始化
    self.canvas.addEventListener(
      'touchstart',
      function (e) {
        // 设置事件
        e.preventDefault(); //阻止触摸时页面的滚动，缩放
      },
      false
    );
    touch.on(self.canvas, 'dragstart tap hold', function (e) {
      self.touchstart(e);
    });
    touch.on(self.canvas, 'drag', function (e) {
      self.touchmove(e);
      obj.dragEvent && self.targetPhoto && obj.dragEvent(self.photos, self.targetPhoto); // 拖拽事件监听
      obj.dragEvent && self.targetPhotoIcon && obj.dragEvent(self.photoIcons, self.targetPhotoIcon); // 拖拽事件监听
    });
    touch.on(self.canvas, 'pinchstart', function (e) {
      // if (e.detail.originalEvent.touches.length >= 2) {
      self.pinchstart(e);
      // }
    });
    touch.on(self.canvas, 'pinch', function (e) {
      // if (e.detail.originalEvent.touches.length >= 2) {}
      self.gestureZoom(e);
      obj.zoomEvent && self.targetPhoto && obj.zoomEvent(self.photos, self.targetPhoto); // 缩放事件监听
      obj.zoomEvent && self.targetPhotoIcon && obj.zoomEvent(self.photoIcons, self.targetPhotoIcon); // 缩放事件监听
    });
    touch.on(self.canvas, 'rotate', function (e) {
      self.touchRotate(e);
      obj.rotateEvent && self.targetPhoto && obj.rotateEvent(self.photos, self.targetPhoto); // 旋转事件监听
      obj.rotateEvent && self.targetPhotoIcon && obj.rotateEvent(self.photoIcons, self.targetPhotoIcon); // 旋转事件监听
    });

    // self.painting();        // 渲染画布
    obj.callback && obj.callback(self.photos, self.photoIcons); // 初始化完成回调并返回图片对象数组
  };
  // 渲染
  Canvas.prototype.addClick = function (x, y, penColor, penSize, dragging = false) {
    this.penXY.push({ x, y, penColor, penSize, dragging });
  };
  Canvas.prototype.painting = function () {
    // 绘画
    var self = this;
    this.ctx.fillStyle = this.bgColor; // 背景色
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // 清空画布
    // 涂鸦
    if (this.penXY && this.penXY.length) {
      this.penXY.forEach((item, idx, arr) => {
        this.ctx.beginPath();
        if (!item.dragging && idx) {
          this.ctx.moveTo(arr[idx - 1].x, arr[idx - 1].y);
        } else {
          this.ctx.moveTo(item.x, item.y);
        }
        this.ctx.lineTo(item.x, item.y);
        this.ctx.closePath();
        this.ctx.strokeStyle = item.penColor;
        this.ctx.lineWidth = item.penSize;
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
      });
    }
    // 雪花背景
    if (this.crayonOpen && this.crayonPhoto) {
      rendering(this.ctx, this.crayonPhoto);
    }
    if (this.bgPhotoType) {
      // 画背景图
      // var scale = this.canvas.width / this.bgPhoto.width;
      // this.ctx.scale(scale, scale);
      // this.ctx.drawImage(this.bgPhoto, 0, 0); // 画布背景图
      // this.ctx.scale(1 / scale, 1 / scale);
      rendering(self.ctx, this.bgPhoto); // 渲染背景图

      if (self.hueScale !== 0) {
        let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
          data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] =
            data[i] + self.hueScale * 10 >= 0
              ? data[i] + self.hueScale * 10 <= 255
                ? data[i] + self.hueScale * 10
                : 255
              : 0;
          data[i + 1] =
            data[i + 1] + self.hueScale * 10 >= 0
              ? data[i + 1] + self.hueScale * 10 <= 255
                ? data[i + 1] + self.hueScale * 10
                : 255
              : 0;
          data[i + 2] =
            data[i + 2] + self.hueScale * 10 >= 0
              ? data[i + 2] + self.hueScale * 10 <= 255
                ? data[i + 2] + self.hueScale * 10
                : 255
              : 0;
        }
        this.ctx.putImageData(imgData, 0, 0);
      }
    }
    self.photos.sort(sortFun);
    self.photoIcons.sort(sortFun);
    self.photos.forEach(function (ele) {
      if (self.targetPhoto == ele) {
        self.targetPhoto.recalculate();
        rendering(self.ctx, ele); // 渲染画布
      } else {
        rendering(self.ctx, ele);
      } // 渲染画布
    });
    self.photoIcons.forEach(function (ele) {
      if (self.targetPhotoIcon == ele) {
        self.targetPhotoIcon.recalculate();
        rendering(self.ctx, ele); // 渲染画布
      } else {
        rendering(self.ctx, ele);
      } // 渲染画布
    });
  };
  Canvas.prototype.touchstart = function (e) {
    // 触摸
    e.preventDefault(); //阻止触摸时页面的滚动，缩放
    var self = this;
    var touch = e.position;
    var x = e.type != 'dragstart' ? (touch.x - $offset(this.box).left) * self.devicRatio : touch.x * self.devicRatio;
    var y = e.type != 'dragstart' ? (touch.y - $offset(this.box).top) * self.devicRatio : touch.y * self.devicRatio;
    // if (
    //   this.targetPhoto &&
    //   this.targetPhoto.isOperation(x, y) &&
    //   this.targetPhoto.setSpot.type == this.targetPhoto.setSpot.deleteBut
    // ) {
    //   this.targetPhoto._delete();
    //   return;
    // }
    // if (
    //   this.targetPhotoIcon &&
    //   this.targetPhotoIcon.isOperation(x, y) &&
    //   this.targetPhotoIcon.setSpot.type == this.targetPhotoIcon.setSpot.deleteBut
    // ) {
    //   this.targetPhotoIcon._delete();
    //   return;
    // }
    this.isSet = false;
    this.targetPhotoIcon = this.photoIcons
      .filter(function (ele) {
        // 获取点击的图片
        return ele.boundary(x, y); // 判断是否在图片内
      })
      .pop();
    if (this.targetPhotoIcon) {
      this.targetPhoto = null;
      this.disx = x - this.targetPhotoIcon.x;
      this.disy = y - this.targetPhotoIcon.y;
      if (this.model == 'autoHierarchy') {
        this.changeHierarchy(this.targetPhotoIcon);
      } // 更改层级
      this.painting();
      // 是否点击了设置点
      // if (this.targetPhotoIcon.isOperation(x, y)) this.isSet = true;
      return;
    }
    this.targetPhoto = this.photos
      .filter(function (ele) {
        // 获取点击的图片
        return ele.boundary(x, y); // 判断是否在图片内
      })
      .pop();
    if (this.targetPhoto) {
      this.targetPhotoIcon = null;
      this.disx = x - this.targetPhoto.x;
      this.disy = y - this.targetPhoto.y;
      if (this.model == 'autoHierarchy') {
        this.changeHierarchy(this.targetPhoto);
      } // 更改层级
      this.painting();
      // 是否点击了设置点
      // if (this.targetPhoto.isOperation(x, y)) this.isSet = true;
    }
  };
  Canvas.prototype.touchmove = function (e) {
    let self = this;
    // 移动
    e.preventDefault(); //阻止触摸时页面的滚动，缩放
    var touch = e.position;
    var x = touch.x * self.devicRatio;
    var y = touch.y * self.devicRatio;

    if (this.targetPhoto) {
      if (this.isSet) {
        // 放大旋转模式
        if (this.targetPhoto.setSpot.type == this.targetPhoto.setSpot.deleteBut) {
          return;
        } // 删除按钮
        // 旋转
        this.targetPhoto.changeRotate(x, y);
        // 缩放
        this.targetPhoto.changeSize(x, y);
      } else {
        // 移动模式
        // console.log(x,y,'xxxxxxxxxxx');
        // console.log(this.disx,this.disy,'disxdisy');
        // console.log(this.disx,this.disx,'this.disxthis.disx');
        this.targetPhoto.move(x - this.disx, y - this.disy);
      }
      this.painting();
    }
    if (this.targetPhotoIcon) {
      if (this.isSet) {
        // 放大旋转模式
        if (this.targetPhotoIcon.setSpot.type == this.targetPhotoIcon.setSpot.deleteBut) {
          return;
        } // 删除按钮
        // 旋转
        this.targetPhotoIcon.changeRotate(x, y);
        // 缩放
        this.targetPhotoIcon.changeSize(x, y);
      } else {
        // 移动模式
        this.targetPhotoIcon.move(x - this.disx, y - this.disy);
      }
      this.painting();
    }
  };
  // 多点触控开始
  Canvas.prototype.pinchstart = function (e) {
    // var touch = e.position;
    var self = this,
      touchPoints = [];
    Array.prototype.forEach.call(e.detail.originEvent.touches, function (ele, idx) {
      // 获取多个点的坐标
      touchPoints[idx] = {};
      if (self.CusPosition) {
        //定制双指缩放参数
        touchPoints[idx].x = ele.clientX * self.devicRatio;
        touchPoints[idx].y = ele.clientY * self.devicRatio;
      } else {
        touchPoints[idx].x = (ele.pageX - $offset(self.canvas).left) * self.devicRatio;
        touchPoints[idx].y = (ele.pageY - $offset(self.canvas).top) * self.devicRatio;
      }
    });

    this.targetPhotoIcon =
      this.photoIcons
        .filter(function (ele) {
          // 获取点击的图片
          var flag = true;
          touchPoints.forEach(function (ele2) {
            if (!ele.boundary(ele2.x, ele2.y)) {
              flag = false;
            }
          });
          return flag;
        })
        .pop() || null;

    if (this.targetPhotoIcon) {
      this.targetPhotoIcon.temporaryScale = this.targetPhotoIcon.scale;
      this.targetPhotoIcon.temporaryRotate = this.targetPhotoIcon.rotate;
      this.targetPhoto = null;
      return;
    }

    this.targetPhoto =
      this.photos
        .filter(function (ele) {
          // 获取点击的图片
          var flag = true;
          touchPoints.forEach(function (ele2) {
            if (!ele.boundary(ele2.x, ele2.y)) {
              flag = false;
            }
          });
          return flag;
        })
        .pop() || null;
    if (this.targetPhoto) {
      this.targetPhoto.temporaryScale = this.targetPhoto.scale;
      this.targetPhoto.temporaryRotate = this.targetPhoto.rotate;
      this.targetPhotoIcon = null;
    }

    this.painting();
  };

  // 双指缩放
  Canvas.prototype.gestureZoom = function (e) {
    if (this.targetPhoto) {
      this.targetPhoto.scale = e.scale * this.targetPhoto.temporaryScale;
      this.targetPhoto.obtainInfo(); // 重新获取位置信息
      this.painting();
    } else if (this.targetPhotoIcon) {
      this.targetPhotoIcon.scale = e.scale * this.targetPhotoIcon.temporaryScale;
      this.targetPhotoIcon.obtainInfo(); // 重新获取位置信息
      this.painting();
    } else {
      return;
    }
  };
  // 旋转
  Canvas.prototype.touchRotate = function (e) {
    if (this.targetPhoto) {
      this.targetPhoto.rotate = e.rotation + this.targetPhoto.temporaryRotate;
      this.targetPhoto.obtainInfo(); // 重新获取位置信息
      this.painting();
    } else if (this.targetPhotoIcon) {
      this.targetPhotoIcon.rotate = e.rotation + this.targetPhotoIcon.temporaryRotate;
      this.targetPhotoIcon.obtainInfo(); // 重新获取位置信息
      this.painting();
    } else {
      return;
    }
  };
  // 重新定义图片层级
  Canvas.prototype.changeHierarchy = function (item) {
    let self = this;
    item.hierarchy = this.photos.length + this.photoIcons.length;
    this.photos.sort(sortFun);
    this.photoIcons.sort(sortFun);
    this.photos.forEach(function (ele, idx) {
      ele.hierarchy = idx;
    });
    this.photoIcons.forEach(function (ele, idx) {
      ele.hierarchy = idx + self.photos.length;
    });
  };
  /*添加图片传入参数为图片参数*/
  Canvas.prototype.addPhoto = function (obj) {
    var self = this;
    var newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = obj.url;
    return new Promise((resolve, reject) => {
      newPhoto.onload = function () {
        var photo = new Photo({
          canvas: self,
          ele: newPhoto,
          enable: obj.enable,
          customPosX: obj.customPosX || self.customPosX,
          customPosY: obj.customPosY || self.customPosY,
          model: obj.model || self.photoModel,
        });
        self.photos.push(photo);
        self.targetPhoto = photo;
        photo.init(function (photo) {
          // 加载图片完成的回调并返回图片对象
          // obj.callback && obj.callback(photo);
          resolve(photo);
        });
      };
      newPhoto.onerror = function (e) {
        reject(e);
      };
    });
  };

  /*添加icon图片传入参数为图片参数2*/
  Canvas.prototype.addPhotoIcon = function (obj) {
    var self = this;
    var newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = obj.url;
    return new Promise((resolve, reject) => {
      newPhoto.onload = function () {
        var photo = new Photo({
          canvas: self,
          ele: newPhoto,
          enable: obj.enable,
          customPosX: obj.customPosX || self.customPosX,
          customPosY: obj.customPosY || self.customPosY,
          model: obj.model || self.photoModel,
        });
        self.photoIcons.push(photo);
        self.targetPhotoIcon = photo;
        photo.init(function (photo) {
          // 加载图片完成的回调并返回图片对象
          // obj.callback && obj.callback(photo);
          resolve(photo);
        });
      };
      newPhoto.onerror = function (e) {
        reject(e);
      };
    });
  };

  // 更换背景图
  Canvas.prototype.changeBg = function (bg) {
    var self = this;
    if (bg.color) {
      this.bgColor = bg.color;
      this.painting();
    }
    if (bg.photoSrc == 'none') {
      // 移除背景
      this.bgPhotoType = false;
      this.painting();
    } else {
      // self.bgPhoto.src = bg.photoSrc;
      let newPhoto = new Image();
      newPhoto.crossOrigin = 'anonymous'; // 跨域图片
      newPhoto.src = bg.photoSrc;

      return new Promise((resolve, reject) => {
        newPhoto.onload = function () {
          var photo = new Photo({
            canvas: self,
            ele: newPhoto,
            enable: bg.enable,
            customPosX: bg.customPosX || self.customPosX,
            customPosY: bg.customPosY || self.customPosY,
            model: bg.model || self.photoModel,
          });
          self.bgPhoto = photo;
          console.log(self.bgPhoto, 'self.bgPhoto');
          self.bgPhotoType = true;
          photo.init(function (photo) {
            // 加载图片完成的回调并返回图片对象
            // self.width=self.width/self.devicRatio;
            // self.height=self.height/self.devicRatio;
            // bg.callback && bg.callback(photo);
            resolve(photo);
          });
        };
        newPhoto.onerror = function (e) {
          reject(e);
          // console.log('图片加载出错');
        };
      });
    }
  };
  // 增加雪花底图
  Canvas.prototype.changeCrayon = function (bg) {
    var self = this;
    // self.bgPhoto.src = bg.photoSrc;
    let newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = bg.photoSrc;
    return new Promise((resolve, reject) => {
      newPhoto.onload = function () {
        var photo = new Photo({
          canvas: self,
          ele: newPhoto,
          enable: bg.enable,
          customPosX: bg.customPosX || self.customPosX,
          customPosY: bg.customPosY || self.customPosY,
          model: bg.model || self.photoModel,
        });
        self.crayonPhoto = photo;
        photo.init(function (photo) {
          resolve(photo);
        });
      };
      newPhoto.onerror = function (e) {
        reject(e);
        // console.log('图片加载出错');
      };
    });
  };
  // 更改画布参数
  Canvas.prototype.changeParams = function (obj) {
    if (obj.width) {
      this.box.style.width = obj.width + 'px';
      this.canvas.width = obj.width;
    }
    if (obj.height) {
      this.box.style.height = obj.height + 'px';
      this.canvas.height = obj.height;
    }
    if (obj.model) {
      this.model = obj.model;
    }
    this.painting();
  };

  // 清空画布
  Canvas.prototype.clearCanvas = function () {
    this.photos = [];
    this.targetPhoto = null;
    this.painting();
  };
  // 清空文字icon
  Canvas.prototype.clearCanvasIcon = function () {
    this.photoIcons = [];
    this.targetPhotoIcon = null;
    this.painting();
  };

  // // 获取当前操作的图片
  Canvas.prototype.getNowPhoto = function () {
    return this.targetPhoto;
  };

  // 输出规定分辨率图片
  Canvas.prototype.toDataURL = function (obj) {
    var self = this;
    var type = obj.type || 'image/jpeg';
    if (!obj.width || !obj.height) {
      return new Promise((resolve, reject) => {
        // 默认为容器分辨率
        if (resolve) {
          resolve(this.canvas.toDataURL(type)); // 有回调则beas64在回调给
          return;
        } else {
          return this.canvas.toDataURL(type);
        }
      });
    }

    var newCanvas = document.querySelector('#s_newCanvas');
    if (!newCanvas) {
      var newCanvas = document.createElement('canvas');
      newCanvas.id = 's_newCanvas';
    }
    var newScale = obj.width / this.width; // 缩放比例以width为准
    newCanvas.width = obj.width;
    newCanvas.height = obj.height;
    newCanvas.style.display = 'none';
    this.box.appendChild(newCanvas);
    var newCtx = newCanvas.getContext('2d');

    if (!this.bgPhotoType) {
      newCtx.fillStyle = obj.bgColor || this.bgColor; // 背景色，没有的话和原画布一致
      newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height); // 清空画布
    } else {
      // 画布背景图
      var bgScale = newScale * (this.canvas.width / this.bgPhoto.img.width); // 背景图在合成图里的真正缩放比例，
      newCtx.scale(bgScale, bgScale);
      newCtx.drawImage(this.bgPhoto.img, 0, 0);

      newCtx.scale(1 / bgScale, 1 / bgScale);
    }
    self.photos.forEach(function (ele) {
      // 放大参数
      ele.changeScale(newScale);
      rendering(newCtx, ele);
      // 缩小参数
      ele.changeScale(1 / newScale);
    });
    self.photoIcons.forEach(function (ele) {
      // 放大参数
      ele.changeScale(newScale);
      rendering(newCtx, ele);
      // 缩小参数
      ele.changeScale(1 / newScale);
    });
    return new Promise((resolve, reject) => {
      if (resolve) {
        resolve(newCanvas.toDataURL(type));
      } else {
        return newCanvas.toDataURL(type);
      }
    });
  };
  //绘制外框
  Canvas.prototype.toDataURLWrap = function (obj) {
    let self = this;
    var newCanvas = document.querySelector('#wp_newCanvas');
    if (!newCanvas) {
      var newCanvas = document.createElement('canvas');
      newCanvas.id = 'wp_newCanvas';
    }

    // var newScale = obj.width / this.width; // 缩放比例以width为准
    newCanvas.width = self.width + 42 * screenScale * self.devicRatio;
    // newCanvas.height = self.height + 300 * self.devicRatio;
    newCanvas.height = (newCanvas.width * 1920) / 1080;
    newCanvas.style.display = 'none';
    this.box.appendChild(newCanvas);
    var newCtx = newCanvas.getContext('2d');
    // var self = this;
    var newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = 'image/editPic/ad-bg.png';
    return new Promise((resolve, reject) => {
      newPhoto.onload = function () {
        // 画布背景图
        // var bgScale = newScale * (this.canvas.width / newPhoto.width); // 背景图在合成图里的真正缩放比例，
        // newCtx.scale(bgScale, bgScale);
        newCtx.drawImage(newPhoto, 0, 0, newCanvas.width, newCanvas.height);
        var newPhotob = new Image();
        newPhotob.crossOrigin = 'anonymous'; // 跨域图片
        newPhotob.src = obj.src;
        newPhotob.onload = function () {
          newCtx.drawImage(newPhotob, 21 * screenScale * self.devicRatio, 32 * screenScale * self.devicRatio);
          if (resolve) {
            resolve(newCanvas.toDataURL());
          } else {
            return newCanvas.toDataURL();
          }
        };
        // newCtx.scale(1 / bgScale, 1 / bgScale);
      };
    });
  };
  //绘制时间地点img
  Canvas.prototype.toDataURLTimeCy = function (obj) {
    let self = this;
    let NowTime = getNowTime();
    let NowCity = userNowCity || '中国';
    let cityLenWd = Math.max(NowCity.length - 2, 0) * 30;
    var newCanvas = document.querySelector('#tcy_newCanvas');
    if (!newCanvas) {
      var newCanvas = document.createElement('canvas');
      newCanvas.id = 'tcy_newCanvas';
    }
    // var newScale = obj.width / this.width; // 缩放比例以width为准
    newCanvas.width = 200 + cityLenWd;
    newCanvas.height = 160;
    newCanvas.style.display = 'none';
    this.box.appendChild(newCanvas);
    var newCtx = newCanvas.getContext('2d');
    var newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = 'image/editPic/location.png';
    return new Promise((resolve, reject) => {
      newPhoto.onload = function () {
        // 画布背景图
        newCtx.drawImage(newPhoto, 20, 38);
        newCtx.font = '28px Arial';
        newCtx.fillStyle = '#ffffff';
        newCtx.fillText(`你好·${NowCity}`, 24, 104);
        newCtx.font = '24px Arial';
        newCtx.fillStyle = '#ffffff';
        newCtx.fillText(NowTime, 20, 134);
        newCtx.moveTo(50, 60); //设置起点状态
        newCtx.lineTo(170 + cityLenWd, 60); //设置末端状态
        newCtx.lineTo(170 + cityLenWd, 100); //设置末端状态
        newCtx.lineTo(150 + cityLenWd, 120); //设置末端状态
        newCtx.lineWidth = 3; //设置线宽状态
        newCtx.strokeStyle = '#ffffff'; //设置线的颜色状态
        newCtx.stroke(); //进行绘制
        if (resolve) {
          resolve(newCanvas.toDataURL('image/png'));
        } else {
          return newCanvas.toDataURL('image/png');
        }
      };
    });
  };
  //绘制自定义文字
  Canvas.prototype.toDataURLMyEntry = function (obj) {
    let self = this;
    let userText = obj.value;
    let canvasLen = 0;
    let canvasRow = 0;
    let posY = 30;
    if (userText.indexOf(',') !== -1) {
      let userArr = userText.split(',');
      canvasRow = Math.max(userArr.length, canvasRow);
      userArr.map((item) => {
        canvasLen = Math.max(item.length, canvasLen);
        if (item.length > 8) {
          canvasRow += 1;
          let textCuta = item.slice(0, 7);
          let textCutb = item.slice(8, item.length);
        } else {
          canvasLen = Math.max(item.length, canvasLen);
        }
      });
    } else if (userText.indexOf('，') !== -1) {
      let userArr = userText.split('，');
      canvasRow = Math.max(userArr.length, canvasRow);
      userArr.map((item) => {
        canvasLen = Math.max(item.length, canvasLen);
        if (item.length > 8) {
          canvasRow += 1;
          let textCuta = item.slice(0, 7);
          let textCutb = item.slice(8, item.length);
        } else {
          canvasLen = Math.max(item.length, canvasLen);
        }
      });
    } else {
      if (userText.length > 8) {
        canvasRow += 1;
        canvasLen = Math.max(8, canvasLen);
      } else {
        canvasLen = Math.max(userText.length, canvasLen);
      }
    }

    let textLenWd = Math.min(Math.max(canvasLen - 2, 0) * 30, 180);
    let textLenHg = Math.max(canvasRow - 2, 0) * 30;
    var newCanvas = document.querySelector('#mey_newCanvas');
    if (!newCanvas) {
      var newCanvas = document.createElement('canvas');
      newCanvas.id = 'mey_newCanvas';
    }
    // var newScale = obj.width / this.width; // 缩放比例以width为准
    newCanvas.width = Math.min(80 + textLenWd, 260);
    newCanvas.height = 80 + textLenHg;
    newCanvas.style.display = 'none';
    this.box.appendChild(newCanvas);
    var newCtx = newCanvas.getContext('2d');
    newCtx.font = '28px akaitong';
    newCtx.fillStyle = '#ffffff';
    if (userText.indexOf(',') !== -1) {
      let userArr = userText.split(',');
      userArr.map((item, index) => {
        if (item.length > 8) {
          let textCuta = item.slice(0, 7);
          newCtx.fillText(textCuta, 10, posY);
          posY += 30;
          let textCutb = item.slice(8, item.length);

          newCtx.fillText(index === userArr.length - 1 ? textCutb : textCutb + ',', 10, posY);
          posY += 30;
        } else {
          newCtx.fillText(index === userArr.length - 1 ? item : item + ',', 10, posY);
          posY += 30;
        }
      });
    } else if (userText.indexOf('，') !== -1) {
      let userArr = userText.split('，');
      userArr.map((item, index) => {
        if (item.length > 8) {
          let textCuta = item.slice(0, 7);
          newCtx.fillText(textCuta, 10, posY);
          posY += 30;
          let textCutb = item.slice(8, item.length);
          newCtx.fillText(index === userArr.length - 1 ? textCutb : textCutb + '，', 10, posY);
          posY += 30;
        } else {
          newCtx.fillText(index === userArr.length - 1 ? item : item + '，', 10, posY);
          posY += 30;
        }
      });
    } else {
      if (userText.length > 8) {
        canvasLen = Math.max(8, canvasLen);
        let textCuta = userText.slice(0, 7);
        newCtx.fillText(textCuta, 10, posY);
        posY += 30;
        let textCutb = userText.slice(8, userText.length);
        newCtx.fillText(textCutb, 10, posY);
        posY += 30;
      } else {
        newCtx.fillText(userText, 10, posY);
      }
    }

    // newCtx.font = '28px akaitong';
    // newCtx.fillStyle = 'red';
    // newCtx.fillText(userText, 10, posY);
    return new Promise((resolve, reject) => {
      if (resolve) {
        resolve(newCanvas.toDataURL('image/png'));
      } else {
        return newCanvas.toDataURL('image/png');
      }
    });
  };
  // 图片对象
  function Photo(obj) {
    this.model = obj.model; // 图片初始化的模式，默认为铺满'covered'，为数字时为宽度，adaption为自适应
    this.enable = obj.enable || false; // 是否禁止编辑该照片默认为false
    this.customPosX = obj.customPosX || '-1';
    this.customPosY = obj.customPosY || '-1';
    this.x = 0; // 距离左上角的x
    this.y = 0; // 距离左上角的y
    this.rotate = 0;
    this.temporaryRotate = 0; // 双指旋转时临时存储的旋转度数
    this.scale = 1;
    this.temporaryScale = 1; // 双指缩放时临时存储的缩放前的比例
    this.mirrorImg = false; //镜像参数
    this.width = 0; // 画布内宽高
    this.height = 0;
    this.actualWidth = 0; // 真实宽高
    this.actualHeight = 0;
    this.img = obj.ele;
    this.hierarchy = 0; // 层级
    this._canvas = obj.canvas;
    this.coreX = 0; // 中心坐标x
    this.coreY = 0; // 中心坐标y
    this.setSpot = {
      // 操作点的坐标
      w: 40,
      h: 40,
      deleteBut: 'topLeft', // 删除按钮所在方位默认为左上角
      type: '', // 类型点击的是具体哪个点（bottomLeft,bottomRight,topLeft,topRight）
    };
    this.oCoords = {}; // 四边的坐标
    this.realCorners = {}; // 四点真实坐标
    this.corners = null; // 四点原始坐标
    this.actualRadius = 0; // 实际半径
    this.radius = 0; // 图片的半径
    this.originalRadius = 0; // 夹角
    this.hornLimit = {
      // 图片的最大最小x,y坐标// 限制活动区域
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    };
    this.edgeLimit = {
      // 图片在容器内触及边线时的x，y最小最大值
      minX: -Infinity,
      maxX: Infinity,
      minY: -Infinity,
      maxY: Infinity,
      flag: false,
      maxScale: Infinity,
    };
  }
  Photo.prototype.init = function (cb) {
    // 初始化// 回调返回图片对象
    var self = this;
    // 将层级提升到最高
    self.hierarchy = self._canvas.photos.length + self._canvas.photoIcons.length;
    // 隐藏图片
    self.img.style.display = 'none';
    this.actualWidth = this.img.width; // 真实宽高
    this.actualHeight = this.img.height;
    this.actualRadius = Math.sqrt(Math.pow(this.actualWidth, 2) + Math.pow(this.actualHeight, 2)) / 2; // 实际半径
    self.rotate = 0;
    this.getExif(function (exif) {
      // 根据exif旋转图片到正常
      if (exif == 6) {
        self.rotate = 90;
        self.setSpot.deleteBut = 'bottomLeft';
      }
      if (exif == 3) {
        self.rotate = 180;
        self.setSpot.deleteBut = 'bottomRight';
      }
      if (exif == 8) {
        self.rotate = 90;
        self.setSpot.deleteBut = 'topRight';
      }
      self.autoScale(); // 调节缩放比例
      cb && cb(self); // 回调返回图片对象
    });
  };
  // 获取图片的arrayBuffer对象和获取图片的exif旋转系数
  Photo.prototype.getExif = function (cb) {
    var self = this;
    var url = this.img.src;
    var exif = null;
    var temp = 0;
    if (REGEXP_DATA_URL.test(url)) {
      return REGEXP_DATA_URL_JPEG.test(url) ? cb(getOrientation(base64ToArrayBuffer(url))) : cb(null);
    } else {
      xhr = new XMLHttpRequest();
      xhr.onload = function () {
        cb(getOrientation(this.response));
      };
      xhr.open('get', url);
      xhr.responseType = 'arraybuffer';
      xhr.send();
    }
  };
  // 图片载入时的模式，铺满，自适应，固定宽度
  Photo.prototype.autoScale = function () {
    if (this.model == 'covered') {
      // 铺满
      if (this.rotate == 90 || this.rotate == -90) {
        if (this.actualWidth / this.actualHeight > this._canvas.height / this._canvas.width) {
          this.scale = this._canvas.width / this.actualHeight;
        } else {
          this.scale = this._canvas.height / this.actualWidth;
        }
      } else {
        if (this.actualWidth / this.actualHeight > this._canvas.width / this._canvas.height) {
          this.scale = this._canvas.height / this.actualHeight;
        } else {
          this.scale = this._canvas.width / this.actualWidth;
        }
      }
    } else if (this.model == 'adaption') {
      // 自适应
      if (this.rotate == 90 || this.rotate == -90) {
        if (this.actualWidth / this.actualHeight > this._canvas.height / this._canvas.width) {
          this.scale = (this._canvas.height / this.actualWidth) * 1.6;
        } else {
          this.scale = (this._canvas.width / this.actualHeight) * 1.6;
        }
      } else {
        if (this.actualWidth / this.actualHeight > this._canvas.width / this._canvas.height) {
          this.scale = (this._canvas.width / this.actualWidth) * 1.6;
        } else {
          this.scale = (this._canvas.height / this.actualHeight) * 1.6;
        }
      }
    } else {
      // 固定宽度
      if (this.rotate == 90 || this.rotate == -90) {
        this.scale = (this.model / this.actualHeight) * this._canvas.devicRatio;
      } else {
        this.scale = (this.model / this.actualWidth) * this._canvas.devicRatio;
      }
    }
    if (this.customPosX !== '-1') {
      //自定义位置
      this.x = Number(this.customPosX * this._canvas.devicRatio * screenScale);
    } else {
      this.x = (this._canvas.width - this.actualWidth * this.scale) / 2;
    }
    if (this.customPosY !== '-1') {
      //自定义位置
      this.y = Number(this.customPosY * this._canvas.devicRatio * screenScale);
    } else {
      this.y = (this._canvas.height - this.actualHeight * this.scale) / 2;
    }
    this.recalculate(); // 初始化数据
    this._canvas.painting(); // 渲染画布
  };

  Photo.prototype.recalculate = function () {
    // 重新计算图片的数据
    this.width = this.scale * this.actualWidth;
    this.height = this.scale * this.actualHeight;
    this.coreX = this.x + this.width / 2;
    this.coreY = this.y + this.height / 2;
    // 获取图片原始四点的坐标
    this.radius = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2)) / 2; // 半径
    this.originalRadius = (Math.atan(this.height / this.width) * 180) / Math.PI; // 中心点正半轴与四角的夹角（0-90）
    this.corners = {
      bottomLeft: {
        // 分别为原始坐标x,y,与中心点正x轴的夹角/即未旋转的
        x: this.coreX - this.width / 2,
        y: this.coreY + this.height / 2,
        angle: this.originalRadius + 180,
      },
      bottomRight: {
        x: this.coreX + this.width / 2,
        y: this.coreY + this.height / 2,
        angle: -this.originalRadius + 360,
      },
      topRight: {
        x: this.coreX + this.width / 2,
        y: this.coreY - this.height / 2,
        angle: this.originalRadius,
      },
      topLeft: {
        x: this.coreX - this.width / 2,
        y: this.coreY - this.height / 2,
        angle: -this.originalRadius + 180,
      },
    };
    this.sideLine();
  };
  Photo.prototype.sideLine = function () {
    // 获取图片四边的坐标ps：真正的坐标
    // 获取四角新的坐标运用公式为x1=x0+r*cos(ao*3.14/180)；
    //                        y1=y0-r*sin(ao*3.14/180)；//ao为与中心点正x轴的夹角（x0，y0）为中心坐标
    this.edgeLimit.minX = -Infinity;
    this.edgeLimit.maxX = Infinity;
    this.edgeLimit.minY = -Infinity;
    this.edgeLimit.maxY = Infinity;
    for (key in this.corners) {
      this.realCorners[key] = {
        x: this.coreX + Math.cos(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius,
        y: this.coreY - Math.sin(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius,
      };
      this.edgeLimit.minX = Math.max(
        -Math.cos(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius - this.width / 2,
        this.edgeLimit.minX
      );
      this.edgeLimit.maxX = Math.min(
        this._canvas.width -
          Math.cos(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius -
          this.width / 2,
        this.edgeLimit.maxX
      );
      this.edgeLimit.minY = Math.max(
        Math.sin(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius - this.height / 2,
        this.edgeLimit.minY
      );
      this.edgeLimit.maxY = Math.min(
        this._canvas.height +
          Math.sin(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius -
          this.height / 2,
        this.edgeLimit.maxY
      );
      this.edgeLimit.flag = true;
    }
    // 确定图片四条边的坐标
    this.oCoords.bottomLine = {
      o: this.realCorners.bottomLeft,
      d: this.realCorners.bottomRight,
    };
    this.oCoords.RightLine = {
      o: this.realCorners.bottomRight,
      d: this.realCorners.topRight,
    };
    this.oCoords.topLine = {
      o: this.realCorners.topRight,
      d: this.realCorners.topLeft,
    };
    this.oCoords.leftLine = {
      o: this.realCorners.topLeft,
      d: this.realCorners.bottomLeft,
    };
    // 获取图片最大最小坐标
    this.hornLimit.minX = Math.min(
      this.realCorners.bottomLeft.x,
      this.realCorners.bottomRight.x,
      this.realCorners.topRight.x,
      this.realCorners.topLeft.x
    );
    this.hornLimit.minY = Math.min(
      this.realCorners.bottomLeft.y,
      this.realCorners.bottomRight.y,
      this.realCorners.topRight.y,
      this.realCorners.topLeft.y
    );
    this.hornLimit.maxX = Math.max(
      this.realCorners.bottomLeft.x,
      this.realCorners.bottomRight.x,
      this.realCorners.topRight.x,
      this.realCorners.topLeft.x
    );
    this.hornLimit.maxY = Math.max(
      this.realCorners.bottomLeft.y,
      this.realCorners.bottomRight.y,
      this.realCorners.topRight.y,
      this.realCorners.topLeft.y
    );
    if (
      this.hornLimit.minX >= 0 &&
      this.hornLimit.minY >= 0 &&
      this.hornLimit.maxX <= this._canvas.width &&
      this.hornLimit.maxY <= this._canvas.height
    ) {
      this.edgeLimit.maxScale = Math.min(
        (this.edgeLimit.maxX - this.edgeLimit.minX + this.width) / this.actualWidth,
        (this.edgeLimit.maxY - this.edgeLimit.minY + this.height) / this.actualHeight
      );
    }
  };
  Photo.prototype.boundary = function (x, y) {
    // 判断是否在范围内且enable=false
    var xcount = 0;
    var xi, yi, a1, a2, b1, b2;
    for (var key in this.oCoords) {
      var iLine = this.oCoords[key];
      if (iLine.o.y < y && iLine.d.y < y) {
        continue;
      } // 边线下面
      if (iLine.o.y >= y && iLine.d.y >= y) {
        continue;
      } // 边线上面
      if (iLine.o.x == iLine.d.x && iLine.o.x >= x) {
        xi = iLine.o.x;
        yi = y;
      }
      // calculate the intersection point
      else {
        b1 = 0; //(y2-y)/(x2-x);
        b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
        a1 = y - b1 * x;
        a2 = iLine.o.y - b2 * iLine.o.x;

        xi = -(a1 - a2) / (b1 - b2);
        yi = a1 + b1 * xi;
      }
      // dont count xi < x cases
      if (xi >= x) {
        xcount += 1;
      }
      // optimisation 4: specific for square images
      if (xcount == 2) {
        break;
      }
    }
    return xcount % 2 && !this.enable; // 为奇数说明在图片内且enable=false
  };

  Photo.prototype.isOperation = function (x, y) {
    // 判断是否点击在四角的操作点上
    for (var key in this.realCorners) {
      var spot = this.realCorners[key];
      if (Math.abs(x - spot.x) < this.setSpot.w && Math.abs(y - spot.y) < this.setSpot.h) {
        this.setSpot.type = key;
        return true;
      }
    }
    return false;
  };
  Photo.prototype.drawSet = function () {
    // 画操作按钮、边框
    var preSpot = null;
    var firstSpot = null;
    this._canvas.ctx.beginPath();
    this._canvas.ctx.fillStyle = '#fff';
    this._canvas.ctx.arc(
      this.realCorners[this.setSpot.deleteBut].x,
      this.realCorners[this.setSpot.deleteBut].y,
      20,
      0,
      2 * Math.PI
    );
    this._canvas.ctx.fill();
    this._canvas.ctx.fillStyle = '#000';
    this._canvas.ctx.textBaseline = 'middle';
    this._canvas.ctx.font = '20px Arial';
    this._canvas.ctx.fillText(
      '╳',
      this.realCorners[this.setSpot.deleteBut].x - 10,
      this.realCorners[this.setSpot.deleteBut].y
    );
    for (var key in this.realCorners) {
      var spot = this.realCorners[key];
      if (preSpot) {
        drawDashLine(this._canvas.ctx, preSpot.x, preSpot.y, spot.x, spot.y); // 画边框
      }
      if (!firstSpot) {
        firstSpot = this.realCorners[key];
      }
      preSpot = spot;
    }
    drawDashLine(this._canvas.ctx, preSpot.x, preSpot.y, firstSpot.x, firstSpot.y); // 画边框
  };

  Photo.prototype.changeSize = function (x, y) {
    // 放大缩小
    // 放大缩小
    var radius = Math.sqrt(Math.pow(x - this.coreX, 2) + Math.pow(y - this.coreY, 2)); // 放大后半径
    this.scale = Math.abs(radius / this.actualRadius); // 缩放倍数
    this.obtainInfo();
  };
  Photo.prototype.obtainInfo = function () {
    // 重新计算图片的宽高和x、y
    this.width = this.scale * this.actualWidth;
    this.height = this.scale * this.actualHeight;
    this.x = this.coreX - this.width / 2;
    this.y = this.coreY - this.height / 2;
  };
  // 移动
  Photo.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
  };
  Photo.prototype.changeRotate = function (x, y) {
    // 旋转
    // 旋转0->-360
    this.rotate = (Math.atan((y - this.coreY) / (x - this.coreX)) * 180) / Math.PI;
    // 在中心点右侧区域的角度需要减去中心正轴与右上角的夹角；左侧区域需要减去中心正轴与右上角的夹角的补角
    this.rotate = x > this.coreX ? this.rotate - this.originalRadius : this.rotate - (180 + this.originalRadius);
    if (this.rotate > 0) {
      this.rotate -= 360;
    }
    // 点击不同位置的设置点修正其角度差
    // 角度差为与右下角与中心点和该角产生的角度
    if (this.setSpot.type == 'topRight') {
      this.rotate += this.originalRadius * 2;
    }
    if (this.setSpot.type == 'topLeft') {
      this.rotate += 180;
    }
    if (this.setSpot.type == 'bottomLeft') {
      this.rotate += this.originalRadius * 2 + 180;
    }
  };

  Photo.prototype.changeScale = function (val) {
    // 修改图片比例（生成不同分辨率画布使用）
    this.width *= val;
    this.height *= val;
    this.x *= val;
    this.y *= val;
    this.scale *= val;
  };

  // 更改图片的参数
  Photo.prototype.changeInfo = function (obj) {
    var self = this;
    obj.hierarchy && (this.hierarchy = obj.hierarchy);
    obj.rotate && (this.rotate = obj.rotate);
    obj.scale && (this.scale = obj.scale);
    obj.mirrorImg && (this.mirrorImg = obj.mirrorImg);
    this.mirrorImg = obj.mirrorImg || false;
    if (obj.img) {
      var newPhoto = new Image();
      newPhoto.crossOrigin = 'anonymous'; // 跨域图片
      newPhoto.src = obj.img;
      newPhoto.onload = function () {
        self.img = newPhoto;
        self.init(obj.callback);
      };
    } else {
      this._canvas.painting();
      obj.callback && obj.callback();
    }
  };

  // 获取图片的信息
  Photo.prototype.getPhotoInfo = function () {
    return {
      model: this.model,
      enable: this.enable,
      customPosX: this.customPosX,
      customPosY: this.customPosY,
      x: this.x,
      y: this.y,
      rotate: this.rotate,
      scale: this.scale,
      mirrorImg: this.mirrorImg,
      width: this.width,
      height: this.height,
      actualWidth: this.actualWidth,
      actualHeight: this.actualHeight,
    };
  };

  window._Canvas = Canvas;
})(window, document);
