export const enum SessionType {
	/* 'Regular' login session. */
	Login,
	/* Temporary session that will only be established for a short time, e.g. when recovering a lost account. */
	Temporary,

	/* Login session for which credentials should be stored on the device. */
	Persistent,
}
