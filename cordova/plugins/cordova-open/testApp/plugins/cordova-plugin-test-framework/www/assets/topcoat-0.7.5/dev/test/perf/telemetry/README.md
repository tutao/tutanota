Performance tests based on chromium telemetry (see https://github.com/topcoat/topcoat/wiki/Measuring-performance for details)

# Preparing to run the tests
A few steps are required before you can run the telemetry tests. 

First of all, you need to download chromium source code locally, as described on http://www.chromium.org/developers/how-tos/get-the-code. No need to compile, just download it. 
Then export the location for the 'src' folder in the CHROMIUM_SRC environment variable, like in
```
export CHROMIUM_SRC = /Users/cataling/work/chromium/home/src_tarball/tarball/chromium/src/
```

Then you need to manually patch a little bit two of the benchmark files (the patches are just one liners, it they get bigger we'll just duplicate the benchmarks in topcoat). Locate the files named `loading_benchmark.py` and `smoothness_benchmark.py` in `$CHROMIUM_SRC/tools/perf/perf_tools`. Inside, look for the method `MeasurePage`, and find an appropriate place to paste `results.Add("UserAgent", "", tab.EvaluateJavaScript("navigator.userAgent"));`. This makes the benchmarks include the user agent string as part of their output, and we need this info to submit the results to the server. 

NOTE: we should make a patch for these modifications

Next you can prepare the telemetry tests:
```
grunt telemetry
```
This does few things: 
* it generates html snippets based on grunt template from test/perf/topcoat-*.test.jade of each of Topcoat component. So make sure you build Topcoat first, by ```grunt default```, so that Topcoat components are downloaded into the src folder;
* then it uses that html snippet to generate the actual test file from topcoat/test/perf /telemetry/perf/page_sets/topcoat/topcoat_telemetry.jade;
* last, it copies those test files to the right location in chromium telemetry tests. 

# Running performance tests locally
You can run a telemetry test with:
```
cd $CHROMIUM_SRC/tools/perf
./run_multipage_benchmarks --browser=system loading_benchmark page_sets/topcoat_buttons-base.test.json -o /tmp/loading_benchmark_topcoat_buttons-base.txt
./run_multipage_benchmarks --browser=system smoothness_benchmark page_sets/topcoat_buttons-base.test.json -o /tmp/smoothness_benchmark_topcoat_buttons-base.txt
``` 
We store the benchmark output in a file - the next script will take this output and push it to the server

For steps of running performance tests on Android:
https://github.com/topcoat/topcoat/wiki/Running-TopCoat-Performance-Test-on-Android

# Pushing benchmark results to the server

There is a grunt task that automates the process `$ grunt telemetry-submit --path=test_results.txt --type=sha|snapshot [--device] [--test]`

Device is an optional parameter and sets the device on which the test ran.
For `type snapshot` you have to send in a date param as well. You have to use: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Type is either `sha` or `snapshot`.

 * `sha` is for running the tests on a stable version (in black)
 * `snapshot` is for running custom nightly builds of topcoat (in red)
 * ![x axis perf view](http://i.imgur.com/DrKxFlI.png)

Test is an optional parameter and it overrides the default test name ( which is the name of the file from path ).

There is a `settings.js` file located under `/test/perf/telemetry/lib/` where you can change the address where to submit. It is currently set for http://bench.topcoat.io/v2/benchmark

If you set an `TOPCOAT_BENCHMARK_SERVER` and `TOPCOAT_BENCHMARK_PORT` env variables you can override the default settings.

You can view the results at http://bench.topcoat.io

# Running all tests
There's also a handy script to run all the performance tests and push the results on the server. 
It's located at `https://github.com/topcoat/topcoat/blob/master/test/perf/telemetry/bin/runAll.py`.
Check out the script for details on how to run it.
 
# Adding a new performance test
Before adding new tests, you should make yourself comfortable with the chromium telemetry framework and running telemetry tests in chrome.

Topcoat performance tests are located in `test/perf/telemetry/perf/page_sets` (the folder convention matches the one from chromium telemetry tests). When building telemetry with `grunt telemetry` this folder is copied over `page_sets` in chromium src. There is one .json file that describes each test, its structure is as required by chromium telemetry framework. You will need to add a new json file to describe your test - just start from an existing ones. 

The files for the tests are located under the `topcoat` folder. You can either add html file directly, or use jade. Jade files are converted to html when you run `grunt telemetry`. The html files will be generated under `page_sets` in chromium src. Currently, if you're adding a jade file you need to manually add it to `Gruntfile.js` (just look up where topcoat_buttons.jade is added). If future we'll get rid of this.

Inside the test files (html or jade) you can reference the topcoat assets (css, fonts, images) under "./release/". The whole `./release` folder under topcoat root and all the components are copied there by `grunt telemetry`.

In the json file you can reference the test file to load using `file:///topcoat/` URLs. Use .html here even if you use .jade for tests - you want to reference the generated html file, not the jade template. When running the tests, telemetry will instantiate a local HTTP server and rewrite the URLs, they will not be loaded with the file protocol. 

From telemetry we're currently using loading and smoothness benchmarks. The runAll.sh script currently runs these two benchmarks on all the .json tests under page_sets. 

Note 1: runAll.py uses CEF ([chromium embedding framework](https://code.google.com/p/chromiumembedded/)) to run the tests on desktop (Win and Mac) by default. This is because the target for TopCoat are web applications, not web sites, and CEF is the preferred way to develop web applications on desktop. 
We're currently using a custom CEF build because telemetry does not work in CEF by default. A patch has been submitted to CEF upstream (https://code.google.com/p/chromiumembedded/issues/detail?id=917&sort=-id) to fix this. 

Note 2: part of this will probably change when we switch to the new components/themes architecture.
