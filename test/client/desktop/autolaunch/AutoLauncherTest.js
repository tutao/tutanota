// @flow

import o from "ospec/ospec.js"
import n from "../../nodemocker"

o.spec("AutoLauncher Test", () => {
	n.startGroup(__filename, [
		'./AutoLauncherLinux.js',
		'./AutoLauncherDarwin.js',
		'./AutoLauncherWin32.js',
	])

	const electron = {
		app: {
			getLoginItemSettings() {return {openAtLogin: false}},
			setLoginItemSettings() {},
			getPath() {return "/app/path/file"},
			getName() {return "appName"},
			getVersion() {return "appVersion"}
		}
	}
	const fsExtra = {
		ensureDirSync() {},
		writeFileSync() {},
		unlink(path, cb) {setImmediate(cb)},
		access(path, mode, cb) {setImmediate(() => cb(new Error("nope")))},
		constants: {
			F_OK: 0,
			W_OK: 1,
			R_OK: 2
		}
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

		return {
			electronMock,
			fsExtraMock,
			winregMock
		}
	}

	o("Darwin enable when off", done => {
		n.setPlatform('darwin')
		const {electronMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")
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
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")
		;(async function () {
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
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")
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
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")
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
		n.setPlatform('linux')
		process.env.APPIMAGE = "appimagepath"
		const {fsExtraMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

		;(async function () {
			await enableAutoLaunch()

			o(fsExtraMock.writeFileSync.callCount).equals(1)
			o(fsExtraMock.writeFileSync.args.length).equals(3)
			o(fsExtraMock.writeFileSync.args[0]).equals("/app/path/file/.config/autostart/appName.desktop")
			o(fsExtraMock.writeFileSync.args[1]).equals('[Desktop Entry]\n\tType=Application\n\tVersion=appVersion\n\tName=appName\n\tComment=appName startup script\n\tExec=appimagepath -a\n\tStartupNotify=false\n\tTerminal=false')
			o(fsExtraMock.writeFileSync.args[2]).deepEquals({encoding: 'utf-8'})

			o(fsExtraMock.ensureDirSync.callCount).equals(1)
			o(fsExtraMock.ensureDirSync.args.length).equals(1)
			o(fsExtraMock.ensureDirSync.args[0]).equals("/app/path/file/.config/autostart")

			done()
		})()
	})

	o("Linux disable when off", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = "appimagepath"
		const {fsExtraMock} = standardMocks()
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

		;(async function () {
			await disableAutoLaunch()
			o(fsExtraMock.unlink.callCount).equals(0)
			done()
		})()
	})

	o("Linux enable when on", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = "appimagepath"
		standardMocks()
		const fsExtraMock = n.mock('fs-extra', fsExtra).with({
			access(path, mode, cb) {setImmediate(() => cb(null))}
		}).set()
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

		;(async function () {
			await enableAutoLaunch()
			o(fsExtraMock.writeFileSync.callCount).equals(0)
			done()
		})()
	})

	o("Linux disable when on", done => {
		n.setPlatform('linux')
		process.env.APPIMAGE = "appimagepath"
		standardMocks()
		const fsExtraMock = n.mock('fs-extra', fsExtra).with({
			access(path, mode, cb) {setImmediate(() => cb(null))}
		}).set()
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

		;(async function () {
			await disableAutoLaunch()
			o(fsExtraMock.unlink.callCount).equals(1)
			o(fsExtraMock.unlink.args.length).equals(2)
			o(fsExtraMock.unlink.args[0]).equals('/app/path/file/.config/autostart/appName.desktop')
			done()
		})()
	})

	o("Win32 enable when off", done => {
		n.setPlatform('win32')
		const {winregMock} = standardMocks()
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

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
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

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
		const {enableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

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
		const {disableAutoLaunch} = n.subject("../../src/desktop/autolaunch/AutoLauncher.js")

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
})