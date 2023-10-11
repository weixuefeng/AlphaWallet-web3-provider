import { YCGateBaseWallet } from './YCGateBaseWallet'

const context = window || global

export const YCGateSEIWallet = {
    isMobileSupported: true,
    mode: 'mobile-web',
    get walletInfo() {
        return {
            windowKey: 'leap',
            name: 'Gate Wallet',
            website: 'https://gate.io',
            icon: 'https://www.gate.io/images/logo/open_sesame_light.png?v=4',
        }
    },
    async enable(chainID) {
        const resultDic = await YCGateBaseWallet.postMessage('seiEnable', chainID)
        return resultDic['isEnable']
    },
    async disable(chainID) {
        const resultDic = await YCGateBaseWallet.postMessage('seiDisable', chainID)
        return resultDic['isDisable']
    },
    async isConnected(chainID) {
        return true
    },
    async disconnect(chainID) {
        return true
    },
    async experimentalSuggestChain(chainInfo) {
        //console.log('experimentalSuggestChain:', JSON.stringify(chainInfo))
    },
    async getKey(chainID) {
        return YCGateBaseWallet.postMessage('seiGetKey', chainID)
    },
    async getAccounts(chainID) {
        return YCGateBaseWallet.postMessage('seiGetAccounts', chainID)
    },
    async connect(chainID) {
        return YCGateBaseWallet.postMessage('seiConnect', chainID)
    },
    async reconnectWallet(chainID) {
        return YCGateBaseWallet.postMessage('seiConnect', chainID)
    },
    async getEnigmaUtils(chainID) {
        return this.getOfflineSignerAuto(chainID)
    },
    async getOfflineSignerOnlyAmino(chainID) {
        return this.getOfflineSignerAuto(chainID)
    },
    async getOfflineSigner(chainID) {
        return this.getOfflineSignerAuto(chainID)
    },
    getOfflineSignerAuto(chainID) {
        return {
            async getAccounts() {
                return YCGateBaseWallet.postMessage('seiGetAccounts', chainID)
            },
            async signDirect(signer, signDoc) {
                const object = {
                    signer,
                    signDoc,
                }
                return YCGateBaseWallet.postMessage('seiSignDirect', object)
            }
        }
    },
    async verifyArbitrary(chainID, signer, data, signature) {
        const object = {
            chainID,
            signer,
            data,
            signature,
        }
        return YCGateBaseWallet.postMessage('seiVerifyArbitrary', object)
    },
    async signArbitrary(chainID, signer, message) {
        const object = {
            chainID,
            signer,
            message,
        }
        return YCGateBaseWallet.postMessage('seiSignArbitrary', object)
    },
}

if (context.leap == undefined) {
    context.leap = YCGateSEIWallet
    context.wallet = YCGateSEIWallet
    context.addEventListener('leap_keystorechange', YCGateSEIWallet.reconnectWallet)
}

export default {
    YCGateSEIWallet,
}