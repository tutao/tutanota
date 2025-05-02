// lib/index.ts
import assert from "node:assert";
import { runInThisContext } from "node:vm";

// lib/loadBindings.ts
import { createRequire } from "node:module";
function loadBindings(moduleUrl, moduleName) {
  const require2 = createRequire(moduleUrl);
  const pathsToTry = [];
  for (const dir of [".", ".."]) {
    for (const subdir of ["", "build/Release", "build/Debug"]) {
      for (const filename of [
        withTuple(moduleName),
        withExtendedTuple(moduleName),
        moduleName
      ]) {
        const pathToTry = modulePath(joinPath(dir, subdir), filename);
        pathsToTry.push(pathToTry);
      }
    }
  }
  for (const pathToTry of pathsToTry) {
    try {
      return require2(pathToTry);
    } catch (e) {
    }
  }
  throw new Error(
    `No native build was found for ${moduleName}, imported from ${moduleUrl}. Checked paths:
${pathsToTry.join("\n")}`
  );
}
function joinPath(...parts) {
  return parts.filter((p) => p != "").join("/");
}
function modulePath(dir, moduleName) {
  return joinPath(dir, `${moduleName}.node`);
}
function withTuple(name) {
  return `${name}.${process.platform}-${process.arch}`;
}
function withExtendedTuple(name) {
  let tag;
  switch (process.platform) {
    case "linux":
      tag = "-gnu";
      break;
    case "win32":
      tag = "-msvc";
      break;
    default:
      tag = "";
      break;
  }
  return `${name}.${process.platform}-${process.arch}${tag}`;
}

