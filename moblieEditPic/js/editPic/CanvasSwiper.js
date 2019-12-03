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
    canvas.addPhotoIcon({
      url: 'image/editPic/thesunText.png',
      model: 70,
      customPosX: '222',
      customPosY: '20',
      callback: function () {
        console.log('成功添加一束光');
      }
    });
  }
  function addTimeCity() {
    let textCity = userNowCity || '中国';
    let textCityLen = 90 + Math.max(textCity.length - 2, 0) * 13;
    canvas.toDataURLTimeCy({
      callback: function (url) {
        // $('.outputPic').attr('src', url);
        canvas.addPhoto({
          url: url,
          model: textCityLen,
          customPosX: '6',
          customPosY: '360',
          callback: function () {
            console.log('成功添加打卡地点');
            $('.loading-bar').hide();
          }
        });
      }
    });
  }
  //自定义文字录入
  function addMyEntry(item) {
    let textItem = item;
    let textLen = 90 + Math.min(Math.max(textItem.length - 2, 0) * 13, 180);
    canvas.toDataURLMyEntry({
      value: item,
      callback: function (url) {
        // $('.outputPic').attr('src', url);
        canvas.addPhotoIcon({
          url: url,
          model: textLen,
          customPosX: '90',
          customPosY: '200',
          callback: function () {
            console.log('成功添加自定义文字');
            addSunText();
            // $('.loading-bar').hide();
          }
        });
      }
    });
  }
  // 默认为covered铺满，为数字时为固定宽度，adaption为自适应，enable：是否禁止编辑
  // 添加光晕A
  $('.addFullPic').click(function () {
    if (loadingoff) {
      $('.loading-bar').show();
    } else {
      return;
    }
    canvas.clearCanvas();
    canvas.addPhoto({
      url: 'image/editPic/asunshiny.png',
      model: 'adaption',
      customPosX: '-80',
      customPosY: '-120',
      callback: function () {
        console.log('成功添加光晕A');
        addTimeCity();
      }
    });
  });
  // 添加光晕B
  $('.addAutoPic').click(function () {
    if (loadingoff) {
      $('.loading-bar').show();
    } else {
      return;
    }
    canvas.clearCanvas();
    canvas.addPhoto({
      url: 'image/editPic/asunshinyb.png',
      model: 'adaption',
      customPosX: '-80',
      customPosY: '-120',
      callback: function () {
        console.log('成功添加光晕B');
        addTimeCity();
      }
    });
  });

  // 添加文字A
  $('.addTextIcon-a').click(function () {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: 'image/editPic/goodMorning.png',
      model: 100,
      customPosX: '90',
      customPosY: '180',
      callback: function () {
        console.log('成功添加文字A');
        addSunText();
      }
    });
  });
  // 添加文字B
  $('.addTextIcon-b').click(function () {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: 'image/editPic/lonely.png',
      model: 140,
      customPosX: '90',
      customPosY: '180',
      callback: function () {
        console.log('成功添加文字B');
        addSunText();
      }
    });
  });
  // 添加文字C
  $('.addTextIcon-c').click(function () {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: 'image/editPic/revive.png',
      model: 100,
      customPosX: '90',
      customPosY: '180',
      callback: function () {
        console.log('成功添加文字C');
        addSunText();
      }
    });
  });
  // 添加文字D
  $('.addTextIcon-d').click(function () {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: 'image/editPic/faceNight.png',
      model: 100,
      customPosX: '90',
      customPosY: '180',
      callback: function () {
        console.log('成功添加文字D');
        addSunText();
      }
    });
  });
  // 添加文字E
  $('.addTextIcon-e').click(function () {
    canvas.clearCanvasIcon();
    canvas.addPhotoIcon({
      url: 'image/editPic/eye-fly.png',
      model: 80,
      customPosX: '90',
      customPosY: '180',
      callback: function () {
        console.log('成功添加文字E');
        addSunText();
      }
    });
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
      model: 'adaption',
      callback: function () {
        console.log('成功添加背景图');
        $('.file').val('');
      }
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
      callback: function (url) {
        $('.updata-modal').hide();
        $('.upload-wrap').hide();
        $('.loading-bar').show();
        $('.remove-pic').show();
        canvas.clearCanvas();
        canvas.clearCanvasIcon();
        canvas.hueScale = 0;
        canvas.changeBg({
          photoSrc: url,
          model: 'covered',
          callback: function () {
            console.log('成功添加剪切图');
            canvas.clearCanvas();
            canvas.addPhoto({
              url: 'image/editPic/asunshiny.png',
              model: 'adaption',
              customPosX: '-80',
              customPosY: '-120',
              callback: function () {
                console.log('成功添加光晕A');
                addTimeCity();
                addSunText();
                $('.add-btn').css('background-color', '#b81657');
                loadingoff = true;
                $('.loading-bar').hide();
              }
            });
          }
        });
      }
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
      type: 'image/jpeg',
      callback: function (url) {
        console.log('成功输出1倍jpg图');
        //再次贴图
        canvas.toDataURLWrap({
          src: url,
          callback: function (url) {
            $('.outputPic').attr('src', url);
            var imgFile = dataURLtoFile(url, 'file');
            var formData = new FormData();
            formData.append('file', imgFile);
          }
        });
      }
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
