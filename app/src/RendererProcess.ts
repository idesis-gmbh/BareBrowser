import { CRendererApplication } from "./renderer/RendererApplication";

// Create an instance of the renderer application class after all DOM content has been loaded.
document.addEventListener("DOMContentLoaded", () => {
    // tslint:disable-next-line: no-unused-expression
    new CRendererApplication();
});
