import { dialog } from "electron";
import { MainApplication } from "./main/MainApplication";

/**
 * Something similar can be found in the Electron sample app, but according to
 * https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
 * there is no straight forward use of it.
 */
process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught exception:", error);
    dialog.showErrorBox("Caught unhandled exception", error.message || "Unknown/missing error message");
    // Only do synchronous cleanup here (if any) and then fail/quit
    // ...cleanup...
    if (mainApplication) {
        mainApplication.quit();
    }
});

/**
 * Start application by creating an instance of the main application class.
 */
const mainApplication: MainApplication = new MainApplication();
