const fs = require('fs')
const process = require('process')
const {URL} = require('url')
const clone = require('clone')
const request = require('superagent')
const utils = require('./util/util')

/**
 * WeChat payment constructor
 */
class WeChat {
  /**
   * constructor
   * @param {Object} options
   */
  constructor(options) {
    this.appid = options.appid
    this.mch_id = options.mch_id
    this.apiKey = options.apiKey
    this.sign_type = options.signType || 'MD5' // 只能为 'HMAC-SHA256' || 'MD5'
    this.env = options.env || process.env.NODE_ENV &&
                              process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  }
    /**
   * set
   * @param {*} options
   * @return {WeChat}
   */
  set(options) {
    // notify_url,trade_type,pfx
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
    that.nonce_str = utils.nonceStr()
    return that
  }

  /**
   * baseUrl
   * @return {String} baseUrl
   */
  baseUrl() {
    const baseUrl = 'https://api.mch.weixin.qq.com/'
    const baseSandBoxUrl = 'https://api.mch.weixin.qq.com/sandboxnew/'
    return this.env === 'production' ? baseUrl : baseSandBoxUrl
  }
  /**
   * normalizingParameters
   * @param {Object} obj parameters
   * @return {Object} normalize parameters
   */
  normalizingParameters(obj) {
    const selfParameters = ['apiKey', 'env']
    selfParameters.forEach((key)=>{
      delete obj[key]
    })
    return obj
  }
  /**
   * unifiedOrder
   * @param {*} data
   * @return {Object} unifiedOrder data
   */
  unifiedOrder(data) {
    /**
     * buildingResult
     * @param {*} data
     * @return {Object} need sign!!!
     */
    const buildingResult = (data)=>{
      const vResult = {}
      vResult.appid = data.appid
      vResult.partnerid = data.mch_id
      vResult.prepayid = data.prepay_id
      vResult.package = 'Sign=WXPay'
      vResult.noncestr = utils.nonceStr()
      vResult.timestamp = utils.timeStamp()
      return vResult
    }
    let unifiedOrderOptions = this.set(data)
    unifiedOrderOptions.sign = utils.sign(unifiedOrderOptions, this.apiKey)
    this.normalizingParameters(unifiedOrderOptions)
    const unifiedOrderUrl = new URL( '/pay/unifiedorder', this.baseUrl())
    const xmlData = utils.json2xml(unifiedOrderOptions)
    return request.post(unifiedOrderUrl.href)
    .type('xml')
    .send((xmlData))
    .then(async (_)=>{
      const responseOptions = (await utils.xml2json(_.text)).xml
      const response = utils.objectArray2String(responseOptions)
      // TODO: error 封装
      if (response.return_code === 'FAIL') {
        const error = new Error()
        error.message = response.return_msg
        return Promise.reject(error)
      }
      else {
        const result = buildingResult(response)
        result.sign = utils.sign(result, this.apiKey)
        return result
      }
    })
    .catch((err)=>{
      return Promise.reject(err)
    })
  }
}

module.exports = WeChat
