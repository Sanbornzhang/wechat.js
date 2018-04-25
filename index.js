const fs = require('fs')
const crypto = require('crypto')
class WeChat{
  constructor(aOptions){
    this.appid = aOptions.appid
    this.mch_id = aOptions.mch_id
    this.apiKey = aOptions.apiKey
    this.signType = aOptions.signType || 'md5'
  }
  set(aOptions){
    // notify_url,trade_type,pfx
    Object.keys(aOptions)
    .forEach((vKey)=>{
      if (vKey === 'pfx'){
        this[vKey] = fs.readFileSync(aOptions[vKey], 'utf8')
      }
      else{
        this[vKey] = aOptions[vKey]
      }
    })
  }
  sign(encoding = 'utf8', outputFormat = 'base64'){
    // 获取支持的算法
    const vSignStr = buildSignStr(this)
    const supportedSign = crypto.getHashes()
    if(supportedSign.indexOf(this.signType) === -1 ){
      const vError = new Error()
      vError.message = 'OS not support this algorithm'
      return vError
    }
    const signer = crypto.createSign(aSignType)
    signer.update(aSignStr, encoding)
    signer.sign(this.apiKey, 'base64')
    return signer
  }
}
const buildSignStr = (aObj)=>{
  return Object.keys(aObj)
  .filter((key)=>{
    return aObj[key]!== null && aObj[key]!== undefined && aObj[key]!== ''
  })
  .sort()
  .map((key)=>{
    return `${key}=${aObj[key]}`
  }).join('&')
}