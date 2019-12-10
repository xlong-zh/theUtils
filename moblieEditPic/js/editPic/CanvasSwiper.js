window.onload = function () {
  $('#sunshine').click(function () {
    $('#paster,#therange').removeClass('status-active');
    $('#sunshine').addClass('status-active');
    $('.paster-group-wall').hide();
    $('.range-wall').hide();
    $('.sunshine-group-wall').show();
  });
  $('#paster').click(function () {
    $('#sunshine,#therange').removeClass('status-active');
    $('#paster').addClass('status-active');
    $('.sunshine-group-wall').hide();
    $('.range-wall').hide();
    $('.paster-group-wall').show();
  });
  $('#therange').click(function () {
    $('#paster,#sunshine').removeClass('status-active');
    $('#therange').addClass('status-active');
    $('.sunshine-group-wall').hide();
    $('.paster-group-wall').hide();
    $('.range-wall').show();
  });
  $('.remove-pic').click(function () {
    loadingoff = false;
    $('.add-btn').css('background-color', '#8f9298');
    $('.upload-wrap').show();
    $('.remove-pic').hide();
  });
  //图片文件转md5哈希值
  var running = false; //running用于判断是否正在计算md5
  function doNormalTest(file, callback) {
    //这里假设直接将文件选择框的dom引用传入
    if (running) {
      // 如果正在计算、不允许开始下一次计算
      return;
    }
    var fileReader = new FileReader(), //创建FileReader实例
      time;
    fileReader.onload = function (e) {
      //FileReader的load事件，当文件读取完毕时触发
      running = false;
      // e.target指向上面的fileReader实例
      if (file.size != e.target.result.length) {
        //如果两者不一致说明读取出错
        alert('ERROR:Browser reported success but could not read the file until the end.');
      } else {
        const resdome = SparkMD5.hashBinary(e.target.result);
        callback && callback(resdome);
        // return resdome;    //计算md5并返回结果
      }
    };
    fileReader.onerror = function () {
      //如果读取文件出错，取消读取状态并弹框报错
      running = false;
      alert('ERROR:FileReader onerror was triggered, maybe the browser aborted due to high memory usage.');
    };
    running = true;
    fileReader.readAsBinaryString(file); //通过fileReader读取文件二进制码
  }
  //url图片转base64
  function getBase64(img) {
    function getBase64Image(img, width, height) {
      var canvas = document.createElement("canvas");
      $('.frame-wrap').append(canvas);
      canvas.width = width ? width : img.width;
      canvas.height = height ? height : img.height;
      canvas.style.display = 'none';
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var dataURL = canvas.toDataURL();
      return dataURL;
    }
    var image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = img;
    return new Promise((resolve, reject) => {
      image.onload = function () {
        resolve(getBase64Image(image));//将base64传给done上传处理
      }
    });
  };
  //将base64转换为文件对象
  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    //转换成file对象
    return new File([u8arr], filename, { type: mime });
    //转换成成blob对象
    //return new Blob([u8arr],{type:mime});
  }

  var AntiShaking = null;
  var canvasBox = document.querySelector('#picBox');
  var canvas = new _Canvas({
    box: canvasBox, // 容器
    bgColor: '#000', // 背景色
    bgPhoto: 'none', // 背景图
    photoModel: 'adaption', // 载入图片模式(设置后添加图片时默认为当前设置模式)
    model: 'Cascade' // 编辑模式
  });
  var timer;
  canvas.init({
    dragEvent: function (e1, e2) {
      clearTimeout(timer);
      $('.event').text('当前操作事件：正在拖拽');
      timer = setTimeout(function () {
        $('.event').text('当前操作事件：无操作');
      }, 10);
    },
    zoomEvent: function (e1, e2) {
      clearTimeout(timer);
      $('.event').text('当前操作事件：正在缩放');
      timer = setTimeout(function () {
        $('.event').text('当前操作事件：无操作');
      }, 10);
    },
    rotateEvent: function (e1, e2) {
      clearTimeout(timer);
      $('.event').text('当前操作事件：正在旋转');
      timer = setTimeout(function () {
        $('.event').text('当前操作事件：无操作');
      }, 10);
    },
    callback: function () {
      console.log('图片初始化完成...');
    }
  });

  var canvasCutBox = document.querySelector('.pic-cut-area');
  var canvasCut = new _Canvas({
    box: canvasCutBox, // 容器
    bgColor: '#000', // 背景色
    bgPhoto: 'none', // 背景图
    photoModel: 'adaption', // 载入图片模式(设置后添加图片时默认为当前设置模式)
    model: 'Cascade', // 编辑模式
    CusPosition: true
  });
  canvasCut.init({
    dragEvent: function (e1, e2) { },
    zoomEvent: function (e1, e2) { },
    rotateEvent: function (e1, e2) { },
    callback: function () {
      console.log('剪切图初始化完成...');
      $('.updata-modal').hide();
      $('.updata-modal').css('z-index', '99');
    }
  });

  function addSunText() {
    return canvas.addPhotoIcon({
      url: 'image/editPic/thesunText.png',
      model: 70,
      customPosX: '222',
      customPosY: '20',
    }).then(res => {
      console.log('成功添加一束光');
    });
  }
  function addTimeCity() {
    let textCity = userNowCity || '中国';
    let textCityLen = 90 + Math.max(textCity.length - 2, 0) * 13;
    return canvas.toDataURLTimeCy({
    }).then(url => {
      // $('.outputPic').attr('src', url);
      canvas.addPhoto({
        url: url,
        model: textCityLen,
        customPosX: '6',
        customPosY: '360'
      })
    }).then(res => {
      console.log('成功添加打卡地点');
      $('.loading-bar').hide();
    });
  }
  //自定义文字录入
  function addMyEntry(item) {
    let textItem = item;
    let textLen = 90 + Math.min(Math.max(textItem.length - 2, 0) * 13, 180);
    canvas.toDataURLMyEntry({
      value: item
    }).then(url => {
      // $('.outputPic').attr('src', url);
      canvas.addPhotoIcon({
        url: url,
        model: textLen,
        customPosX: '90',
        customPosY: '200'
      })
    }).then(res => {
      console.log('成功添加自定义文字');
      addSunText();
      // $('.loading-bar').hide();
    });
  }
  // 默认为covered铺满，为数字时为固定宽度，adaption为自适应，enable：是否禁止编辑
  // 添加光晕函数
  function addSunshineFn(numa, numb) {
    canvas.clearCanvas();
    canvas.addPhoto({
      url: numb,
      model: numa,
      customPosX: '-80',
      customPosY: '-120'
    }).then(res => {
      console.log('成功添加光晕');
      addTimeCity();
    });
  }
  // 添加光晕A
  $('.addFullPic').click(function () {
    if (loadingoff) {
      $('.loading-bar').show();
    } else {
      return;
    }
    addSunshineFn('adaption', 'image/editPic/asunshiny.png');
  });
  // 添加光晕B
  $('.addAutoPic').click(function () {

    if (loadingoff) {
      $('.loading-bar').show();
    } else {
      return;
    }
    addSunshineFn('adaption', 'image/editPic/asunshinyb.png');
  });
  // 添加文字函数
  function addTextFn(numa, numb) {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: numb,
      model: numa,
      customPosX: '90',
      customPosY: '180'
    }).then(res => {
      console.log('成功添加文字');
      addSunText();
    });
  }
  // 添加文字A
  $('.addTextIcon-a').click(function () {
    addTextFn(100, 'image/editPic/goodMorning.png');
  });
  // 添加文字B
  $('.addTextIcon-b').click(function () {
    addTextFn(140, 'image/editPic/lonely.png');
  });
  // 添加文字C
  $('.addTextIcon-c').click(function () {
    addTextFn(100, 'image/editPic/revive.png');
  });
  // 添加文字D
  $('.addTextIcon-d').click(function () {
    addTextFn(100, 'image/editPic/faceNight.png');
  });
  // 添加文字E
  $('.addTextIcon-e').click(function () {
    addTextFn(80, 'image/editPic/eye-fly.png');
  });
  // 添加自定义文字
  $('.addTextIcon-my').click(function () {
    $('.mytext-modal').show();
    $('#myEntry').focus();
  });
  $('.mytext-text-cancle').click(function () {
    $('.mytext-modal').hide();
    // $('#myEntry').val('');
  });
  $('.mytext-text-btn').click(function () {
    let userText = $('#myEntry').val();
    if (!userText) {
      return;
    }
    canvas.clearCanvasIcon();
    addMyEntry(userText);
    $('.mytext-modal').hide();
  });

  // 添加本地图片/背景
  $('.file').change(function () {
    $('.updata-modal').show();
    canvasCut.clearCanvas();
    canvasCut.addPhoto({
      url: getUrl(this.files[0]),
      model: 'adaption'
    }).then(res => {
      console.log('成功添加背景图');
      $('.file').val('');
    });
  });

  // 关闭剪切框
  $('.pic-cut-btna').click(function () {
    $('.updata-modal').hide();
  });
  // 剪切框图片翻转
  $('.pic-cut-btnc').click(function () {
    var nowPhoto = canvasCut.getNowPhoto();
    if (!nowPhoto) {
      alert('请点击图片后操作');
      return;
    } else {
      var nowPhotoInfo = nowPhoto.getPhotoInfo();
      nowPhoto.changeInfo({
        mirrorImg: !nowPhotoInfo.mirrorImg,
        callback: function () {
          console.log('成功镜像');
        }
      });
    }
  });
  //确认剪切
  $('.pic-cut-btnb').click(function () {
    canvasCut.toDataURL({
      type: 'image/png',
    }).then(url => {
      $('.updata-modal').hide();
      $('.upload-wrap').hide();
      $('.loading-bar').show();
      $('.remove-pic').show();
      canvas.clearCanvas();
      canvas.clearCanvasIcon();
      canvas.hueScale = 0;
      return canvas.changeBg({
        photoSrc: url,
        model: 'covered',
      })
    }).then(res => {
      console.log(res, 'changeBg');
      console.log('成功添加剪切图');
      canvas.clearCanvas();
      return canvas.addPhoto({
        url: 'image/editPic/asunshiny.png',
        model: 'adaption',
        customPosX: '-80',
        customPosY: '-120',
      });
    }).then(res => {
      console.log(res, 'addPhoto');
      console.log('成功添加光晕A');
      return Promise.all([addTimeCity(), addSunText()]);
    }).then(res => {
      console.log(res, 'Promise.all');
      $('.add-btn').css('background-color', '#b81657');
      loadingoff = true;
      $('.loading-bar').hide();
    }).catch(e => {
      console.log(e, 'reject-e')
      console.log('错误提示')
    });
  });

  // 调节亮度
  function hueChange(param) {
    console.log('调节亮度');
    canvas.hueScale = param;
    canvas.painting();
  }
  // 保存发布（1倍）
  $('#toAddBtn').click(function () {
    if (!loadingoff) {
      return;
    }
    $('.loading-bar').show();
    // 计时器开启
    submitTimer = setTimeout(() => {
      $('.loading-bar').hide();
      $('.hint-text-a').html('<img src="./image/editPic/warning.png" alt>');
      $('.hint-text-b').text('提交异常');
      $('.hint-text-c').text('请复核提交状态');
      $('.hint-modal').show();
      $('.hint-modal').click(function () {
        $('.hint-modal').hide();
      });
    }, 30000);
    canvas.toDataURL({
      type: 'image/jpeg'
    }).then(url => {
      console.log('成功输出1倍jpg图');
      //再次贴图
      canvas.toDataURLWrap({
        src: url
      });
    }).then(url => {
      $('.outputPic').attr('src', url);
      var imgFile = dataURLtoFile(url, 'file');
      var formData = new FormData();
      formData.append('file', imgFile);
    });
  });

  // 清空画布
  $('.clearCanvas').click(function () {
    canvas.clearCanvas();
    addTimeCity();
  });
  // 清空画布2
  $('.clearCanvasIcon').click(function () {
    canvas.clearCanvasIcon();
    addSunText();
  });
  function getUrl(file) {
    var url = null;
    if (window.createObjectURL !== undefined) {
      url = window.createObjectURL(file);
    } else if (window.URL !== undefined) {
      url = window.URL.createObjectURL(file);
    } else if (window.webkitURL !== undefined) {
      url = window.webkitURL.createObjectURL(file);
    }
    return url;
  }

  //滑块组件
  function myRange() {
    this.zIndex = 1;
    this.blockHalfWidth = null;
    this.$lineOffsetLeft = null;
    this.rangeWidth = null;
    this.recordEnd = null; //记录点
    this.disX1 = 0; //滑竿相对父元素滑动的距离
    this.initX1 = 0; //初始距离-用来判断是否向左还是向右滑动
    this.endX1 = 0; //最终距离-用来判断是否向左还是向右滑动
    this.min = null;
    this.max = null;
    this.texts = null;
    this.step = null;
    this.set = {
      number: 20, //传入的基数
      values: 0, //点的位置
      step: 1, //每次滑动的步数
      slide: function (arg2) {
        // console.log(arg2);
      }
    };
  }
  myRange.prototype.init = function (obj, opt) {
    var This = this;
    this.texts = '';
    $.extend(this.set, opt);

    this.setRangeHtml(obj);
    this.step = this.set.step;
    this.set.step = (this.set.step / this.set.number) * this.rangeWidth;
    console.log(this.set.step);
    this.$block1.on('touchstart', function () {
      This.start(1, this);
    });

    this.$block1.on('touchmove', function () {
      This.move(1);
    });

    this.$block1.on('touchend', function () {
      This.end(1);
    });

    this.$rangeLine.on('mouseup', function (ev) {
      var clickX = ev.pageX - This.$lineOffsetLeft;
      console.log(clickX + ',,,' + This.disX1);
      if (clickX > 0 && This.rangeWidth > clickX) {
        This.click(clickX);
      }
    });
  };

  myRange.prototype.click = function (clickX) {
    var endClickX1 = clickX - (clickX % this.set.step);
    var endClickX2 = clickX + this.set.step - (clickX % this.set.step);
    this.disX1 = endClickX1;
    this.setLineWinth(1);
  };

  myRange.prototype.end = function (num) {
    if (num == 1) {
      if (this.endX1 - this.initX1 > 0) {
        //右, 向上取整
        var v = this.set.step - (this.disX1 % this.set.step) + this.disX1;
        v <= this.rangeWidth ? (this.disX1 = v) : (this.disX1 = this.rangeWidth);
        this.setLineWinth(1);
      } else {
        //左, 向下取整
        this.disX1 = this.disX1 - (this.disX1 % this.set.step);
        this.setLineWinth(1);
      }
    } else {
    }
  };

  myRange.prototype.start = function (num, _this) {
    var ev = ev || event;
    if (num == 1) {
      this.initX1 = ev.targetTouches[0].pageX;
    } else {
      // this.initX2 = ev.targetTouches[0].pageX;
    }
    this.zIndex++;
    $(_this).css('z-index', this.zIndex);
  };

  myRange.prototype.move = function (num) {
    var ev = ev || event;
    var moveX = ev.targetTouches[0].pageX;
    if (moveX >= this.min && moveX <= this.max) {
      this.endX1 = moveX;
      this.disX1 = moveX - this.$lineOffsetLeft;
      this.setLineWinth(1, 'move');
    }
  };

  myRange.prototype.setRangeHtml = function (obj) {
    this.$rangeLine = $('<div class = "range-line"></div>');
    // this.$endNum = $('<div class = "range-num end-num">10</div>');
    this.$block1 = $('<span class = "rang-block block1"></span>');
    this.$line = $('<span class = "line"></span>');

    if ($(obj).find('.range-line').length != 0) {
      $(obj)
        .find('.range-line')
        .remove();
    }
    this.$rangeLine.append(this.$block1, this.$line);
    $(obj).append($(this.$rangeLine));

    // this.$lineOffsetLeft = $(obj).offset().left;
    this.$lineOffsetLeft = ($(document).width() - $(obj).outerWidth()) / 2;
    console.log(this.$lineOffsetLeft, 'this.$lineOffsetLeft');
    this.rangeWidth = $(obj).width();
    this.blockHalfWidth = this.$block1.width() / 2;
    var left1 = parseInt((this.set.values / this.set.number) * this.rangeWidth);
    this.min = this.$lineOffsetLeft;
    this.max = this.rangeWidth + this.$lineOffsetLeft;

    this.disX1 = left1; //滑竿相对父元素滑动的距离

    this.$block1.css('left', left1 - this.blockHalfWidth);
    // this.$line.css({ left: left1 + this.blockHalfWidth - this.blockHalfWidth, right: this.rangeWidth - left2 });
    // this.$endNum.html(this.set.values - 10);
  };

  myRange.prototype.setLineWinth = function (num, move) {
    this.$block1.css('left', this.disX1 - this.blockHalfWidth);
    var start1 = Math.floor(this.disX1 / this.set.step) * this.step;
    var end1 = Math.floor(this.disX1 / this.set.step) * this.step;
    if (start1 > end1) {
      var temp = end1;
      end1 = start1;
      start1 = temp;
    }
    // this.$endNum.html(end1 - 10);
    //防抖函数
    clearTimeout(AntiShaking);
    AntiShaking = setTimeout(function () {
      if (this.recordEnd !== end1) {
        hueChange(end1 - 10);
      }
    }, 50);

    // if (this.recordEnd !== end1 && this.set.slide) {
    //   this.texts = this.$endNum.html();
    //   this.set.slide(this.texts);
    // }
    this.recordEnd = end1;
  };
  var r1 = new myRange();
  r1.init('#range1', {
    number: 20, //传入的基数
    values: 10, //点的位置
    step: 1 //每次滑动的数据
  });
};
