// pages/static/index.js
const regeneratorRuntime = require("regenerator-runtime")
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pixelData: [],
    commonColors: [
      "#000000", "#ffffff", "#aaaaaa", "#555555", "#faac8e", "#ff8b83", "#f44336", "#e91e63", "#e2669e", "#9c27b0", "#673ab7", "#3f51b5", "#004670", "#057197", "#2196f3", "#00bcd4", "#3be5db", "#97fddc", "#167300", "#37a93c", "#89e642", "#d7ff07", "#fff6d1", "#f8cb8c", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#b83f27", "#795548"
      ],
    color: '#000000',
    width: 256,
    height: 256,
    zoomFactor: 1,
    onlineCount: 0,
    uint8Data: {}
  },
  // 向 canvas上绘制数据
  useUint8Data: function(x,y) {
    var that = this
    var data = that.data.uint8Data
    return new Promise((resolve) => {
      wx.canvasPutImageData({
        canvasId: 'cvs',
        data: data,
        x: x,
        y: y,
        width: 256,
        height: 256,
        success(res) {
          // console.log('重新绘制完成...: ', res)
          resolve('reDraw success')
        },
        // fail(res) { console.log('重新绘制失败!!! ', res) },
        // complete(res) { console.log('reDraw complete: ', res) }
      })
    })
    
  },
  dragOrZoom: function(event) {
    
    if (event.touches.length == 1) {
      this.drag(event)
      
    } else if (event.touches.length == 2) {
      this.zoom(event)
    }
  },
  // 当手指按下时记录 site
  site: function(event) {
    var that = this
    // 确定手指起始坐标
    this.startX = event.touches[0].clientX
    this.startY = event.touches[0].clientY

    if (event.touches[1]) {
      this.startX2 = event.touches[1].clientX
      this.startY2 = event.touches[1].clientY
    }
    // 确定元素起始坐标，并挂在this上
    this.posX = this.canvasLeft
    this.posY = this.canvasTop
  },
  drag: function(event) {
    var ctx = wx.createCanvasContext('cvs')
    // 手指坐标
    var currX = event.touches[0].clientX
    var currY = event.touches[0].clientY
    // 从点击那一刻起，不断移动
    var diffX = currX - this.startX
    var diffY = currY - this.startY
    // 移动的时候要保证起始坐标不变
    var left = this.posX + diffX
    var top = this.posY + diffY

    this.canvasTop = top
    this.canvasLeft = left
    // 绘制应该遵循吐一帧，消一帧
    ctx.clearRect(0, 0, 256, 256)
    
    ctx.draw(true,(res) => {
      this.useUint8Data(left, top)
    })

  },
  zoom: function(event) {

  },
  pickColor: function(event) {
    this.data.color = event.currentTarget.dataset.c
  },
  reConnect: function() {
    wx.connectSocket({ url: 'ws://192.168.31.135:443' })
    wx.onSocketOpen(function (res) {
      console.log('websocket 链接成功.');
    })
  },
  getRect: function() {
    var rectLeft = 0
    var rectTop = 0
    return new Promise((resolve) => {
      wx.createSelectorQuery().select('#canvas').boundingClientRect((rect) => {
        rect.left
        rect.top
      }).exec(function (res) {
        // 异步方法回调函数
        rectLeft = res[0].left
        rectTop = res[0].top
        resolve({rectLeft,rectTop})
      })
    })
  },
  // 获取手指相对于 canvas 的坐标
  getFingerPosition: async function (event) {
    var { rectLeft, rectTop } = await this.getRect()
    var x =  event.touches[0].clientX - rectLeft
    var y =  event.touches[0].clientY - rectTop
    return { x, y }
  },
  drawDot: async function(event) {
    // 戳点的过程应该根据当前“虚拟定位”改变
    var { x, y } = await this.getFingerPosition(event)
    console.log('(' + x + ',' + y + ')')
    var msg = JSON.stringify({
      type: 'drawDot',
      x: x - this.canvasLeft,
      y: y - this.canvasTop,
      color: this.data.color
    })
      wx.sendSocketMessage({
        data: msg
      })
  },
  linkAndDraw: function() {
    return new Promise((resolve) => {
      this.reConnect()
      var ctx = wx.createCanvasContext("cvs")
      
      // console.log(ctx)
      // var canvas = ctx._context.canvas
      // canvas.style.imageRendering = 'pixelated'
      this.ctx = ctx
      var that = this
      wx.onSocketMessage((res) => {
        wx.onSocketClose(() => {
          console.log("连接中断...")
        })
        var data = res.data
        if (typeof data == 'object') {
          
          var data = new Uint8ClampedArray(data)
          // 为 uint8 后存储
          this.data.uint8Data = data
          ctx.draw(true, res => {
            wx.canvasPutImageData({
              canvasId: 'cvs',
              data: data,
              x: 0,
              y: 0,
              width: 256,
              height: 256,
              success(res) {
                console.log('Draw succ: ', res)
                resolve('首次绘制完成...')
              },
              fail(res) { console.log('Draw fail: ', res) },
              complete(res) { console.log('Draw complete: ', res) }
            })
          })
        }
      })
    })
    
  },
  watchAndUpdate: function() {
    console.log("canvas数据： ",this.data.uint8Data.length)
    // var ctx = this.ctx
    var ctx = wx.createCanvasContext("cvs")
    wx.onSocketMessage((res) => {
      wx.onSocketClose(() => {
        console.log("连接中断...")
        this.reConnect()
      })
      var data = res.data
      
      if (typeof data == 'object') {
        // 不断将即使发来的 canvas 数据保存
        this.data.uint8Data = data
      }
      if (typeof data == 'string') {
        data = JSON.parse(data)
        if (data.type == 'updateDot') {
          ctx.setFillStyle(data.color)
          ctx.fillRect(data.x + this.canvasLeft, data.y + this.canvasTop, 1 , 1)
          
          ctx.draw(true)
        } else if (data.type == 'onlineCount') {
          var currCount = data.count
          this.data.onlineCount = data.count
          console.log('当前在线人数： ' + currCount)
        }
      }
    })
    
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(this.data.uint8Data)
    // 属性初始化
    this.canvasTop = 0
    this.canvasLeft = 0
    console.log('onLoad...')
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('onRead()')
    this.watchAndUpdate()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    console.log('onShow()页面发生了变化...')
    await this.linkAndDraw()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('onHide...')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onUnload...')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.closeSocket({
      success(res) { console.log("刷新成功准备重新链接...") }
    })
    wx.stopPullDownRefresh()
    wx.reLaunch({
      url: 'index'
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})