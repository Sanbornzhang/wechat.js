const fs = require('fs')
const process = require('process')
// const {URL} = require('url')
const clone = require('clone')
const request = require('superagent')
const utils = require('./util/util')
const urljoin = require('url-join')
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
    this.signKey = options.signKey
    this.passpfx = options.passpfx
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
    that.time_start = that.time_start ? utils.formatDate(that.time_start): null
    that.time_expire = that.time_expire ? utils.formatDate(that.time_expire): null
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
    const selfParameters = ['signKey', 'env', 'passpfx']
    selfParameters.forEach((key)=>{
      delete obj[key]
    })
    return obj
  }

  /**
   * sandboxKey
   * @return {string} sandbox environment sign key
   */
  sandboxKey() {
    const sandboxSignKeyUrl = 'https://api.mch.weixin.qq.com/sandboxnew/pay/getsignkey'
    const options = {
      mch_id: this.mch_id,
      nonce_str: utils.nonceStr(),
    }
    options.sign = utils.sign(options, this.signKey)
    return request.post(sandboxSignKeyUrl)
    .type('xml')
    .send(utils.json2xml(options))
    .then((_)=>{
      return utils.buildResponse(_)
    })
    .then((response)=>{
      this.signKey = response.sandbox_signkey
      return response.sandbox_signkey
    })
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
    this.normalizingParameters(unifiedOrderOptions)
    unifiedOrderOptions.sign = utils.sign(unifiedOrderOptions, this.signKey)
    const unifiedOrderUrl = urljoin(this.baseUrl(), '/pay/unifiedorder')
    const xmlData = utils.json2xml(unifiedOrderOptions)
    return request.post(unifiedOrderUrl)
    .type('xml')
    .send((xmlData))
    .then((_)=>{
      return utils.buildResponse(_)
    })
    .then((response)=>{
      const result = buildingResult(response)
      result.sign = utils.sign(result, this.signKey)
      return result
    })
    .catch((err)=>{
      return Promise.reject(err)
    })
  }
  /**
   * Paid Notify Verify
   * @param {*} data
   * @return {Promise} true|error
   */
  paidNotifyVerify(data) {
    if (data.appid && data.appid === this.appid && data.mch_id && data.mch_id === this.mch_id) {
      const dataSign = utils.sign(data, this.signKey)
      const responseSign = data.sign
      if ( dataSign !== responseSign) {
        const error = new Error('sign is not equal')
        return Promise.reject(error)
      }
      return Promise.resolve(true)
    }
  else {
    const error = new Error('[appid|mch_id] not equal')
    return Promise.reject(error)
    }
  }
  /**
   * refund
   * @param {*} data
   * @return {Object}
   */
  refund(data) {
    const refundOptions = this.set(data)
    this.normalizingParameters(refundOptions)
    refundOptions.sign = utils.sign(refundOptions, this.signKey)
    const refundURL = urljoin(this.baseUrl(), '/secapi/pay/refund')
    return utils.request(refundURL, refundOptions, this.passpfx)
    .then((responseData)=>{
      return responseData
    })
    .catch((err)=>{
      throw (err)
    })
  }
}

module.exports = WeChat
