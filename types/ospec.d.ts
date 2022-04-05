/**
 * @fileoverview Re-done ospec definitions because the ones form DefinitelyTyped are definitely not correctly typed.
 */

type ObjectConstructor<T> = new (...args: any[]) => T

type WithThis<T> = {this: any, args: T}

declare module "ospec" {
	declare namespace o {
		type AssertionDescriber = (description: string) => void;

		interface Spy<Args extends any[], Returns> {
			(...args: Args): Returns;

			/** The number of times the function has been called */
			readonly callCount: number;
			/** The arguments that were passed to the function in the last time it was called */
			readonly args: Args;
			/** List of arguments that were passed to the function each tine it was called */
			readonly calls: WithThis<Args>[];
		}

		interface Assertion<T> {
			/** Asserts that two values are strictly equal */
			equals(expected: T | null | undefined): AssertionDescriber;

			/** Asserts that two values are **not** strictly equal */
			notEquals(value: T | null | undefined): AssertionDescriber;

			/** Asserts that two objects are recursively equal */
			deepEquals(this: Assertion<unknown>, expected: T): AssertionDescriber;

			/** Asserts that two objects are **not** recursively equal */
			notDeepEquals(this: Assertion<unknown>, value: T): AssertionDescriber;

			/** Asserts that the function throws an error of a given type */
			throws(this: Assertion<() => void>, error: string | ErrorConstructor | ObjectConstructor<any>): AssertionDescriber;

			/** Asserts that the function does **not** throw an error of given type */
			notThrows(this: Assertion<() => void>, error: string | ErrorConstructor | ObjectConstructor<any>): AssertionDescriber; // See above

			/** Asserts that a value satisfies a given check */
			satisfies(this: Assertion<T>, check: (value: T) => {pass: boolean, message: string})

			/** Asserts that a value does **not** satisfy a given check */
			notSatisfies(this: Assertion<T>, check: (value: T) => {pass: boolean, message: string})
		}

		type Definer = (done: (error?: Error | null) => void, timeout: (delay: number) => void) => void | PromiseLike<any>;

		interface Result {
			pass: boolean | null;
			context: string;
			message: string;
			error: Error | null;
			testError: Error | null;
		}

		type Reporter = (results: Result[]) => number;

		interface Ospec {
			/** Starts an assertion */<T>(actual: T): Assertion<T>;

			/** Defines a test */
			(name: string, assertions: Definer): void;

			only(name: string, assertions: Definer): void;

			/** Defines a group of tests */
			spec(name: string, tests: () => void): void;

			/** Defines code to be run at the beginning of a test group */
			before(setup: Definer): void;

			/** Defines code to be run before each test in a group */
			beforeEach(teardown: Definer): void;

			/** Defines code to be run at the end of a test group */
			after(setup: Definer): void;

			/** Defines code to be run after each test in a group */
			afterEach(teardown: Definer): void;

			/** Returns a function that records the number of times it gets called, and its arguments */
			spy<A extends any[]>(): Spy<A, undefined>; // tslint:disable-line:no-unnecessary-generics
			spy<A extends any[], R>(fn: (...args: A) => R): Spy<A, R>;

			/** Amount of time (in milliseconds) to wait until bailing out of a test */
			timeout(delay: number): void;

			/** Configure the default amount of time (in milliseconds) to wait until bailing out of a group of tests */
			specTimeout(delay: number): void;

			/** Runs the test suite */
			run(reporter?: Reporter): void;

			/** Default reporter used by `o.run()` */
			report: Reporter;

			'new'(): Ospec;
		}
	}

	declare const o: o.Ospec;
	export = o;
export as namespace o;
}