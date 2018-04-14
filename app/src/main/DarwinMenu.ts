import { Menu, MenuItem } from "electron";
import { ApplicationMenu } from "./ApplicationMenu";

/**
 * The menu for the application on Darwin platforms.
 */
export class DarwinMenu extends ApplicationMenu {

    // PasteAndMatchStyle commonly is only available on Darwin
    private pasteAndMatchStyleMenu: MenuItem;

    /**
     * Build the main menu for Darwin platforms.
     * appName is used for the help menu item label name.
     * @param appName The name of the application.
     */
    constructor(protected appName: string) {
        super(appName);
        this.mainMenu = new Menu();
        this.mainMenu.append(this.buildAppMenu());
        this.mainMenu.append(this.buildEditMenu());
        this.mainMenu.append(this.buildWindowMenu());
        //this.mainMenu.append(this.buildHelpMenu());
	}

    /**
     * Get the PasteAndMatchStyle menu item.
     * @property The Paste menu.
     */
    public get PasteAndMatchStyleMenu(): MenuItem {
        return this.pasteAndMatchStyleMenu;
    }

    /**
     * Build Application sub menu.
     * @returns The Application menu item/submenu items.
     */
    private buildAppMenu(): MenuItem {
        const appMenu = new Menu();
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
            role: "hideothers",
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
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    private buildEditMenu(): MenuItem {
        const editMenu: Menu = super.getEditMenu();
        this.pasteAndMatchStyleMenu = new MenuItem({
            role: "pasteandmatchstyle",
        });
        editMenu.append(this.pasteAndMatchStyleMenu);
        return new MenuItem({
            label: "Edit", // Why doesn't this have a builtin translation based on role like windowMenu and help
            submenu: editMenu,
        });
    }

    /**
     * Build Window sub menu.
     * @returns The Window menu item/submenu items.
     */
    private buildWindowMenu(): MenuItem {
        const windowMenu = new Menu();
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
			role: "zoomin",
        }));
        windowMenu.append(new MenuItem({
		    role: "zoomout",
        }));
        windowMenu.append(new MenuItem({
			role: "resetzoom",
        }));
        windowMenu.append(this.getSeparator());
        windowMenu.append(new MenuItem({
			role: "front",
        }));
        return new MenuItem({
            submenu: windowMenu,
            role: "window",
        });
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    // private buildHelpMenu(): MenuItem {
    //     const helpMenu: Menu = super.getHelpMenu("Cmd+?");
    //     return new MenuItem({
    //         role: "help",
    //         submenu: helpMenu,
    //     });
    // }

}
