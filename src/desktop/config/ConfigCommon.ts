//@flow
export type Config = {[string]: mixed}
export type ConfigMigration = (Config) => Promise<void>