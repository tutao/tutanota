/**
 * @file Common declarations across packages. Should be included in each package.
 */

declare type IntervalID = ReturnType<setInterval>
declare type TimeoutID = ReturnType<setTimeout>
declare type AnimationFrameID = ReturnType<requestAnimationFrame>

declare interface Class<T> {
	new (...args: any[]): T
}

declare type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array

declare type Values<T> = T[keyof T]
declare type PropertyType<T, K> = K extends keyof T ? T[K] : never

declare type Id = string
declare type IdTuple = Readonly<[Id, Id]>

declare type Writeable<T> = { -readonly [P in keyof T]: T[P] }

declare type None = null | undefined

/* eslint-disable no-var */
declare type NumberString = string
declare type Dict = { [key: string]: string }
declare type NonEmptyString = `${any}${string}`

/** Requests from main web thread to worker */
declare type WorkerRequestType = "setup" | "reset" | "testEcho" | "testError" | "restRequest" | "facade"

/** Requests from worker web thread to main web thread */
declare type MainRequestType = "facade" | "execNative" | "error"

/** Requests from web to native */
declare type NativeRequestType = "ipc" | "facade"

/** Requests from native to web */
declare type JsRequestType = "ipc"

declare type EnvMode = Mode

/** A map from hostname to parameters for that domain. */
type DomainConfigMap = Record<string, DomainConfig>

declare var env: EnvType

type EventRedraw<T extends Event> = T & { redraw?: boolean }

/**
 * See Env.ts for explanation.
 */
declare var LOAD_ASSERTIONS: boolean

interface NativeApp {
	// In desktop, we can pass whole objects
	// In app, we can only pass strings
	invoke(message: any)

	attach(handler: (JsMessage) => unknown)

	getPathForFile(file: File): string

	startWebMessageChannel() // Available in android
}

// AppType is defined in @tutao/app-env
// Do not import the enum here since this will break globals.d.ts

declare const APP_TYPE: AppType

declare type Base64 = string
declare type Base64Ext = string
declare type Base64Url = string
declare type Hex = string

// add DurationFormat until we can set the target to es2025 (needs typescript 6)
declare namespace Intl {
	/**
	 * The locale matching algorithm to use.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation).
	 */
	type DurationFormatLocaleMatcher = "lookup" | "best fit"

	/**
	 * The style of the formatted duration.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#style).
	 */
	type DurationFormatStyle = "long" | "short" | "narrow" | "digital"

	/**
	 * Whether to always display a unit, or only if it is non-zero.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#display).
	 */
	type DurationFormatDisplayOption = "always" | "auto"

	/**
	 * Value of the `unit` property in duration objects
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format#duration).
	 */
	type DurationFormatUnit = "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds" | "milliseconds" | "microseconds" | "nanoseconds"

	type DurationFormatUnitSingular = "year" | "month" | "week" | "day" | "hour" | "minute" | "second" | "millisecond" | "microsecond" | "nanosecond"

	/**
	 * An object representing the relative time format in parts
	 * that can be used for custom locale-aware formatting.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts).
	 */
	type DurationFormatPart =
		| {
				type: "literal"
				value: string
				unit?: DurationFormatUnitSingular
		  }
		| {
				type: Exclude<NumberFormatPartTypes, "literal">
				value: string
				unit: DurationFormatUnitSingular
		  }

