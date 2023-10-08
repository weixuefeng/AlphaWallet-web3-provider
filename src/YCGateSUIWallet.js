import { registerWallet, SUI_CHAINS } from '@mysten/wallet-standard'
import { YCGateBaseWallet } from './YCGateBaseWallet'

const context = window || global
var suiAccountArr = []

export const YCGateSUIWallet = {
    version:'1.0.0',
    name: 'Gate Wallet',
    icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjAwcHgiIGhlaWdodD0iNjAwcHgiIHZpZXdCb3g9IjAgMCA2MDAgNjAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPHRpdGxlPue8lue7hCA3PC90aXRsZT4KICAgIDxkZWZzPgogICAgICAgIDxwb2x5Z29uIGlkPSJwYXRoLTEiIHBvaW50cz0iMCAwIDYwMCAwIDYwMCA2MDAgMCA2MDAiPjwvcG9seWdvbj4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSLmjaLoibIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJTVkciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNzU1LjAwMDAwMCwgLTU1MTguMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSLnvJbnu4QtNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTc1NS4wMDAwMDAsIDU1MTguMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8ZyBpZD0i57yW57uEIj4KICAgICAgICAgICAgICAgICAgICA8bWFzayBpZD0ibWFzay0yIiBmaWxsPSJ3aGl0ZSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx1c2UgeGxpbms6aHJlZj0iI3BhdGgtMSI+PC91c2U+CiAgICAgICAgICAgICAgICAgICAgPC9tYXNrPgogICAgICAgICAgICAgICAgICAgIDxnIGlkPSJDbGlwLTIiPjwvZz4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMzAwLDQ2NC45OTg0MjcgQzIwOC44NzMwNjksNDY0Ljk5ODQyNyAxMzQuOTk2NTA0LDM5MS4xMjI1NjYgMTM0Ljk5NjUwNCwyOTkuOTk2NTA0IEMxMzQuOTk2NTA0LDIwOC44NzA0NDIgMjA4Ljg3MzA2OSwxMzUuMDAwOTM4IDMwMCwxMzUuMDAwOTM4IEwzMDAsLTAuMDAwNjM1NjAwNjI0IEMxMzQuMzEwMDQ5LC0wLjAwMDYzNTYwMDYyNCAwLDEzNC4zMTQ0ODkgMCwyOTkuOTk2NTA0IEMwLDQ2NS42Nzg1MiAxMzQuMzEwMDQ5LDYwMCAzMDAsNjAwIEM0NjUuNjg5OTUxLDYwMCA2MDAsNDY1LjY3ODUyIDYwMCwyOTkuOTk2NTA0IEw0NjUuMDAzNDk2LDI5OS45OTY1MDQgQzQ2NS4wMDM0OTYsMzkxLjEyMjU2NiAzOTEuMTI2OTMxLDQ2NC45OTg0MjcgMzAwLDQ2NC45OTg0MjciIGlkPSJGaWxsLTEiIGZpbGw9IiMyMzU0RTYiIG1hc2s9InVybCgjbWFzay0yKSI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IkZpbGwtMyIgZmlsbD0iIzE3RTZBMSIgcG9pbnRzPSIyOTkuOTkyMzczIDI5OS45OTcxNCA0NjQuOTk1ODY5IDI5OS45OTcxNCA0NjQuOTk1ODY5IDEzNC45OTUyMTcgMjk5Ljk5MjM3MyAxMzQuOTk1MjE3Ij48L3BvbHlnb24+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==',
    chains: SUI_CHAINS,
    accounts: suiAccountArr,
    currentAccount: {},
    get features() {
        return {
            'standard:connect': {
                version: '1.0.0',
                connect: this.connect,
            },
            'qredo:connect': {
                version: '0.0.1',
                qredoConnect: this.qredoConnect,
            },
            'sui:signTransactionBlock': {
                version: '1.0.0',
                signTransactionBlock: this.signTransactionBlock,
            },
            'sui:signAndExecuteTransactionBlock': {
                version: '1.0.0',
                signAndExecuteTransactionBlock: this.signAndExecuteTransactionBlock,
            },
            'sui:signMessage': {
                version: '1.0.0',
                signMessage: this.signMessage,
            },
            'standard:events': {
                version: '1.0.0',
                on: this.on,
            },
            'suiWallet:stake': {
                version: '0.0.1',
                stake: this.stake,
            },
        }
    },
    async connect(input) {
        const object = {
            permissions: [
                'viewAccount',
                'suggestTransactions',
            ],
        }
        const resultDic = await YCGateBaseWallet.postMessage('suiConnect', object)
        suiAccountArr = resultDic['accounts']
        for (let i = 0; i < suiAccountArr.length; ++i) {
            suiAccountArr[i].chains = YCGateSUIWallet.chains
            suiAccountArr[i].features = YCGateSUIWallet.features
        }
        YCGateSUIWallet.accounts = suiAccountArr
        YCGateSUIWallet.currentAccount = suiAccountArr[0]
        return {
            accounts: suiAccountArr
        }
    },
    async qredoConnect(input) {
        return YCGateBaseWallet.postMessage('suiQRedoConnect', input)
    },
    async on(input) {
        console.log('SUIOnInput:', JSON.stringify(input))
    },
    async signTransactionBlock(input) {
        const object = {
            // account might be undefined if previous version of adapters is used
            // in that case use the first account address
            account: input.account.address,
            transaction: input.transactionBlock.serialize(),
        }
        return YCGateBaseWallet.postMessage('suiSignTransaction', object)
    },
    async signAndExecuteTransactionBlock(input) {
        const object = {
            type: 'transaction',
            data: input.transactionBlock.serialize(),
            options: input.options,
            account: input.account.address
        }
        return YCGateBaseWallet.postMessage('suiSignAndExecuteTransaction', object)
    },
    async signMessage(message) {
        return YCGateBaseWallet.postMessage('suiSignMessage', message)
    },
    async stake(stake) {
        return YCGateBaseWallet.postMessage('suiStake', stake)
    },
    
}

if (context.YCGateSUIWallet == undefined) {
    context.YCGateSUIWallet = YCGateSUIWallet
    registerWallet(YCGateSUIWallet)
}

export default {
    YCGateSUIWallet,
}