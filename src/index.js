const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const Web3Subprovider = require("web3-provider-engine/subproviders/provider.js")
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const SubscriptionsSubprovider = require('web3-provider-engine/subproviders/subscriptions.js')
import { registerWallet, SUI_CHAINS } from "@mysten/wallet-standard";
import "regenerator-runtime/runtime";

const context = window || global

context.chrome = { webstore: true }
context.Web3 = Web3

let callbacks = {}
let hookedSubProvider
let globalSyncOptions = {}

const AlphaWallet = {
  init (rpcUrl, options, syncOptions) { 
    const engine = new ProviderEngine()
    const web3 = new Web3(engine)
    context.web3 = web3
    globalSyncOptions = syncOptions

    engine.addProvider(new CacheSubprovider())
    engine.addProvider(new SubscriptionsSubprovider())
    engine.addProvider(new FilterSubprovider())
    engine.addProvider(hookedSubProvider = new HookedWalletSubprovider(options))

    let username, password;
    let start = rpcUrl.indexOf("://");
    if (start != -1) {
      start += 3;
      const end = rpcUrl.indexOf("@", start + 1);
      if (end != -1) {
          const credentials = rpcUrl.substring(start, end);
          let [u, p] = credentials.split(":");
          username = u;
          password = p;
      }
    }
    if (typeof username === 'undefined' || typeof password === 'undefined') {
      engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl)))
    } else {
      engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl,0,username,password)))
    }

    engine.on('error', err => console.error(err.stack))
    engine.enable = options.enable
    engine.chainId = syncOptions.networkVersion
    engine.isAlphaWallet = true
    engine.start()

    return engine
  },
  addCallback (id, cb, isRPC) {
    cb.isRPC = isRPC
    callbacks[id] = cb
  },
  executeCallback (id, error, value) {
    let callback = callbacks[id]

    console.log(`executing callback isRpc:${callback.isRPC}: \nid: ${id}\nvalue: ${value}\nerror: ${error},\n`)


    if (callback.isRPC) {
      var response
      if (obj instanceof Object && !(obj instanceof Array)) {
        response = {'id': id, jsonrpc: '2.0', result: value, error: error }
      } else {
        response = {'id': id, jsonrpc: '2.0', result: value, error: {message: error} }
      }

      if (error) {
        callback(response, null)
      } else {
        callback(null, response)
      }
    } else {
      console.log(`not rpc, error: ${error}, value: ${value}`)
      callback(error, value)
    }
    delete callbacks[id]
  }
}

if (typeof context.AlphaWallet === 'undefined') {
  context.AlphaWallet = AlphaWallet
}

ProviderEngine.prototype.setHost = function (host) {
  var length = this._providers.length;
  this._providers[length - 1].provider.host = host;
}

ProviderEngine.prototype.send = function (payload) {
  const self = this

  let result = null
  switch (payload.method) {

    case 'eth_accounts':
      let address = globalSyncOptions.address
      result = address ? [address] : []
      break

    case 'eth_coinbase':
      result = globalSyncOptions.address || null
      break

    case 'eth_uninstallFilter':
      self.sendAsync(payload, noop)
      result = true
      break

    case 'net_version':
      result = globalSyncOptions.networkVersion || null
      break

    case 'net_listening':
      try {
        self._providers.filter(p => p.provider !== undefined)[0].provider.send(payload)
        result = true
      } catch (e) {
        result = false
      }
      break

    // throw not-supported Error
    default:
      var message = `The AlphaWallet Web3 object does not support synchronous methods like ${payload.method} without a callback parameter.`
      throw new Error(message)
  }
  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

ProviderEngine.prototype.isConnected = function () {
    return this.send({
        id: 9999999999,
        jsonrpc: '2.0',
        method: 'net_listening',
        params: []
    }).result
}

ProviderEngine.prototype.sendAsyncOriginal = ProviderEngine.prototype.sendAsync
ProviderEngine.prototype.sendAsync = function (payload, cb) {
  switch (payload.method) {
    case 'net_version':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: globalSyncOptions.networkVersion || null
      };
      cb(null, result);
      break;
    case 'eth_requestAccounts':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: [globalSyncOptions.address]
      };
      cb(null, result);
      break;
    case 'eth_chainId':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: "0x" + parseInt(globalSyncOptions.networkVersion).toString(16) || null
      };
      cb(null, result);
      break;
    default:
      //Patch the payload so nodes accept it, to prevent error: "invalid json request"
      if (payload.id) {
        this.sendAsyncOriginal(payload, cb);
      } else {
        var payload2 = payload
        payload2['id'] = 1
        this.sendAsyncOriginal(payload2, cb);
      }
  }
};

