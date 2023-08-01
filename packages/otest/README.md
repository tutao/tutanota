# otest

A little testing library. Current functionality:

* A test runner
* Grouping tests & specs into specs
* Assertions
* "spying" on functions
* Printing the results
* Filtering on test/spec name

Started as [ospec](https://github.com/MithrilJS/ospec) re-implementation with filter support, the API is subject to
change. Rough TODO list:

* getting rid of overloaded `o` function, giving things proper greppable names
* improving API for describing assertions
* making it easier to supply custom matchers
* including mocking/spying out of the box

## API

See [otest.ts](lib/otest.ts)

See [Assertion.ts](lib/assertion.ts)