// IMPORTANT: Constants defiend here muts be kept in sync with src/main/URLHandler.ts!

// Types of navigation.

/**
 * Request for loading a page/resource.
 * Issued by the address bar, the home page or the command line.
 */
const NAV_LOAD = 0;

/**
 * Request for reloading a page/resource.
 * Issued by a keyboard shortcut.
 */
const NAV_RELOAD = 1;

/**
 * Go back in the browser history.
 * Issued by the back button or a keyboard shortcut.
 */
const NAV_BACK = 2;

/**
 * Go forward in the browser history.
 * Issued by the forward button or a keyboard shortcut.
 */
const NAV_FORWARD = 3;

/**
 * Not strictly a naviagtion. In almost all cases issued by the page itself,
 * if it tries to load a resource.
 */
const NAV_INTERNAL = 4;


// Possible return values of function `handleRequest`.

/**
 * An error occured handling the request. BareBrowser will stop calling the following handler.
 */
const REQ_ERROR = 0;

/**
 * The handler doesn't handle the request. BareBrowser will call the following handler.
 */
const REQ_NONE = 1;

/**
 * Purely informative: the handler has done something with the given resource and allows the
 * request. BareBrowser will call the following handler.
 */
const REQ_CONTINUE = 2;

/**
 * The handler allows the request. BareBrowser will stop calling the following handler.
 */
const REQ_ALLOW = 3;

/**
 * The handler denies the request. BareBrowser will stop calling the following handler.
 */
const REQ_DENY = 4;


module.exports = {
    NAV_LOAD,
    NAV_RELOAD,
    NAV_BACK,
    NAV_FORWARD,
    NAV_INTERNAL,
    REQ_ERROR,
    REQ_NONE,
    REQ_CONTINUE,
    REQ_ALLOW,
    REQ_DENY,
};