// lib/index.ts
var addon = loadBindings(import.meta.url, "node_sqlcipher");
var Statement = class {
  #needsTranslation;
  #cache;
  #createRow;
  #native;
  #onClose;
  /** @internal */
  constructor(db, query, { persistent, pluck, bigint }, onClose) {
    this.#needsTranslation = persistent === true && !pluck;
    this.#native = addon.statementNew(
      db,
      query,
      persistent === true,
      pluck === true,
      bigint === true
    );
    this.#onClose = onClose;
  }
  /**
   * Run the statement's query without returning any rows.
   *
   * @param params - Parameters to be bound to query placeholders before
   *                 executing the statement.
   * @returns An object with `changes` and `lastInsertedRowid` integers.
   */
  run(params) {
    if (this.#native === void 0) {
      throw new Error("Statement closed");
    }
    const result = [0, 0];
    this.#checkParams(params);
    addon.statementRun(this.#native, params, result);
    return { changes: result[0], lastInsertRowid: result[1] };
  }
  /**
   * Run the statement's query and return the first row of the result or
   * `undefined` if no rows matched.
   *
   * @param params - Parameters to be bound to query placeholders before
   *                 executing the statement.
   * @returns A row object or a single column if `pluck: true` is set in the
   *          statement options.
   */
  get(params) {
    if (this.#native === void 0) {
      throw new Error("Statement closed");
    }
    this.#checkParams(params);
    const result = addon.statementStep(this.#native, params, this.#cache, true);
    if (result === void 0) {
      return void 0;
    }
    if (!this.#needsTranslation) {
      return result;
    }
    const createRow = this.#updateCache(result);
    return createRow(result);
  }
  /**
   * Run the statement's query and return the all rows of the result or
   * `undefined` if no rows matched.
   *
   * @param params - Parameters to be bound to query placeholders before
   *                 executing the statement.
   * @returns A list of row objects or single columns if `pluck: true` is set in
   *          the statement options.
   */
  all(params) {
    if (this.#native === void 0) {
      throw new Error("Statement closed");
    }
    const result = [];
    this.#checkParams(params);
    let singleUseParams = params;
    while (true) {
      const single = addon.statementStep(
        this.#native,
        singleUseParams,
        this.#cache,
        false
      );
      singleUseParams = null;
      if (single === void 0) {
        break;
      }
      if (!this.#needsTranslation) {
        result.push(single);
        continue;
      }
      const createRow = this.#updateCache(single);
      result.push(createRow(single));
    }
    return result;
  }
  /**
   * Close the statement and release the used memory.
   */
  close() {
    if (this.#native === void 0) {
      throw new Error("Statement already closed");
    }
    addon.statementClose(this.#native);
    this.#native = void 0;
    this.#onClose?.();
  }
  /** @internal */
  #updateCache(result) {
    if (this.#cache === result) {
      assert(this.#createRow !== void 0);
      return this.#createRow;
    }
    const half = result.length >>> 1;
    const lines = [];
    for (let i = 0; i < half; i += 1) {
      lines.push(`${JSON.stringify(result[i])}: value[${half} + ${i}],`);
    }
    this.#cache = result;
    const createRow = runInThisContext(`(function createRow(value) {
      return {
        ${lines.join("\n")}
      };
    })`);
    this.#createRow = createRow;
    return createRow;
  }
  /** @internal */
  #checkParams(params) {
    if (params === void 0) {
      return;
    }
    if (typeof params !== "object") {
      throw new TypeError("Params must be either object or array");
    }
    if (params === null) {
      throw new TypeError("Params cannot be null");
    }
  }
};
var Database = class {
  #native;
  #transactionDepth = 0;
  #isCacheEnabled;
  #statementCache = /* @__PURE__ */ new Map();
  #transactionStmts;
  /**
   * Constructor
   *
   * @param path - The path to the database file or ':memory:'/'' for opening
   *               the in-memory database.
   */
  constructor(path = ":memory:", { cacheStatements } = {}) {
    if (typeof path !== "string") {
      throw new TypeError("Invalid database path");
    }
    this.#native = addon.databaseOpen(path);
    this.#isCacheEnabled = cacheStatements === true;
  }
  initTokenizer() {
    if (this.#native === void 0) {
      throw new Error("Database closed");
    }
    addon.databaseInitTokenizer(this.#native);
  }
  /**
   * Execute one or multiple SQL statements in a given `sql` string.
   *
   * @param sql - one or multiple SQL statements
   */
  exec(sql) {
    if (this.#native === void 0) {
      throw new Error("Database closed");
    }
    if (typeof sql !== "string") {
      throw new TypeError("Invalid sql argument");
    }
    addon.databaseExec(this.#native, sql);
  }
  prepare(query, options = {}) {
    if (this.#native === void 0) {
      throw new Error("Database closed");
    }
    if (typeof query !== "string") {
      throw new TypeError("Invalid query argument");
    }
    if (!this.#isCacheEnabled || options.persistent === false) {
      return new Statement(this.#native, query, options);
    }
    const cacheKey = `${options.pluck}:${options.bigint}:${query}`;
    const cached = this.#statementCache.get(cacheKey);
    if (cached !== void 0) {
      return cached;
    }
    const stmt = new Statement(
      this.#native,
      query,
      {
        persistent: true,
        pluck: options.pluck,
        bigint: options.bigint
      },
      () => this.#statementCache.delete(cacheKey)
    );
    this.#statementCache.set(cacheKey, stmt);
    return stmt;
  }
  /**
   * Close the database and all associated statements.
   */
  close() {
    if (this.#native === void 0) {
      throw new Error("Database already closed");
    }
    addon.databaseClose(this.#native);
    this.#native = void 0;
  }
  pragma(source, { simple } = {}) {
    if (typeof source !== "string") {
      throw new TypeError("Invalid pragma argument");
    }
    if (simple === true) {
      const stmt2 = this.prepare(`PRAGMA ${source}`, { pluck: true });
      return stmt2.get();
    }
    const stmt = this.prepare(`PRAGMA ${source}`);
    return stmt.all();
  }
  /**
   * Wrap `fn()` in a transaction.
   *
   * @param fn - a function to be executed within a transaction.
   * @returns The value returned by `fn()`.
   */
  transaction(fn) {
    return (...params) => {
      if (this.#transactionStmts === void 0) {
        const options = { persistent: true, pluck: true };
        this.#transactionStmts = {
          begin: this.prepare("BEGIN", options),
          rollback: this.prepare("ROLLBACK", options),
          commit: this.prepare("COMMIT", options),
          savepoint: this.prepare("SAVEPOINT signalappsqlcipher", options),
          rollbackTo: this.prepare("ROLLBACK TO signalappsqlcipher", options),
          release: this.prepare("RELEASE signalappsqlcipher", options)
        };
      }
      this.#transactionDepth += 1;
      let begin;
      let rollback;
      let commit;
      if (this.#transactionDepth === 1) {
        ({ begin, rollback, commit } = this.#transactionStmts);
      } else {
        ({
          savepoint: begin,
          rollbackTo: rollback,
          release: commit
        } = this.#transactionStmts);
      }
      begin.run();
      try {
        const result = fn(...params);
        commit.run();
        return result;
      } catch (error) {
        rollback.run();
        throw error;
      } finally {
        this.#transactionDepth -= 1;
      }
    };
  }
  /**
   * Tokenize a given sentence with a Signal-FTS5-Extension.
   *
   * @param value - a sentence
   * @returns a list of word-like tokens.
   *
   * @see {@link https://github.com/signalapp/Signal-FTS5-Extension}
   */
  signalTokenize(value) {
    if (typeof value !== "string") {
      throw new TypeError("Invalid value");
    }
    return addon.signalTokenize(value);
  }
};
export {
  Database,
  Database as default
};
