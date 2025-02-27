import { Menu, MenuItem } from "electron";
import { IPC_MAIN_RENDERER } from "../shared/IPC";
import { ISettings } from "../shared/Settings";
import { MainApplication } from "./MainApplication";

/**
 * General application menu (items) on all platforms.
 */
export abstract class ApplicationMenu {
    /**
     * Basic menu common for all platforms.
     */
    protected mainMenu: Menu;
    private undoMenu: MenuItem;
    private redoMenu: MenuItem;
    private cutMenu: MenuItem;
    private copyMenu: MenuItem;
    private pasteMenu: MenuItem;
    private selectAllMenu: MenuItem;
    // private showAddressBarMenu: MenuItem;

    /**
     * Build basic main menu parts common for all platforms.
     * @param mainApp Instance of MainApplication.
     * @param settings The application settings.
     * @param appName The name of the application. `appName` can be used for building special menu
     * item entries.
     */
    constructor(protected mainApp: MainApplication, protected settings: ISettings, protected appName: string) { }

    /**
     * Get the application menu. Since it only contains items common to all platforms it has to be
     * extended with items specific for the respective platform (app menu, help menu, ...).
     */
    public get Menu(): Menu {
        return this.mainMenu;
    }

    /**
     * Get the Undo menu item.
     */
    public get Undo(): MenuItem {
        return this.undoMenu;
    }

    /**
     * Get the Redo menu item.
     */
    public get Redo(): MenuItem {
        return this.redoMenu;
    }

    /**
     * Get the Cut menu item.
     */
    public get Cut(): MenuItem {
        return this.cutMenu;
    }

    /**
     * Get the Copy menu item.
     */
    public get Copy(): MenuItem {
        return this.copyMenu;
    }

    /**
     * Get/set the Paste menu item.
     */
    public get Paste(): MenuItem {
        return this.pasteMenu;
    }

    /**
     * Get the Select all menu item.
     */
    public get SelectAll(): MenuItem {
        return this.selectAllMenu;
    }

    /**
     * Build Edit submenu.
     * @returns The Edit menu.
     */
    public getEditMenu(): Menu {
        const editMenu = new Menu();
        /* eslint-disable jsdoc/require-jsdoc */
        this.undoMenu = new MenuItem({
            role: "undo",
        });
        editMenu.append(this.undoMenu);
        this.redoMenu = new MenuItem({
            role: "redo",
        });
        editMenu.append(this.redoMenu);
        editMenu.append(this.getSeparator());
        this.cutMenu = new MenuItem({
            role: "cut",
        });
        editMenu.append(this.cutMenu);
        this.copyMenu = new MenuItem({
            role: "copy",
        });
        editMenu.append(this.copyMenu);
        this.pasteMenu = new MenuItem({
            role: "paste",
        });
        editMenu.append(this.pasteMenu);
        this.selectAllMenu = new MenuItem({
            role: "selectAll",
        });
        editMenu.append(this.selectAllMenu);
        /* eslint-enable */
        return editMenu;
    }

    /**
     * Show hide address bar.
     * @param acceleratorStr Keyboard shortcut.
     * @returns Show hide address bar menu item.
     */
    public getShowAddressBarMenu(acceleratorStr: string): MenuItem {
        /* eslint-disable jsdoc/require-jsdoc */
        return new MenuItem({
            label: "Toggle address bar",
            accelerator: acceleratorStr,
            click: () => { this.mainApp.getCurrentWindow()?.webContents.send(IPC_MAIN_RENDERER, ""); },
        });
        /* eslint-enable */
    }

    /**
     * Build Help submenu.
     * @param acceleratorStr Shortcut for help menu.
     * @returns The Help menu.
     */
    public getHelpMenu(acceleratorStr: string): Menu {
        const helpMenu = new Menu();
        /* eslint-disable jsdoc/require-jsdoc */
        helpMenu.append(new MenuItem({
            role: "help",
            // label: `${this.appName}-Help`, 
            accelerator: acceleratorStr,
        }));
        /* eslint-enable */
        return helpMenu;
    }

    /**
     * Get a separator.
     * @returns A menu separator.
     */
    protected getSeparator(): MenuItem {
        return new MenuItem({
            type: "separator", // eslint-disable-line jsdoc/require-jsdoc
        });
    }
}
