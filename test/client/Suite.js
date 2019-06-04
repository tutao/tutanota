import "./calendar/CalendarModelTest"
import "./calendar/CalendarUtilsTest"

import o from "ospec/ospec.js"

node(() => {
	require("./desktop/DesktopUtilsTest.js")
	require("./desktop/DesktopConfigHandlerTest")
	require("./desktop/ElectronUpdaterTest")
	require("./desktop/DesktopNotifierTest")
	require("./desktop/DesktopWindowManagerTest.js")
	require("./desktop/DesktopTrayTest.js")
	require("./desktop/ApplicationWindowTest.js")
})()

o.run()


