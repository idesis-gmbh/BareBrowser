# SingleInstanceBrowser

*A minimalist single window/single instance browser, invokable via command line.*

This app grew out of the need of a customer to open URLs from a desktop application. But 
instead of opening every URL in a normal browser and thus opening a new tab/window with 
every call the customer wanted to have just a simple window which does nothing more than 
open a new URL (given via command line) in the same window.

Starting with version 2.0.0 any URL is handled by a chain of URL handlers. Every handler
is a small piece of JavaScript and can easily be developed by users. This makes the browser 
more customizable and to some extent scriptable.

SingleInstanceBrowser was developed in pure 
[TypeScript](http://www.typescriptlang.org)
with minimal dependencies using 
[electron-typescript-template](https://github.com/idesis-gmbh/electron-typescript-template) 
and runs on the [Electron](https://electron.atom.io) platform.

***Important note:*** No special attempts have been made to make this browser secure 
for web browsing. Loaded pages can open new windows by default; all other options are 
set to their default values. See also 
[Electron BrowserWindow](https://electron.atom.io/docs/api/browser-window/)
and
[Electron &lt;webview&gt; Tag](https://electron.atom.io/docs/api/webview-tag/).
SingleInstanceBrowser is by no means a complete replacement for regular browsers, it's meant
to be a tool for specific tasks in defined environments. For normal surfing the web it's
probably a better idea to use a regular browser. Use at your own risk!


## Documentation

The documentation can be found in the [README.md](app/_root/README.md) of the app itself.

---

# Development

A complete documentation for development can be found at 
[electron-typescript-template](https://github.com/idesis-gmbh/electron-typescript-template) 
(the template used to create this app). The following is only a short synopsis of the most 
frequent commands you can use.


## Prerequisites

You only need [Node.js](https://nodejs.org) to be installed on your machine.

If you want to build Windows releases on the Mac you also need to install 
[Wine](https://www.winehq.org) with version 1.6 or later. One easy way to 
install Wine on the Mac is to use [Homebrew](https://brew.sh). Building Mac 
releases on Windows currently isn't possibe.


## Setup

After cloning this repository please run

```bash
npm install
```

or the equivalent 

```bash
npm i
```

You need to run `npm install` only once. It installs the necessary components for the 
*building tool chain*, usually there are no reasons to change this again.

If you want to make changes to the code or any other parts you first have to run

```bash
npm run build
```

This installs all dependencies needed for *development* 
([TypeScript](http://www.typescriptlang.org), 
[Electron](https://electron.atom.io),
[electron-packager](https://github.com/electron-userland/electron-packager)
etc.) and also updates/assembles app resources and copies them to `./out/`. Without 
a successful run of `npm run build` you won't be able to compile, run or make 
distributables of the app.

Compiling the TypeScript source code is done with

```bash
npm run compile
```

So after cloning the repository and a successful single run of 

```bash
npm install && npm run build && npm run compile
```

you should be able to start the generated app with

```bash
npm start
```


## Most important available (`npm`) commands for development

| Command             | Description |
| ------------------- | ----------- |
| `npm install`       | Initial setup, mandatory, run only once. |
| `npm run build`     | Install/update development dependencies; one run after `npm install` is mandatory. During development: update/assemble all build artifacts (generated code, app resources, Node modules used by the app etc.) and copy to `./out/`. Must be run if any non-code resources (like CSS) were changed.|
| `npm compile`       | Compile and pack the source code for both the main and renderer process to `./out/`. Can be run on any source code changes. |
| `npm c:main`        | Compile and pack only the source code for the Electron main process to `./out/`. Must be run if source code of the main process was changed. |
| `npm c:renderer`    | Like `c:main` but only for the Electron renderer process. |
| `npm start`         | Start the current state of the app from `./out/`. Requires at least one successful preceding run of both `npm run build` and `npm run compile`. |
| `npm run make`      | Create a distributable of the app for the current platform and write it to `./release/`. |
| `npm run make:all`  | Create distributables for all supported platforms and write them to `./release/`. |
| `npm run clean`     | Remove all build artifacts (`./out/` and parts of `./build/tmp/`) but excluding release builds in `./release/`. |
| `npm`&nbsp;`run`&nbsp;`clean:all` | Like `npm run clean` but including also all release builds in `./release/`. |
| `npm run watch`     | Start file system watchers for *everything* below `./app/`. Frees you from manually running `build` and `compile` commands. Modifying code or resources will trigger the appropriate build commands and keep a `npm start`-able / `npm run make`-able application up to date in `./out/`. |
| `npm run lint`      | Check the complete source code with [TSLint](https://palantir.github.io/tslint/). |


## License

MIT © [idesis GmbH](http://www.idesis.de), Rellinghauser Straße 334F, D-45136 Essen
