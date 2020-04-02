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
// 排序规则
function asasadasdasd() {
  console.log('在');
}
function sortFun(a, b) {
  return a.hierarchy - b.hierarchy;
}
// 渲染画布
function rendering(ctx, ele) {
  // 切换画布中心点->旋转画布->切回画布原来中心点// 此时画布已经旋转过
  // ctx.translate(ele.x + ele.width / 2, ele.y + ele.height / 2);
  // ctx.rotate((ele.rotate / 180) * Math.PI, (ele.rotate / 180) * Math.PI);
  // ctx.translate(-(ele.x + ele.width / 2), -(ele.y + ele.height / 2));
  // 放大
  ctx.scale(ele.scale, ele.scale);

  ctx.drawImage(ele.img, ele.x / ele.scale, ele.y / ele.scale); // 不放大x和y
  // 缩回原来大小
  ctx.scale(1 / ele.scale, 1 / ele.scale);
  // 切换画布中心点->旋转画布->切回画布原来中心点// 将画布旋转回之前的角度
  // ctx.translate(ele.x + ele.width / 2, ele.y + ele.height / 2);
  // ctx.rotate((-ele.rotate / 180) * Math.PI, (-ele.rotate / 180) * Math.PI);
  // ctx.translate(-(ele.x + ele.width / 2), -(ele.y + ele.height / 2));
}
/******************对象函数****************************************/
// 画布对象
export function Canvas(obj) {
  this.canvas = document.createElement('canvas');
  this.width = obj.box.offsetWidth;
  this.height = obj.box.offsetHeight;
  this.canvas.width = this.width;
  this.canvas.height = this.height;
  this.photos = [];
  this.box = obj.box; // 容器
  this.box.appendChild(this.canvas);
  this.ctx = this.canvas.getContext('2d');
  this.bgColor = obj.bgColor || '#fff'; // 背景颜色
  this.bgPhoto = obj.bgPhoto || false; // 背景图
  this.bgPhotoType = false; // 是否有背景图
  this.targetPhoto = null; // target图片
  this.disx = 0; // 触摸点与target图片左边的距离
  this.disy = 0; // 触摸点与target图片上边的距离
  this.photoModel = obj.photoModel || 'covered'; // 默认图片载入的模式
  // this.model = obj.model || 'autoHierarchy'; // 模式Cascade为添加的图片层级右添加顺序决定，autoHierarchy为层级由选中的图片为最高级
  this.devicRatio = 1; //设备缩放比例
  this.handleOn = false; //是非激活拖动
}
Canvas.prototype.init = function(obj) {
  // 初始话创建图片对象
  var self = this;
  self.canvas.style.width = self.width + 'px';
  self.canvas.style.height = self.height + 'px';
  //赋值设备缩放比例
  // self.devicRatio = getPixelRatio(this.ctx);
  // self.devicRatio = 1;
  //根据设备缩放比例重新赋值canvas宽高
  self.width = self.width * self.devicRatio;
  self.height = self.height * self.devicRatio;
  self.canvas.width = self.canvas.width * self.devicRatio;
  self.canvas.height = self.canvas.height * self.devicRatio;
  // 防止移动端拖动
  // self.canvas.style.touchAction = 'none';
  // self.canvas.style.WebkitUserSelect = 'none';
  // self.canvas.style.WebkitUserDrag = 'none';
  // 对监听的DOM进行一些初始化
  self.canvas.addEventListener('mousedown', self.theMousedown.bind(this), false);
  self.canvas.addEventListener(
    'mouseup',
    function() {
      self.handleOn = false;
    },
    false
  );
  self.canvas.addEventListener(
    'mouseout',
    function() {
      self.handleOn = false;
    },
    false
  );
  self.painting(); // 渲染画布
  obj.callback && obj.callback(self.photos); // 初始化完成回调并返回图片对象数组
};
Canvas.prototype.painting = function() {
  // 绘画
  var self = this;
  this.ctx.fillStyle = this.bgColor; // 背景色
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // 清空画布
  if (this.bgPhotoType) {
    // 画背景图
    // var scale = this.canvas.width / this.bgPhoto.width;
    // this.ctx.scale(scale, scale);
    // this.ctx.drawImage(this.bgPhoto, 0, 0); // 画布背景图
    // this.ctx.scale(1 / scale, 1 / scale);
    rendering(self.ctx, this.bgPhoto); // 渲染背景图
  }
  self.photos.sort(sortFun);
  self.photos.forEach(function(ele) {
    if (self.targetPhoto == ele) {
      self.targetPhoto.recalculate();
      rendering(self.ctx, ele); // 渲染画布
    } else {
      rendering(self.ctx, ele);
    } // 渲染画布
  });
};
Canvas.prototype.theMousedown = function(e) {
  var self = this;
  // 点击
  e.preventDefault(); //阻止触摸时页面的滚动，缩放
  let x = e.pageX - $offset(this.box).left;
  let y = e.pageY - $offset(this.box).top;
  // console.log(x, y);
  this.targetPhoto = this.photos
    .filter(function(ele) {
      // 获取点击的图片
      return ele.boundary(x, y); // 判断是否在图片内
    })
    .pop();
  // console.log(this.targetPhoto);
  if (this.targetPhoto && Object.keys(this.targetPhoto).length) {
    this.disx = x - this.targetPhoto.x;
    this.disy = y - this.targetPhoto.y;
    if (this.model == 'autoHierarchy') {
      this.changeHierarchy(this.targetPhoto);
    } // 更改层级
    this.painting();
    // 是否点击了设置点
    // if (this.targetPhoto.isOperation(x, y)) this.isSet = true;
    // 对监听的DOM进行一些初始化
    self.handleOn = true;
    self.canvas.addEventListener(
      'mousemove',
      function onMoveGo(e) {
        self.theMousemove.bind(self)(e);
        if (!self.handleOn) {
          self.canvas.removeEventListener('mousemove', onMoveGo, false);
        }
      },
      false
    );
  }
};
Canvas.prototype.theMousemove = function(e) {
  e.preventDefault(); //阻止触摸时页面的滚动，缩放
  let self = this;
  // 移动
  // var touch = e.position;
  // var x = e.pageX;
  // var y = e.pageY;
  let x = e.pageX - $offset(this.box).left;
  let y = e.pageY - $offset(this.box).top;
  if (this.targetPhoto) {
    this.targetPhoto.move(x - this.disx, y - this.disy);
    this.painting();
  }
};
// 重新定义图片层级
Canvas.prototype.changeHierarchy = function(item) {
  let self = this;
  item.hierarchy = this.photos.length;
  this.photos.sort(sortFun);
  this.photos.forEach(function(ele, idx) {
    ele.hierarchy = idx;
  });
};
/*添加图片传入参数为图片参数*/
Canvas.prototype.addPhoto = function(obj) {
  var self = this;
  var newPhoto = new Image();
  newPhoto.crossOrigin = 'anonymous'; // 跨域图片
  newPhoto.src = obj.url;
  return new Promise((resolve, reject) => {
    newPhoto.onload = function() {
      var photo = new Photo({
        canvas: self,
        ele: newPhoto,
        enable: obj.enable,
        customPosX: obj.customPosX || self.customPosX,
        customPosY: obj.customPosY || self.customPosY,
        model: obj.model || self.photoModel
      });
      self.photos.push(photo);
      self.targetPhoto = photo;
      photo.init(function(photo) {
        // 加载图片完成的回调并返回图片对象
        // obj.callback && obj.callback(photo);
        resolve(photo);
      });
    };
    newPhoto.onerror = function(e) {
      reject(e);
    };
  });
};

