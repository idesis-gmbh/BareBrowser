/**
 * The command to quit a running instance (on Darwin and Windows).
 */
export const CMD_QUIT = "quit";

/**
 * The command which signals that the directories and files in the user data directories
 * shall be deleted. When the app is about to quit and ClearTraces is true it spawns a new
 * instance of the app and passes this command as a command line parameter. The spawned
 * app then does nothing but clears the user data directory and quits immediately.
 * This is done because deleting the content of the user data directory in a running
 * instance of the app on quitting is currently impossible.
 */
export const CMD_CLEAR_TRACES = "__clear_traces__";
