// see https://stackoverflow.com/questions/21892571/data-structure-for-sorted-browsing-history

/**
 * An item in the browser history.
 */
export class BrowserHistoryItem {

    private previous: BrowserHistoryItem | undefined = undefined;
    private next: BrowserHistoryItem | undefined = undefined;

    /**
     * Ctor.
     * @param {string} url The URL of the browser history item.
     * @param {number} timestamp The timestamp of the browser history item.
     */
    constructor(private url: string, private timestamp: number) { }

    /**
     * URL property.
     * @property {string} The URL.
     */
    public get URL(): string {
        return this.url;
    }
    public set URL(value: string) {
        this.url = value;
    }

    /**
     * Previous property.
     * @property {BrowserHistoryItem} The previous item.
     */
    public get Previous(): BrowserHistoryItem | undefined {
        return this.previous;
    }
    public set Previous(value: BrowserHistoryItem | undefined) {
        this.previous = value;
    }

    /**
     * Next property.
     * @property {BrowserHistoryItem} The next item.
     */
    public get Next(): BrowserHistoryItem | undefined{
        return this.next;
    }
    public set Next(value: BrowserHistoryItem | undefined) {
        this.next = value;
    }

    /**
     * Timestamp property.
     * @property {number} The timestamp.
     */
    public get Timestamp(): number {
        return this.timestamp;
    }
    public set Timestamp(value: number) {
        this.timestamp = value;
    }

    /**
     * "Remove" an item. Actually it won't be removed, only the links are updated.
     */
    public remove(): void {
        if (this.previous) {
            this.previous.next = this.next;
        }
        if (this.next) {
            this.next.previous = this.previous;
        }
        this.next = undefined;
        this.previous = undefined;
      }

}

/**
 * A primitive browser history implementation.
 */
export class BrowserHistory {

    private first: BrowserHistoryItem;
    private last: BrowserHistoryItem;
    private rootItem: BrowserHistoryItem;
    private items: Map<String, BrowserHistoryItem>;

    /**
     * Ctor.
     * @param {string} rootURL The URL of the initial item.
     */
    constructor(rootURL: string) {
        this.items = new Map<String, BrowserHistoryItem>();
        this.rootItem = new BrowserHistoryItem(rootURL, Date.now());
        this.items.set(rootURL, this.rootItem);
        this.first = this.rootItem;
        this.last = this.first;
    }

    /**
     * Size property.
     * @property {number} The number of entries in this history.
     */
    public get Size(): number {
        return this.items.size;
    }

    /**
     * Adds or updates a browser history item.
     * @param {string} url The URL of the item to be added or updated.
     * @returns {BrowserHistoryItem} The new or updated browser history item.
     */
    public addOrUpdateItem(url: string): BrowserHistoryItem {
        let item: BrowserHistoryItem | undefined = this.items.get(url);
        if (item !== undefined) {
          item.Timestamp = Date.now();
          if (item.Next !== undefined) {
              item.remove();
          } else {
              //this.logHistory();
              return item;
          }
        } else {
          item = new BrowserHistoryItem(url, Date.now());
          this.items.set(url, item);
        }
        this.last.Next = item;
        item.Previous = this.last;
        this.last = item;
        //this.logHistory();
        return item;
    }

    /**
     * Clear the history and add the initial item.
     */
    public clear(): void {
        this.items.clear();
        this.items.set(this.rootItem.URL, this.rootItem);
    }

    /**
     * Print history content.
     */
    public logHistory(): void {
        this.items.forEach((element) => {
            console.info("### History item: "
                + element.URL + " / " + element.Timestamp
                + " Previous: " + (element.Previous ? element.Previous.URL : "<none>")
                + " Next: " + (element.Next ? element.Next.URL : "<none>"),
            );
        });
    }

}
