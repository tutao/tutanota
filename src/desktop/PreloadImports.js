// @flow
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from '../api/common/utils/Encoding.js'
import {Request} from '../api/common/WorkerProtocol.js'
import {lang} from './DesktopLocalizationProvider.js'

/**
 * keep the import in DesktopMain and set up functions that are missing in node
 */
function keep() {
	global.btoa = (str) => {
		return new Buffer.from(str).toString('base64')
	}
}

/**
 * add any functions that should be available in preload.js here.
 * preload can only require modules that were previously loaded in the node thread
 */
const PreloadImports = {
	stringToUtf8Uint8Array,
	Request,
	uint8ArrayToBase64,
	lang,
	keep
}

export default PreloadImports