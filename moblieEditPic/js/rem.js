function getRem(pwidth, prem) {
  var html = document.getElementsByTagName("html")[0];
  var oWidth = window.innerWidth || document.documentElement.clientWidth;
  console.log(oWidth, 'oWidth')
  html.style.fontSize = oWidth / pwidth * prem + "px";
}
getRem(375, 100);
window.onresize = function () {
  getRem(375, 100)
};