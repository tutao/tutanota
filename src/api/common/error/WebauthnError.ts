//@bundleInto:common-min

import {TutanotaError} from "./TutanotaError.js";

export class WebauthnError extends TutanotaError {
    constructor(error: Error) {
        super("WebauthnError", `${error.name} ${String(error)}`)
    }
}