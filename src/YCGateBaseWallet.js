const context = window || global
let callbackArr = {}

export const YCGateBaseWallet = {
    createIdentity() {
        const timeStamp = (new Date()).getTime()
        const num = 10
        const randomNum = Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, num - 1))
        const identity = (timeStamp).toString() + (randomNum).toString()
        return identity
    },
    addCallback(id, cb) {
        callbackArr[id] = cb
    },
    executeCallback(id, error, value) {
        const callback = callbackArr[id]
        if (callback) {
            callback(error, value)
            delete callbackArr[id]
        }
    },
    postMessage(methodName, object, cb) {
        if (cb) {
            const id = this.createIdentity()
            this.addCallback(id, cb)
            this.postMessageToWallet(methodName, id, object)
        }
        else {
            return new Promise((resolve, reject) => {
                const id = this.createIdentity()
                const cb = (error, value) => {
                    if (error == null) {
                        resolve(JSON.parse(value))
                    } else {
                        reject(error)
                    }
                }
                this.addCallback(id, cb)
                this.postMessageToWallet(methodName, id, object)
            })
        }
    },
    postMessageToWallet(methodName, id, object) {
        const params = {
            'methodName': methodName,
            'id': id,
            'object': object,
        }
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
    },
}

if (context.YCGateBaseWallet == undefined) {
    context.YCGateBaseWallet = YCGateBaseWallet
}

export default {
    YCGateBaseWallet,
}