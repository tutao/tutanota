// @flow
import {WorkerClient} from "../../../src/api/main/WorkerClient"
import {EntityEventController} from "../../../src/api/main/EntityEventController"
import {locator} from "../../../src/api/worker/WorkerLocator"

let uc = (locator.login:LoginInterface)
let wc = (new WorkerClient(new EntityEventController()):LoginInterface)
wc = (new WorkerClient(new EntityEventController()):EntityRestInterface)