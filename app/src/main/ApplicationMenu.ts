import { Menu, MenuItem } from "electron";

/**
 * General application menu (items) on all platforms
 */
export class ApplicationMenu {

	protected mainMenu: Menu;
    private undoMenu:  MenuItem;
    private redoMenu:  MenuItem;
    private cutMenu: MenuItem;
    private copyMenu: MenuItem;
    private pasteMenu: MenuItem;
    private selectAllMenu: MenuItem;

    /**
     * Build basic main menu parts common for all platforms.
     * appName can be used for building special menu item entries.
     * @param {string} appName The name of the application
     */
    constructor(protected appName: string) { }

    /**
     * Get the application menu.
     * Since it only contains items common to all platforms it has to be extended
     * with items specific for the respective platform (app menu, help menu, ...).
     * @property {Menu} The main menu.
     */
    public get Menu(): Menu {
        return this.mainMenu;
    }

    /**
     * Get the Undo menu item.
     * @property {MenuItem} The Undo menu item.
     */
    public get Undo(): MenuItem {
        return this.undoMenu;
    }

    /**
     * Get the Redo menu item.
     * @property {MenuItem} The Redo menu item.
     */
    public get Redo(): MenuItem {
        return this.redoMenu;
    }

    /**
     * Get the Cut menu item.
     * @property {MenuItem} The Cut menu item.
     */
    public get Cut(): MenuItem {
        return this.cutMenu;
    }

    /**
     * Get the Copy menu item.
     * @property {MenuItem} The Copy menu item.
     */
    public get Copy(): MenuItem {
        return this.copyMenu;
    }

    /**
     * Get the Paste menu item.
     * @property {MenuItem} The Paste menu item.
     */
    public get Paste(): MenuItem {
        return this.pasteMenu;
    }

    /**
     * Get the Select all menu item.
     * @property {MenuItem} The Select all menu item.
     */
    public get SelectAll(): MenuItem {
        return this.selectAllMenu;
    }

    /**
     * Build Edit submenu.
     * @returns {Menu} The Edit submenu.
     */
    public getEditMenu(): Menu {
        const editMenu = new Menu();
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
            role: "selectall",
        });
        editMenu.append(this.selectAllMenu);
        return editMenu;
    }

    /**
     * Build Help submenu.
     * @returns {Menu} The Help submenu.
     */
    public getHelpMenu(acceleratorStr: string): Menu {
        const helpMenu = new Menu();
        helpMenu.append(new MenuItem({
            role: "help",
            label: `${this.appName}-Help`,
            accelerator: acceleratorStr,
        }));
        return helpMenu;
    }

    /**
     * Get a separator.
     * @returns {MenuItem} A separator.
     */
    protected getSeparator(): MenuItem {
        return new MenuItem({
            type: "separator",
        });
    }
}

