import o from "@tutao/otest"
import n from "../../nodemocker.js"
import { getDesktopIntegratorForPlatform } from "../../../../src/common/desktop/integration/DesktopIntegrator.js"
import { downcast, LazyLoaded } from "@tutao/tutanota-utils"
import type { WindowManager } from "../../../../src/common/desktop/DesktopWindowManager.js"
import { lang } from "../../../../src/common/misc/LanguageViewModel.js"
import en from "../../../../src/mail-app/translations/en.js"
import { DesktopIntegratorLinux } from "../../../../src/common/desktop/integration/DesktopIntegratorLinux.js"
import { DesktopIntegratorDarwin } from "../../../../src/common/desktop/integration/DesktopIntegratorDarwin.js"
import { DesktopIntegratorWin32 } from "../../../../src/common/desktop/integration/DesktopIntegratorWin32.js"
import { spy } from "@tutao/tutanota-test-utils"
import { object, verify, when } from "testdouble"
import { RegistryHive, WindowsRegistryFacade, WindowsRegistryKey } from "../../../../src/common/desktop/integration/WindowsRegistryFacade"

const desktopEntry = `[Desktop Entry]
Name=Tuta Mail
Comment=The desktop client for Tuta Mail, the secure e-mail service.
GenericName=Mail Client
Keywords=Email;E-mail
Exec="/appimage/path/file.appImage" %U
Terminal=false
Type=Application
Icon=appName
StartupWMClass=appName
MimeType=x-scheme-handler/mailto;
Categories=Network;
X-Tutanota-Version=appVersion
TryExec=/appimage/path/file.appImage`

lang.init(en)

