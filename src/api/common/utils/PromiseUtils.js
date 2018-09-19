//@flow

import {downcast} from "./Utils"

// flow erases types to empty (bottom) if we write them inline so we give them a name
type PromiseAllTyped = (<A, B>(a: $Promisable<A>, b: $Promisable<B>) => Promise<[A, B]>)
	& (<A, B, C>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>) => Promise<[A, B, C]>)
	& (<A, B, C, D>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>, d: $Promisable<D>) =>
	Promise<[A, B, C, D]>)

export const all: PromiseAllTyped = downcast((...promises) => Promise.all(promises))