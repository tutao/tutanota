import { app, BrowserWindow, utilityProcess } from "electron"
import path from "node:path"
import { registerWorker } from "./registerWorker.js"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
	})

	win.loadFile(path.join(__dirname, "index.html"))
}

app.whenReady().then(() => {
	registerWorker()
	createWindow()
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
