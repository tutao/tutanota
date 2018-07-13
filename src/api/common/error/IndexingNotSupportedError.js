// @flow
import {TutanotaError} from "./TutanotaError"

export class IndexingNotSupportedError extends TutanotaError {
	constructor() {
		super("IndexingNotSupportedError", "indexing not supported")
	}

}