// @flow
import o from "ospec"
import type {App} from "electron"
import type {DesktopCryptoFacade} from "../../../src/desktop/DesktopCryptoFacade";
import {downcast} from "@tutao/tutanota-utils";
import {ElectronUpdater} from "../../../src/desktop/ElectronUpdater";
import type {DesktopTray} from "../../../src/desktop/tray/DesktopTray";
import type {UpdaterWrapper} from "../../../src/desktop/UpdaterWrapper";
import n from "../nodemocker"
import type {DesktopConfig} from "../../../src/desktop/config/DesktopConfig";
import type {DesktopNotifier} from "../../../src/desktop/DesktopNotifier";
import {lang} from "../../../src/misc/LanguageViewModel"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"
import {delay} from "@tutao/tutanota-utils"

lang.init(en)

o.spec("ElectronUpdater Test", function () {

	let electron: {app: App}
	let rightKey
	let wrongKey
	let crypto
	let autoUpdater
	let conf: DesktopConfig
	let notifier: DesktopNotifier

	const tray: DesktopTray = downcast({
		getIconByName: () => ({})
	})

	let updaterImpl: UpdaterWrapper
	o.beforeEach(function () {
		notifier = downcast({
			showOneShot: o.spy((prop: {title: string, body: string, icon: any}) => Promise.resolve('click'))
		})
		conf = downcast({
				removeListener: o.spy((key: string, cb: ()=>void) => conf),
				on: o.spy((key: string) => conf),
				setVar: o.spy(),
				getVar: (key: string) => {
					switch (key) {
						case 'enableAutoUpdate':
							return true
						case 'showAutoUpdateOption':
							return true
						default:
							throw new Error(`unexpected getVar key ${key}`)
					}
				},
				getConst: (key: string) => {
					switch (key) {
						case 'checkUpdateSignature':
							return true
						case 'pubKeys':
							return ['no', 'yes']
						case 'pollingInterval':
							return 300
						case 'iconName':
							return 'iconName.name'
						default:
							throw new Error(`unexpected getConst key ${key}`)
					}
				},
			}
		)
		electron = {
			app: downcast({
					getPath: (path: string) => `/mock-${path}/`,
					getVersion: (): string => "3.45.0",
					emit: o.spy(),
					callbacks: [],
					once: function (ev: string, cb: ()=>void) {
						this.callbacks[ev] = cb
						return electron.app
					},
				}
			)
		}
		rightKey = {verify: o.spy(() => true)}
		wrongKey = {verify: o.spy(() => false)}
		crypto = downcast<DesktopCryptoFacade>({
			publicKeyFromPem: o.spy((pem: string) => pem === "yes" ? rightKey : wrongKey)
		})
		autoUpdater = {
			callbacks: {},
			logger: undefined,
			on: o.spy(function (ev: string, cb: (any)=>void) {
				if (!this.callbacks[ev]) this.callbacks[ev] = []
				this.callbacks[ev].push({fn: o.spy(cb), once: false})
				return this
			}),
			once: function (ev: string, cb: (any) => void) {
				if (!this.callbacks[ev]) this.callbacks[ev] = []
				this.callbacks[ev].push({fn: o.spy(cb), once: true})
				return this
			},
			removeListener: function (ev: string, cb: (any) => void) {
				if (!this.callbacks[ev]) return
				this.callbacks[ev] = this.callbacks[ev].filter(entry => entry.fn !== cb)
			},
			removeAllListeners: o.spy(function (ev: string) {
				this.callbacks[ev] = []
				return this
			}),
			emit: function (ev: string, args: any) {
				const entries = this.callbacks[ev]
				entries.forEach(entry => {
					setTimeout(() => entry.fn(args), 1)
				})
				this.callbacks[ev] = entries.filter(entry => !entry.once)
			},
			checkForUpdates: o.spy(function () {
				this.emit('update-available', {
					sha512: 'sha512',
					signature: 'signature',
				})
				return Promise.resolve()
			}),
			downloadUpdate: o.spy(function () {
				this.emit('update-downloaded', {
					version: '4.5.0',
				})
				return Promise.resolve()
			}),
			quitAndInstall: o.spy(),
		}
		updaterImpl = downcast({
			electronUpdater: Promise.resolve(autoUpdater),
			updatesEnabledInBuild: () => true,
		})
	})

	o("update is available", async function () {
		downcast(updaterImpl).updatesEnabledInBuild = () => true
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl)

		upd.start()

		o(conf.setVar.callCount).equals(1)
		o(conf.setVar.args).deepEquals(['showAutoUpdateOption', true])

		// there is only one enableAutoUpdate listener
		o(conf.removeListener.callCount).equals(1)
		o(conf.removeListener.args[0]).equals('enableAutoUpdate')
		o(conf.on.callCount).equals(1)

		await updaterImpl.electronUpdater
		await delay(190)

		// check signature
		o(crypto.publicKeyFromPem.callCount).equals(2)

		o(rightKey.verify.callCount).equals(1)
		o(rightKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(rightKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		o(wrongKey.verify.callCount).equals(1)
		o(wrongKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(wrongKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		// show notification
		o(notifier.showOneShot.callCount).equals(1)
		o(electron.app.emit.callCount).equals(1)
		o(electron.app.emit.args[0]).equals('enable-force-quit')
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)
	})


	o("update is not available", async function () {
		autoUpdater.checkForUpdates = o.spy(() => Promise.resolve())
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl)
		upd.start()

		await delay(190)
		o(autoUpdater.checkForUpdates.callCount).equals(1)

		// don't check signature
		o(crypto.publicKeyFromPem.callCount).equals(0)
		o(rightKey.verify.callCount).equals(0)
		o(wrongKey.verify.callCount).equals(0)

		// don't show notification
		o(notifier.showOneShot.callCount).equals(0)
		o(autoUpdater.quitAndInstall.callCount).equals(0)
		upd._stopPolling() // makes the test halt
	})

	o("enable autoUpdate while running", async function () {
		//mock instances
		let enabled = false
		const oldConf = conf
		conf = n.mock('__conf', oldConf)
		        .with({
			        removeListener: () => conf,
			        on: (key: string, cb: any) => {
				        if (!enabled) {
					        setTimeout(() => {
						        enabled = true
						        cb()
					        }, 25)
				        }
				        return conf
			        },
			        getVar: (key: string) => {
				        switch (key) {
					        case 'enableAutoUpdate':
						        return enabled
					        case 'showAutoUpdateOption':
						        return true
					        default:
						        throw new Error(`unexpected getVar key ${key}`)
				        }
			        }
		        })
		        .set()
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl)

		upd.start()

		await delay(100)
		// entered start() twice
		o(conf.removeListener.callCount).equals(2)
		o(conf.on.callCount).equals(2)

		// check signature
		o(crypto.publicKeyFromPem.callCount).equals(2)
		o(crypto.publicKeyFromPem.args[0]).equals('yes')

		o(rightKey.verify.callCount).equals(1)
		o(rightKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(rightKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		o(wrongKey.verify.callCount).equals(1)
		o(wrongKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(wrongKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		// show notification
		o(notifier.showOneShot.callCount).equals(1)

		o(electron.app.emit.callCount).equals(1)
		o(electron.app.emit.args[0]).equals('enable-force-quit')
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)
	})

	o("retry after autoUpdater reports an error", async function () {
		o.timeout(500) // this is very slow for some reason
		let first = true
		autoUpdater.checkForUpdates = function () {
			if (first) {
				first = false
				this.emit('error', {message: "this is an autoUpdater error"})
				return Promise.reject("oops")
			} else {
				this.emit('update-available', {
					sha512: 'sha512',
					signature: 'signature',
				})
				return Promise.resolve()
			}
		}
		const scheduler = (fn, time, args) => setInterval(fn, 10)
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl, scheduler)

		upd.start()

		// after the error
		await delay(2)
		o(autoUpdater.downloadUpdate.callCount).equals(0)("downloadUpdate after error")

		//after the download
		await delay(200)
		o(notifier.showOneShot.callCount).equals(1)("showOneShot")
		o(autoUpdater.downloadUpdate.callCount).equals(1)("downloadUpdate after download")
	})

	o("shut down autoUpdater after errors", async function () {
		autoUpdater.downloadUpdate = function () {
			autoUpdater.emit('error', {message: "this is an autoUpdater error"})
			return Promise.resolve()
		}
		const scheduler = (fn) => setInterval(fn, 5)
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl, scheduler)

		upd.start()
		await delay(150)

		upd._stopPolling()
		o(autoUpdater.removeAllListeners.callCount).equals(4)("removeAllListeners")
		o(notifier.showOneShot.callCount).equals(1)("showOneShot")
	})

	o("works if second key is right one", async function () {
		o.timeout(1000)
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl)
		upd.start()

		// there is only one enableAutoUpdate listener
		o(conf.removeListener.callCount).equals(1)
		o(conf.removeListener.args[0]).equals('enableAutoUpdate')
		o(conf.on.callCount).equals(1)

		await delay(250)
		o(autoUpdater.checkForUpdates.callCount).equals(1)

		// check signature
		o(crypto.publicKeyFromPem.callCount).equals(2)
		o(crypto.publicKeyFromPem.args[0]).equals("yes")

		o(wrongKey.verify.callCount).equals(1)
		o(wrongKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(wrongKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		o(rightKey.verify.callCount).equals(1)
		o(rightKey.verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
		o(rightKey.verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

		// show notification
		o(notifier.showOneShot.callCount).equals(1)

		o(electron.app.emit.callCount).equals(1)
		o(electron.app.emit.args[0]).equals('enable-force-quit')
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)
		upd._stopPolling()
	})

	o("updater disables itself if accessSync throws", async function () {
			downcast(updaterImpl).updatesEnabledInBuild = () => false
			const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, tray, updaterImpl)
			await updaterImpl.electronUpdater
			o(autoUpdater.on.callCount).equals(6)

			upd.start()

			o(conf.setVar.callCount).equals(1)
			o(conf.setVar.args).deepEquals(['showAutoUpdateOption', false])
			o(conf.removeListener.callCount).equals(0)
		}
	)
})
