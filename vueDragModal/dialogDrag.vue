<template>
  <div v-if="visible" class="my_dialog">
    <!-- 遮罩层 -->
    <div class="my_dialog_mask"></div>
    <div class="my_dialog_box" :style="{width:width+'px'}" v-drag>
      <!-- 标题 -->
      <div class="my_dialog_title">
        {{title}}
        <span class="my_dialog_close" @click="cancel">X</span>
      </div>
      <!-- 内容 -->
      <div class="my_dialog_content">
        <slot></slot>
      </div>
      <!-- 底部按钮 -->
      <div class="my_dialog_bottom">
        <button class="btn cancelBtn" v-if="showCancelButton" @click="cancel">{{canceltext}}</button>
        <button class="btn confirmBtn" v-if="showOkButton" @click="ok">{{confirmtext}}</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    visible: { type: Boolean, required: true }, //控制弹窗显示，false 不显示，true 显示
    title: { type: String, default: '弹窗' }, //弹窗标题，默认 提示
    confirmtext: { type: String, default: '确定' }, //确认按钮文案，默认 确定
    canceltext: { type: String, default: '取消' }, //取消按钮文案，默认 取消
    showCancelButton: { type: Boolean, default: true }, //是否显示取消按钮，false 否，true 是，默认 true
    showOkButton: { type: Boolean, default: true }, //是否显示确认按钮，false 否，true 是，默认 true
    width: { type: String, default: '1000' } //默认宽度
  },
  data() {
    return {};
  },
  methods: {
    cancel: function() {
      // .sync 实现弹窗显示 or 隐藏
      this.$emit('update:visible', false);
      this.$emit('cancel');
    },
    ok: function() {
      this.$emit('ok');
    }
  }
};
</script>
<style lang="less" scoped>
.my_dialog {
  position: fixed;
  z-index: 99;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
}
.my_dialog_mask {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  background-color: #000;
  opacity: 0.5;
}
.my_dialog_box {
  position: absolute;
  background: #fff;
  top: 50%;
  left: 50%;
  max-width: 100%;
  border-radius: 3px;
  // overflow: hidden;
  transform: translate(-50%, -50%);
}
.my_dialog_content {
  height: 80vh;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  padding: 4px 12px;
  text-align: left;
  box-sizing: border-box;
}
.my_dialog_title {
  cursor: all-scroll;
  word-break: keep-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  top: 0;
  left: 0;
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid #e7e8eb;
  color: #000;
  font-size: 18px;
  font-family: \5fae\8f6f\96c5\9ed1;
  padding: 0 31px 0 18px;
  text-align: left;
  user-select: none;
}
.my_dialog_close {
  cursor: pointer;
  position: absolute;
  top: 50%;
  margin-top: -8px;
  right: 20px;
  width: 16px;
  height: 16px;
  line-height: 16px;
  color: #ccc;
}
.my_dialog_close:hover {
  color: #409eff;
}
.my_dialog_bottom {
  margin: 0;
  padding: 8px 0;
  text-align: center;
  border-top: 1px solid transparent;
}
.btn {
  min-width: 60px;
  text-align: center;
  vertical-align: middle;
  font-size: 14px;
  padding: 5px 15px;
  border-radius: 3px;
  text-decoration: none;
  border-radius: 3px;
  cursor: pointer;
}
.my_dialog_bottom .cancelBtn:focus,
.my_dialog_bottom .cancelBtn:hover {
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}
.my_dialog_bottom .confirmBtn:focus,
.my_dialog_bottom .confirmBtn:hover {
  background: #66b1ff;
  border: 1px solid #66b1ff;
  color: #fff;
}
.my_dialog_bottom .confirm_btn .marginLeft {
  margin-left: 10px;
}
.cancelBtn {
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
}
.confirmBtn {
  border: 1px solid #409eff;
  background-color: #409eff;
  color: #fff;
}
button + button {
  margin-left: 15px;
}
</style>