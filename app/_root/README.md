
# BareBrowser

***Important note:***\
Apart from the usual recommendations for Electron based 'web browsers' no special or further
attempts have been made to make this browser secure for ordinary web browsing (see also
[Electron BrowserWindow](https://electronjs.org/docs/api/browser-window) and
[Electron &lt;webview&gt; Tag](https://electronjs.org/docs/api/webview-tag)). BareBrowser is by no
means a complete replacement for regular browsers, for normal web surfing it's probably a better
idea to use a regular browser. Use at your own risk!

## Use cases

BareBrowser is meant to be a tool for specific tasks in controlled environments:

- Use as a browser in organizations where a single defined rendering engine is needed.
- A simple frontend for inhouse web applications.
- View/use pages independently from any installed system browser and maintain a stable
  installation/configuration.
- Deliver together with your own software, BareBrowser doesn't need an
  [installation](#installation), it can deployed by just copying it to any directory.
- Privacy concerns, BareBrowser can be [configured](#configuration) to delete *any* data created
  during browser sessions after closing.
- User-provided [request handlers](#request-handlers) (via a simple JavaScript interface) allow fine
  grained control over what BareBrowser can load. You could, for example, create a request handler
  which logs any request or even implement a simple ad blocker. Or you decide to execute some
  JavaScript in an already loaded page instead of reloading the page.
- [Command-line support](#command-line-usage): open URLs/files, open/close (new) windows, page
  navigation, quit BareBrowser.
- Configurable single instance mode. If configured, only one instance of BareBrowser can be started.
- Highly configurable, disable/enable/modify any shortcut, disable/enable the address bar, prevent
  screenshots from pages etc.
- Open source, easily [build your own](#building) distribution with another name and/or logo.
- ...

**Note:**

The Linux related parts of the following documentation are at least valid for Ubuntu 20.04, on other
distributions the behavior of BareBrowser may differ slightly (e.g. keyboard shortcuts, default
directories etc.).

## Compatibility

BareBrowser runs on macOS, Windows and Linux platforms. The supported OS versions depend on the
version of the underlying Electron platform but in general the current release of BareBrowser should
run on

- macOS High Sierra (10.13) and newer,
- Windows 10 and newer,
- Linux
    - Ubuntu 14.04 and newer
    - Fedora 24 and newer
    - Debian 8 and newer.

In order to support older OS versions you could change the underlying Electron platform to older
(and unsupported) versions, see [Building](#building).

## Installation

Download one of the releases from the
[releases](https://github.com/idesis-gmbh/BareBrowser/releases) page, unzip the file and copy the
resulting directory to any place you like (preferably on a local hard drive, running BareBrowser
from a network mount needs additional `ElectronFlags` [configuration settings](#configuration)). On
the Mac you'd probably just copy the `BareBrowser` app (inside the unzipped folder) to
`/Applications`.

## GUI Usage

Just double click `BareBrowser` (Mac), execute `./bb` (Linux) or `bb.exe` (Windows). BareBrowser
will start and show its internal home page. To show/hide the address bar press `Cmd+T`
(Mac)/`Ctrl+T` (Linux/Windows). With `Cmd+L`/`Ctrl+L` the address bar will be shown and its entry
field is focused. The address bar is very primitive, don't expect the same features you get from
regular browsers. All it does is to try to auto-complete some URLs but without any sophistication.

Examples:

```text
www.idesis.de          =>  https://www.idesis.de  (ok)
HttPs://www.idesis.de  =>  https://www.idesis.de  (ok)
http:/www.idesis.de    =>  http:/www.idesis.de    (wrong)

Users/doe/Desktop/SomePDF.pdf   =>  https://users/doe/Desktop/SomePDF.pdf     (wrong)
/Users/doe/Desktop/SomePDF.pdf  =>  file:///Users/doe/Desktop/SomePDF.pdf     (ok*)
./../somedir/SomePDF.pdf        =>  file:///somepath/doe/somedir/SomePDF.pdf  (ok*)

c:\somedir\SomePDF.pdf    =>  https://c/somedir/SomePDF.pdf             (wrong)
/c:\somedir\SomePDF.pdf   =>  file:///c:/somedir/SomePDF.pdf            (ok*)
.\..\somedir\SomePDF.pdf  =>  file:///somepath/doe/somedir/SomePDF.pdf  (ok*)
```

\* *Absolute* file paths must start with a slash (`/`), *relative* file paths must start with a dot
(`.`).

## Command-line usage

BareBrowser accepts an arbitrary number of command-line parameters but only the last two arguments
are used; both are optional. All other parameters are ignored.

- The first parameter is usually the URL or filename to be opened. For URLs the same
  restrictions/rules as above apply.
- The second parameter is the numeric id of the window to which the URL/filename shall be passed.
  The window id is shown in square brackets in the title bar of every BareBrowser window. If a non
  existing window id is given, the command will be ignored.
- If a window id is given and found, BareBrowser will first make the corresponding window the top
  most window of all BareBrowser windows. If the window also will be focused depends on the setting
  `FocusOnNewURL`. This is regardless of whether a URL was given or not, so instead of giving a URL
  you can also use a window id only to activate a BareBrowser window.
- If both URL and window id are omitted, BareBrowser just starts with a new window. If
  `SingleInstance` is set to `true` (see [Configuration](#configuration)) BareBrowser doesn't start,
  instead the already running instance will become active. If this instance will be focused also
  depends on the setting `FocusOnNewURL`. In other words, if `SingleInstance` is `true`,
  `FocusOnNewURL` is `false` and no URL and no window id are given, nothing happens.
- If BareBrowser is configured to prevent opening new windows, the window id parameter will be
  ignored (no window id is shown in the title bar; all commands will apply to the current active
  window).

### Mac

```text
bb [URL/Filename] [Window ID]
```

Examples:

```text
<install-dir>/BareBrowser.app/Contents/MacOS/bb www.idesis.de                   // Open in current window
<install-dir>/BareBrowser.app/Contents/MacOS/bb /Users/doe/Desktop/SomePDF.pdf              "
<install-dir>/BareBrowser.app/Contents/MacOS/bb ./../somedir/SomePDF.pdf                    "
<install-dir>/BareBrowser.app/Contents/MacOS/bb bb://reload                     // Reload current window
<install-dir>/BareBrowser.app/Contents/MacOS/bb github.com 3                    // Open github.com in window 3
<install-dir>/BareBrowser.app/Contents/MacOS/bb back: 4                         // Go back in window 4
<install-dir>/BareBrowser.app/Contents/MacOS/bb bb://forward 1                  // Go forward in window 1
<install-dir>/BareBrowser.app/Contents/MacOS/bb 2                               // Activate window 2
<install-dir>/BareBrowser.app/Contents/MacOS/bb new:github.com                  // Open github.com in new window
<install-dir>/BareBrowser.app/Contents/MacOS/bb bb://close 5                    // Close window 5
```

However, starting the executable form inside the app bundle is rather unusual but it is one way to
open multiple instances of an application. But if BareBrowser is configured to allow only one
instance then even starting the executable again won't create another instance, instead the URL
and/or the window id given via command-line will be opened/handled in the current running instance.

The usual way is to use the `open` command:

```text
open -g -b de.idesis.barebrowser https://www.idesis.de
open -g -b de.idesis.barebrowser /Users/doe/Desktop/SomePDF.pdf
open -g -b de.idesis.barebrowser ./../somedir/SomePDF.pdf
```

**Notes:**

- If you use `open` to load a *web page* you have to enter a complete vaild URL, prefixed with
  `https://` or `http://`, otherwise `open` will treat the argument as a filename and tell you that
  it doesn't exist, e.g. `open -g ... github.com` doesn't work.
- Prefixing *filenames* with `file://` does work but isn't necessary. If you use `file://` the
  filename can't be relative.
- A window id can't be used as a second or as the only parameter with `open`. In both cases the OS
  considers the id as a filename which most probably doesn't exist.
- The argument `-g` isn't mandatory, it tells the `open` command to not bring an app to the
  foreground. This can also be controlled with BareBrowsers own [settings](#configuration), so you
  can decide for yourself which behavior best fits your needs.

The default behavior of `open` is to prevent multiple instances of an application, so calling
`open` if BareBrowser is already running will open the given URL/filename in the already running
instance. But if you really need multiple instances, you can use `open` with `-n`:

```text
open -n -b de.idesis.barebrowser --args [URL/Filename] [Window ID]
```

This is equivalent to calling the executable directly as described at the beginning, including the
handling of the `SingleInstance` setting, so `open -n` can be used to pass in a URL *and* a window
id.


### Linux

```text
./bb [URL/Filename] [Window ID]
```

Examples:

```text
<install-dir>/bb www.idesis.de                   // Open in current window
<install-dir>/bb /Users/doe/Desktop/SomePDF.pdf              "
<install-dir>/bb ./../somedir/SomePDF.pdf                    "
<install-dir>/bb bb://reload                     // Reload current window
<install-dir>/bb github.com 3                    // Open github.com in window 3
<install-dir>/bb back: 4                         // Go back in window 4
<install-dir>/bb bb://forward 1                  // Go forward in window 1
<install-dir>/bb 2                               // Activate window 2
<install-dir>/bb new:github.com                  // Open github.com in new window
<install-dir>/bb bb://close 5                    // Close window 5
```

### Windows

The behavior is the same like on the Mac or on Linux, but starting BareBrowser from the command-line
is straight forward:

```text
bb.exe [URL/Filename] [Window ID]
```

Examples:

```text
<install-dir>\bb.exe www.idesis.de                   // Open in current window
<install-dir>\bb.exe /c:\somedir\SomePDF.pdf                     "
<install-dir>\bb.exe .\..\somedir\SomePDF.pdf                    "
<install-dir>\bb.exe 'bb://reload'                   // Reload current window, see notes
<install-dir>\bb.exe github.com 3                    // Open github.com in window 3
<install-dir>\bb.exe 'back:' 4                       // Go back in window 4, see notes
<install-dir>\bb.exe 'bb://forward' 1                // Go forward in window 1, see notes
<install-dir>\bb.exe 2                               // Activate window 2
<install-dir>\bb.exe 'new:github.com'                // Open github.com in new window, see notes
<install-dir>\bb.exe 'bb://close' 5                  // Close window 5, see notes
```

**Important notes:**

Electron *on Windows* has multiple problems/bugs when it passes command-lines to an already running
instance in single instance mode. It's recommended to follow these rules when passing commands to an
already running instance:

1. If the command-line has a URL *and* a window id *always* surround the URL with single quotes, for
   example `bb.exe 'back:' 2` instead of `bb.exe back: 2`. With regard to the examples above,
   `bb.exe github.com 3` works but only because the URL doesn't contain a colon (`:`), e.g.
   `bb.exe https://github.com 3` wouldn't work but `bb.exe 'https://github.com' 3` does. *This colon
   problem also happens on initially starting BareBrowser/Electron!*
2. If a URL contains spaces put it inside single *and* double quotes, for example
   `bb.exe "'/c:\my path\index.html'"`. This is regardless of whether a window id is given or not.
   Alternatively you could use `bb.exe /c:\my%20path\index.html` (replacing spaces with `%20`). This
   problem doesn't occur on *initially* starting BareBrowser with a path that contains spaces, so
   the usual way of surrounding the URL with double quotes like `bb.exe "/c:\my path\index.html"`
   can be used.


### Quitting a running instance

You can also quit a running instance via command-line (if `SingleInstance` is `true`, see below).

**Mac:**

```text
<install-dir>/BareBrowser.app/Contents/MacOS/bb quit
open -n -b de.idesis.barebrowser --args quit
```

**Linux:**

```text
<install-dir>/bb quit
```

**Windows:**

```text
<install-dir>\bb.exe quit
```

## Builtin URLs

BareBrowser supports the following builtin URLs, they can be used in the address bar *and* on the
command-line:

- `bb://home`, `home:` – Go to the internal home page of BareBrowser*.
- `bb://readme`, `readme:` – Show README file (HTML format, the file you are reading now)*.
- `bb://readme.md`, `readme.md:` – Show README file (same as above, but in Markdown format)*.
- `bb://settings`, `settings:` – Show the current active settings.
- `bb://info`, `info:` – Show product, installation and system info.
- `bb://license`, `license:` – Show software license of BareBrowser*.
- `bb://changes`, `changes:` – Show changelog of BareBrowser*.
- `bb://reload`, `reload:` – Reload the currently loaded page.
- `bb://back`, `back:` – Go one step back in the browser history.
- `bb://forward`, `forward:` – Go one step forward in the browser history.
- `bb://close`, `close:` – Close a window.

\* If these files/URLs are actually available depends on how you build your
[own distribution](#building).

Any\** URL (web/file/builtin) can be prefixed with `new:` e.g. `bb.exe new:idesis.de`,
`bb.exe new:bb://info`. In this case the URL will be opened in a new window, provided the
[configuration](#configuration) allows new windows to be opened. Using `new:` without adding a URL
also works, in this case the new window either loads the home page (if configured) or a blank page.
If `new:` is used on the command-line together with a window id, the id will be ignored. Prefixing
URLs with `new:` is also available in the address bar of a browser window *and* on the command-line.

\** Except for `bb://reload`/`reload:`, `bb://back`/`back:`, `bb://forward`/`forward:` and
`bb://close`/`close:`. If used together with `new:`, they are simply ignored when passed to an
already running instance (single instance mode) or on starting a new instance.


## Configuration

There is only one configuration file:

**Mac:**

```
~/Library/Application Support/de.idesis.barebrowser/settings.json
```

**Linux:**

```
~/.config/de.idesis.barebrowser/settings.json
```

**Windows:**

```
%APPDATA%\de.idesis.barebrowser\settings.json
```

At the very first start of BareBrowser this file is created from a template settings file (by
copying it) which is located in the following directory:

**Mac:**

```
<install-dir>/BareBrowser.app/Contents/Resources/app.asar.unpacked/res/settings.json
```

**Linux:**

```
<install-dir>/resources/app.asar.unpacked/res/settings.json
```

**Windows:**\*

```
c:\Program Files\BareBrowser-x.y.z-win32-x64\resources\app.asar.unpacked\res\settings.json
```

\*Assuming a standard installation in `%ProgramFiles%`.

If you want to prepare a deplyoment on multiple machines in an organization you can install a copy
of BareBrowser on your machine, adjust the settings to your needs and then deploy this copy to the
target machines. On the target machines these settings will then be used as the *initial* default
settings.

If you install/deploy a newer version of BareBrowser over an existing one, settings that are not
present in the older version (e.g. a new configurable feature has been introduced) will be added to
the existing user settings file. At the same time a backup of the old user settings file is created
(for example `settings-2022-05-24_16-04-03.json`). **Note:** This is only done, if the settings file
coming with the new BareBrowser version is *newer* than the existing user settings file.

In older versions of BareBrowser the user settings file was always overwritten on
installing/deploying a new version. If you have used this (rather radical) 'feature' to 'deploy'
new/changed user settings, this is no longer possible, instead changes to user settings files have
to be done manually in the directory of the file on the respective machine.

The default configuration (from the directory above) looks like this:

```json
{
  "Window": {
    "Left": 10,
    "Top": 10,
    "LeftTopOfCurrentScreen": true,
    "Width": 1280,
    "Height": 900,
    "NewRelativeToCurrent": true
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
    "NewWindow": [
      "mod+n"
    ],
    "InternalReload": [
      []
    ],
    "Reload": [
      "mod+r",
      "f5"
    ],
    "GoBack": [
      "ctrl+meta+left",
      "ctrl+alt+left"
    ],
    "GoForward": [
      "ctrl+meta+right",
      "ctrl+alt+right"
    ],
    "GoHome": [
      "ctrl+meta+up",
      "ctrl+alt+up"
    ],
    "GoInternalHome": [
      "ctrl+shift+meta+up",
      "ctrl+shift+alt+up"
    ],
    "ExitHTMLFullscreen": [
      "esc"
    ],
    "ToggleMenu": [
      "ctrl+h"
    ]
  },
  "RequestHandlers": [
    {
      "Load": false,
      "Active": false,
      "Source": "./lib/RequestHandlers/default/RequestLoggerHandler.js"
    },
    {
      "Load": false,
      "Active": false,
      "Source": "./lib/RequestHandlers/default/FilterRequestHandler.js",
      "Config": {
        "Filter": [
          "^https://github.com(/.*)?",
          "^https://github.githubassets.com(/.*)?",
          "^https?://(.*\\.)?heise.de(/.*)?",
          "^https://heise.cloudimg.io(/.*)?",
          "^<LOAD>$",
          "^<BACK>$",
          "^<FORWARD>$",
          "^<RELOAD>$",
          "^data:text/html,.*",
          "^bb://.*"
        ],
        "LogAllow": false,
        "LogDeny": true
      }
    },
    {
      "Load": false,
      "Active": false,
      "Source": "./lib/RequestHandlers/RequestHandlerTemplate.js",
      "Config": {
        "Log": true
      }
    },
    {
      "Load": true,
      "Active": true,
      "Source": "./lib/RequestHandlers/default/DefaultRequestHandler.js",
      "Config": {
        "Log": false
      }
    }
  ],
  "LogRequests": false,
  "CaptureConsole": true,
  "UserAgent": "",
  "Permissions": [
      "fullscreen"
  ],
  "AllowPlugins": false,
  "AllowPopups": true,
  "AllowNewWindows": true,
  "ClearTraces": false,
  "SingleInstance": true,
  "FocusOnNewURL": true,
  "DarwinForceFocus": false,
  "ElectronFlags": [],
  "HardwareAcceleration": true,
  "ContentProtection": false,
  "AddressBar": 2,
  "MenuState": 1,
  "Homepage": "bb://home",
  "Scheme": "bb"
}
```

These are also the default values for every property in case of a malformed JSON file or if any of
the values is invalid, missing or has the wrong type. For the `RequestHandlers` object and
`LogRequests` see following [chapter](#request-handlers).

- The `Window` object configures the initial window position and size when BareBrowser is started
  respectively a new window is opened. If `LeftTopOfCurrentScreen` is `true`, the `Left` and `Top`
  values are calculated relative to the screen on which the mouse cursor is visible. If
  `NewRelativeToCurrent` is `true`, `Left` and `Top` are calculated relative to the current active
  window of BareBrowser (by adding 25 pixel to the top and left position of this window).

- The `ShortCuts` object configures the available keyboard shortcuts. The value of `Global` controls
  how keyboard shortcuts are enabled/disabled. With `false` all shortcuts are disabled if the URL
  field in the address bar is focused. With `true` shortcuts are enabled even if the URL field is
  focused.

    Every entry is an array of strings, so you can assign multiple shortcuts to each command, (see
    `Reload`). The key `mod` (see below) is mapped to the `Command`-key on the Mac and to the
    `Ctrl`-key on Linux/Windows. You can assign your own keyboard shortcuts to any of the keys
    above. For available key combinations please see the documentation of
    [Mousetrap](https://craig.is/killing/mice). If you want to disable a keyboard shortcut set its
    value to `[""]`.

    The term *host window* below means the native window (`Electron.BrowserWindow`), which
    effectively is also a web page that (amongst others) contains the `webview` in which pages
    are loaded. You can open the Electron developer tools to debug the BareBrowser
    window itself with `mod+shift+d`. To debug the actual web page you'd use `mod+d` instead.

    Please note that there are also other common keyboard shortcuts in the main menu (for example
    for Cut, Copy, Paste etc.). Currently these menu shortcuts are not configurable.

    | Key                      | Shortcuts&nbsp;(default)                         | Action                                                                          |
    | :----------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------ |
    | `ToggleAddressBar`       | `mod+t`                                          | Show/hide the address bar.                                                      |
    | `ToggleInternalDevTools` | `mod+shift+d`                                    | Show/hide the developer tools for the host window.                              |
    | `ToggleDevTools`         | `mod+d`                                          | Show/hide the developer tools for the current page.                             |
    | `FocusLocationBar`       | `mod+l`                                          | Show the address bar and focus it.                                              |
    | `InternalReload`         |                                                  | Reload the host window (only for development!).                                 |
    | `NewWindow`              | `mod+n`                                          | Open a new window.                                                              |
    | `Reload`                 | `mod+r, f5`                                      | Reload the current page.                                                        |
    | `GoBack`                 | `ctrl+meta+left`,<br/>`ctrl+alt+left` \*         | Go one step back in the browser history.                                        |
    | `GoForward`              | `ctrl+meta+right`,<br/>`ctrl+alt+right` \*       | Go one step forward in the browser history.                                     |
    | `GoHome`                 | `ctrl+meta+up`,<br/>`ctrl+alt+up` \*             | Go to the home page.                                                            |
    | `GoHomeInternal`         | `ctrl+shift+meta+up`,<br/>`ctrl+shift+alt+up` \* | Go to BareBrowsers internal home page, [if available](#builtin-urls) (`home:`). |
    | `ExitHTMLFullscreen`     | `esc`                                            | Leave HTML fullscreen (for example from YouTube videos).                        |
    | `ToggleMenu`             | `ctrl+h`                                         | Show/hide the main menu (Linux/Windows, unavailable on the Mac).                |

\* The shortcuts with `ctrl+alt` and `ctrl+shift+alt` do not work on some Linux systems since they
are reserved by the operating system (e.g. Ubuntu). The same is true for `ctrl+meta+left` and
`ctrl+meta+right` on Windows.

- If `LogRequests` is `true`, BareBrowser will log extensive information about requests made by
  pages and how they have been handled by request handlers (see following chapter).

- If `CaptureConsole` is `true`, console messages from a web page will be copied to the console of
  the Electron browser window which hosts the webview tag. BareBrowser does its best to keep these
  messages intact but due to a bug in Chromium copying isn't perfect, console formatting is broken
  and some message may be lost.

- `UserAgent` will be used to set the user agent string for the webview tag. If this value is
  missing or an empty string (`""`), the default from Electron will be used (see
  [`app.userAgentFallback`](https://www.electronjs.org/docs/api/app#appuseragentfallback)). You can
  set this value to any string you like. If you don't want to send a detectable user agent set this
  value to a single space (`" "`).

- `Permissions` is an array of strings which controls the behavior if a web page asks for a specific
  permission. The default is to allow fullscreen requests. If you also want to allow notifications
  from web pages the value would be `["fullscreen", "notifications"]`. The following values can be
  used: `clipboard-read`, `media`, `mediaKeySystem`, `geolocation`, `notifications`, `midi`,
  `midiSysex`, `pointerLock`, `fullscreen` and `openExternal`. BareBrowser currently contains no
  code to handle any of these values in a specific way, so the default behavior from Electron
  applies.

- With `AllowPlugins` set to `true` BareBrowser should be able to load plugins.

- With `AllowPopups` set to `true` the current window can open other windows (e.g. through links
  with `target="_blank"`). If this setting is `false`, *nothing* will happen if such links are
  clicked. Instead you have to click with `Shift` or `Ctrl`/`Cmd` (see below `AllowNewWindows`).

- With `AllowNewWindows` set to `true` the current window can open new windows when links in the
  current page want to be opened in a new window (see `AllowPopups`). In addition to that users will
  be able to open new (empty) windows with `Cmd`/`Ctrl`+`N`. Setting this to `false` can
  significantly degrade the browsing experience. Prefixing URLs with `new:` (see above) also won't
  open new windows.\
  ***Note:*** To open a regular link in a new window you can click on it while holding down the
  `Shift` or `Cmd` key on the Mac or the `Shift` or `Ctrl` key on Linux/Windows. When the `Cmd` or
  `Ctrl` key is used, the new window will be opened *behind* the current active window (similar to
  opening a background tab in a regular browser). If `AllowNewWindows` is `false` clicking on a link
  while holding down one of these keys has no effect, instead the link will be opened in the current
  window.

- If `ClearTraces` is set to `true` then any temporary data like caches, local storage, cookies,
  sessions etc. will be deleted when BareBrowser is closed. Deleting means the *complete removal*(!)
  of the contents of the following directory:

  **Mac:**

  ```
  ~/Library/Application Support/de.idesis.barebrowser
  ```

  **Linux:**

  ```
  ~/.config/de.idesis.barebrowser
  ```

  **Windows:**

  ```
  %APPDATA%\de.idesis.barebrowser
  ```

  The only exception is the file `settings.json` and it's backups.

  **Note:**\
  `ClearTraces` is `false` by default to keep temporary data, cookies etc. intact between
  BareBrowser sessions, so the behavior when surfing the web is comparable to a regular browser, but
  in most cases this should be set to `true`.

- If `SingleInstance` is set to `true` then only one instance of BareBrowser is allowed (lets call
  it *A*). If you start another instance (*B*), the already running instance *A* will be given the
  [command-line parameters](#command-line-usage) from *B* and *B* will quit immediately.

- If `FocusOnNewURL` is set to `true` and `SingleInstance` is also `true` then starting another
  instance will cause the already running instance to activate its window and make it the foreground
  window (even if no URL was given via the command-line). Setting this value to `false` opens the
  given URL (if any) in the current instances window (*A*) but it won't be focused. On the Mac
  bringing the app to the foreground doesn't always work, in most cases this can be fixed by setting
  `DarwinForceFocus` to `true` although it isn't recommended according to this
  [documentation](https://www.electronjs.org/docs/api/app#appfocusoptions).

- With `ElectronFlags` (an array of strings) you can pass additional command line
  switches/parameters to the Electron runtime. A comprehensive list can be found here:
  [Supported Command Line Switches](https://www.electronjs.org/docs/latest/api/command-line-switches/).
  One example is `"ElectronFlags": ["--no-sandbox"],` which enables running BareBrowser from a
  network drive.\
  ***Note: for security reasons using `--no-sandbox` is strongly discouraged!***

- On some systems you may encounter graphics artifacts in web pages, in such cases you can try to
  set `HardwareAcceleration` to `false`.

- Setting `ContentProtection` to `true` prevents screenshots from the browser window. On the Mac a
  screenshot from the window itself will cause an error message. Even taking a screenshot of the
  complete desktop won't show anything from BareBrowser. On Windows 10 version 2004 and up the
  window doesn't appear in the screenshot, on older versions the screenshot contains the window
  title and borders of BareBrowser but the content area will be black.

- If `AddressBar` is set to `0` the address bar is hidden and it also can't be made visible with the
  keyboard shortcut defined by `ToggleAddressBar`. The value `1` enables the address bar but it will
  be initially hidden on startup and in new windows. The value `2` shows the address bar on startup
  and in new windows. Any other value will cause the default setting (`1`) to be used.

- `MenuState` sets the behavior of the main menu on Linux/Windows platforms. This setting is ignored
  on the Mac. `0` disables the main menu completely. Setting the value to `1` enables the main menu
  but doesn't show it on startup (see respective shortcut). `2` enables the main menu and shows it
  on startup. Any other value will cause the default setting (`1`) to be used.

- The string in `Homepage` contains the URL to be opened by default if no URL was given via command
  line. `Homepage` is ignored if it is an empty string `("")`, in this case BareBrowser will start
  with an empty page. In the standard distribution BareBrowser will open its internal home page
  (`bb://home`) but this value can be replaced with any other web address or a local file
  (`file:///mypath/myfile.html`). You can also use the builtin variable `$APP_PATH$` to point to a
  file inside in your own packaged BareBrowser distribution, for example
  `$APP_PATH$/res/myhome.html` or `$APP_PATH$/company.html` (in the latter case you'd have to put
  the file `company.html` into the directory `./app/_root`).

- `Scheme` is used for BareBrowsers internal protocol `bb://`, for example to show the internal home
  page. It can be changed to other
  [RFC 3986 URI syntax](https://tools.ietf.org/html/rfc3986#section-3) compliant values. This
  affects BareBrowsers builtin URLs, so you would have to use, for example, `myscheme://home` etc.
  instead of `bb://home`.


## Request handlers

Any resource which is opened by BareBrowser is passed to a chain of request handlers. Common tasks
for request handlers are for example:

- Logging of URLs.
- Restricting access to a set of predefined URLs.
- Open a URL or, if it is are already opened, execute some JavaScript in the page instead.
- Use/add/remove custom URL parameters to execute special tasks.
- Run tests on a page.
- Modify the user agent for a URL.
- Redirect a URL to another URL.

Multiple handlers can be configured in `settings.json` (see above), the execution order of the
handlers matches their order in `settings.json`. You register a URL handler by adding it to the
`RequestHandlers` object in `settings.json`:

```json
"RequestHandlers": [
  {
    "Load": true,
    "Active": true,
    "Source": "./lib/RequestHandlers/MyURLHandler/MyURLHandler.js",
    "Config": {
      "UserAgent": "FooBar"
    }
  },
```

- `Load` tells BareBrowser to load the JavaScript file which implements the request handler. Can be
  used to deactivate a handler completely.
- `Active` indicates if a loaded handler is active or not. If `Active` is `false` the function
  `handleRequest` won't be called by BareBrowser. This means that the handler has no influence on
  resource loading. Using `"Load": true` together with `"Active": false` can be used to perform a
  single task when a new window is opened (in the constructor of a handler).
- `Source` is the name of a JavaScript source file which must export a request handler class.
  Request handler source files should be placed in the `./lib/RequestHandlers` directory, preferably
  in their own directory below `./lib/RequestHandlers`.
- The `Config` object is optional, but if it is available, it will pe passed as an object to the
  handlers constructor (see below).

Request handlers must implement a simple interface and export it as a class. The file
`RequestHandlerTemplate.js` in `./lib/RequestHandlers` can be used as a template for writing
your own handler. The files `DefaultRequestHandler.js` and `RequestHandlerConsts.js` contain
detailed comments and API descriptions (see also the TypeScript file `/src/main/RequestHandler.ts`).

***Note:*** BareBrowser itself is unable to open URLs. In the standard distribution opening URLs is
done by the `DefaultRequestHandler` which is the last handler in the chain and active by default; it
opens just any URL and also handles all navigation types (see below). If you deactivate this handler
you have to replace it with your own handler, otherwise BareBrowser won't open anything.


### Sample request handler

Following the handler registration example above the code below implements a trivial request handler
which opens any URL and allows to navigate backward. It forbids to navigate forward and to reload
the page. Additionally it sets the user agent string to `FooBar` and it logs any resource requested
by the loaded page:

```javascript
const {
  NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
  REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");

class MyRequestHandler {

  constructor(config, settings, active, webContents, browserWindow) {
    this.className = this.constructor.name;
    this.config = config;
    this.settings = settings;
    this.webContents = webContents;
    this.browserWindow = browserWindow;
    this.winId = this.browserWindow.id;
    this.log(`Instance created with config (Active=${active}): ${JSON.stringify(this.config, 2)}`);
  }

  handleRequest(urlObj, originalURL, navType) {
    const url = urlObj.URL;
    switch (navType) {
      case NAV_LOAD:
        this.log(`Loading ${url}`);
        this.webContents.loadURL(url, { userAgent: this.config.UserAgent });
        break;
      case NAV_BACK:
        if (this.webContents.canGoBack()) {
            this.log("Going back");
            this.webContents.goBack();
        }
        break;
      case NAV_FORWARD:
      case NAV_RELOAD:
        this.log("FORBIDDEN");
        return REQ_DENY;
      case NAV_INTERNAL:
        this.log(`Allowing request ${url}`);
    }
    return REQ_ALLOW;
  }

  log(msg, error) {
    if (error) {
      console.error(`${this.className} (${this.winId}): ${msg}\n`, error);
    } else if (this.config.Log) {
      console.log(`${this.className} (${this.winId}): ${msg}`);
    }
  }

  dispose() {
    this.config = undefined;
    this.settings = undefined;
    this.webContents = undefined;
    this.browserWindow = undefined;
  }
}

module.exports = MyRequestHandler;
```


### Implementation details

#### Necessary boilerplate code

Every handler must contain similar code:

```javascript
// Can be reduced to what is effectively used
const {
  NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
  REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");

// Mandatory
class MyRequestHandler {
...
}

// Mandatory
module.exports = MyRequestHandler;
```

- The `require` statement imports predefined numeric constants which must be used for handling
  requests. In the example it's assumed that the handler source file is put in its own directory
  below `/lib/RequestHandler/`, that's why `require` points to `../RequestHandlerConsts.js`.
- `class MyRequestHandler` Implementation of the request handler.
- `module.exports = MyRequestHandler;` BareBrowser will require the module and use the exported
  class.


#### Constructor

**Note:** Every (new) browser window will create an instance of every request handler configured
with `"Load": true`.

```javascript
// Mandatory
constructor(config, settings, active, webContents, browserWindow) {
  this.className = this.constructor.name; // Not required, only used for logging.
  this.config = config;
  this.settings = settings;
  this.webContents = webContents;
  this.browserWindow = browserWindow;
  this.winId = this.browserWindow.id;     // Not required, only used for logging.
  this.log(`Instance created with config (Active=${active}): ${JSON.stringify(this.config, 2)}`);
}
```

Every handler gets passed the following parameters in its constructor:

- `config`: The `Config` object of the handler itself (if configured in `settings.json`) or
  `undefined` if it isn't available there.
- `settings`: The content of `settings.json` as an object.
- `active`: A boolean flag indicating if the handler is active. If `false`, its `handleRequest`
  function won't be called by BareBrowser.
- `webContents`: A reference to the [webContents](https://www.electronjs.org/docs/api/web-contents)
  object which is bound to the webview tag in the Electron browser window.
- `browserWindow`: The Electron browser window which hosts the webview tag that is used to display
  pages/files.


#### Handling requests

```javascript
// Mandatory
handleRequest(urlObj, originalURL, navType) {
  const url = urlObj.URL;
  switch (navType) {
    case NAV_LOAD:
      this.log(`Loading ${url}`);
      this.webContents.loadURL(url, { userAgent: this.config.UserAgent });
      break;
    case NAV_BACK:
      if (this.webContents.canGoBack()) {
          this.log("Going back");
          this.webContents.goBack();
      }
      break;
    case NAV_FORWARD:
    case NAV_RELOAD:
      this.log("FORBIDDEN");
      return REQ_DENY;
    case NAV_INTERNAL:
      this.log(`Allowing request ${url}`);
  }
  return REQ_ALLOW;
}
```

If a resource is requested, the first handler in the chain will be called (function `handleRequest`)
with the parsed URL (`urlObj`), the original unparsed URL of the resource (`originalURL`) and a
navigation type (`navType`).


**`urlObj`**

`urlObj` is an object with a single string property named `URL` that contains the address of the
resource to be loaded. `urlObj.URL` *is intentionally a writable property!* If a request handler
changes the value of `URL` during `handleRequest`, the changed value will be passed to the next
handler in the chain. For example, if the first handler in the chain gets passed the object
`{ URL: "https://example.com?x=100&y=200" }` it could easily change the value of `URL` to
`"https://example.com"` and set the current window position to the left and top coordinates `100`
and `200`. The following handler would then receive the object `{ URL: "https://example.com" }` and
it could again modify the value of `URL` in its implementation of `handleRequest` and so on. A
complete example can be found in `lib/RequestHandlers/samples/WindowBoundsRequestHandler.js`. This
sample handler can be activated by adding the following lines to the `RequestHandlers` object
(*before* the default request handler):

```json
{
  "Load": true,
  "Active": true,
  "Source": "./lib/RequestHandlers/samples/WindowBoundsRequestHandler.js"
},
```

You can now see what happens, if you open a web site with four custom URL parameters added, e.g.
`https://github.com/idesis-gmbh/BareBrowser?_wbx=100&_wby=100&_wbw=800&_wbh=800`.


**`originalURL`**

Usually the content of `urlObj.URL` originates from a resource in a web page. But if `urlObj.URL`
comes from the initial URL from the command line or the URL field in the GUI, `originalURL` will
contain the unparsed value. `originalURL` can be used to create a proper URL since not all calling
processes are able to create a correctly encoded URL. But you could also use it to pass arbitrary
data to URL handlers that has nothing to do with URLs, for example `bb.exe "doSomething=10,20"`. In
this case you would have to implement your own handling since `url` would contain
`https://dosomething%3D10%2C20/`. In most other cases `urlObj.URL` and `originalURL` are equal.


**`navType`**

The navigation type (numeric constant) tells the handler what caused the request:

- `NAV_LOAD` (= `0`) Initial loading of a page.
- `NAV_RELOAD` (= `1`) Reload an already loaded page*.
- `NAV_BACK` (= `2`) Go back in the browser history*.
- `NAV_FORWARD` (= `3`) Go forward in the browser history*.
- `NAV_INTERNAL` (= `4`) Issued by a page itself during loading CSS, JavaScript, images etc.

\* On these navigation types `urlObj.URL` and `originalURL` contain the atificial URLs `<RELOAD>`,
`<BACK>` and `<FORWARD>`.

If a handler decides to handle the request it *must* call the corresponding method on the object
`webContents`. In the case of `NAV_LOAD` this would be `this.webContents.loadURL(urlObj.URL)`.
Similar handling must be done for all other types except `NAV_INTERNAL`. This type is rather
informative, it doesn't require an action on the `webContents` object. If you pass non-URL data like
in the example above, you have to handle it on your own in `handleRequest`.

**Note:** Regardless of actively handling the request or not the handler **must** return a numeric
constant which tells BareBrowser how to proceed with the request. The following return values can be
used:

- `REQ_ERROR` (= `0`) An error occured handling the request. BareBrowser won't call the next
  handler.
- `REQ_NONE` (= `1`) The handler doesn't handle the request (and shouldn't change `urlObj.URL`).
  BareBrowser will call the next handler with the same URL.
- `REQ_CONTINUE` (= `2`) Rather informative: the handler has done something with the given resource
  (including rewriting `urlObj.URL`) and allows the request. BareBrowser will call the next handler.
- `REQ_ALLOW` (= `3`) The handler allows the request. BareBrowser won't call the next handler.
- `REQ_DENY` (= `4`) The handler denies the request. BareBrowser won't call the next handler.


#### Clean up

Free resources to avoid memory leaks and other problems. Especially `webContents` and
`browserWindow` are tied to a BrowserWindow object which can be closed by users. On
closing a BrowserWindow this method will be called on every associated request handler.
Can also be used to clean up other things a handler may have allocated.

```javascript
// Mandatory
dispose() {
  this.config = undefined;
  this.settings = undefined;
  this.webContents = undefined;
  this.browserWindow = undefined;
}
```


### Notes

- Intercepting resource loading is technically done by using a
  [request handler](https://www.electronjs.org/docs/api/web-request#webrequestonbeforerequestfilter-listener)
  on the [webRequest](https://www.electronjs.org/docs/api/web-request) object of the
  [Electron default session](https://www.electronjs.org/docs/api/session#sessiondefaultsession) in
  the [main process](https://www.electronjs.org/docs/glossary#main-process).

- Internal Electron resources like `devtools://`, `chrome://` and the resources needed by
  BareBrowser itself are not passed through the handler chain, so there is no way to control them.

- It's not necessary to explicitly handle *all* navigation types in a handler. For example, it's
  completely valid to just prevent forward navigation and leave the handling of all other types to
  the next handlers in the chain:

    ```javascript
    handleRequest(urlObj, originalURL, navType) {
      if (navType === NAV_FORWARD) {
        return REQ_DENY;
      };
      return REQ_NONE;
    }
    ```


### Available handlers

For all available request handlers see also the file `settings.json`.

- `LoggerRequestHandler.js`\
  A simple request handler that just logs any request and allows access. It can be used to analyze
  what pages/web sites want to load. This handler isn't loaded and is inactive by default.

- `FilterRequestHandler.js`\
  A primitive but effective filter for *all* requests made by users or web pages. For example, if
  you log the requests of a web site with the help of `LoggerRequestHandler.js`, it's easy to define
  a set of filter rules which allow/deny requests of that (or additional) site(s), so it could be
  used as a simple whitelist ad blocker. A more realistic use case is to restrict access to a
  limited set of URLs inside an organization. The configuration of this handler already contains
  some sample rules for `github.com` and `heise.de`:
  
    ```json
    "Config": {
      "Filter": [
        "^https://github.com(/.*)?",
        "^https://github.githubassets.com(/.*)?",
        "^https?://(.*\\.)?heise.de(/.*)?",
        "^https://heise.cloudimg.io(/.*)?",
        "^<LOAD>$",
        "^<BACK>$",
        "^<FORWARD>$",
        "^<RELOAD>$",
        "^data:text/html,.*"
      ],
      "LogAllow": false,
      "LogDeny": true
    }
    ```

    The filters are defined as regular expressions. If a request matches one of the expressions, it
    will be allowed and otherwise blocked. As you can see, the builtin pseudo URLs like `<BACK>` can
    also be filtered, but usually they should be allowed, otherwise navigation would be impossible.
    With `LogAllow` and `LogDeny` you can log which requests have been allowed/denied. This handler
    isn't loaded and is inactive by default.

- `RequestHandlerTemplate.js`\
  A template for writing your own request handler. This handler isn't loaded and is inactive by
  default.

- `DefaultRequestHandler.js`\
  This is the default request handler which just allows *any* request. If this handler isn't loaded
  or active, BareBrowser won't load anything, if other handlers are also not loaded/active. With
  `Config.Log` request logging can be turned on/off (default). The handler is loaded and active by
  default.

- `WindowBoundsRequestHandler.js`\
  See [Handling requests](#handling-requests).

- `Nervous.js`\
  See [here](#nervous-).


## Building

### Requirements

[Node.js](https://nodejs.org) 13.0.0 or higher is required. If you want to build Windows versions
on the Mac or Linux you also need [Wine](https://www.winehq.org) installed on your system, on the
Mac, for example, via [Homebrew](https://brew.sh).


### Source code structure

During development the only directory you'd use is `./app`. It contains everything needed for
developing BareBrowser. All other directories are only used by the build system so in most cases you
don't have to take care of them. The only exception is the directory `./release` (created
automatically), it will contain the distribution files if you package BareBrowser for deployment.

The content of `./app`:

| Directory           | Content                                                                                                                                                                                                                                                                                                                                                                    |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_root`             | `index.html`, the page loaded by the renderer process; `home.html`, BareBrowsers internal home page; `appicon.png`, the logo of BareBrowser; `dockicon.png`, the dock icon for Linux; the software license (`LICENSE`); the changelog of BareBrowser (`CHANGES`); the readme files (`README.md`, `README.html`); `github.css`, CSS used for `README.html` and `home.html`. |
| `lib`               | JavaScript libraries used by BareBrowser, currently only the source files of request handlers.                                                                                                                                                                                                                                                                             |
| `res`               | BareBrowser runtime settings in `settings.json`. The right place for other static resources.                                                                                                                                                                                                                                                                               |
| `src`               | Source code of BareBrowser; settings for the TypeScript compiler and ESLint.                                                                                                                                                                                                                                                                                               |
| `style`             | CSS and images needed by `_root/index.html`. The right place for your own CSS.                                                                                                                                                                                                                                                                                             |
| File `package.json` | Configuration of BareBrowser app (name, description etc.); configuration of runtime and development dependencies (TypeScript compiler, additional Node modules etc.).                                                                                                                                                                                                      |

**Notes:**

- Adding files/directories to `lib`, `res` or `style` automatically adds them to `./out` and also
  the packaged BareBrowser.
- If you add a directory/file to `_root` it will be added to `./out` and the root directory of the
  packaged BareBrowser (besides `lib`, `res` etc.). An example would be a separate `doc` directory.
- `index.html` is mandatory and must not be renamed. Modification should be restricted to the title
  tag and maybe some meta tags!
- `home.html` is optional, it is used for the internal home page of BareBrowser and can contain
  arbitrary content. If you change the name, you won't be able to display it with the
  [builtin URLs](#builtin-urls) `bb://home`, `home:`.
- `appicon.png` is mandatory and must not be renamed. The file is used for creating the Logo of
  BareBrowser and should be a 1024x1024px RGB PNG with transparency (see also
  [here](https://github.com/idesis-gmbh/png2icons)).
- `dockicon.png` is optional. The file is used for displaying an icon in Linux docks or for window
  decorations. A 256x256px RGB PNG with transparency is usually sufficient. If this file isn't
  available, the build system will use a copy of `appicon.png` during packaging BareBrowser for
  releases.
- `README.md` is optional, it is a good place for your documentation in
  [GFM](https://github.github.com/gfm/) format. If you change the name, you won't be able to display
  it with the builtin URLs `bb://readme.md`, `readme.md:`.
- If `README.html` is available, it can be displayed with the builtin URLs `bb://readme`, `readme:`.
  The file can contain arbitrary content but if the build system finds the placeholder string
  `<!-- README.md -->` in it, this placeholder will be replaced with the content of `README.md`
  converted to HTML.\
  **Note:** This Markdown conversion is done with a request to the
  [GitHub REST API](https://docs.github.com/en/rest/reference/markdown) so the Markdown format
  should be GFM and the HTML file should use suitable CSS. Please refer to the files
  `./app_root/README.html`, `./app_root/github.css` and `./build/make-readme-html.js`.
- `LICENSE` is optional, it contains your license. If you change the name, you won't be able to
  display it with the builtin URLs `bb://license`, `license:`.
- `CHANGES` is optional, it contains the current changelog of BareBrowser. If you change the name,
  you won't be able to display it with the builtin URLs `bb://changes`, `changes:`.
- `src` has four sub-directories that separate the source code by scope: `main` and `renderer`
  contain the code only used by the main/renderer processes, `shared` contains code used be *both*
  process types and `preload` is used for the
  [preload](https://www.electronjs.org/docs/api/webview-tag#preload)-script. Adding
  files/directories to one of these sub-directories is also automatically handled by the build
  system and the TypeScript compiler.


### Configure your own version

Configuration is entirely done in `./app/package.json`:

```json
{
  "name": "barebrowser",
  "productName": "BareBrowser",
  "description": "A minimalist browser for specific tasks in controlled environments.",
  "companyname": "idesis GmbH",
  "copyright": "©2023 idesis GmbH",
  "version": "3.0.0",
  "-buildVersion": 4367,
  "identifier": "de.idesis.barebrowser",
  "identifierRoot": "",
  "executableName": "bb",
  "darwinAppCategory": "public.app-category.productivity",
  "win32FileDescription": "BareBrowser",
  "win32InternalName": "idesis BareBrowser",
  "win32RequestedExecutionLevel": "asInvoker",
  "win32ApplicationManifest": "",
  "homepage": "https://github.com/idesis-gmbh/BareBrowser",
  "author": {
    "name": "Michael Nitze",
    "email": "michael.nitze@idesis.de"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/idesis-gmbh/BareBrowser.git"
  },
  "readme": "README.md",
  "bugs": {
    "url": "https://github.com/idesis-gmbh/BareBrowser/issues",
    "email": "produktion@idesis.de"
  },
  "private": false,
  "license": "MIT",
  "main": "./bin/MainProcess.js",
  "dependencies": {
    "fs-extra": "11.1.0",
    "mousetrap": "1.6.5"
  },
  "devDependencies": {
    "@types/fs-extra": "11.0.1",
    "@types/mousetrap": "1.6.11",
    "@types/node": "18.14.2",
    "@typescript-eslint/eslint-plugin": "5.54.0",
    "@typescript-eslint/parser": "5.54.0",
    "electron": "23.1.1",
    "eslint-plugin-jsdoc": "40.0.0",
    "eslint": "8.35.0",
    "typescript": "4.9.5"
  },
  "config": {
    "arch": "x64,arm64",
    "pkgParams": "--quiet --asar.unpackDir=\"{res,lib/RequestHandlers}\""
  }
}
```

Most of the fields are self-explanatory, the complete documentation can be found at the
[Electron Packager](https://github.com/electron/electron-packager) web site. Further notes on some
of the fields:

- `productName` is the product name visible for the end user.

- `version` must follow [SemVer](https://semver.org), otherwise you may end up with errors like
  missing Node modules on Windows, for example, `2.0.0-alpha` works but `2.0.0_alpha` will fail.

- `buildVersion` is optional but if used, it should follow `x.y.n.m`, where `x` etc. are numeric
  without a leading zero. For example, `a47.11` works as is on the Mac but building for Windows will
  fail. `47.11a` also works on the Mac while building for Windows doesn't break but it will be
  transformed to `47.11.0.0`.

- `identifier` will be used for the user data directory in `~/Library/Application Support` (Mac),
  `~/.config` (Linux) and `%APPDATA%` (Windows). Make sure, that you use a unique identifier (which
  also doesn't contain characters unsuitable for filenames)!

- `identifierRoot`, optional. If this value is available and it is not an empty string (trimmed) it
  will be used as the name for a parent directory in `~/Library/Application Support` (Mac),
  `~/.config` (Linux) and `%APPDATA%` (Windows) in which the directory denoted by `identifier` is
  created. This name also must not contain characters unsuitable for filenames. Suppose the value is
  `ACME Corp` and `identifier` is `SuperBrowser`, then the follwing directory would be created for
  BareBrowsers user data:

  **Mac**:\
  `~/Library/Application Support/ACME Corp/SuperBrowser`

  **Linux**:\
  `~/.config/ACME Corp/SuperBrowser`

  **Windows**:\
  `%APPDATA%\ACME Corp\SuperBrowser`

  Without `identifierRoot` the directories `~/Library/Application Support/SuperBrowser`,
  `~/.config/SuperBrowser` and `%APPDATA%\SuperBrowser` would be created. `identifierRoot` is useful
  if, for example, an organization wants to keep the user data directories of all their internal
  applications under a single common directory.

- `executableName` will be used for the name of the primary executable. Do not add an extension like
  `.exe`, on building for Windows this will be done automatically. Also do not use the value
  `electron`!

- `dependencies` contains the additional Node modules currently needed by BareBrowser at *runtime*.

- `devDependencies` contains the Node modules used for *developing* BareBrowser. `typescript`,
  `electron` and `eslint` are the absolute minimum. Removing `eslint-plugin-jsdoc` means changing
  the ESLint configuration.

- `config.arch` can be `x64`, `arm64`, `ia32`, `armv7l` or any combination of these values, if you
  want to build releases for multiple architectures (comma-delimited). `ia32` is only valid for
  building a 32-bit Windows version. It can also be used for Linux but currently there is no
  official support by Electron Packager and it is also deprecated. `armv7l` is only available for
  Linux. If an architecture is given, that is not available for a platform a warning will be emitted
  on the console and this architecture will be ignored. If, for example, `config.arch` is
  `x64,arm64,ia32` and `Make:all` (see below) is used on a Mac, the build system will generate 8
  releases, 2 for macOS (`x64`, `arm64`), 3 for Linux (`x64`, `arm64`, `ia32`) and 3 for Windows
  (`x64`, `arm64`, `ia32`).

- `config.pkgParams` can be modified, please refer to Electron packager. `--asar.unpackDir`
  currently keeps the directories `./app/res` and `./app/lib/RequestHandlers` out of the packed
  `app.asar` file. You can add or remove directories to/from this list. For example, you could use
  `--asar.unpackDir=\"\"` to put *all* files inside `app.asar` which would make it almost impossible
  for users to edit/add/remove request handler JavaScript source files.

- The objects `dependencies`, `devDependencies` and `config` will be removed before putting the file
  to the packaged app.


### Build system

BareBrowser uses a build system based on two `package.json` files:

- `./app/package.json` is used to *configure* and *develop* BareBrowser, this is what you use to set
  up your own version, see [above](#configure-your-own-version).
- `./package.json` is used to *build* BareBrowser during development. It contains various npm
  scripts that enable building, compiling, running and packaging BareBrowser. In most cases it isn't
  necessary to change anything in this file, except for adding test scripts.

The build system is completely self-contained, it will never install/download something globally,
even the download of the Electron version used for running/packaging is put to a subdirectory.

After cloning the repository you have to run the following tasks, which may take a while:

1. `npm i`
2. `npm run Build`
3. `npm run Compile`

After doing so, you can run BareBrowser with `npm run Start:Build`, which starts it from the newly
created directory `./out`.

If you take a look at the `package.json` file you'll find *a lot* of npm scripts normally not found
in other `package.json` files. This is because the build system tries very hard to avoid large build
tools like Grunt, Gulp, Webpack etc. to keep dependencies minimal. The file works more like a
traditional makefile with small subtasks. Nevertheless there are a few tasks at the beginning that
all start with a capital letter. These are the tasks you'd normaly use during development (with
`npm run <task>`):

| Task            | Purpose                                                                                                                                                   |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Watch`         | Starts all of the watch tasks which are configured in `package.json` in parallel.                                                                         |
| `Start:Build`   | Runs the current compiled state of BareBrowser from the directory `./out`.                                                                                |
| `Start:Release` | Runs the packaged BareBrowser from the directory `./release` (created by the `Make*` tasks). \*                                                           |
| `Build`         | Complete refresh of the build system files, based on the settings in `./app/package.json`.                                                                |
| `Compile`       | Compiles the complete source code (main and renderer process, preload script).                                                                            |
| `Clean`         | Cleans everything (including the `release` directory). After cleaning you must run the `Build` and `Compile` tasks again to be able to use `Start:Build`. |
| `Make`          | Packages BareBrowser for your platform (auto-detected).                                                                                                   |
| `Make:Mac`      | Packages BareBrowser for the Mac. \**                                                                                                                     |
| `Make:Linux`    | Packages BareBrowser for Linux. \***                                                                                                                      |
| `Make:Windows`  | Packages BareBrowser for Windows.                                                                                                                         |
| `Make:All`      | Packages BareBrowser for the Mac, Linux and Windows. \****                                                                                                |
| `Lint`          | Executes source code linting with ESLint (based on the settings in `./app/src/eslintrc.json`.)                                                            |

\* `Start:Release` currently will always pick a release that matches the current Node.js processor
architecture. If, for example, you are developing on a Mac with Apple Silicon and `config.arch` is
only `x64` running `Start:Release` will fail.

\** Can't be used on Windows due to the symlinks created by Electron Packer in the output (the build
system will output a warning on the console).

\*** If used on Windows you may have to set the executable attribute with `chmod +x bb` after copying
the release to a Linux machine.

\**** Can't be used on Windows due to \**.

It's highly recommended that you start the `Watch` task. This task watches for file changes in
`./app/package.json` and all of the directories below `./app`. On a change it immediately executes
an appropriate build subtask which puts changed files to the right place in `./out`.
Usually this is very fast, the only exception are changes in `./app/package.json` which cause an
update of the development and runtime dependencies defined there (Node modules). So development is
straight forward, just edit and save any file, the `Watch` task ensures that there is always an
up-to-date state in `./out`, ready for running with `Start:Build`.

**Notes:**
- Occasionally it may happen that the `Watch` task doesn't catch up all changes or executing one of
  the many subtasks fails. In this case just kill the `Watch` task, run the `Build` task and start
  the `Watch` task again. If that doesn't help (never seen so far), run `Clean` before.
- If you change the Electron version you can take a look at `./build/tmp/.electron-download` and
  delete downloads you no longer need.
- The various subtasks in `package.json` are also worth a look. For example, you coud use
  `m:darwin:pkg` to quickly package BareBrowser for the Mac (provided the necessary `Build` and
  `Compile` tasks have been run before). This is much faster than running `Make`, although `Make` is
  safer because it ensures, that everything was cleaned and setup properly.

The repo contains a Visual Studio Code workspace file (`BareBrowser.code-workspace`). It contains
the necessary settings to enable live linting based on `./app/src/eslintrc.json` in VS Code and a
filter setting to hide most of the files/directories not needed during development from the file
explorer.


## License

MIT ©2023 [idesis GmbH](https://www.idesis.de), Max-Keith-Straße 66 (E 11), D-45136 Essen.

Development kindly supported by [VISUS Health IT GmbH](https://www.visus.com), Gesundheitscampus-Süd
15, D-44801 Bochum.

<br/><br/><br/><br/>

---

## Nervous? 😉

Ideally a good web site should only load resources from or below it's origin, right? E.g.
`www.example.org` can load things from `www.example.org`, `example.org`, `imgs.example.org` etc.
Resources loaded from other origins should make us skeptical if not nervous. Don't worry,
`Nervous.js` will do this job for you! It's a creative use for a request handler, trying to
visualize what really happens behind the scenes on todays web sites...

You'll find the JavaScript file* in `./lib/RequestHandlers/sample` The handler isn't configured in
`settings.json`, so you have to activate it by adding this snippet to the `RequestHandlers` object
(*before* the default request handler):

```json
{
  "Load": true,
  "Active": true,
  "Source": "./lib/RequestHandlers/samples/Nervous.js"
},
```

After restarting BareBrowser just go to a web site, `https://www.forbes.com` is a 'recommended'
example. Now every time Forbes loads a resource which doesn't origin from `*forbes.com` the browser
window will *shiver for you* (it also 'talks' to you on the command-line), so you can sit back and
relax ;-).

\* Beware, `Nervous.js` is a quick hack, it's by no means stable or complete, it may fail any time
or break other things.
