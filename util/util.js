const crypto = require('crypto')
const util = require('util')
const xml2js = require('xml2js')
const superagent = require('superagent')

const requestData = (url, data, passpfx)=>{
  return superagent.post(url)
  .type('xml')
  .send(json2xml(data))
  .pfx({
    pfx: passpfx,
    passphrase: data.mch_id,
  })
  .then((_)=>{
    return buildResponse(_)
  })
}

const formatDate = (aDate)=>{
  const vDate = new Date(aDate)
  const Y = vDate.getFullYear()
  const M = (vDate.getMonth() + 1 < 10 ? `0${vDate.getMonth() + 1}` : vDate.getMonth() + 1)
  const D = (vDate.getDate() < 10 ? `0${vDate.getDate()}` : vDate.getDate())
  const h = (vDate.getHours() < 10 ? '0' + vDate.getHours() : vDate.getHours())
  const m = (vDate.getMinutes() < 10 ? '0' + vDate.getMinutes() : vDate.getMinutes())
  const s = (vDate.getSeconds() < 10 ? '0' + vDate.getSeconds() : vDate.getSeconds())
  return `${Y}${M}${D}${h}${m}${s}`
}
const buildSignStr = (obj, signKey)=>{
  const limitKey = ['sign', 'signKey', 'env']
  const signStr = Object.keys(obj)
  .filter((key)=>{
    return obj[key]!== null && obj[key]!== undefined && obj[key]!== '' && limitKey.indexOf(key) === -1
  })
  .sort()
  .map((key)=>{
    return `${key}=${obj[key]}`
  }).join('&')
  return `${signStr}&key=${signKey}`
}
const sign = (data, key, signType = 'md5', encoding = 'utf8', outputFormat = 'base64')=> {
  // 获取支持的算法 md5 以及 sha256
  // ref: https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=4_3
  const signStr = buildSignStr(data, key)
  const supportedSign = crypto.getHashes()
  if (supportedSign.indexOf(signType) === -1 ) {
    const vError = new Error()
    vError.message = 'OS not support this algorithm'
    return vError
  }
  return crypto.createHash(signType)
                  .update(signStr)
                  .digest('hex')
                  .toUpperCase()
  }
const objectArray2String = (aObj)=>{
  let vKeys = Object.keys(aObj)
  let vResult = {}
  vKeys.forEach((vKey)=>{
    if (aObj[vKey] && aObj[vKey] instanceof Array && aObj[vKey].length === 1 ) {
      vResult[vKey] = aObj[vKey][0]
    }
    else {
      vResult[vKey] = aObj[vKey]
    }
  })
  return vResult
}
const buildResponse = async (res)=>{
  const responseOptions = (await xml2json(res.text)).xml
  const result = objectArray2String(responseOptions)
  if (result.return_code !== 'SUCCESS') {
    const error = new Error()
    error.message = result.return_msg || result.retmsg
    error.status = 500
    return Promise.reject(error)
  }
  return result
}
const timeStamp = ()=> parseInt(Date.now() / 1000)
const nonceStr = ()=> crypto.randomBytes(16).toString('hex')
const xml2json = util.promisify(xml2js.parseString)
const json2xml = (data)=>{
  const builder = new xml2js.Builder()
  return builder.buildObject(data)
}
module.exports = {
  sign: sign,
  xml2json: xml2json,
  json2xml: json2xml,
  nonceStr: nonceStr,
  timeStamp: timeStamp,
  buildSignStr: buildSignStr,
  buildResponse: buildResponse,
  formatDate: formatDate,
  objectArray2String: objectArray2String,
  request: requestData,
}
