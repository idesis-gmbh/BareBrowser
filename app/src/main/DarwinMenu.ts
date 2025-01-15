import { Menu, MenuItem } from "electron";
import { ISettings } from "../shared/Settings";
import { ApplicationMenu } from "./ApplicationMenu";
import { MainApplication } from "./MainApplication";

/**
 * The menu for the application on Darwin platforms.
 */
export class DarwinMenu extends ApplicationMenu {
    // PasteAndMatchStyle commonly is only available on Darwin.
    private pasteAndMatchStyleMenu: MenuItem;

    /**
     * Build the main menu for Darwin platforms.
     * appName is used for the help menu item label name.
     * @param mainApp Instance of MainApplication.
     * @param settings The application settings.
     * @param appName The name of the application.
     */
    constructor(protected override mainApp: MainApplication, protected override settings: ISettings, protected override appName: string) {
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
        /* eslint-disable jsdoc/require-jsdoc */
        appMenu.append(new MenuItem({
            role: "about",
        }));
        // appMenu.append(this.getSeparator());
        // appMenu.append(new MenuItem({
        //     label: "Preferences ...",
        //     accelerator: "Cmd+,",
        // }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "services",
            submenu: new Menu(),
        }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "hide",
        }));
        appMenu.append(new MenuItem({
            role: "hideOthers",
        }));
        appMenu.append(new MenuItem({
            role: "unhide",
        }));
        appMenu.append(this.getSeparator());
        appMenu.append(new MenuItem({
            role: "quit",
        }));
        return new MenuItem({
            label: "App",
            submenu: appMenu,
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
        this.pasteAndMatchStyleMenu = new MenuItem({
            role: "pasteAndMatchStyle",
        });
        editMenu.append(this.pasteAndMatchStyleMenu);
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
            role: "zoom",
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
        windowMenu.append(this.getSeparator());
        windowMenu.append(new MenuItem({
            role: "front",
        }));
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
    //     const helpMenu: Menu = super.getHelpMenu("Cmd+?");
    //     return new MenuItem({
    //         role: "help",
    //         submenu: helpMenu,
    //     });
    // }
}
