//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"
export class OutOfSyncError extends TutanotaError {
    constructor(message: string) {
        super("OutOfSyncError", message)
    }
}