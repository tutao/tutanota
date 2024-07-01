export type Config = Record<string, unknown>
export type ConfigMigration = (arg0: Config) => Promise<void>
