// @flow

/**
 * @file Vendored version of p-map: https://github.com/sindresorhus/p-map/
 * Vendored to avoid having dependency on AggregateError.
 *
 * Changed: default concurrency level is 1 and not Infinite
 */

export interface Options {
	/**
		Number of concurrently pending promises returned by `mapper`.
		Must be an integer from 1 and up or `Infinity`.
		@default 1
	 */
	+concurrency?: number;
}

/**
	Function which is called for every item in `input`. Expected to return a `Promise` or value.
	@param element - Iterated element.
	@param index - Index of the element in the source array.
 */
export type Mapper<Element, NewElement> = (
	element: Element,
	index: number
) =>  Promise<NewElement> | NewElement;

/**
	@param iterable - Iterated over concurrently in the `mapper` function.
	@param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
    @param options
	@returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `mapper` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `mapper` in `input` order.
	@example
	```
	import pMap from 'p-map';
	import got from 'got';
	const sites = [
		getWebsiteFromUsername('sindresorhus'), //=> Promise
		'https://avajs.dev',
		'https://github.com'
	];
	const mapper = async site => {
		const {requestUrl} = await got.head(site);
		return requestUrl;
	};
	const result = await pMap(sites, mapper, {concurrency: 2});
	console.log(result);
	//=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
	```
 */
export async function pMap<Element, NewElement>(
	iterable: Iterable<Element>,
	mapper: Mapper<Element, NewElement>,
	options: Options = {},
): Promise<Array<NewElement>> {
	const {
		concurrency = 1,
	} = options
	return new Promise((resolve, reject) => {
		if (typeof mapper !== 'function') {
			throw new TypeError('Mapper function is required');
		}

		if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) {
			throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
		}

		const result = [];
		const errors = [];
		// $FlowIssue[incompatible-use]
		const iterator = iterable[Symbol.iterator]();
		let isRejected = false;
		let isIterableDone = false;
		let resolvingCount = 0;
		let currentIndex = 0;

		const next = () => {
			if (isRejected) {
				return;
			}

			const nextItem = iterator.next();
			const index = currentIndex;
			currentIndex++;

			if (nextItem.done) {
				isIterableDone = true;

				if (resolvingCount === 0) {
					resolve(result);
				}

				return;
			}

			resolvingCount++;

			(async () => {
				try {
					const element = await nextItem.value;
					result[index] = await mapper(element, index);
					resolvingCount--;
					next();
				} catch (error) {
					isRejected = true;
					reject(error);
				}
			})();
		};

		for (let index = 0; index < concurrency; index++) {
			next();

			if (isIterableDone) {
				break;
			}
		}
	});
}

