// @ flow
import path from 'path'
import {defer} from '../api/common/utils/Utils.js'
import type {DeferredObject} from "../api/common/utils/Utils"

class DesktopConfigHandler {
	_loaded: DeferredObject = defer();
	_config: any;

	constructor() {
		try {
			this._config = require(path.join(__dirname, '../..', 'package.json'))['tutao-config']
			this._loaded.resolve()
		} catch (e) {
			this._loaded.reject(e)
		}
	}

	get = (key: string): Promise<any> => {
		return this._loaded.promise.then(() => this._config[key])
	}
}

export const conf = new DesktopConfigHandler()