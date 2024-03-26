import path from "node:path"
import { app } from "electron"

export function makeDbPath(dbName: string): string {
	// return path.join(app.getPath("userData"), `offline_${userId}.sqlite`)
	return path.join(app.getPath("userData"), `${dbName}.sqlite`)
}
