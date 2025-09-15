import o from "@tutao/otest"
import { matchers, object, verify } from "testdouble"
import { DesktopUtils } from "../../../src/common/desktop/DesktopUtils"
import { TempFs } from "../../../src/common/desktop/files/TempFs"
import { ElectronExports } from "../../../src/common/desktop/ElectronExportTypes"
import { CommandExecutor } from "../../../src/common/desktop/CommandExecutor"
import { App } from "electron"

o.spec("DesktopUtilsTest", function () {
	let desktopUtils: DesktopUtils
	let process: Partial<NodeJS.Process>
	let tempFs: TempFs
	let electron: ElectronExports
	let executor: CommandExecutor
	let app: App
	let env: any

	o.beforeEach(async function () {
		env = {}
		process = { env, argv: [] }
		tempFs = object()
		app = object()
		executor = object()
		electron = Object.assign(object<ElectronExports>(), { app })

		desktopUtils = new DesktopUtils(process as NodeJS.Process, tempFs, electron, executor)
	})

	o.spec("relaunch", () => {
		o.test("appimage executes the appimage", () => {
			Object.assign(app, { isPackaged: false })

			desktopUtils.relaunch()
			verify(executor.runDetached(matchers.anything()), { times: 0 })
			verify(app.relaunch())
			verify(app.exit(0))
			verify(app.quit())
		})
		o.test("non-appimage restarts the program", () => {
			Object.assign(app, { isPackaged: true })

			env.APPIMAGE = "some_appimage.appimage"
			process.argv = ["some_appimage.appimage", "some", "args", "here"]

			desktopUtils.relaunch()
			verify(
				executor.runDetached({
					executable: "some_appimage.appimage",
					args: ["some", "args", "here"],
				}),
			)
			verify(app.relaunch(), { times: 0 })
			verify(app.exit(0))
			verify(app.quit())
		})
	})
})
