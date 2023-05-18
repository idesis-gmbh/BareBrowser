import { Menu, MenuItem } from "electron";
import { ISettings } from "../shared/Settings";
import { ApplicationMenu } from "./ApplicationMenu";
import { MainApplication } from "./MainApplication";

/**
 * The menu for the application on Darwin platforms.
 */
export class DarwinMenu extends ApplicationMenu {

    // PasteAndMatchStyle commonly is only available on Darwin
    private pasteAndMatchStyleMenu: MenuItem;

    /**
     * Build the main menu for Darwin platforms.
     * appName is used for the help menu item label name.
     * @param mainApp Instance of MainApplication.
     * @param settings The application settings.
     * @param appName The name of the application.
     */
    constructor(protected mainApp: MainApplication, protected settings: ISettings, protected appName: string) {
        super(mainApp, settings, appName);
        this.mainMenu = new Menu();
        this.mainMenu.append(this.buildAppMenu());
        this.mainMenu.append(this.buildEditMenu());
        this.mainMenu.append(this.buildWindowMenu());
        // this.mainMenu.append(this.buildHelpMenu());
    }

    /**
     * Get the PasteAndMatchStyle menu item.
     */
    public get PasteAndMatchStyleMenu(): MenuItem {
        return this.pasteAndMatchStyleMenu;
    }

    /**
     * Build Application sub menu.
     * @returns The Application menu.
     */
    private buildAppMenu(): MenuItem {
        const appMenu = new Menu();
        appMenu.append(new MenuItem({
            role: "about", // eslint-disable-line jsdoc/require-jsdoc
        }));
        // appMenu.append(this.getSeparator());
        // appMenu.append(new MenuItem({
        //     label: "Preferences ...",
        //     accelerator: "Cmd+,",
        // }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "services", // eslint-disable-line jsdoc/require-jsdoc
            submenu: new Menu(), // eslint-disable-line jsdoc/require-jsdoc
        }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "hide", // eslint-disable-line jsdoc/require-jsdoc
        }));
        appMenu.append(new MenuItem({
            role: "hideOthers", // eslint-disable-line jsdoc/require-jsdoc
        }));
        appMenu.append(new MenuItem({
            role: "unhide", // eslint-disable-line jsdoc/require-jsdoc
        }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "quit", // eslint-disable-line jsdoc/require-jsdoc
        }));
        return new MenuItem({
            label: "App", // eslint-disable-line jsdoc/require-jsdoc
            submenu: appMenu, // eslint-disable-line jsdoc/require-jsdoc
        });
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    private buildEditMenu(): MenuItem {
        const editMenu: Menu = super.getEditMenu();
        this.pasteAndMatchStyleMenu = new MenuItem({
            role: "pasteAndMatchStyle", // eslint-disable-line jsdoc/require-jsdoc
        });
        editMenu.append(this.pasteAndMatchStyleMenu);
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
            role: "zoom", // eslint-disable-line jsdoc/require-jsdoc
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
        windowMenu.append(this.getSeparator());
        windowMenu.append(new MenuItem({
            role: "front", // eslint-disable-line jsdoc/require-jsdoc
        }));
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
    //     const helpMenu: Menu = super.getHelpMenu("Cmd+?");
    //     return new MenuItem({
    //         role: "help",
    //         submenu: helpMenu,
    //     });
    // }

}
