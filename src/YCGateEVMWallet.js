import RpcSource from 'web3-provider-engine/subproviders/rpc'
import { YCGateBaseWallet } from './YCGateBaseWallet'

const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const Web3Subprovider = require('web3-provider-engine/subproviders/provider.js')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const SubscriptionsSubprovider = require('web3-provider-engine/subproviders/subscriptions.js')

const context = window || global
context.chrome = { webstore: true }
context.Web3 = Web3
let globalSyncOptions = {}

if (!context.gateEngineContainer || context.gateEngineContainer.length == 0) {
	context.gateEngineContainer = []
}

export const YCGateEVMWallet = {
	init(rpcUrl, options, syncOptions) {
		const engine = new ProviderEngine()
		const web3 = new Web3(engine)
		globalSyncOptions = syncOptions
		engine.addProvider(new CacheSubprovider())
		engine.addProvider(new SubscriptionsSubprovider())
		engine.addProvider(new FilterSubprovider())
		engine.addProvider(new HookedWalletSubprovider(options))
		engine.addProvider(new RpcSource({ rpcUrl: rpcUrl }))
		engine.on('error', err => console.error('gate inject error', err.stack))
		engine.enable = options.enable
		engine.chainId = syncOptions.networkVersion
		engine.isGateWallet = true
		//标识工作引擎ID
		engine.flag = YCGateBaseWallet.createIdentity()
		//保证只启动一个engine
		if (context.gateEngineContainer.length == 0) {
			engine.start()
			context.web3 = web3
			context.gateEngineContainer.push(engine)
		}
		return engine
	},
	//实现一思考：进入界面会启动两个 engine，切换链之后两个 engine 都在运行，需要将原先链的 engine 停止，并且清空
	//对于剩下的一个 engine，需要更换 Rpc，将原先 Rpc 从 Provider 中移除，并且置空，再加入新的 RpcSource
	//这样的话导致第二个 hooked 不运行, 以上方法没有走通。为什么不重新 inject 就无法切链成功？
	//现在实现方案：将所有 engine 中的 rpcSource 的 url 同时替换
	updateChainInfo(newRpc, newChainId) {
		if (context.gateEngineContainer.length > 0) {
			for (let i = 0; i < context.gateEngineContainer.length; ++i) {
				const engine = context.gateEngineContainer[i];
				console.log(`newRpc is ${newRpc} newchainId: ${newChainId} engine:${engine.flag}`)
				const rpcSource = engine.getProviderByIndex(4)
				rpcSource.updateRpc(newRpc)
				globalSyncOptions.networkVersion = newChainId
			}
		}
	}
}

ProviderEngine.prototype.setHost = function (host) {
	var length = this._providers.length
	this._providers[length - 1].provider.host = host
}

ProviderEngine.prototype.send = function (payload) {
	const self = this
	let result = null
	switch (payload.method) {
		case 'eth_accounts':
			const address = globalSyncOptions.address
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
		default:
			const message = `The GateEVMWallet Web3 object does not support synchronous methods like ${payload.method} without a callback parameter.`
			throw new Error(message)
	}
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
		params: [],
	}).result
}

ProviderEngine.prototype._request = function (payload, cb) {
	switch (payload.method) {
		case 'web3_clientVersion':
		case 'net_version':
			var result = {
				id: payload.id,
				jsonrpc: payload.jsonrpc,
				result: globalSyncOptions.networkVersion || null,
			}
			cb(null, result)
			break
		case 'eth_chainId':
			var result = {
				id: payload.id,
				jsonrpc: payload.jsonrpc,
				result: '0x' + parseInt(globalSyncOptions.networkVersion).toString(16) || null,
			}
			cb(null, result)
			break
		case 'eth_requestAccounts':
			var result = {
				id: payload.id,
				jsonrpc: payload.jsonrpc,
				result: [globalSyncOptions.address],
			}
			cb(null, result)
			break
		default:
			if (payload.id) {
				this.sendAsync(payload, cb)
			} else {
				var payload2 = payload
				payload2['id'] = 1
				this.sendAsync(payload2, cb)
			}
			break
	}
}

ProviderEngine.prototype.request = function (payload) {
	return new Promise((resolve, reject) => {
		this._request(payload, function (error, response) {
			if (error) {
				reject(error)
			} else {
				resolve(response.result)
			}
		})
	})
}

if (context.YCGateEVMWallet == undefined) {
	context.YCGateEVMWallet = YCGateEVMWallet
}

export default {
	YCGateEVMWallet,
}