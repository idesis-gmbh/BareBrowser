/**
 * Newer versions of Electron come with their own TypeScript definitions, so @types/electron no longer
 * needs to be used. Unfortunately these definitions are lacking on("uncaughtException") which causes
 * a compile error when used. This happens at least with Electron 1.6.10, newer versions may contain
 * a more complete definition, in that case this file can simply be removed.
 * See https://nodejs.org/api/process.html#process_event_rejectionhandled and
 * https://nodejs.org/api/process.html
 */

// tslint:disable-next-line:no-namespace
declare namespace NodeJS {
  interface Process extends NodeJS.EventEmitter {
      on(event: "uncaughtException", listener: (err: Error) => void): this;
      // Other missing events
      on(event: "exit" | "beforeExit", listener: (exitCode: number) => void): this;
      on(event: "disconnect"): this;
      // on(event: "message", listener: (message: Object, sendHandle: net.Socket | net.Server | undefined) => void): this;
      on(event: "warning", listener: (warning: Error) => void): this;
      on(event: "rejectionHandled", listener: (p: Promise<{}>) => void): this;
      on(event: "unhandledRejection", listener: (reason: Error | {}, p: Promise<{}>) => void): this;
    }
}
