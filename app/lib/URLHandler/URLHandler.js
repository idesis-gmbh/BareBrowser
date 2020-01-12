/**
 *  Possible return values of function `handleURL`.
 *  Possible values of parameter `urlSource` passed to function `handleURL`.
 */

// URL source constants.
/**
 * URL was created by the app itself.
 */
const URL_SOURCE_APP = 0;
/**
 * URL was manually entered by the user.
 */
const URL_SOURCE_USER = 1;
/**
 * URL was created by, for example, clicking on a link or
 * by the page itself by rewriting `window.location`.
 */
const URL_SOURCE_PAGE = 2;
/**
 * URL was created by opening a new window.
 */
const URL_SOURCE_NEW_WINDOW = 3;
/**
 * URL was given by command line.
 */
const URL_SOURCE_CMD_LINE = 4;

// Return values.
/**
 * An error occured handling the given URL.
 * SingleInstanceBrowser will stop passing on the URL to the following handler.
 */
const HANDLE_URL_ERROR = 0;
/**
 * This handler doesn't handle the given URL.
 * SingleInstanceBrowser will pass the URL to the following handler.
 */
const HANDLE_URL_NONE = 1;
/**
 * This handler has done something with the given URL but
 * the URL should be passed on to the following handler.
 */
const HANDLE_URL_CONTINUE = 2;
/**
 * This handler has done something with the given URL
 * and any further processing should be prevented.
 */
const HANDLE_URL_STOP = 3;

module.exports = {
    URL_SOURCE_APP,
    URL_SOURCE_USER,
    URL_SOURCE_PAGE,
    URL_SOURCE_NEW_WINDOW,
    URL_SOURCE_CMD_LINE,
    HANDLE_URL_ERROR,
    HANDLE_URL_NONE,
    HANDLE_URL_CONTINUE,
    HANDLE_URL_STOP,
};
