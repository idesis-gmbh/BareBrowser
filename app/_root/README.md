# SingleInstanceBrowser

***Important note:*** No special attempts have been made to make this browser secure 
for web browsing. Loaded pages can open new windows by default; all other options are 
set to their default values. See also 
[Electron BrowserWindow](https://electron.atom.io/docs/api/browser-window/)
and
[Electron &lt;webview&gt; Tag](https://electron.atom.io/docs/api/webview-tag/).
SingleInstanceBrowser is by no means a complete replacement for regular browsers, it's meant
to be a tool for specific tasks in defined environments. For normal surfing the web it's
probably a better idea to use a regular browser. Use at your own risk!

## Installation

Download one of the releases from the [releases](../../../../releases) page, unzip the file and 
copy the resulting directory to any place you like. On the Mac you'd probably just 
copy the `SIB` app (inside the unzipped folder) to `/Applications`.

## GUI Usage

Just double click `SIB` (Mac) or `SIB.exe` (Windows). SingleInstanceBrowser will open 
and show a blank window with an address bar. The address bar is very primitive, don't 
expect the same features you get from regular browsers. All it does is to try to 
auto-complete some URLs but without any sophistication.

Examples:

```
www.idesis.de          =>  http://www.idesis.de  (ok)
HttP://www.idesis.de   =>  http://www.idesis.de  (ok)
http:/www.idesis.de    =>  http:/www.idesis.de   (wrong)

Users/doe/Desktop/SomePDF.pdf   =>  http://users/doe/Desktop/SomePDF.pdf   (wrong)
/Users/doe/Desktop/SomePDF.pdf  =>  file:///Users/doe/Desktop/SomePDF.pdf  (ok)

c:\somedir\SomePDF.pdf          =>  http://c/somedir/SomePDF.pdf    (wrong)
/c:\somedir\SomePDF.pdf         =>  file:///c:/somedir/SomePDF.pdf  (ok)
```

## Command line usage

SingleInstanceBrowser accepts an arbitrary number of command line parameters but only 
the last one is taken as a URL which should be opened. Currently any other parameters 
are ignored. For the URLs passed the same restrictions/rules as above apply.

**Mac:**

```bash
/Applications/SIB.app/Contents/MacOS/SIB www.idesis.de
/Applications/SIB.app/Contents/MacOS/SIB /Users/doe/Desktop/SomePDF.pdf
```

Starting the executable form inside the app bundle is very unusual but it is one 
way to open multiple instances of an application. But if SingleInstanceBrowser is 
configured to allow only one instance then even starting the executable again won't 
create another instance, instead the URL given via command line will be opened in 
the current running instance.

The recommended way is to use the `open` command:

```bash
open -g -b de.idesis.singleinstancebrowser http://www.idesis.de
open -g -b de.idesis.singleinstancebrowser /Users/doe/Desktop/SomePDF.pdf
```

If you use `open` to navigate to a *web page* you have to enter a complete vaild URL 
(prefixed with `http://` or `https://` but `file://` will also work) otherwise `open` will 
treat the argument as a file name and tell you that it doesn't exist.

The default behaviour of `open` is to prevent multiple instances of an application, but
if you really need it then you can use `open` with `-n`:

```bash
open -n -b de.idesis.singleinstancebrowser http://www.idesis.de
```

However, this does only work, if `SingleInstance` is set to `false` (see below). If it is 
set to `true` the given URL won't be passed to the already running instance.

**Windows:**

The behaviour is the same like on the Mac, but starting SingleInstanceBrowser from 
the command line is straight forward:

```bash
SIB.exe www.idesis.de
SIB.exe /c:\somedir\SomePDF.pdf
```

### Quitting a running instance

You can also quit a running instance via command line (if `SingleInstance` is `true`, see below).

**Mac:**

```bash
/Applications/SIB.app/Contents/MacOS/SIB quit
```

or

```bash
open -g -b de.idesis.singleinstancebrowser http:quit
```

Simply using `quit` here isn't possible because it would be interpreted by the `open` command 
as a file, therefore `http:quit` is used as a pseudo URL to "fool" the `open` command and pass
it through to the running instance. 

**Windows:**

```bash
SIB.exe quit
```

## Configuration

There is only one configuration file:

**Mac:**

```
~/Library/Application Support/de.idesis.singleinstancebrowser/settings.json
```

**Windows:**

```
%APPDATA%\de.idesis.singleinstancebrowser\settings.json
```

At the very first start of SingleInstanceBrowser this file is created from a template
settings file (by copying it) which resides in the following directory:

**Mac:**

```
/Applications/SIB.app/Contents/Resources/app.asar.unpacked/res/settings.json
```

**Windows\*:**

```
c:\Program Files\SIB-x.y.z-win32-x64\resources\app.asar.unpacked\res\settings.json
```

\*Assuming a standard installation in `%ProgramFiles%`.

If you want to prepare a deplyoment on multiple machines in an organization you can
install a copy of SingleInstanceBrowser on your machine, adjust the settings to your 
needs and then deploy this copy to the target machines. On the target machines these
settings will be used then as the initial default settings. 

If you later modify the template settings file it will be copied again to the user data 
directory overwriting an already existing user settings file but only if the template 
settings file is newer than the user settings file. Before overwriting the user settings 
file a backup is created (for example `settings-2018-06-08_11-51-52.json`).

The default configuration (from the application directory above) looks like this:

```json
{
    "Window": {
        "Left": 50,
        "Top": 50,
        "Width": 1024,
        "Height": 768
    },
    "ShortCuts": {
        "Global": true,
        "ToggleAddressBar": [
            "mod+t"
        ],
        "ToggleInternalDevTools": [
            "mod+shift+d"
        ],
        "ToggleDevTools": [
            "mod+d"
        ],
        "FocusLocationBar": [
            "mod+l"
        ],
        "InternalReload": [
            "mod+shift+r",
            "shift+f5"
        ],
        "Reload": [
            "mod+r",
            "f5"
        ],
        "GoBack": [
            "ctrl+alt+left"
        ],
        "GoForward": [
            "ctrl+alt+right"
        ],
        "ExitHTMLFullscreen": [
            "esc"
        ],
        "ToggleWin32Menu": [
            "ctrl+h"
        ]
    },
    "UserAgent": "",
    "Permissions": [
        "fullscreen"
    ],
    "AllowPlugins": false,
    "AllowPopups": false,
    "AllowNewWindows": true,
    "ClearTraces": false,
    "SingleInstance": true,
    "FocusOnNewURL": true,
    "HardwareAcceleration": true,
    "ContentProtection": false,
    "Win32MenuState": 1,
    "Homepage": "",
    "URLHandlers": [
        {
            "Note1": "To activate this sample URL handler rename `Source_` to 'Source'.",
            "Note2": "For production simply delete this handler element.",
            "ClassName": "SampleURLHandler",
            "Source_": "./lib/URLHandler/SampleURLHandler/SampleURLHandler.js",
            "Config": {
                "URLRegExp": "\\bhttps://github.com/idesis-gmbh/SingleInstanceBrowser/blob/master/app/_root/README.md\\b"
            }
        },
        {
            "ClassName": "DefaultURLHandler",
            "Source": "./lib/DefaultURLHandler.js"
        }
    ]
}
```

These are also the default values for every property (except the `SampleURLHandler` section 
which will be omitted) in case of a malformed JSON file or if any of the values is invalid, 
missing or has the wrong type.

- The `Window` object configures the initial window position and size when 
  SingleInstanceBrowser is started. 

- The `ShortCuts` object configures the available keyboard shortcuts. The value of the `Global` 
  key controls how keyboard shortcuts are enabled/disabled. With `false` all shortcuts are 
  disabled if the URL field in the address bar is focused. With `true` shortcuts are enabled 
  even if the URL field is focused.

  Every entry is an array of strings, so you can assign multiple shortcuts to every command, 
  (see `Reload`). The key `mod` (see below) is mapped to the `Command`-key on the Mac and to 
  the `Ctrl`-key on Windows.

  The term *host window* below means the native window (`Electron.BrowserWindow`), which 
  effectively is also a web page but only contains the `webview` tag which itself contains 
  the actual page. You can open the Chrome developer tools to debug the SingleInstanceBrowser 
  window itself with `mod+shift+d`. To debug the actual web page you'd use `mod+d` instead. 

  Please note that there are also other common keyboard shortcuts in the main menu (for 
  example for Cut, Copy, Paste etc.). Currently these menu shortcuts are not configurable.

  | Key                      | ShortCuts (default)     | Action                                                                   |
  | ------------------------ | ----------------------- | ------------------------------------------------------------------------ |
  | `ToggleAddressBar`       | `mod+t`                 | Show/hide the addressbar.                                                |
  | `ToggleInternalDevTools` | `mod+shift+d`           | Show/hide developer tools for the host window.                           |
  | `ToggleDevTools`         | `mod+d`                 | Show/hide developer tools for the current page.                          |
  | `FocusLocationBar`       | `mod+l`                 | Show addressbar and focus the URL entry field.                           |
  | `InternalReload`         | `mod+shift+r, shift+f5` | Reload the host window.                                                  |
  | `Reload`                 | `mod+r, f5`             | Reload the current page.                                                 |
  | `GoBack`                 | `ctrl+alt+left`         | Go one step back in the browser history.                                 |
  | `GoForward`              | `ctrl+alt+right`        | Go one step forward in the browser history.                              |
  | `ExitHTMLFullscreen`     | `esc`                   | Leave HTML fullscreen (for example from YouTube videos).                 |
  | `ToggleWin32Menu`        | `ctrl+h`                | Show/hide the main menu on Windows platforms (not available on the Mac). |

  If you want to disable a keyboard shortcut set its value to `null` or an empty string (`""`). 
  You can assign your own keyboard shortcuts to any of the keys above. For available key 
  combinations please see the documentation of [Mousetrap](https://craig.is/killing/mice).

- `UserAgent` will be used to set `navigator.userAgent` in the browser window. If this 
  value is missing or an empty string (`""`), the default `navigator.userAgent` from the 
  builtin Chromium engine will be used. You can set this value to any string you like. If 
  you want to prevent a user agent to be sent then set this value to a single space (`" "`).

- `Permissions` is an array of strings which controls the behaviour if a web page asks 
  for a specific permission. The default is to allow fullscreen requests. If you also want
  to allow notifications from web pages the value would be `["fullscreen", "notifications"]`.
  The follwoing values can be assigned: `media`, `geolocation`, `notifications`, `midiSysex`,
  `pointerLock`, `fullscreen` and `openExternal`.

- With `AllowPlugins` set to `true` the current page can load plugins. ***Note:*** `false` 
  will also disable the builtin PDF viewer plugin.

- With `AllowPopups` set to `true` the current window can open other popup windows.

- With `AllowNewWindows` set to `true` the current window can open new windows when
  links in the current page want to be opened in new windows. Setting this to `false` 
  can significantly degrade the browsing experience.\
  ***Note:*** To open a link in a new window you can click on a link while holding
  down the `Shift` or `Cmd` key on the Mac or the `Shift` or `Ctrl` key on Windows.

- If `ClearTraces` is set to `true` then any temporary data like caches, local storage, 
  cookies etc. will be deleted when SingleInstanceBrowser is closed. Deleting means
  the complete removal of the contents of the following directory:

  **Mac:**

  ```
  ~/Library/Application Support/de.idesis.singleinstancebrowser
  ```

  **Windows:**

  ```
  %APPDATA%\de.idesis.singleinstancebrowser
  ```

  The only exception is the file `settings.json` and it's backups which are left to 
  keep user settings.

  ***Please note***: on Windows the removal of most files/directories currently fails silently 
  due to a bug in the Electron framework. On the Mac some files can also remain, but 
  they don't contain any private data.

- If `SingleInstance` is set to `true` then only one instance of SingleInstanceBrowser
  is allowed (lets call it *A*). If you try to start another instance (*B*), the already 
  running instance *A* will be given the command line parameters from *B* and *B* will
  quit immediately.

- If `FocusOnNewURL` is set to `true` and `SingleInstance` is also `true` then starting
  another instance will cause the already running instance to activate its window and
  make it the forground window (regardless of a given command line URL). Setting this
  value to `false` opens the given URL (if any) in the current instances window (*A*) 
  but it won't be focused.

- On some systems you may encounter graphics artifacts in web pages, in such cases you 
  can try to set `HardwareAcceleration` to `false`.

- Setting `ContentProtection` to `true` prevents screenshots from the browser window. 
  On the Mac a screenshot from the window itself will cause an error message. Even taking 
  a screenshot of the complete desktop won't show anything from SingleInstanceBrowser. 
  On Windows the result contains the window title and borders of SingleInstanceBrowser 
  but the content area will be black.

- `Win32MenuState` sets the behaviour of the main menu on Windows platforms. This
  setting is ignored on the Mac. `0` means that the main menu isn't available at all.
  Setting the value to `1` enables the main menu but doesn't show it on startup (see
  respective shortcut). `2` enables the main menu and shows it on startup. Any other
  value will cause the default setting (`1`) to be used.

- The string in `Homepage` contains the URL to be opened by default if no URL was given
  via command line. `Homepage` is ignored at all if it is an empty string `("")`.

- For `URLHandlers` see following chapter.


## URL handlers

Almost any URL which is opened by SingleInstanceBrowser is passed to a chain of so 
called URL handlers. Multiple URL handlers can be configured in `settings.json` (see
above), the execution order of URL handlers matches the order in which URL handlers
are configured in `settings.json`. Any URL handler can do almost anything with a given
URL or even SingleInstanceBrowser itself since a handler gets access to the current 
[Electron BrowserWindow](https://electron.atom.io/docs/api/browser-window/) and the 
[Electron &lt;webview&gt; tag](https://electron.atom.io/docs/api/webview-tag/) which 
is used to render pages. URL handlers are executed in the context of the current running 
Electron instance, so there are no restrictions on Electron API usage. Furthermore, any 
handler can interrupt the execution chain by returning an appropriate return code.

Common tasks for URL handlers are for example:

- Logging of URLs.
- Restricting access to a set of predefined URLs.
- Open a URL or, if it is are already opened, execute some JavaScript in the page instead.
- Run tests on a page.
- Modify the user agent for a URL.
- Redirect a URL to another URL.

You register a URL handler in the section `URLHandlers` in `settings.json`:

```json
...
"URLHandlers": [
      {
          "ClassName": "MyURLHandler",
          "Source": "./lib/MyURLHandler/MyURLHandler.js",
          "Config": { "Foo": "Bar" }
      },
...
```

- `ClassName` is a mandatory property which must be used for the class name in the JavaScript 
  implementation of a handler. 
- `Source` is also mandatory and contains the name of the JavaScript  source 
  file. A good place for URL handler source files is the `./lib/URLHandler` directory, 
  preferably URL handlers are put in their own directory below `./lib/URLHandler`.\
  ***Note***: to deactivate a handler temporarily it's sufficient to rename the key `Source`. 
- The `Config` object is optional, but if it is available it will pe passed as a JSON object 
  to the constructor of a URL handler (amongst other values, see below).

URL handlers are written in JavaScript and must follow a simple API contract. The (deactivated) 
`SampleURLHandler` in `./lib/URLHandler/SampleURLHandler/` and the builtin `DefaultURLHandler`
in `./lib/DefaultURLHandler.js` can be used as templates for writing your own handlers. Both 
source files also contain detailed comments and API descriptions. See also TypeScript source 
file `./src/renderer/URLHandler.ts`.

***Note:*** SingleInstanceBrowser itself is unable to open URLs, in the standard distribution
opening URLs is done by the `DefaultURLHandler` which is active by default and opens just any 
URL. If you deactivate this handler you have to replace it with your own handler otherwise
SingleInstanceBrowser won't open anything.

The following example is a minimal URL handler which opens just any URL and signals back that 
SingleInstanceBrowser should proceed with the next handler.

```JavaScript
require("../URLHandler.js");

const className = "MyURLHandler";

class MyURLHandler {

    constructor(config, settings, webView, browserWindow, handleURLCallback) {
        this.ClassName = className;
        this.Config = config;
        this.Settings = settings;
        this.WebView = webView;
        this.BrowserWindow = browserWindow;
        this.HandleURLCallback = handleURLCallback;
        this.Active = false;
        this.WebView.addEventListener("dom-ready", this.onDOMReady.bind(this), false);
        console.log(className + ": instance created with config: " + JSON.stringify(this.Config, 2));
    }

    handleURL(url) {
        this.URL = url;
        this.Active = true;
        console.log(className + ": attempt to open URL: " + this.URL);
        try {
            this.WebView.setAttribute("useragent", this.Settings.UserAgent);
            this.WebView.setAttribute("src", this.URL);
        } catch (error) {
            this.Active = false;
            console.error(className + ": error handling URL: " + this.URL + "\n", error);
            this.HandleURLCallback(HANDLE_URL_ERROR);
        }
    }

    onDOMReady(event) {
        if (!this.Active) {
            return;
        }
        this.Active = false;
        try {
            console.log(className + ": successfully handled URL: " + this.URL);
            this.HandleURLCallback(HANDLE_URL_CONTINUE);
        } catch (error) {
            console.error(className + ": onDOMReady: error handling URL: " + this.URL + "\n", error);
            this.HandleURLCallback(HANDLE_URL_ERROR);
        }
    }

}

global[className] = MyURLHandler;
```

### Implementation details

#### Boilerplate code

```JavaScript
require("../URLHandler.js");

const className = "MyURLHandler";

class MyURLHandler {
...
}

if (!global[className]) {
    global[className] = MyURLHandler;
}
```

- `require("../URLHandler.js");` is not strictly mandatory but it contains the predefined constants
  which must be returned by any handler after having done it's work. In the example it's assumed 
  that this handler source file is put in its own directory below `./lib/URLHandler/`, that's why 
  `require` points to `../URLHandler.js`. If you use a different place for your handler you must 
  adapt the path to `URLHandler.js`.
- `const className = "MyURLHandler";` The name of the class must match the `ClassName` property
  of the handler configuration in `settings.json`.
- `class MyURLHandler` Again, the class name must match the value given by `const className ...`
- `global[className] = MyURLHandler;` This will register the class as a globally available object
  and enables SingleInstanceBrowser to dynamically create an instance of it. Make sure that you
  don't use class names which already exist in the `global` object or elsewhere.


#### Constructor

It's important to know that every browser window of SingleInstanceBrowser will create an instance
of every configured URL handler, so be prepared that your own URL handler may be created and used 
multiple times.

```JavaScript
constructor(config, settings, webView, browserWindow, handleURLCallback) {
...
}
```

The constructor is mandatory, it has 5 arguments:

- `config` is the `Config` object from the handler configuration in `settings.json` or `null` if it
  isn't available there.
- `settings` is the content of `settings.json` as a JSON object.
- `webView` is the [Electron &lt;webview&gt; tag](https://electron.atom.io/docs/api/webview-tag/) 
  which the browser window uses to render URLs.
- `browserWindow` is the current calling 
  [Electron BrowserWindow](https://electron.atom.io/docs/api/browser-window/) which hosts the 
  webview tag and initializes the URL handler.
- `handleURLCallback` is an asynchronous callback function which has 2 parameters:
    - `handleURLResult` can be one of the (numeric) constants defined in `./lib/URLHandlers.js`:
      ```JavaScript
      // An error occured. SingleInstanceBrowser won't continue with the next handler.
      const HANDLE_URL_ERROR = 0;
      // Not handling this URL, SingleInstanceBrowser should continue with next handler.
      const HANDLE_URL_NONE = 1;
      // URL was handled but SingleInstanceBrowser should continue with the next handler.
      const HANDLE_URL_CONTINUE = 2;
      // URL was handled and SingleInstanceBrowser shouldn't continue with the next handler.
      const HANDLE_URL_STOP = 3;
      ```
    - `redirectURL` is an optional string which tells SingleInstanceBrowser to use a different URL
      for calling the next URL handler (if the next handler should be called).

    It's mandatory to call `handleURLCallback` if the handler has done all of it's work, otherwise 
    the handler chain is interrupted which can lead to (probably harmless) unpredictable results! 
    SingleInstanceBrowser will wait for every handler to issue the callback before continuing with 
    the next handler (or stopping the handler chain). 


#### Handling URLs

```JavaScript
handleURL(url) {
...
}
```

Will be called by SingleInstanceBrowser with any URL (parameter `url`) the user navigates to, be
it by using the commandline line, the address bar or by clicking on a link in a page. The correct 
way for handler to navigate to a URL is by setting the `src` attribute of the `webview` tag:

```JavaScript
this.WebView.setAttribute("src", this.URL);
```

Since many actions on the `webview` tag lead to asynchronous code execution it is recommended to 
use event listeners to issue the final `handleURLCallback` callback, like it is done with 
`onDOMReady` in the example above. If, for example, `handleURLCallback` would be called immediately
after setting the `src` attribute of the `webview` tag this will almost always lead to problems 
because the next handler would be called much to fast. It's also recommended to skip code execution 
in event listeners if the handler currently isn't active (see `this.Active` in the example code 
above in `handleURL` and `onDOMReady`).


### Limitations

SingleInstanceBrowser does it's best to intercept and handle URLs but it's not perfect. Some pages 
on Github, for example, use POST requests to "open" other pages and modify the URL. This is currently
not handled. Other pages force a redirect from `http` to `https`, this is also not covered. Both 
examples will open fine but in the first case URL handlers won't be called at all and in the second 
case the first URL handler will be called with the `http` URL but not again with the redirecetd 
`https` URL.


## License

MIT © [idesis GmbH](http://www.idesis.de), Rellinghauser Straße 334F, D-45136 Essen
