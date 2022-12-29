import { aes256RandomKey, keyToBase64 } from "@tutao/tutanota-crypto"
import { urlify } from "../Urlifier.js"
import { Logger } from "../../common/Logger.js"

/**
 *  Loose collection of functions that should be run on the worker side e.g. because they take too much time and don't belong anywhere else.
 *  (read: kitchen sink).
 */
export class WorkerFacade {
	async generateSsePushIdentifer(): Promise<string> {
		return keyToBase64(aes256RandomKey())
	}

	async getLog(): Promise<string[]> {
		const global = self as any
		const logger = global.logger as Logger | undefined

		if (logger) {
			return logger.getEntries()
		} else {
			return []
		}
	}

	async urlify(html: string): Promise<string> {
		return urlify(html)
	}
}
