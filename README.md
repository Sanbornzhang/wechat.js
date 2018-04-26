# wechat.js

```
  const vOptions = {
    appid: 'your appId',
    mch_id: 'mchId',
    apiKey: 'your key',
    env: 'production',
  }
  const WeChat = requie('wechat-pay-xxxx')
  const weChatPay = new WeChat(vOptions)
```
## 统一下单
```
  const vProductInfo = {
    body: 'xxxxx-支付测试',
    out_trade_no: '11111111111',
    total_fee: 100,
    spbill_create_ip: '127.0.0.1',
    time_start: 20180426205245,
    time_expire: 20180427045245,
    notify_url: 'http://xxx/api/wechat/callback',
    trade_type: 'APP',
  }
  return weChatPay.unifiedOrder(vProductInfo)
```

## TODO list
*   [ ]  基本的测试 打算用 eslint + mocha + chai + istanbul
*   [ ]  退款API
*   [ ]  订单查询API