ProviderEngine.prototype.request = function (payload) {
  return new Promise((resolve, reject) => {
    this.sendAsync(payload, function(error, response) {
      if (error) {
        reject(error)
      } else {
        resolve(response.result)
      }
    })
  })
}


function createMessage(payload, method, id) {
  return {
    id: id || Math.floor((Math.random() * 10000000) + 1),
    method: method,
    payload
  }
}

function postSuiMessageToWallet(methodName, id, data) {
  const params = {
      'methodName': methodName,
      'id': id,
      'object': data,
  }
  console.log(JSON.stringify(params))
  if (window.flutter_inappwebview) {
      console.log('Flutter浏览器')
      window.flutter_inappwebview.callHandler('web3Message', params)
  } else if (window.webkit) {
      console.log('iOS浏览器')
      window.webkit.messageHandlers.web3Message.postMessage(params)
  } else if (window.gateio) {
      console.log('android浏览器')
      window.gateio.web3Message(params)
  }
}

function sendAsync (msg, cb) {
  AlphaWallet.addCallback(msg.id, cb)
  postSuiMessageToWallet(msg.method, msg.id, msg.payload)
}

function request(msg) {
  return new Promise((resolve, reject) => {
    sendAsync(msg, function(error, response) {
      if (error) {
        console.log("error", error);
        reject(error)
      } else {
        console.log("response info: ", response)
        resolve(JSON.parse(response))
      }
    })
  })
}


const MESSAGE_TYPE_ACQUIRE_PERMISSION = "acquire-permissions-request";
const MESSAGE_TYPE_SIGN_TRANSACTION = "sign-transaction-request";
const MESSAGE_TYPE_SIGN_AND_EXECUTE = "execute-transaction-request";
const MESSAGE_TYPE_STAKE = "stake-request";
const MESSAGE_TYPE_SIGN_MESSAGE = "sign-message-request";
const MESSAGE_TYPE_HAS_PERMISSION = "has-permissions-request";
const MESSAGE_TYPE_GET_ACCOUNT = "get-account";
const MESSAGE_TYPE_GET_NETWORK = "get-network";
const MESSAGE_TYPE_QREDO_CONNECT = "qredo-connect";

class GateSuiWallet {
  
  get version() { return "1.0.0"; }

  get name() { return "GateWallet"; }

