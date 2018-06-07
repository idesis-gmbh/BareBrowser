/**
 *  Possible return values of function `handleURL` of any URL handler class.
 */

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
