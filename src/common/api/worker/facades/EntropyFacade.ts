import { _encryptBytes, aesDecrypt, cryptoUtils, EntropySource, random, Randomizer } from "@tutao/crypto"
import { UserFacade } from "./UserFacade.js"
import { tutanotaServices, tutanotaTypeRefs } from "@tutao/typerefs"
import { lazy, noOp, ofClass } from "@tutao/utils"
import { restError } from "@tutao/rest-client"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { KeyLoaderFacade } from "./KeyLoaderFacade.js"

export interface EntropyDataChunk {
	source: EntropySource
	entropy: number
	data: number | Array<number>
}

/** A class which accumulates the entropy and stores it on the server. */
export class EntropyFacade {
	private newEntropy: number = -1
	private lastEntropyUpdate: number = Date.now()

	constructor(
		private readonly userFacade: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly random: Randomizer,
		private readonly lazyKeyLoaderFacade: lazy<KeyLoaderFacade>,
	) {}

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
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const entropyData = tutanotaTypeRefs.createEntropyData({
			userEncEntropy: _encryptBytes(userGroupKey.object, this.random.generateRandomData(32)),
			userKeyVersion: userGroupKey.version.toString(),
		})
		return this.serviceExecutor
			.put(tutanotaServices.EntropyService, entropyData)
			.catch(ofClass(restError.LockedError, noOp))
			.catch(
				ofClass(restError.ConnectionError, (e) => {
					console.log("could not store entropy", e)
				}),
			)
			.catch(
				ofClass(restError.TooManyRequestsError, (e) => {
					console.log("could not store entropy", e)
				}),
			)
	}

	/**
	 * Loads entropy from the last logout.
	 */
	public async loadEntropy(tutanotaProperties: tutanotaTypeRefs.TutanotaProperties): Promise<void> {
		if (tutanotaProperties.userEncEntropy) {
			try {
				const keyLoaderFacade = this.lazyKeyLoaderFacade()
				const userGroupKey = await keyLoaderFacade.loadSymUserGroupKey(cryptoUtils.parseKeyVersion(tutanotaProperties.userKeyVersion ?? "0"))
				const entropy = aesDecrypt(userGroupKey, tutanotaProperties.userEncEntropy)
				random.addStaticEntropy(entropy)
			} catch (error) {
				console.log("could not decrypt entropy", error)
			}
		}
	}
}
