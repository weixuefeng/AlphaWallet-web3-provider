import { YCGateBaseWallet } from './YCGateBaseWallet'

const context = window || global

export const YCGateSEIWallet = {
    get isMobileSupported() {
        return true
    },
    get walletInfo() {
        return {
            windowKey: 'keplr',
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
    async getAccounts(chainId) {
        return YCGateBaseWallet.postMessage('seiGetAccounts', chainId)
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
    }
}

if (context.keplr == undefined) {
    context.keplr = YCGateSEIWallet
}

export default {
    YCGateSEIWallet,
}