	/**
	 * An object with some or all properties of the `Intl.DurationFormat` constructor `options` parameter.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#parameters)
	 */
	interface DurationFormatOptions {
		localeMatcher?: DurationFormatLocaleMatcher | undefined
		numberingSystem?: string | undefined
		style?: DurationFormatStyle | undefined
		years?: "long" | "short" | "narrow" | undefined
		yearsDisplay?: DurationFormatDisplayOption | undefined
		months?: "long" | "short" | "narrow" | undefined
		monthsDisplay?: DurationFormatDisplayOption | undefined
		weeks?: "long" | "short" | "narrow" | undefined
		weeksDisplay?: DurationFormatDisplayOption | undefined
		days?: "long" | "short" | "narrow" | undefined
		daysDisplay?: DurationFormatDisplayOption | undefined
		hours?: "long" | "short" | "narrow" | "numeric" | "2-digit" | undefined
		hoursDisplay?: DurationFormatDisplayOption | undefined
		minutes?: "long" | "short" | "narrow" | "numeric" | "2-digit" | undefined
		minutesDisplay?: DurationFormatDisplayOption | undefined
		seconds?: "long" | "short" | "narrow" | "numeric" | "2-digit" | undefined
		secondsDisplay?: DurationFormatDisplayOption | undefined
		milliseconds?: "long" | "short" | "narrow" | "numeric" | undefined
		millisecondsDisplay?: DurationFormatDisplayOption | undefined
		microseconds?: "long" | "short" | "narrow" | "numeric" | undefined
		microsecondsDisplay?: DurationFormatDisplayOption | undefined
		nanoseconds?: "long" | "short" | "narrow" | "numeric" | undefined
		nanosecondsDisplay?: DurationFormatDisplayOption | undefined
		fractionalDigits?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined
	}

	/**
	 * The Intl.DurationFormat object enables language-sensitive duration formatting.
	 *
	 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)
	 */
	interface DurationFormat {
		/**
		 * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
		 *
		 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format).
		 */
		format(duration: Partial<Record<DurationFormatUnit, number>>): string
		/**
		 * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
		 *
		 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts).
		 */
		formatToParts(duration: Partial<Record<DurationFormatUnit, number>>): DurationFormatPart[]
		/**
		 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/resolvedOptions).
		 */
		resolvedOptions(): ResolvedDurationFormatOptions
	}

	interface ResolvedDurationFormatOptions {
		locale: UnicodeBCP47LocaleIdentifier
		numberingSystem: string
		style: DurationFormatStyle
		years: "long" | "short" | "narrow"
		yearsDisplay: DurationFormatDisplayOption
		months: "long" | "short" | "narrow"
		monthsDisplay: DurationFormatDisplayOption
		weeks: "long" | "short" | "narrow"
		weeksDisplay: DurationFormatDisplayOption
		days: "long" | "short" | "narrow"
		daysDisplay: DurationFormatDisplayOption
		hours: "long" | "short" | "narrow" | "numeric" | "2-digit"
		hoursDisplay: DurationFormatDisplayOption
		minutes: "long" | "short" | "narrow" | "numeric" | "2-digit"
		minutesDisplay: DurationFormatDisplayOption
		seconds: "long" | "short" | "narrow" | "numeric" | "2-digit"
		secondsDisplay: DurationFormatDisplayOption
		milliseconds: "long" | "short" | "narrow" | "numeric"
		millisecondsDisplay: DurationFormatDisplayOption
		microseconds: "long" | "short" | "narrow" | "numeric"
		microsecondsDisplay: DurationFormatDisplayOption
		nanoseconds: "long" | "short" | "narrow" | "numeric"
		nanosecondsDisplay: DurationFormatDisplayOption
		fractionalDigits?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
	}

	const DurationFormat: {
		prototype: DurationFormat

		/**
		 * @param locales A string with a BCP 47 language tag, or an array of such strings.
		 *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
		 *   page.
		 *
		 * @param options An object for setting up a duration format.
		 *
		 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat).
		 */
		new (locales?: LocalesArgument, options?: DurationFormatOptions): DurationFormat

		/**
		 * Returns an array containing those of the provided locales that are supported in display names without having to fall back to the runtime's default locale.
		 *
		 * @param locales A string with a BCP 47 language tag, or an array of such strings.
		 *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
		 *   page.
		 *
		 * @param options An object with a locale matcher.
		 *
		 * @returns An array of strings representing a subset of the given locale tags that are supported in display names without having to fall back to the runtime's default locale.
		 *
		 * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/supportedLocalesOf).
		 */
		supportedLocalesOf(locales?: LocalesArgument, options?: { localeMatcher?: DurationFormatLocaleMatcher }): UnicodeBCP47LocaleIdentifier[]
	}
}
