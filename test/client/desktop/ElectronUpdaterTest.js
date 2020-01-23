// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("ElectronUpdater Test", function (done, timeout) {
	n.startGroup({
		group: __filename, allowables: [
			'./utils/Utils', '../api/common/utils/Utils',
			'./TutanotaError',
			'../api/common/error/RestError',
			'../api/common/error/UpdateError',
			'./DesktopNotifier',
			'../TutanotaConstants',
			"./DesktopConstants",
			'../EntityFunctions',
			'./utils/Encoding',
			'../error/CryptoError',
			'./StringUtils',
			'./EntityConstants',
			'./utils/ArrayUtils',
			'./Utils',
			'./MapUtils'
		], timeout: 2000
	})

	const electron = {
		app: {
			getPath: (path: string) => `/mock-${path}/`,
			getVersion: (): string => "3.45.0",
			emit: ()=>{}
		}
	}

	const rightKey = {verify: () => true}
	const wrongKey = {verify: () => false}
	const nodeForge = {
		pki: {
			publicKeyFromPem: (pem: string) => n.spyify(pem === "yes" ? rightKey : wrongKey)
		}
	}

	const autoUpdater = {
		callbacks: {
			'update-available': (any) => {
				throw new Error('checkForUpdates called before setting listener')
			},
			'update-downloaded': (any) => {
				throw new Error('downloadUpdates called before setting listener')
			},
			'error': (any) => {
				throw new Error('error called before setting  error listener')
			},
			'checking-for-update': () => {
				throw new Error('checking-for-updates called before setting listener')
			}
		},
		logger: undefined,
		on: (ev: string, cb: (any)=>void) => {
			autoUpdater.callbacks[ev] = cb
			return n.spyify(autoUpdater)
		},
		removeAllListeners: (ev: string) => {
			autoUpdater.callbacks[ev] = null
			return n.spyify(autoUpdater)
		},
		checkForUpdates: () => {
			setTimeout(() => autoUpdater.callbacks['update-available']({
				sha512: 'sha512',
				signature: 'signature',
			}), 90)
			return Promise.resolve()
		},
		downloadUpdate: () => {
			setImmediate(() => autoUpdater.callbacks['update-downloaded']({
				version: '4.5.0',
			}))
			return Promise.resolve()
		},
		quitAndInstall: (isSilent: boolean, isForceRunAfter: boolean) => {
		}
	}

	const desktopTray = {
		DesktopTray: {
			getIcon: () => {
				return 'this is an icon'
			}
		}
	}

	const lang = {
		lang: {
			get: (key: string) => {
				if (['updateAvailable_label', 'clickToUpdate_msg', 'errorReport_label', 'errorDuringUpdate_msg'].includes(key)) {
					return key
				}
				throw new Error(`unexpected lang key ${key}`)
			}
		}
	}

	const notifier = {
		showOneShot: (prop: {title: string, body: string, icon: any}) => Promise.resolve('click')
	}

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case 'enableAutoUpdate':
					return true
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		get: (key: string) => {
			switch (key) {
				case 'checkUpdateSignature':
					return true
				case 'pubKeys':
					return ['yes', 'no']
				case 'pollingInterval':
					return 300
				case 'iconName':
					return 'iconName.name'
				default:
					throw new Error(`unexpected get key ${key}`)
			}
		}
	}

	o("update is available", done => {
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater}).set().autoUpdater
		const electronMock = n.mock('electron', electron).set()

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock)

		o(autoUpdaterMock.on.callCount).equals(5)
		o(autoUpdaterMock.logger).equals(null)

		upd.start()

		// there is only one enableAutoUpdate listener
		o(confMock.removeListener.callCount).equals(1)
		o(confMock.removeListener.args[0]).equals('enableAutoUpdate')
		o(confMock.on.callCount).equals(1)

		setTimeout(() => {
			o(autoUpdaterMock.checkForUpdates.callCount).equals(1)

			// check signature
			o(forgeMock.pki.publicKeyFromPem.callCount).equals(2)

			o(n.spyify(rightKey).verify.callCount).equals(1)
			o(n.spyify(rightKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(rightKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			o(n.spyify(wrongKey).verify.callCount).equals(1)
			o(n.spyify(wrongKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(wrongKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			// show notification
			o(notifierMock.showOneShot.callCount).equals(1)
			o(notifierMock.showOneShot.args[0]).deepEquals({
				title: 'updateAvailable_label',
				body: 'clickToUpdate_msg',
				icon: 'this is an icon'
			})

			o(electronMock.app.emit.callCount).equals(1)
			o(electronMock.app.emit.args[0]).equals('enable-force-quit')
			o(autoUpdaterMock.quitAndInstall.callCount).equals(1)
			o(autoUpdaterMock.quitAndInstall.args[0]).equals(false)
			o(autoUpdaterMock.quitAndInstall.args[1]).equals(true)
			done()
		}, 190)
	})


	o("update is not available", done => {
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).set()
		const electronMock = n.mock('electron', electron).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater})
		                         .with({
			                         autoUpdater: {
				                         //never emit update-available
				                         checkForUpdates: () => Promise.resolve()
			                         }
		                         })
		                         .set().autoUpdater

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock)
		upd.start()

		setTimeout(() => {
			o(autoUpdaterMock.checkForUpdates.callCount).equals(1)

			// don't check signature
			o(forgeMock.pki.publicKeyFromPem.callCount).equals(0)
			o(n.spyify(rightKey).verify.callCount).equals(0)
			o(n.spyify(wrongKey).verify.callCount).equals(0)

			// don't show notification
			o(notifierMock.showOneShot.callCount).equals(0)
			o(autoUpdaterMock.quitAndInstall.callCount).equals(0)
			done()
			upd._stopPolling() // makes the test halt
		}, 190)
	})

	o("enable autoUpdate while running", done => {
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).set()
		const electronMock = n.mock('electron', electron).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater}).set().autoUpdater

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		let enabled = false
		const confMock = n.mock('__conf', conf)
		                  .with({
			                  removeListener: () => confMock,
			                  on: (key: string, cb: any) => {
				                  if (!enabled) {
					                  setTimeout(() => {
						                  enabled = true
						                  cb()
					                  }, 25)
				                  }
				                  return confMock
			                  },
			                  getDesktopConfig: (key: string) => {
				                  switch (key) {
					                  case 'enableAutoUpdate':
						                  return enabled
					                  default:
						                  throw new Error(`unexpected getDesktopConfig key ${key}`)
				                  }
			                  }
		                  })
		                  .set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock)

		upd.start()

		setTimeout(() => {
			// entered start() twice
			o(confMock.removeListener.callCount).equals(2)
			o(confMock.on.callCount).equals(2)

			// check signature
			o(forgeMock.pki.publicKeyFromPem.callCount).equals(2)
			o(forgeMock.pki.publicKeyFromPem.args[0]).equals('no')

			o(n.spyify(rightKey).verify.callCount).equals(1)
			o(n.spyify(rightKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(rightKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			o(n.spyify(wrongKey).verify.callCount).equals(1)
			o(n.spyify(wrongKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(wrongKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			// show notification
			o(notifierMock.showOneShot.callCount).equals(1)
			o(notifierMock.showOneShot.args[0]).deepEquals({
				title: 'updateAvailable_label',
				body: 'clickToUpdate_msg',
				icon: 'this is an icon'
			})

			o(electronMock.app.emit.callCount).equals(1)
			o(electronMock.app.emit.args[0]).equals('enable-force-quit')
			o(autoUpdaterMock.quitAndInstall.callCount).equals(1)
			o(autoUpdaterMock.quitAndInstall.args[0]).equals(false)
			o(autoUpdaterMock.quitAndInstall.args[1]).equals(true)
			done()
		}, 250)
	})

	o("retry after autoUpdater reports an error", done => {
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).set()
		const electronMock = n.mock('electron', electron).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater})
		                         .with({
			                         autoUpdater: {
				                         checkForUpdates: () => {
					                         setTimeout(() => autoUpdater.callbacks['update-available']({
						                         sha512: 'sha512',
						                         signature: 'signature',
					                         }), 90)
					                         return Promise.resolve()
				                         },
				                         downloadUpdate: () => {
					                         setTimeout(() => autoUpdater.callbacks['update-downloaded']({
						                         version: '4.5.0',
					                         }), 30)
					                         return Promise.resolve()
				                         },
				                         on: (ev: string, cb: (e: {message: string})=>void) => {
					                         autoUpdater.callbacks[ev] = cb
					                         if (ev === "error") {
						                         setTimeout(() => cb({message: "this is an autoUpdater error"}), 20)
					                         }
					                         return autoUpdaterMock
				                         }
			                         }
		                         })
		                         .set().autoUpdater

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock, 100)

		upd.start()

		// after the error
		setTimeout(() => {
			o(notifierMock.showOneShot.callCount).equals(1)
			o(notifierMock.showOneShot.args[0]).deepEquals({
				title: "errorReport_label",
				body: "errorDuringUpdate_msg",
				icon: 'this is an icon'
			})
			o(autoUpdaterMock.downloadUpdate.callCount).equals(0)
		}, 20)

		//after the download
		setTimeout(() => {
			o(notifierMock.showOneShot.callCount).equals(2)
			o(notifierMock.showOneShot.args[0]).deepEquals({
				title: "updateAvailable_label",
				body: "clickToUpdate_msg",
				icon: 'this is an icon'
			})
			o(autoUpdaterMock.downloadUpdate.callCount).equals(1)
			done()
		}, 150)
	})

	o("shut down autoUpdater after 5 errors", done => {
		const RETRY_INTERVAL = 150
		const MAX_NUM_ERRORS = 5
		let threw = false
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).set()
		const electronMock = n.mock('electron', electron).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater})
		                         .with({
			                         autoUpdater: {
				                         downloadUpdate: () => {
					                         setImmediate(() => {
						                         try {
							                         autoUpdater.callbacks['error']({message: "this is an autoUpdater error"})
						                         } catch (e) { // prevent escalation from killing the test suite
							                         console.log("caught")
							                         threw = true
						                         }
					                         })
					                         return Promise.resolve()
				                         }
			                         }
		                         })
		                         .set().autoUpdater

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock, RETRY_INTERVAL)

		upd.start()

		setTimeout(() => {
			upd._stopPolling()
			o(autoUpdaterMock.removeAllListeners.callCount).equals(4)
			o(threw).equals(true)
			done()
		}, RETRY_INTERVAL * (MAX_NUM_ERRORS + 1))
	})

	o("works if second key is right one", done => {

		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).with({
			publicKeyFromPem: (pem: string) => n.spyify(pem === "no" ? rightKey : wrongKey)
		}).set()
		const autoUpdaterMock = n.mock('electron-updater', {autoUpdater}).set().autoUpdater
		const electronMock = n.mock('electron', electron).set()

		//mock our modules
		n.mock('./DesktopTray', desktopTray).set()
		n.mock('../misc/LanguageViewModel', lang).set()

		//mock instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(confMock, notifierMock)

		o(autoUpdaterMock.on.callCount).equals(5)
		o(autoUpdaterMock.logger).equals(null)

		upd.start()

		// there is only one enableAutoUpdate listener
		o(confMock.removeListener.callCount).equals(1)
		o(confMock.removeListener.args[0]).equals('enableAutoUpdate')
		o(confMock.on.callCount).equals(1)

		setTimeout(() => {
			o(autoUpdaterMock.checkForUpdates.callCount).equals(1)

			// check signature
			o(forgeMock.pki.publicKeyFromPem.callCount).equals(2)
			o(forgeMock.pki.publicKeyFromPem.args[0]).equals("no")

			o(n.spyify(rightKey).verify.callCount).equals(1)
			o(n.spyify(rightKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(rightKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			o(n.spyify(wrongKey).verify.callCount).equals(1)
			o(n.spyify(wrongKey).verify.args[0]).equals(Buffer.from('sha512', 'base64').toString('binary'))
			o(n.spyify(wrongKey).verify.args[1]).equals(Buffer.from('signature', 'base64').toString('binary'))

			// show notification
			o(notifierMock.showOneShot.callCount).equals(1)
			o(notifierMock.showOneShot.args[0]).deepEquals({
				title: 'updateAvailable_label',
				body: 'clickToUpdate_msg',
				icon: 'this is an icon'
			})


			o(electronMock.app.emit.callCount).equals(1)
			o(electronMock.app.emit.args[0]).equals('enable-force-quit')
			o(autoUpdaterMock.quitAndInstall.callCount).equals(1)
			o(autoUpdaterMock.quitAndInstall.args[0]).equals(false)
			o(autoUpdaterMock.quitAndInstall.args[1]).equals(true)
			upd._stopPolling()
			done()
		}, 190)
	})
})
