import {debounce,} from "@tutao/tutanota-utils"
import type {InstanceSessionKey} from "../../entities/sys/TypeRefs.js"
import {createUpdateSessionKeysPostIn,} from "../../entities/sys/TypeRefs.js"
import {LockedError} from "../../common/error/RestError"
import {assertWorkerOrNode} from "../../common/Env"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {UpdateSessionKeysService} from "../../entities/sys/Services"
import {UserFacade} from "../facades/UserFacade"

assertWorkerOrNode()

export const UPDATE_SESSION_KEYS_SERVICE_DEBOUNCE_MS = 50

/**
 * This queue collects updates for ownerEncSessionKeys and debounces the update request to the UpdateSessionKeysService,
 * in order to update as many instances in one request as possible.
 *
 * In case of LockedErrors it will retry. In case of other errors it will discard the update.
 * (The next time the instance session key is resolved using the bucket key a new update attempt will be made for those instances.)
 */
export class OwnerEncSessionKeysUpdateQueue {

	private updateInstanceSessionKeyQueue: Array<InstanceSessionKey> = []
	private readonly invokeUpdateSessionKeyService: (() => Promise<void>)

	constructor(
		private readonly userFacade: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		// we pass the timeout for testability. see UPDATE_SESSION_KEYS_SERVICE_DEBOUNCE_MS
		debounceTimeoutMs: number) {
		this.invokeUpdateSessionKeyService = debounce(debounceTimeoutMs, () => this.sendUpdateRequest())
	}

	/**
	 * Add the ownerEncSessionKey updates to the queue and debounce the update request.
	 *
	 * @param instanceSessionKeys all instanceSessionKeys from one bucketKey containing the ownerEncSessionKey as symEncSessionKey
	 */
	updateInstanceSessionKeys(instanceSessionKeys: Array<InstanceSessionKey>) {
		if (this.userFacade.isLeader()) {
			this.updateInstanceSessionKeyQueue.push(...instanceSessionKeys)
			this.invokeUpdateSessionKeyService()
		}
	}

	private async sendUpdateRequest() {
		const input = createUpdateSessionKeysPostIn()
		input.ownerEncSessionKeys = this.updateInstanceSessionKeyQueue
		this.updateInstanceSessionKeyQueue = []
		if (input.ownerEncSessionKeys.length > 0) {
			try {
				await this.serviceExecutor.post(UpdateSessionKeysService, input)
			} catch (e) {
				if (e instanceof LockedError) {
					this.updateInstanceSessionKeyQueue.push(...input.ownerEncSessionKeys)
					this.invokeUpdateSessionKeyService()
				} else {
					throw e
				}
			}
		}
	}
}