  get icon() { return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjAwcHgiIGhlaWdodD0iNjAwcHgiIHZpZXdCb3g9IjAgMCA2MDAgNjAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPHRpdGxlPue8lue7hCA3PC90aXRsZT4KICAgIDxkZWZzPgogICAgICAgIDxwb2x5Z29uIGlkPSJwYXRoLTEiIHBvaW50cz0iMCAwIDYwMCAwIDYwMCA2MDAgMCA2MDAiPjwvcG9seWdvbj4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSLmjaLoibIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJTVkciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNzU1LjAwMDAwMCwgLTU1MTguMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSLnvJbnu4QtNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTc1NS4wMDAwMDAsIDU1MTguMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8ZyBpZD0i57yW57uEIj4KICAgICAgICAgICAgICAgICAgICA8bWFzayBpZD0ibWFzay0yIiBmaWxsPSJ3aGl0ZSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx1c2UgeGxpbms6aHJlZj0iI3BhdGgtMSI+PC91c2U+CiAgICAgICAgICAgICAgICAgICAgPC9tYXNrPgogICAgICAgICAgICAgICAgICAgIDxnIGlkPSJDbGlwLTIiPjwvZz4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMzAwLDQ2NC45OTg0MjcgQzIwOC44NzMwNjksNDY0Ljk5ODQyNyAxMzQuOTk2NTA0LDM5MS4xMjI1NjYgMTM0Ljk5NjUwNCwyOTkuOTk2NTA0IEMxMzQuOTk2NTA0LDIwOC44NzA0NDIgMjA4Ljg3MzA2OSwxMzUuMDAwOTM4IDMwMCwxMzUuMDAwOTM4IEwzMDAsLTAuMDAwNjM1NjAwNjI0IEMxMzQuMzEwMDQ5LC0wLjAwMDYzNTYwMDYyNCAwLDEzNC4zMTQ0ODkgMCwyOTkuOTk2NTA0IEMwLDQ2NS42Nzg1MiAxMzQuMzEwMDQ5LDYwMCAzMDAsNjAwIEM0NjUuNjg5OTUxLDYwMCA2MDAsNDY1LjY3ODUyIDYwMCwyOTkuOTk2NTA0IEw0NjUuMDAzNDk2LDI5OS45OTY1MDQgQzQ2NS4wMDM0OTYsMzkxLjEyMjU2NiAzOTEuMTI2OTMxLDQ2NC45OTg0MjcgMzAwLDQ2NC45OTg0MjciIGlkPSJGaWxsLTEiIGZpbGw9IiMyMzU0RTYiIG1hc2s9InVybCgjbWFzay0yKSI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IkZpbGwtMyIgZmlsbD0iIzE3RTZBMSIgcG9pbnRzPSIyOTkuOTkyMzczIDI5OS45OTcxNCA0NjQuOTk1ODY5IDI5OS45OTcxNCA0NjQuOTk1ODY5IDEzNC45OTUyMTcgMjk5Ljk5MjM3MyAxMzQuOTk1MjE3Ij48L3BvbHlnb24+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg=="; }

  get chains() {
    return SUI_CHAINS;
  }

  get accounts() {
    return [{
      "address":"0x5bc852f1ca0b36b22ccaab5a859bcb26afa5527aef5638088c2bd841201d2310",
      "publicKey": ""
    }]
  }

  get features() {
    return {
			"standard:connect": {
				version: "1.0.0",
				connect: this.connect,
			},
			"standard:events": {
				version: "1.0.0",
				on: this.on,
			},
			"sui:signTransactionBlock": {
				version: "1.0.0",
				signTransactionBlock: this.signTransactionBlock,
			},
			"sui:signAndExecuteTransactionBlock": {
				version: "1.0.0",
				signAndExecuteTransactionBlock: this.signAndExecuteTransactionBlock,
			},
			"suiWallet:stake": {
				version: "0.0.1",
				stake: this.stake,
			},
			"sui:signMessage": {
				version: "1.0.0",
				signMessage: this.signMessage,
			},
			"qredo:connect": {
				version: "0.0.1",
				qredoConnect: this.qredoConnect,
			},
    };
  }

  async connect(input)  {
    var msg = createMessage({
      permissions: [
        'viewAccount',
        'suggestTransactions',
      ],
    }, MESSAGE_TYPE_ACQUIRE_PERMISSION)
    var res = await request(msg)
    return []
  }

  on(input) {
    console.log("on", JSON.stringify(input))
  }

  signTransactionBlock(transaction) {
    var msg = createMessage(transaction, MESSAGE_TYPE_SIGN_TRANSACTION)
    return request(msg)
  }

  signAndExecuteTransactionBlock(transaction)  {
    var msg = createMessage(transaction, MESSAGE_TYPE_SIGN_AND_EXECUTE)
    return request(msg)
  }

  stake(stake) {
    var msg = createMessage(stake, MESSAGE_TYPE_STAKE)
    return request(msg)
  }

  signMessage(message) {
    var msg = createMessage(message, MESSAGE_TYPE_SIGN_MESSAGE)
    return request(msg)
  }

  qredoConnect(input) {
    var msg = createMessage(input, MESSAGE_TYPE_QREDO_CONNECT)
    return request(msg)
  }
}

registerWallet(new GateSuiWallet());


module.exports = AlphaWallet
