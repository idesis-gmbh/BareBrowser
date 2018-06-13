// see https://stackoverflow.com/questions/21892571/data-structure-for-sorted-browsing-history

/**
 * An item in the browser history.
 */
export class BrowserHistoryItem {

    private previous: BrowserHistoryItem | undefined = undefined;
    private next: BrowserHistoryItem | undefined = undefined;

    /**
     * Ctor.
     * @param url The URL of the browser history item.
     * @param timestamp The timestamp of the browser history item.
     */
    constructor(private url: string, private timestamp: number) { }

    /**
     * URL property.
     */
    public get URL(): string {
        return this.url;
    }
    public set URL(value: string) {
        this.url = value;
    }

    /**
     * Previous property.
     */
    public get Previous(): BrowserHistoryItem | undefined {
        return this.previous;
    }
    public set Previous(value: BrowserHistoryItem | undefined) {
        this.previous = value;
    }

    /**
     * Next property.
     */
    public get Next(): BrowserHistoryItem | undefined {
        return this.next;
    }
    public set Next(value: BrowserHistoryItem | undefined) {
        this.next = value;
    }

    /**
     * Timestamp property.
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
// tslint:disable-next-line:max-classes-per-file
export class BrowserHistory {

    private first: BrowserHistoryItem;
    private last: BrowserHistoryItem;
    private rootItem: BrowserHistoryItem;
    private items: Map<string, BrowserHistoryItem>;

    /**
     * Ctor.
     * @param rootURL The URL of the initial item.
     */
    constructor(rootURL: string) {
        this.items = new Map<string, BrowserHistoryItem>();
        this.rootItem = new BrowserHistoryItem(rootURL, Date.now());
        this.items.set(rootURL, this.rootItem);
        this.first = this.rootItem;
        this.last = this.first;
    }

    /**
     * Size property.
     */
    public get Size(): number {
        return this.items.size;
    }

    /**
     * Adds or updates a browser history item.
     * @param url The URL of the item to be added or updated.
     * @returns The new or updated browser history item.
     */
    public addOrUpdateItem(url: string): BrowserHistoryItem {
        let item: BrowserHistoryItem | undefined = this.items.get(url);
        if (item !== undefined) {
          item.Timestamp = Date.now();
          if (item.Next !== undefined) {
              item.remove();
          } else {
              // this.logHistory();
              return item;
          }
        } else {
          item = new BrowserHistoryItem(url, Date.now());
          this.items.set(url, item);
        }
        this.last.Next = item;
        item.Previous = this.last;
        this.last = item;
        // this.logHistory();
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
