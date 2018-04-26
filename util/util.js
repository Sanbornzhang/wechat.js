const crypto = require('crypto')

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
const buildSignStr = (obj)=>{
  const limitKey = ['sign']
  const signStr = Object.keys(obj)
  .filter((key)=>{
    return obj[key]!== null && obj[key]!== undefined && obj[key]!== '' && limitKey.indexOf(key) === -1
  })
  .sort()
  .map((key)=>{
    return `${key}=${obj[key]}`
  }).join('&')
  return `${signStr}&key=${obj.apiKey}`
}
const sign = (data, signType = 'md5', encoding = 'utf8', outputFormat = 'base64')=> {
  // 获取支持的算法 md5 以及 	sha256 
  // ref: https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=4_3
  const signStr = buildSignStr(data)
  const supportedSign = crypto.getHashes()
  if (supportedSign.indexOf(signType) === -1 ) {
    const vError = new Error()
    vError.message = 'OS not support this algorithm'
    return vError
  }
  return crypto.createHmac(signType, signStr)
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
module.exports = {
  sign: sign,
  buildSignStr: buildSignStr,
  formatDate: formatDate,
  objectArray2String: objectArray2String,
}
