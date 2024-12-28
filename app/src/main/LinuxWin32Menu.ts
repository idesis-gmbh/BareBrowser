import { Menu, MenuItem } from "electron";
import { APP_INFO } from "../shared/AppInfo";
import { ISettings } from "../shared/Settings";
import { ApplicationMenu } from "./ApplicationMenu";
import { MainApplication } from "./MainApplication";

/**
 * The menu for the application on Linux/Windows platforms.
 */
export class LinuxWin32Menu extends ApplicationMenu {
    /**
     * Build the main menu for Linux/Windows platforms.
     * appName is used for the help menu item label name.
     * @param mainApp Instance of MainApplication.
     * @param settings The application settings.
     * @param appName The name of the application.
     */
    constructor(protected override mainApp: MainApplication, protected override settings: ISettings, protected override appName: string) {
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
        /* eslint-disable jsdoc/require-jsdoc */
        fileMenu.append(new MenuItem({
            role: "about",
        }));
        fileMenu.append(this.getSeparator());
        // fileMenu.append(new MenuItem({
        //     label: "Preferences ...",
        //     accelerator: "Ctrl+,",
        // }));
        // fileMenu.append(this.getSeparator());
        fileMenu.append(new MenuItem({
            role: "quit",
            // Why does this have to be set manually for role quit?
            accelerator: APP_INFO.Platform === "linux" ? "Ctrl+Q" : "Alt+F4",
        }));
        return new MenuItem({
            role: "fileMenu",
            submenu: fileMenu,
        });
        /* eslint-enable */
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    private buildEditMenu(): MenuItem {
        const editMenu: Menu = super.getEditMenu();
        /* eslint-disable jsdoc/require-jsdoc */
        return new MenuItem({
            role: "editMenu",
            submenu: editMenu,
        });
        /* eslint-enable */
    }

    /**
     * Build Window sub menu.
     * @returns The Window menu item/submenu items.
     */
    private buildWindowMenu(): MenuItem {
        const windowMenu = new Menu();
        /* eslint-disable jsdoc/require-jsdoc */
        windowMenu.append(new MenuItem({
            role: "minimize",
        }));
        windowMenu.append(new MenuItem({
            role: "close",
        }));
        windowMenu.append(new MenuItem({
            role: "togglefullscreen",
        }));
        windowMenu.append(this.getSeparator());
        windowMenu.append(new MenuItem({
            role: "zoomIn",
        }));
        windowMenu.append(new MenuItem({
            role: "zoomOut",
        }));
        windowMenu.append(new MenuItem({
            role: "resetZoom",
        }));
        // windowMenu.append(this.getSeparator());
        // windowMenu.append(this.getShowAddressBarMenu("mod+t"));
        return new MenuItem({
            role: "window",
            submenu: windowMenu,
        });
        /* eslint-enable */
    }

    /**
     * Build Help sub menu.
     * @returns The Help menu item/submenu items.
     */
    // private buildHelpMenu(): MenuItem {
    //     const helpMenu: Menu = super.getHelpMenu("F1");
    //     helpMenu.insert(0, new MenuItem({
    //         role: "about", 
    //     }));
    //     helpMenu.insert(1, super.getSeparator());
    //     return new MenuItem({
    //         role: "help", 
    //         submenu: helpMenu, 
    //     });
    // }
}
