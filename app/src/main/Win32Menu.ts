import { Menu, MenuItem } from "electron";
import { ISettings } from "../shared/Settings";
import { ApplicationMenu } from "./ApplicationMenu";
import { MainApplication } from "./MainApplication";

/**
 * The menu for the application on Win32 platforms.
 */
export class Win32Menu extends ApplicationMenu {

    /**
     * Build the main menu for Win32 platforms.
     * appName is used for the help menu item label name.
     * @param mainApp Instance of MainApplication.
     * @param settings The application settings.
     * @param appName The name of the application.
     */
    constructor(protected mainApp: MainApplication, protected settings: ISettings, protected appName: string) {
        super(mainApp, settings, appName);
        this.mainMenu = new Menu();
        this.mainMenu.append(this.buildFileMenu());
        this.mainMenu.append(this.buildEditMenu());
        this.mainMenu.append(this.buildWindowMenu());
        // this.mainMenu.append(this.buildHelpMenu());
    }

    /**
     * Build File sub menu.
     * @returns The File menu item/submenu items.
     */
    private buildFileMenu(): MenuItem {
        const fileMenu = new Menu();
        fileMenu.append(new MenuItem({
            role: "about", // eslint-disable-line jsdoc/require-jsdoc
        }));
        fileMenu.append(this.getSeparator());
        // fileMenu.append(new MenuItem({
        //     label: "Preferences ...",
        //     accelerator: "Ctrl+,",
        // }));
        // fileMenu.append(this.getSeparator());
        fileMenu.append(new MenuItem({
            role: "quit", // eslint-disable-line jsdoc/require-jsdoc
            // Why does this have to be set manually for role quit?
            accelerator: "Alt+F4", // eslint-disable-line jsdoc/require-jsdoc
        }));
        return new MenuItem({
            role: "fileMenu", // eslint-disable-line jsdoc/require-jsdoc
            submenu: fileMenu, // eslint-disable-line jsdoc/require-jsdoc
        });
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    private buildEditMenu(): MenuItem {
        const editMenu: Menu = super.getEditMenu();
        return new MenuItem({
            role: "editMenu", // eslint-disable-line jsdoc/require-jsdoc
            submenu: editMenu, // eslint-disable-line jsdoc/require-jsdoc
        });
    }

    /**
     * Build Window sub menu.
     * @returns The Window menu item/submenu items.
     */
    private buildWindowMenu(): MenuItem {
        const windowMenu = new Menu();
        windowMenu.append(new MenuItem({
            role: "minimize", // eslint-disable-line jsdoc/require-jsdoc
        }));
        windowMenu.append(new MenuItem({
            role: "close", // eslint-disable-line jsdoc/require-jsdoc
        }));
        windowMenu.append(new MenuItem({
            role: "togglefullscreen", // eslint-disable-line jsdoc/require-jsdoc
        }));
        windowMenu.append(this.getSeparator());
        windowMenu.append(new MenuItem({
            role: "zoomIn", // eslint-disable-line jsdoc/require-jsdoc
        }));
        windowMenu.append(new MenuItem({
            role: "zoomOut", // eslint-disable-line jsdoc/require-jsdoc
        }));
        windowMenu.append(new MenuItem({
            role: "resetZoom", // eslint-disable-line jsdoc/require-jsdoc
        }));
        // windowMenu.append(this.getSeparator());
        // windowMenu.append(this.getShowAddressBarMenu("mod+t"));
        return new MenuItem({
            role: "window", // eslint-disable-line jsdoc/require-jsdoc
            submenu: windowMenu, // eslint-disable-line jsdoc/require-jsdoc
        });
    }

    /**
     * Build Help sub menu.
     * @returns The Help menu item/submenu items.
     */
    // private buildHelpMenu(): MenuItem {
    //     const helpMenu: Menu = super.getHelpMenu("F1");
    //     helpMenu.insert(0, new MenuItem({
    //         role: "about", // eslint-disable-line jsdoc/require-jsdoc
    //     }));
    //     helpMenu.insert(1, super.getSeparator());
    //     return new MenuItem({
    //         role: "help", // eslint-disable-line jsdoc/require-jsdoc
    //         submenu: helpMenu, // eslint-disable-line jsdoc/require-jsdoc
    //     });
    // }

}
