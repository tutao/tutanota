export function concat(...arrays: Uint8Array): Uint8Array {
	let length = arrays.reduce((previous, current) => previous + current.length, 0)
	let result = new Uint8Array(length)
	let index = 0
	arrays.forEach(array => {
		result.set(array, index)
		index += array.length
	})
	return result
}

/**
 * Compares two arrays for equality.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 */
export function arrayEquals(a1: Uint8Array|Array<string>, a2: Uint8Array|Array<string>) {
	if (a1.length === a2.length) {
		for (var i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
		return true;
	}
	return false;
}

/**
 * Remove the element from theArray if it is contained in the array.
 * @param theArray The array to remove the element from.
 * @param elementToRemove The element to remove from the array.
 * @return True if the element was removed, false otherwise.
 */
export function remove(theArray: Array<any>, elementToRemove: any): boolean {
	let i = theArray.indexOf(elementToRemove)
	if (i !== -1) {
		theArray.splice(i, 1)
		return true;
	} else {
		return false;
	}
}

export function findAndRemove(theArray: Array<any>, finder: finder): boolean {
	let e = theArray.find(finder)
	if (e) {
		return remove(theArray, e)
	} else {
		return false
	}
}

export function replace(theArray: Array<any>, oldElement: any, newElement: any): boolean {
	let i = theArray.indexOf(oldElement)
	if (i !== -1) {
		theArray.splice(i, 1, newElement)
		return true;
	} else {
		return false;
	}
}

export function mapAndFilterNull<T, R>(theArray: Array<T>, mapper: mapper<T, R>): R[] {
	let resultList = []
	theArray.forEach(item => {
		let resultItem = mapper(item)
		if (resultItem) {
			resultList.push(resultItem)
		}
	})
	return resultList
}

/**
 * Provides the last element of the given array.
 * @param theArray The array.
 * @return The last element of the array.
 */
export function last(theArray: Array<any>): ?any {
	if (theArray.length === 0) {
		return null;
	} else {
		return theArray[theArray.length - 1];
	}
}

export function contains(theArray: Array<any>, elementToCheck: any): boolean {
	return theArray.indexOf(elementToCheck) !== -1
}

export function addAll(array: Array<any>, elements: Array<any>) {
	array.push.apply(array, elements)
}

export function removeAll(array: Array<any>, elements: Array<any>) {
	elements.forEach(element => {
		remove(array, element)
	})
}