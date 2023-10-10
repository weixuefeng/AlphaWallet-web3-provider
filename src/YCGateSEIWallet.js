import { YCGateBaseWallet } from './YCGateBaseWallet'

const context = window || global

export const YCGateSEIWallet = {
    get isMobileSupported() {
        return true
    },
    mode: "mobile-web",
    get walletInfo() {
        return {
            windowKey: 'leap',
            name: 'Gate Wallet',
            website: 'https://gate.io',
            icon: 'https://www.gate.io/images/logo/open_sesame_light.png?v=4',
        }
    },
    async enable(chainId) {
        const resultDic = await YCGateBaseWallet.postMessage('seiEnable', chainId)
        return resultDic['isEnable']
    },
    async disable(chainId) {
        const resultDic = await YCGateBaseWallet.postMessage('seiDisable', chainId)
        return resultDic['isDisable']
    },
    async connect(chainId) {
        return YCGateBaseWallet.postMessage('seiConnect', chainId)
    },
    async isConnected(chainId) {
        return true;
    },
    async getKey(chainId) {
        return YCGateBaseWallet.postMessage('seiGetKey', chainId)
    },
    async disconnect(chainId) {
        return true;
    },
    async getAccounts(chainId) {
        return YCGateBaseWallet.postMessage('seiGetAccounts', chainId);
    },
    async experimentalSuggestChain(chainInfo) {
        // todo
        console.log("experimentalSuggestChain:", JSON.stringify(chainInfo))
    },
    getOfflineSignerAuto(chainId) {
        return {
            async getAccounts() {
                return YCGateBaseWallet.postMessage('seiGetAccounts', chainId)
            },
            async signDirect(signerAddress, signDoc) {
                const object = {
                    signerAddress,
                    signDoc,
                }
                return YCGateBaseWallet.postMessage('seiSignDirect', object)
            }
        }
    },
    async signArbitrary(chainId, signer, message) {
        const object = {
            chainId,
            signer,
            message,
        }
        return YCGateBaseWallet.postMessage('seiSignArbitrary', object)
    },
    async verifyArbitrary(chainId, signer, data, signature) {
        const object = {
            chainId,
            signer,
            data,
            signature,
        }
        return YCGateBaseWallet.postMessage('seiVerifyArbitrary', object)
    },
    async reconnectWallet(chainId) {
        return YCGateBaseWallet.postMessage('seiConnect', chainId)
    },
    async getEnigmaUtils(chainId){
        return this.getOfflineSignerAuto(chainId)
    },
    async getOfflineSignerOnlyAmino(chainId) {
        return this.getOfflineSignerAuto(chainId)
    },
    async getOfflineSigner(chainId) {
        return this.getOfflineSignerAuto(chainId)
    }
}

if (context.leap == undefined) {
    context.leap = YCGateSEIWallet
    context.wallet = context.leap
    window.addEventListener('leap_keystorechange', YCGateSEIWallet.reconnectWallet)
}

export default {
    YCGateSEIWallet,
}