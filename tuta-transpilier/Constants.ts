import path from "node:path"

// @ts-ignore
const dirname: string = import.meta.dirname
export const TUTANOTA_ROOT: string = path.normalize(path.join(dirname, ".."))
export const TUTANOTA_SRC: string = path.join(TUTANOTA_ROOT, "src")
