// pages/static/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pixelData: [],
    commonColors: ["red", "green", "blue", "aqua"],
    color: '#000000',
    width: 600,
    height: 600,
    isPickingColor: false,
    zoomFactor: 1,
    onlineCount: 0
  },
  pickColor: function(event) {
    this.data.color = event.currentTarget.dataset.c
  },

  drawDot: function(event) {
    var x = event.detail.x - event.target.offsetLeft
    var y = event.detail.y - event.target.offsetTop
    console.log('(' + x + ',' + y + ')')
    
    var msg = JSON.stringify({
      type: 'drawDot',
      x: x,
      y: y,
      color: this.data.color
    })
    console.log(msg)
      wx.sendSocketMessage({
        data: msg
      })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.connectSocket({ url: 'ws://localhost:1996' })
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
              console.log(data)
              console.log(res.data)
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var ctx = this.ctx
    wx.onSocketMessage((res) => {
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