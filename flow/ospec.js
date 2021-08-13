// @flow

type ComparisonDescriptor = (string) => void;
type DoneFn = () => void;
type TimeoutFn = (number) => void;

type OspecSpy<T> = T & {
	/** Last invocation */
	args: $ReadOnlyArray<any>,
	/** All invocations */
	calls: $ReadOnlyArray<{this: any, args: $ReadOnlyArray<any>}>,
	callCount: number,
}

interface Ospec {
	<T>(T): {
		equals: (T) => ComparisonDescriptor,
		deepEquals: (T) => ComparisonDescriptor,
		notEquals: (T) => ComparisonDescriptor,
		notDeepEquals: (T) => ComparisonDescriptor,
		// Throws can be used when function is passed but Flow can't distinguish them currently
		throws: (Class<any>) => void
	};

	(string, (done: DoneFn, timeout: TimeoutFn) => mixed): void;

	spec: (string, () => mixed) => void;
	only: (string, (done: DoneFn, timeout: TimeoutFn) => mixed) => void;
	before: ((DoneFn, TimeoutFn) => mixed) => void;
	after: ((DoneFn, TimeoutFn) => mixed) => void;
	beforeEach: ((DoneFn, TimeoutFn) => mixed) => void;
	afterEach: ((DoneFn, TimeoutFn) => mixed) => void;

	spy(): OspecSpy<() => void>;

	spy<T>(T): OspecSpy<T>;

	timeout: (number) => void;
	specTimeout: (number) => void;
	report: (results: mixed, stats: mixed) => number;
}

declare module 'ospec' {
	declare export default Ospec;
}