// 更换背景图
Canvas.prototype.changeBg = function(bg) {
  let self = this;
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
      newPhoto.onload = function() {
        let photo = new Photo({
          canvas: self,
          ele: newPhoto,
          enable: bg.enable || false,
          customPosX: bg.customPosX,
          customPosY: bg.customPosY,
          model: bg.model || self.photoModel
        });
        self.bgPhotoType = true;
        self.bgPhoto = photo;
        self.painting();
        photo.init(function(photo) {
          // 加载图片完成的回调并返回图片对象
          // self.width=self.width/self.devicRatio;
          // self.height=self.height/self.devicRatio;
          // bg.callback && bg.callback(photo);
          resolve(photo);
        });
      };
      newPhoto.onerror = function(e) {
        reject(e);
        // console.log('图片加载出错');
      };
    });
  }
};
// 更改画布参数
Canvas.prototype.changeParams = function(obj) {
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
Canvas.prototype.clearCanvas = function() {
  this.photos = [];
  this.targetPhoto = null;
  this.painting();
};

// 输出规定分辨率图片
Canvas.prototype.toDataURL = function(obj) {
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
  self.photos.forEach(function(ele) {
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

// 图片对象
function Photo(obj) {
  this.model = obj.model; // 图片初始化的模式，默认为铺满'covered'，为数字时为宽度，adaption为自适应
  this.enable = obj.enable || false; // 是否禁止编辑该照片默认为false
  this.customPosX = obj.customPosX || '-1';
  this.customPosY = obj.customPosY || '-1';
  this.x = 0; // 距离左上角的x
  this.y = 0; // 距离左上角的y
  this.rotate = 0;
  this.scale = 1;
  // this.mirrorImg = false; //镜像参数
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
    type: '' // 类型点击的是具体哪个点（bottomLeft,bottomRight,topLeft,topRight）
  };
  this.oCoords = {}; // 四边的坐标
  this.realCorners = {}; // 四点真实坐标
  this.corners = null; // 四点原始坐标
  this.radius = 0; // 图片的半径
  this.originalRadius = 0; // 夹角
  this.hornLimit = {
    // 图片的最大最小x,y坐标// 限制活动区域
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
  };
  this.edgeLimit = {
    // 图片在容器内触及边线时的x，y最小最大值
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity,
    flag: false,
    maxScale: Infinity
  };
}
Photo.prototype.init = function(cb) {
  // 初始化// 回调返回图片对象
  let self = this;
  // 将层级提升到最高
  this.hierarchy = this._canvas.photos.length;
  // 隐藏图片
  this.img.style.display = 'none';
  this.actualWidth = this.img.width; // 真实宽高
  this.actualHeight = this.img.height;
  // this.actualRadius = Math.sqrt(Math.pow(this.actualWidth, 2) + Math.pow(this.actualHeight, 2)) / 2; // 实际半径
  self.rotate = 0;
  self.autoScale(); // 调节缩放比例
  cb && cb(self); // 回调返回图片对象
};

// 图片载入时的模式，铺满，自适应，固定宽度
Photo.prototype.autoScale = function() {
  if (this.model == 'covered') {
    // 铺满
    if (this.actualWidth / this.actualHeight > this._canvas.width / this._canvas.height) {
      this.scale = this._canvas.height / this.actualHeight;
    } else {
      this.scale = this._canvas.width / this.actualWidth;
    }
  } else if (this.model == 'adaption') {
    // 自适应
    if (this.actualWidth / this.actualHeight > this._canvas.width / this._canvas.height) {
      this.scale = this._canvas.width / this.actualWidth;
    } else {
      this.scale = this._canvas.height / this.actualHeight;
    }
  } else {
    // 固定宽度
    this.scale = (this.model / this.actualWidth) * this._canvas.devicRatio;
  }
  if (this.customPosX !== '-1') {
    //自定义位置
    this.x = Number(this.customPosX * this._canvas.devicRatio * 1);
  } else {
    this.x = (this._canvas.width - this.actualWidth * this.scale) / 2;
  }
  if (this.customPosY !== '-1') {
    //自定义位置
    this.y = Number(this.customPosY * this._canvas.devicRatio * 1);
  } else {
    this.y = (this._canvas.height - this.actualHeight * this.scale) / 2;
  }
  this.recalculate(); // 初始化数据
  this._canvas.painting(); // 渲染画布
};

Photo.prototype.recalculate = function() {
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
      angle: this.originalRadius + 180
    },
    bottomRight: {
      x: this.coreX + this.width / 2,
      y: this.coreY + this.height / 2,
      angle: -this.originalRadius + 360
    },
    topRight: {
      x: this.coreX + this.width / 2,
      y: this.coreY - this.height / 2,
      angle: this.originalRadius
    },
    topLeft: {
      x: this.coreX - this.width / 2,
      y: this.coreY - this.height / 2,
      angle: -this.originalRadius + 180
    }
  };
  this.sideLine();
};
Photo.prototype.sideLine = function() {
  // 获取图片四边的坐标ps：真正的坐标
  // 获取四角新的坐标运用公式为x1=x0+r*cos(ao*3.14/180)；
  //                        y1=y0-r*sin(ao*3.14/180)；//ao为与中心点正x轴的夹角（x0，y0）为中心坐标
  this.edgeLimit.minX = -Infinity;
  this.edgeLimit.maxX = Infinity;
  this.edgeLimit.minY = -Infinity;
  this.edgeLimit.maxY = Infinity;

  for (let key in this.corners) {
    this.realCorners[key] = {
      x: this.coreX + Math.cos(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius,
      y: this.coreY - Math.sin(((this.corners[key].angle - this.rotate) / 180) * Math.PI) * this.radius
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
    d: this.realCorners.bottomRight
  };
  this.oCoords.RightLine = {
    o: this.realCorners.bottomRight,
    d: this.realCorners.topRight
  };
  this.oCoords.topLine = {
    o: this.realCorners.topRight,
    d: this.realCorners.topLeft
  };
  this.oCoords.leftLine = {
    o: this.realCorners.topLeft,
    d: this.realCorners.bottomLeft
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
Photo.prototype.boundary = function(x, y) {
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

// 移动
Photo.prototype.move = function(x, y) {
  this.x = x;
  this.y = y;
  if (this.x < 0) {
    this.x = 0;
  } else if (this.x > this._canvas.width - this.actualWidth) {
    this.x = this._canvas.width - this.actualWidth;
  }
  if (this.y < 0) {
    this.y = 0;
  } else if (this.y > this._canvas.height - this.actualHeight) {
    this.y = this._canvas.height - this.actualHeight;
  }
  // console.log(this.x, this.y);
};

Photo.prototype.changeScale = function(val) {
  // 修改图片比例（生成不同分辨率画布使用）
  this.width *= val;
  this.height *= val;
  this.x *= val;
  this.y *= val;
  this.scale *= val;
};

// 更改图片的参数
Photo.prototype.changeInfo = function(obj) {
  var self = this;
  obj.hierarchy && (this.hierarchy = obj.hierarchy);
  obj.rotate && (this.rotate = obj.rotate);
  obj.scale && (this.scale = obj.scale);
  // obj.mirrorImg && (this.mirrorImg = obj.mirrorImg);
  // this.mirrorImg = obj.mirrorImg || false;
  if (obj.img) {
    var newPhoto = new Image();
    newPhoto.crossOrigin = 'anonymous'; // 跨域图片
    newPhoto.src = obj.img;
    newPhoto.onload = function() {
      self.img = newPhoto;
      self.init(obj.callback);
    };
  } else {
    this._canvas.painting();
    obj.callback && obj.callback();
  }
};

// 获取图片的信息
Photo.prototype.getPhotoInfo = function() {
  return {
    model: this.model,
    enable: this.enable,
    customPosX: this.customPosX,
    customPosY: this.customPosY,
    x: this.x,
    y: this.y,
    rotate: this.rotate,
    scale: this.scale,
    // mirrorImg: this.mirrorImg,
    width: this.width,
    height: this.height,
    actualWidth: this.actualWidth,
    actualHeight: this.actualHeight
  };
};

// window._Canvas = Canvas;
