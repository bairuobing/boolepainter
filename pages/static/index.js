// pages/static/index.js
const regeneratorRuntime = require("regenerator-runtime")
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pixelData: [],
    commonColors: ["red", "green", "blue", "aqua"],
    color: '#000000',
    width: 256,
    height: 256,
    zoomFactor: 1,
    onlineCount: 0
  },
  dragOrZoom(event) {
    if (event.touches.length == 1) {
      this.drag(event)
    } else if (event.touches.length == 2) {
      this.zoom(event)
    }
  },
  site(event) {
    console.log(this.ctx)
    var ctx = this.ctx._context.canvas
    this.startX = event.touches[0].clientX
    this.startY = event.touches[0].clientY
    this.posX = ctx.style.left
    this.posY = ctx.style.top
    console.log(this.startX, this.startY,this.posX,this.posY)
  },
  drag(event) {
    var ctx = this.ctx
    var currX = event.touches[0].clientX
    var currY = event.touches[0].clientY
    var diffX = currX - this.startX
    var diffY = currY - this.startY
    console.log(event)
  },
  zoom(event) {
    console.log(event)
  },
  pickColor: function(event) {
    this.data.color = event.currentTarget.dataset.c
  },
  reConnect: function() {
    wx.connectSocket({ url: 'ws://localhost:1996' })
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
        rectLeft ='' +  res[0].left
        rectTop = '' + res[0].top
        resolve({rectLeft,rectTop})
      })
    })
  },
  getFingerPosition: async function (event) {
    var { rectLeft, rectTop } = await this.getRect()
    var x =  event.touches[0].clientX - rectLeft
    var y =  event.touches[0].clientY - rectTop
    return { x, y }
  },
  drawDot: async function(event) {
    var { x, y } = await this.getFingerPosition(event)
    console.log('(' + x + ',' + y + ')')
    var msg = JSON.stringify({
      type: 'drawDot',
      x: x,
      y: y,
      color: this.data.color
    })
      wx.sendSocketMessage({
        data: msg
      })
  },
  linkAndDraw: function() {
    this.reConnect()
    var ctx = wx.createCanvasContext("cvs")
    // console.log(ctx)
    // var canvas = ctx._context.canvas
    // canvas.style.imageRendering = 'pixelated'
    this.ctx = ctx
    wx.onSocketMessage((res) => {
      var data = res.data
      if (typeof data == 'object') {
        var data = new Uint8ClampedArray(data)

        ctx.draw(true, res => {
          wx.canvasGetImageData({
            canvasId: 'cvs',
            x: 0,
            y: 0,
            width: 256,
            height: 256,
            success(res) {
              wx.canvasPutImageData({
                canvasId: 'cvs',
                data: data,
                x: 0,
                y: 0,
                width: 256,
                height: 256
              })
            },
            fail(res) { console.log('fail: ', res) },
            complete(res) { console.log('complete: ', res) }
          })
        })
      }
    })
  },
  watchAndUpdate: function() {
    var ctx = this.ctx
    wx.onSocketMessage((res) => {
      wx.onSocketClose(() => {
        console.log("连接中断...")
        this.reConnect()
      })
      var data = res.data
      if (typeof data == 'string') {
        data = JSON.parse(data)
        if (data.type == 'updateDot') {
          ctx.fillStyle = data.color
          ctx.fillRect(data.x, data.y, 1, 1)
          ctx.draw(true)
        } else if (data.type == 'onlineCount') {
          var preCount = this.onlineCount
          var currCount = data.count
          this.onlineCount = data.count
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.linkAndDraw()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.watchAndUpdate()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
   
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