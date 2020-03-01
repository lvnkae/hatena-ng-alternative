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
            browser.storage.local.get((items) => {
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
        browser.storage.local.set(jobj);
    }
    
    clear() {
        this.json = {}
        this.json.active = true;        // フィルタ 有効/無効
        this.json.ng_thumbnail = false; // サムネイル除去 有効/無効
        this.json.mark_owned_star=true; // ★付けたブコメ強調表示 有効/無効
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
        const nlc = text_utility.new_line_code_lf();
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

    /*!
     *  @brief  ドメインフィルタ設定を追加(重複チェックあり)
     *  @param  domain  ドメイン名(128文字上限)
     *  @retval true    storage構成変更があった
     */
    add_domain_filter_with_check(domain) {
        if (this.json.ng_domain == null) {
            this.json.ng_domain = [];
        }
        for (const ngd of this.json.ng_domain) {
            if (ngd.keyword.toLowerCase() == domain.toLowerCase()) {
                return false;
            }
        }
        var ng_url = {};
        ng_url.keyword = domain;
        ng_url.sub_dirs = [];
        ng_url.black_titles = [];
        this.json.ng_domain.push(ng_url);
        return true;
    }

    /*!
     *  @brief  ドメインフィルタ
     *  @param  href    URL
     *  @param  title   タイトル
     *  @note   大文字/小文字区別なし
     */
    domain_filter(href, title) {
        const href_l = href.toLowerCase();
        for (const ngd of this.json.ng_domain) {
            if (href_l.indexOf(ngd.keyword.toLowerCase()) >= 0) {
                if (function(href, sub_dirs) {
                    if (sub_dirs.length == 0) {
                        return true;
                    }
                    for (const subdir of sub_dirs) {
                        if (href.indexOf(subdir) >= 0) {
                            return true;
                        }
                    }
                } (href_l, ngd.sub_dirs)) {
                    if (function(title, black_titles) {
                        if (black_titles.length == 0) {
                            return true;
                        }
                        for (const btitle of black_titles) {
                            if (text_utility.regexp_indexOf(btitle, title)) {
                                return true;
                            }
                        }
                    } (title, ngd.black_titles)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  タイトルフィルタ
     *  @param  title   タイトル
     */
    title_filter(title) {
        for (const ngt of this.json.ng_title) {
            if (text_utility.regexp_indexOf(ngt, title)) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  ユーザ名フィルタ設定を追加(重複チェックあり)
     *  @param  user    ユーザ名(24文字上限)
     *  @retval true    storage構成変更があった
     */
    add_user_filter_with_check(user) {
        if (this.json.ng_user == null) {
            this.json.ng_user = [];
        }
        for (const ngu of this.json.ng_user) {
            if (user == ngu) {
                return false;
            }
        }
        this.json.ng_user.push(user);
        return true;
    }

    /*!
     *  @brief  ユーザ名フィルタ
     *  @param  user    ユーザ名
     *  @note   完全一致
     */
    user_filter(user) {
        if (this.json.ng_user != null) {
            for (const ngu of this.json.ng_user) {
                if (user == ngu) {
                    return true;
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  コメントフィルタ
     *  @param  comment コメントテキスト
     */
    comment_filter(comment) {
        if (this.json.ng_comment != null) {
            for (const ngc of this.json.ng_comment) {
                if (text_utility.regexp_indexOf(ngc, comment)) {
                    return true;
                }
            }
        }
        return false;
    }
}