o.spec("DesktopIntegrator", () => {
	const cp = {
		exec: () => {},
	}

	const oldDataHome = process.env.XDG_DATA_HOME
	const oldConfigHome = process.env.XDG_CONFIG_HOME
	const oldExecPath = process.execPath

	const setupLinuxEnv = () => {
		n.setPlatform("linux")
		process.env.APPIMAGE = "/appimage/path/file.appImage"
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
			getLoginItemSettings() {
				return { openAtLogin: false }
			},
			setLoginItemSettings() {},
			getPath() {
				return "/app/path/file"
			},
			getVersion() {
				return "appVersion"
			},
		},
		dialog: {
			showMessageBox: () => Promise.resolve({ response: 1, checkboxChecked: false }),
		},
		Menu: {
			buildFromTemplate: () => {},
			setApplicationMenu: () => {},
		},
	}
	let writtenFiles, copiedFiles, deletedFiles, createdDirectories, readFiles

	const fsExtra = {
		writeFileSync(file, content, opts) {
			writtenFiles.push({ file, content, opts })
		},
		writeFile(file, content, opts) {
			writtenFiles.push({ file, content, opts })
			return Promise.resolve()
		},
		copyFileSync(from, to) {
			copiedFiles.push({ from, to })
		},
		mkdir(directory, opts) {
			createdDirectories.push(directory)
			return Promise.resolve()
		},
		mkdirSync(directory, opts) {
			createdDirectories.push(directory)
			return Promise.resolve()
		},
		copyFile(from, to) {
			copiedFiles.push({ from, to })
			return Promise.resolve()
		},
		unlinkSync(f) {
			deletedFiles.push(f)
		},
		readFileSync: () => "",
		constants: {
			F_OK: 0,
			W_OK: 1,
			R_OK: 2,
		},
		promises: {
			access: (p, f) => {
				console.log(p, f)
				return Promise.reject(new Error("nope"))
			},
			mkdir() {
				return Promise.resolve()
			},
			copyFile(from, to) {
				copiedFiles.push({ from, to })
				return Promise.resolve()
			},
			writeFile(file, content, opts) {
				writtenFiles.push({ file, content, opts })
				return Promise.resolve()
			},
			readFile(file) {
				readFiles.push(file)
				return Promise.resolve(new Uint8Array())
			},
			unlink(path, cb) {
				deletedFiles.push(path)
				if (cb) {
					setImmediate(cb)
				} else {
					return Promise.resolve()
				}
			},
		},
	}

	const wm = {}

	const standardMocks = () => {
		writtenFiles = []
		copiedFiles = []
		deletedFiles = []
		createdDirectories = []
		readFiles = []

		// node modules
		const electronMock = n.mock<typeof import("electron")>("electron", electron).set()
		const fsExtraMock = n.mock<typeof import("fs")>("fs", fsExtra).set()
		const cpMock = n.mock<typeof import("child_process")>("child_process", cp).set()
		const wmMock = n.mock<WindowManager>("wm", wm).set()

		return {
			electronMock,
			fsExtraMock,
			cpMock,
			wmMock,
		}
	}

	o.spec("macOS", function () {
		o.beforeEach(function () {
			n.setPlatform("darwin")
		})

		o("enable when off", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorDarwin(electronMock)
			await integrator.enableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(1)

			o(electronMock.app.setLoginItemSettings.args.length).equals(1)
			o(electronMock.app.setLoginItemSettings.args[0]).deepEquals({ openAtLogin: true })
		})

		o("disable when off", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorDarwin(electronMock)
			await integrator.disableAutoLaunch()

			o(electronMock.app.setLoginItemSettings.callCount).equals(0)
		})

		o("enable when on", async function () {
			const electronMock = n
				.mock<typeof import("electron")>("electron", electron)
				.with({
					app: {
						getLoginItemSettings() {
							return { openAtLogin: true }
						},
					},
				})
				.set()
			const integrator = new DesktopIntegratorDarwin(electronMock)
			await integrator.enableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(0)
		})

		o("disable when on", async function () {
			const electronMock = n
				.mock<typeof import("electron")>("electron", electron)
				.with({
					app: {
						getLoginItemSettings() {
							return { openAtLogin: true }
						},
					},
				})
				.set()
			const integrator = new DesktopIntegratorDarwin(electronMock)
			await integrator.disableAutoLaunch()

			o(electronMock.app.getLoginItemSettings.callCount).equals(1)
			o(electronMock.app.setLoginItemSettings.callCount).equals(1)

			o(electronMock.app.setLoginItemSettings.args.length).equals(1)
			o(electronMock.app.setLoginItemSettings.args[0]).deepEquals({ openAtLogin: false })
		})

		o("ApplicationMenu gets created", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorDarwin(electronMock)

			const wmMock = downcast<WindowManager>({
				newWindow: spy(() => {}),
			})
			await integrator.runIntegration(wmMock)
			o(electronMock.Menu.buildFromTemplate.callCount).equals(1)
			o(electronMock.Menu.buildFromTemplate.args.length).equals(1)
			o(electronMock.Menu.setApplicationMenu.callCount).equals(1)
		})
	})

	o.spec("Linux", function () {
		o.beforeEach(function () {
			setupLinuxEnv()
		})

		o.afterEach(function () {
			resetLinuxEnv()
		})

		o("enable when off", async function () {
			const { electronMock, fsExtraMock, cpMock } = standardMocks()
			o(fsExtraMock.writeFileSync.callCount).equals(0)("test is not ready")
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.enableAutoLaunch()

			o(fsExtraMock.writeFileSync.callCount).equals(1)
			o(fsExtraMock.writeFileSync.args.length).equals(3)
			o(fsExtraMock.writeFileSync.args[0]).equals("/app/path/file/.config/autostart/appName.desktop")
			o(fsExtraMock.writeFileSync.args[1]).equals(
				"[Desktop Entry]\n\tType=Application\n\tVersion=appVersion\n\tName=appName\n\tComment=appName startup script\n\tExec=/appimage/path/file.appImage -a\n\tStartupNotify=false\n\tTerminal=false",
			)
			o(fsExtraMock.writeFileSync.args[2]).deepEquals({ encoding: "utf-8" })

			o(fsExtraMock.mkdirSync.callCount).equals(1)
			o(fsExtraMock.mkdirSync.args[0]).equals("/app/path/file/.config/autostart")
		})

		o("disable when off", async function () {
			const { electronMock, fsExtraMock, cpMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.disableAutoLaunch()
			o(fsExtraMock.promises.unlink.callCount).equals(0)
		})

		o("enable when on", async function () {
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					promises: {
						access: (path, mode) => Promise.resolve(),
					},
				})
				.set()
			const { electronMock, cpMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.enableAutoLaunch()
			o(fsExtraMock.writeFileSync.callCount).equals(0)
		})

		o("disable when on", async function () {
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					promises: {
						access: () => Promise.resolve(),
					},
				})
				.set()
			const { electronMock, cpMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.disableAutoLaunch()
			o(fsExtraMock.promises.unlink.callCount).equals(1)
			o(fsExtraMock.promises.unlink.args.length).equals(1)
			o(fsExtraMock.promises.unlink.args[0]).equals("/app/path/file/.config/autostart/appName.desktop")
		})

		o("runIntegration without integration, clicked yes, no no_integration, not checked", async function () {
			const { electronMock, fsExtraMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)
			await integrator.runIntegration(wmMock)

			o(electronMock.dialog.showMessageBox.callCount).equals(1)
			o(electronMock.dialog.showMessageBox.args.length).equals(1)
			o(electronMock.dialog.showMessageBox.args[0]).deepEquals({
				title: lang.get("desktopIntegration_label"),
				buttons: [lang.get("no_label"), lang.get("yes_label")],
				defaultId: 1,
				message: lang.get("desktopIntegration_msg"),
				checkboxLabel: lang.get("doNotAskAgain_label"),
				checkboxChecked: false,
				type: "question",
			})
			await Promise.resolve()
			o(fsExtraMock.promises.mkdir.args[0]).equals("/app/path/file/.local/share/applications")
			o(writtenFiles).deepEquals([
				{
					file: "/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/applications/appName.desktop",
					content: desktopEntry,
					opts: { encoding: "utf-8" },
				},
			])
			o(readFiles).deepEquals(["/exec/path/resources/icons/logo-solo-red-small.png", "/exec/path/resources/icons/logo-solo-red.png"])
		})

		o("runIntegration without integration, clicked yes, no no_integration, checked", async function () {
			const electronMock = n
				.mock<typeof import("electron")>("electron", electron)
				.with({
					dialog: {
						showMessageBox: () => Promise.resolve({ response: 1, checkboxChecked: true }),
					},
				})
				.set()
			const { fsExtraMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)
			await integrator.runIntegration(wmMock)
			o(fsExtraMock.promises.mkdir.args[0]).equals("/app/path/file/.local/share/applications")
			o(writtenFiles).deepEquals([
				{
					file: "/app/path/file/.config/tuta_integration/no_integration",
					content: "/appimage/path/file.appImage\n",
					opts: { encoding: "utf-8", flag: "a" },
				},
				{
					file: "/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/applications/appName.desktop",
					content: desktopEntry,
					opts: { encoding: "utf-8" },
				},
			])
			o(readFiles).deepEquals(["/exec/path/resources/icons/logo-solo-red-small.png", "/exec/path/resources/icons/logo-solo-red.png"])
		})

		o("runIntegration without integration, clicked no, not checked", async function () {
			n.setPlatform("linux")
			process.env.APPIMAGE = "/appimage/path/file.appImage"
			const electronMock = n
				.mock<typeof import("electron")>("electron", electron)
				.with({
					dialog: {
						showMessageBox: () => Promise.resolve({ response: 0, checkboxChecked: false }),
					},
				})
				.set()
			const { fsExtraMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)
			await integrator.runIntegration(wmMock)
			o(fsExtraMock.promises.mkdir.callCount).equals(0)
			o(writtenFiles).deepEquals([])
			o(copiedFiles).deepEquals([])
			delete process.env.APPIMAGE
		})

		o("runIntegration without integration, clicked no, checked", async function () {
			const electronMock = n
				.mock<typeof import("electron")>("electron", electron)
				.with({
					dialog: {
						showMessageBox: () => Promise.resolve({ response: 0, checkboxChecked: true }),
					},
				})
				.set()
			const { fsExtraMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)
			await integrator.runIntegration(wmMock)
			o(fsExtraMock.promises.mkdir.args[0]).equals("/app/path/file/.config/tuta_integration")
			o(writtenFiles).deepEquals([
				{
					file: "/app/path/file/.config/tuta_integration/no_integration",
					content: "/appimage/path/file.appImage\n",
					opts: { encoding: "utf-8", flag: "a" },
				},
			])
			o(copiedFiles).deepEquals([])
		})

		o("runIntegration with integration, outdated version", async function () {
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					readFileSync: () => "X-Tutanota-Version=notAppVersion",
					promises: {
						access: () => Promise.resolve(),
					},
				})
				.set()
			const { electronMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.runIntegration(wmMock)

			o(electronMock.dialog.showMessageBox.callCount).equals(0)(
				"should have no calls to dialog, had:" + JSON.stringify(electronMock.dialog.showMessageBox.calls),
			)
			o(writtenFiles).deepEquals([
				{
					file: "/app/path/file/.local/share/icons/hicolor/64x64/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/icons/hicolor/512x512/apps/appName.png",
					content: new Uint8Array(),
					opts: undefined,
				},
				{
					file: "/app/path/file/.local/share/applications/appName.desktop",
					content: desktopEntry,
					opts: { encoding: "utf-8" },
				},
			])
			o(readFiles).deepEquals(["/exec/path/resources/icons/logo-solo-red-small.png", "/exec/path/resources/icons/logo-solo-red.png"])
		})

		o("runIntegration with integration, matching version", async function () {
			n.setPlatform("linux")
			process.env.APPIMAGE = "/appimage/path/file.appImage"
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					readFileSync: () => "X-Tutanota-Version=appVersion",
					promises: {
						access: () => Promise.resolve(),
					},
				})
				.set()
			const { electronMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.runIntegration(wmMock)

			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			o(writtenFiles).deepEquals([])
			o(copiedFiles).deepEquals([])
			delete process.env.APPIMAGE
		})

		o("runIntegration without integration, blacklisted", async function () {
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					readFileSync: () => "/another/blacklisted/file.appImage\n/appimage/path/file.appImage",
					promises: {
						access: (p) => (p === "/app/path/file/.config/tuta_integration/no_integration" ? Promise.resolve() : Promise.reject()),
					},
				})
				.set()
			const { electronMock, cpMock, wmMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.runIntegration(wmMock)

			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			o(writtenFiles).deepEquals([])
			o(copiedFiles).deepEquals([])
		})

		o("unintegration & integration undo each other", async function () {
			n.setPlatform("linux")
			process.env.APPIMAGE = "/appimage/path/file.appImage"
			const fsExtraMock = n
				.mock<typeof import("fs")>("fs", fsExtra)
				.with({
					readFileSync: () => "/another/blacklisted/file.appImage\n/appimage/path/file.appImage",
					promises: {
						access: (p) => (p === "/app/path/file/.config/tuta_integration/no_integration" ? Promise.resolve() : Promise.reject()),
					},
				})
				.set()
			const { electronMock, cpMock } = standardMocks()
			const integrator = new DesktopIntegratorLinux(electronMock, fsExtraMock, cpMock)

			await integrator.integrate()
			await integrator.unintegrate()
			const addedFiles = writtenFiles
				.map((f) => f.file)
				.concat(copiedFiles.map((f) => f.to))
				.sort()
			o(addedFiles).deepEquals(deletedFiles.sort())
			delete process.env.APPIMAGE
		})
	})

	o.spec("Windows", function () {
		let windowsRegistryFacade: WindowsRegistryFacade
		let autorunMock: WindowsRegistryKey

		o.beforeEach(function () {
			n.setPlatform("win32")
			windowsRegistryFacade = object()
			autorunMock = object()
			when(windowsRegistryFacade.entry(RegistryHive.HKEY_CURRENT_USER, "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")).thenReturn(autorunMock)
		})

		o("enable when off", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorWin32(electronMock, windowsRegistryFacade)
			when(autorunMock.get(electronMock.app.name)).thenResolve(null)

			await integrator.enableAutoLaunch()
			verify(autorunMock.get(electronMock.app.name))
			verify(autorunMock.set(electronMock.app.name, `${process.execPath} -a`))
		})

		o("enable when on", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorWin32(electronMock, windowsRegistryFacade)
			when(autorunMock.get(electronMock.app.name)).thenResolve("yes, autorun is on :)")

			await integrator.enableAutoLaunch()
			verify(autorunMock.get(electronMock.app.name))
			verify(autorunMock.set(electronMock.app.name, `${process.execPath} -a`), { times: 0 })
		})

		o("disable", async function () {
			const { electronMock } = standardMocks()
			const integrator = new DesktopIntegratorWin32(electronMock, windowsRegistryFacade)

			await integrator.disableAutoLaunch()
			verify(autorunMock.remove(electronMock.app.name))
		})
	})

	o.spec("Dispatch", function () {
		o("Linux", async function () {
			n.setPlatform("linux")
			const { electronMock, fsExtraMock, cpMock } = standardMocks()
			const windowsRegistryFacade = new LazyLoaded((): Promise<WindowsRegistryFacade> => {
				throw new Error("tried to load WindowsRegistryFacade on Linux")
			})

			const integrator = await getDesktopIntegratorForPlatform(electronMock, fsExtraMock, cpMock, windowsRegistryFacade)
			o(integrator instanceof DesktopIntegratorLinux).equals(true)("Integrator should be a DesktopIntegratorLinux")
		})

		o("Win32", async function () {
			n.setPlatform("win32")
			const { electronMock, fsExtraMock, cpMock } = standardMocks()
			const windowsRegistryFacade = new LazyLoaded((): Promise<WindowsRegistryFacade> => Promise.resolve(object()))

			const integrator = await getDesktopIntegratorForPlatform(electronMock, fsExtraMock, cpMock, windowsRegistryFacade)
			o(integrator instanceof DesktopIntegratorWin32).equals(true)("Integrator should be a DesktopIntegratorWin32")
		})

		o("Darwin", async function () {
			n.setPlatform("darwin")
			const { electronMock, fsExtraMock, cpMock } = standardMocks()
			const windowsRegistryFacade = new LazyLoaded((): Promise<WindowsRegistryFacade> => {
				throw new Error("tried to load WindowsRegistryFacade on macOS/Darwin")
			})

			const integrator = await getDesktopIntegratorForPlatform(electronMock, fsExtraMock, cpMock, windowsRegistryFacade)
			o(integrator instanceof DesktopIntegratorDarwin).equals(true)("Integrator should be a DesktopIntegratorDarwin")
		})
	})
})
