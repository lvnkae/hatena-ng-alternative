/*!
 *  @brief  データクラス
 */
class StorageData {

    constructor() {
        this.clear();
    }

    filter_key() {
        return "Filter";
    }

    load() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get((items) => {
                if (this.filter_key() in items) {
                    this.json = JSON.parse(items[this.filter_key()]);
                    this.update_text();
                } else {
                    this.clear();
                }
                resolve();
            });
        }); 
    }

    save() {
        var jobj = {};
        jobj[this.filter_key()] = JSON.stringify(this.json);
        chrome.storage.local.set(jobj);
    }
    
    clear() {
        this.json = {}
        this.json.active = true;        // フィルタ 有効/無効
        this.json.ng_thumbnail = false; // サムネイル除去 有効/無効
        this.json.ng_domain = [];       // ドメインフィルタ
        this.json.ng_title = [];        // タイトルフィルタ
        this.json.ng_user = [];         // ユーザフィルタ
        this.json.ng_comment = [];      // コメントフィルタ

        this.ng_domain_text = "";       // ドメインフィルタを改行コードで連結したテキスト
        this.ng_title_text = "";        // タイトルフィルタを改行コードで連結したテキスト
        this.ng_user_text = "";         // ユーザフィルタを改行コードで連結したテキスト
        this.ng_comment_text = "";      // コメントフィルタを改行コードで連結したテキスト
    }

    update_text() {
        const nlc = text_utility.new_line_code();
        this.ng_domain_text = "";
        for (const ngd of this.json.ng_domain) {
            this.ng_domain_text += ngd.keyword + nlc;
        }
        this.ng_title_text = "";
        for (const ngt of this.json.ng_title) {
            this.ng_title_text += ngt + nlc;
        }
        this.ng_user_text = "";
        if (this.json.ng_user != null) {
            for (const ngu of this.json.ng_user) {
                this.ng_user_text += ngu + nlc;
            }
        }
        this.ng_comment_text = "";
        if (this.json.ng_comment != null) {
            for (const ngc of this.json.ng_comment) {
                this.ng_comment_text += ngc + nlc;
            }
        }
    }
}
