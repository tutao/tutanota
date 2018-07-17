//@flow
import type {WorkerClient} from "./WorkerClient"
import {EntityEventController} from "./EntityEventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/SearchModel"
import {assertMainOrNode} from "../Env"
import {logins} from "./LoginController"

assertMainOrNode()

export type MainLocatorType = {
	entityEvent: EntityEventController;
	entropyCollector: EntropyCollector;
	search:SearchModel;
}

export const locator: MainLocatorType = ({}:any)

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}

export function initLocator(worker: WorkerClient) {
	locator.entityEvent = new EntityEventController(logins)
	locator.entropyCollector = new EntropyCollector(worker)
	locator.search = new SearchModel()
}