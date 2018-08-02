/*!
 *  @brief  content.js本体
 */
class Content {

    constructor() {
        this.filter = new HatenaBookmarkFilter();
        this.kick();
    }

    kick() {
        this.filter.load();
    }
}

var gContent = new Content();
