// @flow
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

export const KeyLength = Object.freeze({
	b128: "128",
	b256: "256"
})
export type KeyLengthEnum = $Values<typeof KeyLength>;