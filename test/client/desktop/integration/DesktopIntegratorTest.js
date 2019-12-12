// @flow
import o from "ospec/ospec.js"
import n from "../../nodemocker"

o.spec("DesktopIntegrator Test", () => {
	n.startGroup({
		group: __filename,
		allowables: [
			'./DesktopIntegratorLinux.js',
			'./DesktopIntegratorDarwin.js',
			'./DesktopIntegratorWin32.js',
		],
		cleanupFunctions: [() => resetFsExtra()]
	})

	const lang = {
		lang: {get: key => key}
	}
	const cp = {
		exec: () => {}
	}

	const oldDataHome = process.env.XDG_DATA_HOME
	const oldConfigHome = process.env.XDG_CONFIG_HOME
	const oldExecPath = process.execPath

	const setupLinuxEnv = () => {
		n.setPlatform('linux')
		process.env.APPIMAGE = '/appimage/path/file.appImage'
		process.env.XDG_DATA_HOME = "/app/path/file/.local/share"
		process.env.XDG_CONFIG_HOME = "/app/path/file/.config"
		process.execPath = "/exec/path/elf"
	}

	const resetLinuxEnv = () => {
		delete process.env.APPIMAGE
		process.env.XDG_DATA_HOME = oldDataHome
		process.env.XDG_CONFIG_HOME = oldConfigHome
		process.execPath = oldExecPath
	}

	const electron = {
		app: {
			name: "appName",
			getLoginItemSettings() {return {openAtLogin: false}},
			setLoginItemSettings() {},
			getPath() {return "/app/path/file"},
			getVersion() {return "appVersion"}
		},
		dialog: {
			showMessageBox: () => Promise.resolve({response: 1, checkboxChecked: false})
		},
		Menu: {
			buildFromTemplate: () => {},
			setApplicationMenu: () => {}
		}
	}
	const fsExtra = {
		writtenFiles: [],
		copiedFiles: [],
		deletedFiles: [],
		createdDirectories: [],
		ensureDirSync() {},
		ensureDir() {
			return Promise.resolve()
		},
		writeFileSync(file, content, opts) {
			this.writtenFiles.push({file, content, opts})
		},
		writeFile(file, content, opts) {
			this.writtenFiles.push({file, content, opts})
			return Promise.resolve()
		},
		copyFileSync(from, to) {
			this.copiedFiles.push({from, to})
		},
		mkdir(directory, opts) {
			this.createdDirectories.push(directory)
			return Promise.resolve()
		},
		copyFile(from, to) {
			this.copiedFiles.push({from, to})
			return Promise.resolve()
		},
		unlinkSync(f) {
			this.deletedFiles.push(f)
		},
		readFileSync: () => "",
		unlink(path, cb) {
			this.deletedFiles.push(path)
			if (cb) {
				setImmediate(cb)
			} else {
				return Promise.resolve()
			}
		},
		access: (p, f) => {
			console.log(p, f)
			return Promise.reject(new Error('nope'))
		},
		constants: {
			F_OK: 0,
			W_OK: 1,
			R_OK: 2
		}
	}
	const resetFsExtra = () => {
		fsExtra.writtenFiles = []
		fsExtra.copiedFiles = []
		fsExtra.deletedFiles = []
		fsExtra.createdDirectories = []
	}

	let itemToReturn = undefined
	const winreg = n.classify({
		prototype: {
			get(key, cb) {setImmediate(() => cb(null, itemToReturn))},
			set(key, reg, val, cb) { setImmediate(() => cb(null))},
			remove(key, cb) {setImmediate(() => cb(null))}
		},
		statics: {}
	})

	const standardMocks = () => {
		// node modules
		const electronMock = n.mock('electron', electron).set()
		const fsExtraMock = n.mock('fs-extra', fsExtra).set()
		const winregMock = n.mock('winreg', winreg).set()
		const langMock = n.mock("../../misc/LanguageViewModel", lang).set()
		const cpMock = n.mock("child_process", cp).set()

		return {
			electronMock,
			fsExtraMock,
			winregMock,
			langMock,
			cpMock
		}
	}

	o("Darwin enable when off", done => {
		n.setPlatform('darwin')
		const {electronMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		;(async function () {
			await enableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(1)

			o(electronMock.app.setLoginItemSettings.args.length).equals(1)
			o(electronMock.app.setLoginItemSettings.args[0]).deepEquals({openAtLogin: true})

			done()
		})()
	})

	o("Darwin disable when off", done => {
		n.setPlatform('darwin')
		const {electronMock} = standardMocks()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		;(async function () {

			o(electronMock.Menu.buildFromTemplate.callCount).equals(1)
			o(electronMock.Menu.buildFromTemplate.args.length).equals(1)
			o(electronMock.Menu.buildFromTemplate.args[0]).deepEquals([
					{"role": "appMenu"}, {
						"label": "Edit",
						"submenu": [
							{"role": "undo"}, {"role": "redo"}, {"type": "separator"}, {"role": "cut"}, {"role": "copy"}, {"role": "paste"},
							{"role": "pasteAndMatchStyle"}, {"role": "delete"}, {"role": "selectAll"}, {"type": "separator"},
							{"label": "Speech", "submenu": [{"role": "startSpeaking"}, {"role": "stopSpeaking"}]}
						]
					}, {"label": "View", "submenu": [{"role": "togglefullscreen"}]}, {
						"role": "window",
						"submenu": [
							{"role": "minimize"}, {"role": "close"}, {"role": "minimize"}, {"role": "zoom"}, {"type": "separator"},
							{"role": "front"}
						]
					}
				]
			)
			o(electronMock.Menu.setApplicationMenu.callCount).equals(1)

			await disableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(0)

			done()
		})()
	})

	o("Darwin enable when on", done => {
		n.setPlatform('darwin')
		const electronMock = n.mock('electron', electron).with({
			app: {
				getLoginItemSettings() {return {openAtLogin: true}}
			}
		}).set()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		;(async function () {
			await enableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(0)

			done()
		})()
	})

	o("Darwin disable when on", done => {
		n.setPlatform('darwin')
		const electronMock = n.mock('electron', electron).with({
			app: {
				getLoginItemSettings() {return {openAtLogin: true}}
			}
		}).set()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		;(async function () {
			await disableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(1)

			o(electronMock.app.setLoginItemSettings.args.length).equals(1)
			o(electronMock.app.setLoginItemSettings.args[0]).deepEquals({openAtLogin: false})

			done()
		})()
	})

	o("Linux enable when off", done => {
		setupLinuxEnv()
		const {fsExtraMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await enableAutoLaunch()

			o(fsExtraMock.writeFileSync.callCount).equals(1)
			o(fsExtraMock.writeFileSync.args.length).equals(3)
			o(fsExtraMock.writeFileSync.args[0]).equals("/app/path/file/.config/autostart/appName.desktop")
			o(fsExtraMock.writeFileSync.args[1]).equals('[Desktop Entry]\n\tType=Application\n\tVersion=appVersion\n\tName=appName\n\tComment=appName startup script\n\tExec=/appimage/path/file.appImage -a\n\tStartupNotify=false\n\tTerminal=false')
			o(fsExtraMock.writeFileSync.args[2]).deepEquals({encoding: 'utf-8'})

			o(fsExtraMock.ensureDirSync.callCount).equals(1)
			o(fsExtraMock.ensureDirSync.args.length).equals(1)
			o(fsExtraMock.ensureDirSync.args[0]).equals("/app/path/file/.config/autostart")
			resetLinuxEnv()
			done()
		})()
	})

	o("Linux disable when off", done => {
		setupLinuxEnv()
		const {fsExtraMock} = standardMocks()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await disableAutoLaunch()
			o(fsExtraMock.unlink.callCount).equals(0)
			resetLinuxEnv()
			done()
		})()
	})

	o("Linux enable when on", done => {
		setupLinuxEnv()
		standardMocks()
		const fsExtraMock = n.mock('fs-extra', fsExtra).with({
			access: (path, mode) => Promise.resolve()
		}).set()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await enableAutoLaunch()
			o(fsExtraMock.writeFileSync.callCount).equals(0)
			resetLinuxEnv()
			done()
		})()
	})

	o("Linux disable when on", done => {
		setupLinuxEnv()
		standardMocks()
		const fsExtraMock = n.mock('fs-extra', fsExtra).with({
			access: () => Promise.resolve()
		}).set()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await disableAutoLaunch()
			o(fsExtraMock.unlink.callCount).equals(1)
			o(fsExtraMock.unlink.args.length).equals(1)
			o(fsExtraMock.unlink.args[0]).equals('/app/path/file/.config/autostart/appName.desktop')
			resetLinuxEnv()
			done()
		})()
	})

	o("Win32 enable when off", done => {
		n.setPlatform('win32')
		const {winregMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await enableAutoLaunch()
			o(winregMock.mockedInstances.length).equals(1)
			const regInst = winregMock.mockedInstances[0]
			o(regInst.get.callCount).equals(1)
			o(regInst.get.args.length).equals(2)
			o(regInst.get.args[0]).equals("appName")

			o(regInst.set.callCount).equals(1)
			o(regInst.set.args.length).equals(4)
			o(regInst.set.args[0]).equals('appName')
			o(regInst.set.args[2]).equals(`${process.execPath} -a`)
			done()
		})()
	})

	o("Win32 disable when off", done => {
		n.setPlatform('win32')
		const {winregMock} = standardMocks()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await disableAutoLaunch()
			o(winregMock.mockedInstances.length).equals(1)
			const regInst = winregMock.mockedInstances[0]
			o(regInst.get.callCount).equals(1)
			o(regInst.get.args.length).equals(2)
			o(regInst.get.args[0]).equals("appName")

			o(regInst.set.callCount).equals(0)
			o(regInst.remove.callCount).equals(0)
			done()
		})()
	})

	o("Win32 enable when on", done => {
		n.setPlatform('win32')
		itemToReturn = "not undefined"
		const {winregMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await enableAutoLaunch()
			o(winregMock.mockedInstances.length).equals(1)
			const regInst = winregMock.mockedInstances[0]

			o(regInst.set.callCount).equals(0)
			o(regInst.remove.callCount).equals(0)
			done()
		})()
	})

	o("Win32 disable when on", done => {
		n.setPlatform('win32')
		itemToReturn = "not undefined"
		const {winregMock} = standardMocks()
		const {disableAutoLaunch} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")

		;(async function () {
			await disableAutoLaunch()
			o(winregMock.mockedInstances.length).equals(1)
			const regInst = winregMock.mockedInstances[0]

			o(regInst.set.callCount).equals(0)
			o(regInst.remove.callCount).equals(1)
			o(regInst.remove.args.length).equals(2)
			o(regInst.remove.args[0]).equals("appName")
			done()
		})()
	})

	o("runIntegration without integration, clicked yes, no no_integration, not checked", done => {
		setupLinuxEnv()
		const {electronMock, fsExtraMock} = standardMocks()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(fsExtraMock.access.callCount).equals(3)
			o(electronMock.dialog.showMessageBox.callCount).equals(1)
			o(electronMock.dialog.showMessageBox.args.length).equals(2)
			o(electronMock.dialog.showMessageBox.args[0]).equals(null)
			o(electronMock.dialog.showMessageBox.args[1]).deepEquals({
				title: 'desktopIntegration_label',
				buttons: ['no_label', 'yes_label'],
				defaultId: 1,
				message: 'desktopIntegration_msg',
				checkboxLabel: 'doNotAskAgain_label',
				checkboxChecked: false,
				type: 'question'
			})
			o(fsExtraMock.ensureDir.callCount).equals(1)
			o(fsExtraMock.ensureDir.args.length).equals(1)
			o(fsExtraMock.ensureDir.args[0]).equals("/app/path/file/.local/share/applications")
			o(fsExtraMock.writtenFiles).deepEquals([
				{
					file: '/app/path/file/.local/share/applications/appName.desktop',
					content: '[Desktop Entry]\nName=Tutanota Desktop\nComment=The desktop client for Tutanota, the secure e-mail service.\nExec="/appimage/path/file.appImage" %U\nTerminal=false\nType=Application\nIcon=appName.png\nStartupWMClass=de.tutao.appName\nMimeType=x-scheme-handler/mailto;\nCategories=Network;\nX-Tutanota-Version=appVersion\nTryExec=/appimage/path/file.appImage',
					opts: {encoding: 'utf-8'}
				}
			])
			o(fsExtraMock.copiedFiles).deepEquals([
				{
					from: '/exec/path/resources/icons/logo-solo-red-small.png',
					to: '/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png'
				},
				{
					from: '/exec/path/resources/icons/logo-solo-red.png',
					to: '/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png'
				}
			])
			resetLinuxEnv()
			done()
		}, 10)
	})

	o("runIntegration without integration, clicked yes, no no_integration, checked", done => {
		setupLinuxEnv()
		const {fsExtraMock} = standardMocks()
		const electronMock = n.mock("electron", electron).with({
			dialog: {
				showMessageBox: () => Promise.resolve({response: 1, checkboxChecked: true})
			}
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(fsExtraMock.access.callCount).equals(3)
			o(fsExtraMock.ensureDir.callCount).equals(2)
			o(fsExtraMock.ensureDir.args.length).equals(1)
			o(fsExtraMock.ensureDir.args[0]).equals("/app/path/file/.local/share/applications")
			o(fsExtraMock.writtenFiles).deepEquals([
				{
					file: '/app/path/file/.config/tuta_integration/no_integration',
					content: '/appimage/path/file.appImage\n',
					opts: {encoding: 'utf-8', flag: 'a'}
				}, {
					file: '/app/path/file/.local/share/applications/appName.desktop',
					content: '[Desktop Entry]\nName=Tutanota Desktop\nComment=The desktop client for Tutanota, the secure e-mail service.\nExec="/appimage/path/file.appImage" %U\nTerminal=false\nType=Application\nIcon=appName.png\nStartupWMClass=de.tutao.appName\nMimeType=x-scheme-handler/mailto;\nCategories=Network;\nX-Tutanota-Version=appVersion\nTryExec=/appimage/path/file.appImage',
					opts: {encoding: 'utf-8'}
				}
			])
			o(fsExtraMock.copiedFiles).deepEquals([
				{
					from: '/exec/path/resources/icons/logo-solo-red-small.png',
					to: '/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png'
				},
				{
					from: '/exec/path/resources/icons/logo-solo-red.png',
					to: '/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png'
				}
			])
			resetLinuxEnv()
			done()
		}, 10)
	})

	o("runIntegration without integration, clicked no, not checked", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = '/appimage/path/file.appImage'
		const {fsExtraMock} = standardMocks()
		const electronMock = n.mock("electron", electron).with({
			dialog: {
				showMessageBox: () => Promise.resolve({response: 0, checkboxChecked: false})
			}
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(fsExtraMock.access.callCount).equals(3)
			o(fsExtraMock.ensureDirSync.callCount).equals(0)
			o(fsExtraMock.writtenFiles).deepEquals([])
			o(fsExtraMock.copiedFiles).deepEquals([])
			delete process.env.APPIMAGE
			done()
		}, 10)
	})

	o("runIntegration without integration, clicked no, checked", done => {
		setupLinuxEnv()
		const {fsExtraMock} = standardMocks()
		const electronMock = n.mock("electron", electron).with({
			dialog: {
				showMessageBox: () => Promise.resolve({response: 0, checkboxChecked: true})
			}
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(fsExtraMock.access.callCount).equals(3)
			o(fsExtraMock.ensureDir.callCount).equals(1)
			o(fsExtraMock.ensureDir.args.length).equals(1)
			o(fsExtraMock.ensureDir.args[0]).equals("/app/path/file/.config/tuta_integration")
			o(fsExtraMock.writtenFiles).deepEquals([
				{
					file: '/app/path/file/.config/tuta_integration/no_integration',
					content: '/appimage/path/file.appImage\n',
					opts: {encoding: 'utf-8', flag: 'a'}
				}
			])
			o(fsExtraMock.copiedFiles).deepEquals([])
			resetLinuxEnv()
			done()
		}, 10)
	})

	o("runIntegration with integration, outdated version", done => {
		setupLinuxEnv()
		const {electronMock} = standardMocks()
		const fsExtraMock = n.mock("fs-extra", fsExtra).with({
			readFileSync: () => "X-Tutanota-Version=notAppVersion",
			access: () => Promise.resolve()
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			o(fsExtraMock.access.callCount).equals(2)
			o(fsExtraMock.writtenFiles).deepEquals([
				{
					file: '/app/path/file/.local/share/applications/appName.desktop',
					content: '[Desktop Entry]\nName=Tutanota Desktop\nComment=The desktop client for Tutanota, the secure e-mail service.\nExec="/appimage/path/file.appImage" %U\nTerminal=false\nType=Application\nIcon=appName.png\nStartupWMClass=de.tutao.appName\nMimeType=x-scheme-handler/mailto;\nCategories=Network;\nX-Tutanota-Version=appVersion\nTryExec=/appimage/path/file.appImage',
					opts: {encoding: 'utf-8'}
				}
			])
			o(fsExtraMock.copiedFiles).deepEquals([
				{
					from: '/exec/path/resources/icons/logo-solo-red-small.png',
					to: '/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png'
				},
				{
					from: '/exec/path/resources/icons/logo-solo-red.png',
					to: '/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png'
				}
			])
			resetLinuxEnv()
			done()
		}, 10)
	})

	o("runIntegration with integration, matching version", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = '/appimage/path/file.appImage'
		const {electronMock} = standardMocks()
		const fsExtraMock = n.mock("fs-extra", fsExtra).with({
			readFileSync: () => "X-Tutanota-Version=appVersion",
			access: () => Promise.resolve()
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			o(fsExtraMock.access.callCount).equals(2)
			o(fsExtraMock.writtenFiles).deepEquals([])
			o(fsExtraMock.copiedFiles).deepEquals([])
			delete process.env.APPIMAGE
			done()
		}, 10)
	})

	o("runIntegration without integration, blacklisted", done => {
		setupLinuxEnv()
		const {electronMock} = standardMocks()
		const fsExtraMock = n.mock("fs-extra", fsExtra).with({
			readFileSync: () => '/another/blacklisted/file.appImage\n/appimage/path/file.appImage',
			access: p => p === '/app/path/file/.config/tuta_integration/no_integration' ? Promise.resolve() : Promise.reject()
		}).set()
		const {runIntegration} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		runIntegration()
		setTimeout(() => {
			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			o(fsExtraMock.access.callCount).equals(3)
			o(fsExtraMock.writtenFiles).deepEquals([])
			o(fsExtraMock.copiedFiles).deepEquals([])
			resetLinuxEnv()
			done()
		}, 10)
	})

	o("unintegration & integration undo each other", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = '/appimage/path/file.appImage'
		const {electronMock} = standardMocks()
		const fsExtraMock = n.mock("fs-extra", fsExtra).with({
			readFileSync: () => '/another/blacklisted/file.appImage\n/appimage/path/file.appImage',
			access: p => p === '/app/path/file/.config/tuta_integration/no_integration' ? Promise.resolve() : Promise.reject()
		}).set()
		const {integrate, unintegrate} = n.subject("../../src/desktop/integration/DesktopIntegrator.js")
		integrate()
		unintegrate()
		setTimeout(() => {
			const addedFiles = fsExtraMock.writtenFiles.map(f => f.file)
			                              .concat(fsExtraMock.copiedFiles.map(f => f.to)).sort()
			o(addedFiles).deepEquals(fsExtraMock.deletedFiles.sort())
			delete process.env.APPIMAGE
			done()
		}, 10)
	})
})