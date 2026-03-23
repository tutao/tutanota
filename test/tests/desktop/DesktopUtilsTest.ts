import o from "@tutao/otest"
import { object, verify } from "testdouble"
import { DesktopUtils } from "../../../src/common/desktop/DesktopUtils"
import { TempFs } from "../../../src/common/desktop/files/TempFs"
import { ElectronExports } from "../../../src/common/desktop/ElectronExportTypes"
import { CommandExecutor } from "../../../src/common/desktop/CommandExecutor"
import { App } from "electron"
import { WindowsRegistryFacade } from "../../../src/common/desktop/integration/WindowsRegistryFacade"
import { LazyLoaded } from "@tutao/tutanota-utils"

o.spec("DesktopUtils", function () {
	let desktopUtils: DesktopUtils
	let process: Writeable<Partial<NodeJS.Process>>
	let tempFs: TempFs
	let electron: ElectronExports
	let executor: CommandExecutor
	let registry: WindowsRegistryFacade
	let app: App
	let env: any

	o.beforeEach(async function () {
		env = {}
		process = { env, argv: [] }
		tempFs = object()
		app = object()
		executor = object()
		electron = Object.assign(object<ElectronExports>(), { app })
		registry = object()

		desktopUtils = new DesktopUtils(process as NodeJS.Process, tempFs, electron, executor, new LazyLoaded(() => Promise.resolve(registry)))
	})

	o.test("exit", () => {
		desktopUtils.exit()
		verify(app.exit(0))
		verify(app.quit())
	})
})
