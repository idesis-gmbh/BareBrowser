import { RendererApplication } from "./renderer/RendererApplication.js";

// Create an instance of the renderer application class after all DOM content has been loaded.
document.addEventListener("DOMContentLoaded", () => {
    new RendererApplication();
});
