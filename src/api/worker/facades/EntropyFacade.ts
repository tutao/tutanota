import { EntropySource, Randomizer } from "@tutao/tutanota-crypto"
import { UserFacade } from "./UserFacade.js"
import { createEntropyData } from "../../entities/tutanota/TypeRefs.js"
import { encryptBytes } from "../crypto/CryptoFacade.js"
import { EntropyService } from "../../entities/tutanota/Services.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { ConnectionError, LockedError, ServiceUnavailableError } from "../../common/error/RestError.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"

export interface EntropyDataChunk {
	source: EntropySource
	entropy: number
	data: number | Array<number>
}

/** A class which accumulates the entropy and stores it on the server. */
export class EntropyFacade {
	private newEntropy: number = -1
	private lastEntropyUpdate: number = Date.now()

	constructor(private readonly userFacade: UserFacade, private readonly serviceExecutor: IServiceExecutor, private readonly random: Randomizer) {}

	/**
	 * Adds entropy to the randomizer. Updated the stored entropy for a user when enough entropy has been collected.
	 */
	addEntropy(entropy: EntropyDataChunk[]): Promise<void> {
		try {
			return this.random.addEntropy(entropy)
		} finally {
			this.newEntropy = this.newEntropy + entropy.reduce((sum, value) => value.entropy + sum, 0)
			const now = new Date().getTime()

			if (this.newEntropy > 5000 && now - this.lastEntropyUpdate > 1000 * 60 * 5) {
				this.lastEntropyUpdate = now
				this.newEntropy = 0
				this.storeEntropy()
			}
		}
	}

	storeEntropy(): Promise<void> {
		// We only store entropy to the server if we are the leader
		if (!this.userFacade.isFullyLoggedIn() || !this.userFacade.isLeader()) return Promise.resolve()
		const userGroupKey = this.userFacade.getUserGroupKey()
		const entropyData = createEntropyData({
			groupEncEntropy: encryptBytes(userGroupKey, this.random.generateRandomData(32)),
		})
		return this.serviceExecutor
			.put(EntropyService, entropyData)
			.catch(ofClass(LockedError, noOp))
			.catch(
				ofClass(ConnectionError, (e) => {
					console.log("could not store entropy", e)
				}),
			)
			.catch(
				ofClass(ServiceUnavailableError, (e) => {
					console.log("could not store entropy", e)
				}),
			)
	}
}
