const fs = require('fs')
const crypto = require('crypto')
const process = require('process')
const { URL } = require('url')
const clone = require('clone')
const xml2js = require('xml2js')
const request = require('superagent')

class WeChat{
  constructor(options){
    this.appid = options.appid
    this.mch_id = options.mch_id
    this.apiKey = options.apiKey
    this.signType = options.signType || 'md5'
    this.env = options.env || process.env.NODE_ENV && 
                              process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  }
  set(options){
    // notify_url,trade_type,pfx
    const that = clone(this)
    Object.keys(options)
    .forEach((key)=>{
      if (key === 'pfx'){
        that[key] = fs.readFileSync(options[key], 'utf8')
      }
      else{
        that[key] = options[key]
      }
    })
    return that
  }
  sign(data,encoding = 'utf8', outputFormat = 'base64'){
    // 获取支持的算法 md5 以及 	sha256 ref: https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=4_3
    const signStr =  buildSignStr(data)
    const supportedSign = crypto.getHashes()
    if(supportedSign.indexOf(this.signType) === -1 ){
      const vError = new Error()
      vError.message = 'OS not support this algorithm'
      return vError
    }
    const signer =  crypto.createHmac(this.signType, sharedSecret)
                    .update(signStr)
                    .digest("hex");
    return signer.toUpperCase()
  }
  baseUrl (){
    const baseUrl = 'https://api.mch.weixin.qq.com/'
    const baseSandBoxUrl = 'https://api.mch.weixin.qq.com//sandboxnew/'
    return this.env === 'production' ? baseUrl : baseSandBoxUrl

  }
  unifiedOrder(data){
    const unifiedOrderUrl = new URL( '/pay/unifiedorder', this.baseUrl())
    const builder = new xml2js.Builder();
    return builder.buildObject(data)
    // request.post(unifiedOrderUrl.href) 
    // .send((builder))
  }

}
const buildSignStr = (obj)=>{
  const limitKey = ['sign']
  const signStr = Object.keys(aObj)
  .filter((key)=>{
    return obj[key]!== null && obj[key]!== undefined && obj[key]!== '' && limitKey.indexOf(key) === -1
  })
  .sort()
  .map((key)=>{
    return `${key}=${aObj[key]}`
  }).join('&')
  return `${signStr}key=${this.apiKey}`
}

