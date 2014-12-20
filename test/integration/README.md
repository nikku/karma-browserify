This folder contains an integration test project that handles various use cases we cannot write simple tests for.

## Expected Result

All test cases should run, only one should fail with the following error message:

```
PhantomJS 1.9.8 (Linux) failing spec should result in nicely formated stack trace FAILED
        Error: intentional
            at /tmp/51c9709e217c50aa330289ba59e2372f6db88164.browserify:21:0 <- lib/fail.js:2:0
            at /tmp/51c9709e217c50aa330289ba59e2372f6db88164.browserify:66:0 <- test/failingSpec.js:8:0
```


## Run

```
karma start
```


## Debug

```
karma start --auto-watch --no-single-run --browsers=Chrome
```


## Recreate prebundled common module

```
npm install browserify && node_modules/.bin/browserify -r ./lib/common.js -o prebundled/common.js
```