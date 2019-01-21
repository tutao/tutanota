// @ flow
import path from 'path'
import {app, dialog} from 'electron'
import fs from 'fs'

/**
 * manages build and user config
 */
class DesktopConfigHandler {
	_buildConfig: any;
	_desktopConfig: any; // user preferences as set for this installation
	_desktopConfigPath: string;

	constructor() {
		this._desktopConfigPath = path.join(app.getPath('userData'), 'conf.json')

		try {
			this._buildConfig = require(path.join(__dirname, '../..', 'package.json'))['tutao-config']
		} catch (e) {
			dialog.showMessageBox(null, {
				type: 'error',
				buttons: ['Ok'],
				defaultId: 0,
				// no lang yet
				title: 'Oh No!',
				message: `Couldn't load config: \n ${e.message}`
			})
			process.exit(1)
		}
		try {
			if (fs.existsSync(this._desktopConfigPath)) {
				this._desktopConfig = JSON.parse(fs.readFileSync(this._desktopConfigPath).toString())
			} else { //create default user config file
				this._desktopConfig = this._buildConfig["defaultDesktopConfig"]
				fs.writeFileSync(this._desktopConfigPath, JSON.stringify(this._desktopConfig))
			}
		} catch (e) {
			console.error("Could not create or load desktop config:", e.message)
		}
	}

	get = (key?: string): any => {
		return key
			? this._buildConfig[key]
			: this._buildConfig
	}

	getDesktopConfig = (key?: string): any => {
		return key
			? this._desktopConfig[key]
			: this._desktopConfig
	}

	setDesktopConfig = (key: ?string, value: any): Promise<void> => {
			if(key) {
				this._desktopConfig[key] = value
			} else {
				this._desktopConfig = value
			}
			return Promise.promisify(fs.writeFile)(this._desktopConfigPath, JSON.stringify(this._desktopConfig))
	}
}

export const conf = new DesktopConfigHandler()