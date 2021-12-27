declare module "global" {
	interface Class<T> {
		new(...args: any[]): T;
	}
}