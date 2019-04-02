// @flow
import {Request} from '../api/common/WorkerProtocol.js'
import {lang} from './DesktopLocalizationProvider.js'
import * as localShortcut from 'electron-localshortcut'
import {isMailAddress} from "../misc/FormatValidator"
import {noOp} from "../api/common/utils/Utils"
import type {Socketeer} from "./Socketeer"

/**
 * keep the import in DesktopMain and set up functions that are missing in node
 */
let sock = {
	startClient: noOp
}

function keep(socketeer: Socketeer) {
	sock = socketeer
}

/**
 * add any functions that should be available in preload.js here.
 * preload can only require modules that were previously loaded in the node thread
 */
const PreloadImports = {
	startClient: sock.startClient,
	isMailAddress,
	localShortcut,
	Request,
	lang,
	keep
}

export default PreloadImports
