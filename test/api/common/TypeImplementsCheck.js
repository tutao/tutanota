// @flow
import {loginFacade} from "../../../src/api/worker/facades/LoginFacade"
import {WorkerClient} from "../../../src/api/main/WorkerClient"
import {EntityEventController} from "../../../src/api/main/EntityEventController"

let uc = (loginFacade:LoginInterface)
let wc = (new WorkerClient(new EntityEventController()):LoginInterface)
wc = (new WorkerClient(new EntityEventController()):EntityRestInterface)