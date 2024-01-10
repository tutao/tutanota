## tutanota-error

Provides an extendable error class that takes care of setting the correct name and filling in the stacktrace.

If you create error types that use this, do not export them from the main entry point to your package.
Instead, export them from a separate file to enable consumers to just import that one error type instead
of the whole library.