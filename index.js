const fs = require('fs')
const crypto = require('crypto')
const process = require('process')
const util = require('util')
const {URL} = require('url')
const clone = require('clone')
const xml2js = require('xml2js')
const request = require('superagent')
const utils = require('./util/util')

class WeChat {
  constructor(options) {
    this.appid = options.appid
    this.mch_id = options.mch_id
    this.apiKey = options.apiKey
    this.sign_type = options.signType || 'MD5' // 只能为 'HMAC-SHA256' || 'MD5'
    this.env = options.env || process.env.NODE_ENV &&
                              process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  }
  set(options) {
    // notify_url,trade_type,pfx
    const limitKey = ['apiKey','env']
    const that = clone(this)
    Object.keys(options)
    .forEach((key)=>{
      if (key === 'pfx') {
        that[key] = fs.readFileSync(options[key], 'utf8')
      }
      else {
        that[key] = options[key]
      }
    })
    that.nonce_str = crypto.randomBytes(16).toString('hex')
    Object.keys(that)
    .forEach((key)=>{
      if(limitKey.indexOf(key) !== -1){
        delete that[key]
      }
    })
    return that
  }

  baseUrl() {
    const baseUrl = 'https://api.mch.weixin.qq.com/'
    const baseSandBoxUrl = 'https://api.mch.weixin.qq.com//sandboxnew/'
    return this.env === 'production' ? baseUrl : baseSandBoxUrl
  }
  unifiedOrder(data) {
    const buildingResult = (aData)=>{
      const vResult = {}
      vResult.appid = aData.appid
      vResult.partnerid = aData.mch_id
      vResult.prepayid = aData.prepay_id
      vResult.package = 'Sign=WXPay'
      vResult.noncestr = aData.nonce_str
      vResult.sign = aData.sign
      vResult.timestamp = utils.formatDate(new Date())
      return vResult
    }
    let unifiedOrderOptions = this.set(data)
    unifiedOrderOptions.sign = utils.sign(unifiedOrderOptions)
    const unifiedOrderUrl = new URL( '/pay/unifiedorder', this.baseUrl())
    const builder = new xml2js.Builder()
    const xmlData = builder.buildObject(unifiedOrderOptions)
    return request.post(unifiedOrderUrl.href)
    .type('xml')
    .send((xmlData))
    .then(async (_)=>{
      const xml2json = util.promisify(xml2js.parseString)
      const vResultOptions = (await xml2json(_.text)).xml
      const vResult = utils.objectArray2String(vResultOptions)
      console.log(unifiedOrderOptions)
      console.log(vResult)
      return buildingResult(vResult)
    })
    .catch((err)=>{
      return Promise.reject(err)
    })
  }
  test (){
    return Promise.resolve()
  }
}

