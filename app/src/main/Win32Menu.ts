import { Menu, MenuItem } from "electron";
import { ApplicationMenu } from "./ApplicationMenu";

/**
 * The menu for the application on Win32 platforms.
 */
export class Win32Menu extends ApplicationMenu {

    /**
     * Build the main menu for Win32 platforms.
     * appName is used for the help menu item label name.
     * @param appName The name of the application.
     */
    constructor(protected appName: string) {
        super(appName);
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
        // fileMenu.append(new MenuItem({
        //     label: "Preferences ...",
        //     accelerator: "Ctrl+,",
        // }));
        // appMenu.append(this.getSeparator());
        fileMenu.append(new MenuItem({
            role: "quit",
            accelerator: "Alt+F4", // Why does this have to be set manually for role quit?
        }));
        return new MenuItem({
            label: "File",
            submenu: fileMenu,
        });
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
     */
    private buildEditMenu(): MenuItem {
        const editMenu: Menu = super.getEditMenu();
        return new MenuItem({
            label: "Edit", // Why doesn't this have a builtin translation based on role like windowMenu and help?
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
        return new MenuItem({
            role: "window",
            submenu: windowMenu,
        });
    }

    /**
     * Build Edit sub menu.
     * @returns The Edit menu item/submenu items.
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
