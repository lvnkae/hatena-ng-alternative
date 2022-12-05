/*!
 *  @brief  保存データimport/export
 */
class StoragePorter {

    //
    static CSV_TAG_DOMAIN = "NG_ENTRY_DOMAIN=";
    static CSV_TAG_DOMAIN_NG_WORD = "NG_ENTRY_DOMAIN_NG_WORD=";
    static CSV_TAG_TITLE = "NG_ENTRY_TITLE=";
    static CSV_TAG_USER = "NG_HATENA_USER"
    static CSV_TAG_COMMENT = "NG_BOOKMARK_COMMENT=";

    constructor(json) {
        // deep-copy
        this.json = JSON.parse(JSON.stringify(json));        
    }

    /*!
     *  @brief  真偽値を文字列に変換
     */
    static bool_to_string(flag) {
        return (flag) ?"true" :"false";
    }
    /*!
     *  @brief  文字列を真偽値に変換
     *  @retval result  処理の成否
     *  @retval flag    変換した真偽値
     */
    static string_to_bool(str) {
        let ret = { result:false };
        if (str == "true") {
            ret.result = true;
            ret.flag = true;
        } else
        if (str == "false") {
            ret.result = true;
            ret.flag = false;
        }
        return ret;
    }


    /*!
     *  @brief  export用に文字列をencodeする
     *  @note   一部記号をエスケープするだけ
     */
    static encord_for_export(txt) {
        var enc = "";
        [...txt].forEach(c => {
            if (c == "\\") {
                enc += "\\";
            } else if (c== '"') {
                // excelのエスケープにあわせておく
                enc += '"';
            }
            enc += c;
        });
        return enc;
    }
    /*!
     *  @brief  ドメインフィルタ1設定分をcsv形式で出力
     */
    static export_ng_domain_unit(ngd) {
        if (ngd.keyword == "") {
            return "";
        }
        let retcsv = "";
        retcsv += this.CSV_TAG_DOMAIN + ","
               + '"' + this.encord_for_export(ngd.keyword) + '"';
        retcsv += "," + this.CSV_TAG_DOMAIN_NG_WORD;
        for (const ngt of ngd.black_titles) {
            if (ngt != "") {
                retcsv += "," + '"' + this.encord_for_export(ngt) + '"';
            }
        }
        return retcsv;
    }
    /*!
     *  @brief  タイトルフィルタ1設定分をcsv形式で出力
     */
    static export_ng_title_unit(title) {
        if (title == "") {
            return "";
        } else {
            return this.CSV_TAG_TITLE + "," + '"' + this.encord_for_export(title) + '"';
        }
    }
    /*!
     *  @brief  ユーザフィルタ1設定分をcsv形式で出力
     */
    static export_ng_user_unit(ngu) {
        if (ngu == "") {
            return "";
        } else {
            return this.CSV_TAG_USER + "," + '"' + this.encord_for_export(ngu) + '"';
        }
    }
    /*!
     *  @brief  コメントフィルタ1設定分をcsv形式で出力
     */
    static export_ng_comment_unit(ngc) {
        if (ngc == "") {
            return "";
        } else {
            return this.CSV_TAG_COMMENT + "," + '"' + this.encord_for_export(ngc) + '"';
        }
    }
    /*!
     *  @brief  Storage(json)をcsv形式で出力する
     */
    static export(json) {
        let retcsv = "";
        const NLC = text_utility.new_line_code_lf();
        for (const ngd of json.ng_domain) {
            retcsv += this.export_ng_domain_unit(ngd) + NLC;
        }
        for (const title of json.ng_title) {
            retcsv += this.export_ng_title_unit(title) + NLC;
        }
        for (const ngu of json.ng_user) {
            retcsv += this.export_ng_user_unit(ngu) + NLC;
        }
        for (const ngc of json.ng_comment) {
            retcsv += this.export_ng_comment_unit(ngc) + NLC;
        }
        return retcsv;
    }

    /*!
     *  @brief  1行分のimportデータ(csv)を要素ごとに分割
     */
    static split_import_csv_row(row) {
        var split_row = [];
        var in_db_quote = false;
        var db_quote_push = false;
        var in_escape = false;
        var buffer = "";
        [...row].forEach(c=>{
            if (db_quote_push) {
                // prevがdb_quoteだった場合の例外処理
                db_quote_push = false;
                if (c == '"') {
                    // エスケープされてるので1つだけ採用
                    buffer += c;
                    return; // 打ち切り
                } else {
                    // db_quote括り閉じ
                    if (in_db_quote) {
                        in_db_quote = false;
                    }
                }
            }
            if (c == "\\") {
                if (in_escape) {
                    buffer += c;
                    in_escape = false;
                } else {
                    // エスケープ
                    in_escape = true;
                }
            } else if (c == '"') {
                if (in_db_quote) {
                    // 棚上げ
                    db_quote_push = true;
                } else {
                    // db_quote括り開始
                    in_db_quote = true;
                }
            } else if (c == ",") {
                if (in_db_quote) {
                    buffer += c;
                } else {
                    split_row.push(buffer);
                    buffer = "";
                }
            } else {
                buffer += c;
            }
        });
        if (buffer != "") {
            split_row.push(buffer);
        }
        return split_row;
    }
    /*!
     *  @brief  ドメインフィルタ1つ分をsplit_rowから得る
     *  @param  split_row   importデータ1行分を要素ごとに分割したもの
     */
    static get_domain_filter_object(split_row) {
        const SPR_INDEX_DOMAIN = 1;
        const SPR_INDEX_NG_WORD_TAG = 2
        const SPR_INDEX_NG_WORD_TOP = 3;
        let dm_filter = {};
        dm_filter.keyword = split_row[SPR_INDEX_DOMAIN];
        if (split_row[SPR_INDEX_NG_WORD_TAG] == this.CSV_TAG_DOMAIN_NG_WORD) {
            dm_filter.black_titles = [];
            for (var inx = SPR_INDEX_NG_WORD_TOP; inx < split_row.length; inx++) {
                if (split_row[inx] != "") {
                    dm_filter.black_titles.push(split_row[inx]);
                }
            }
        } else {
            return null;
        }
        return dm_filter;
    }

    static search_array(src, key) {
        for (const e of src) {
            if (e == key) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  1行分のimportデータをstorageへ書き込む
     */
    import_row(split_row) {
        if (split_row.length <= 0) {
            return true;
        }
        const SPR_INDEX_TYPE_TAG = 0;
        if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_DOMAIN) {
            const dm_filter = StoragePorter.get_domain_filter_object(split_row);
            if (dm_filter == null) {
                return false;
            }
            for (var obj of this.json.ng_domain) {
                if (obj.keyword == dm_filter.keyword) {
                    for (var key of dm_filter.black_titles) {
                        if (!StoragePorter.search_array(obj.black_titles, key)) {
                            obj.black_titles.push(key);
                        }
                    }
                    return true;
                }
            }
            this.json.ng_domain.push(dm_filter);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_TITLE) {
            const SPR_INDEX_WORD = 1;
            for (const word of this.json.ng_title) {
                if (word == split_row[SPR_INDEX_WORD]) {
                    return true;
                }
            }
            this.json.ng_title.push(split_row[SPR_INDEX_WORD]);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_USER) {
            const SPR_INDEX_USERNAME = 1;
            for (const user of this.json.ng_user) {
                if (user == split_row[SPR_INDEX_USERNAME]) {
                    return true;
                }
            }
            this.json.ng_user.push(split_row[SPR_INDEX_USERNAME]);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_COMMENT) {
            const SPR_INDEX_COMMENT = 1;
            for (const word of this.json.ng_comment) {
                if (word == split_row[SPR_INDEX_COMMENT]) {
                    return true;
                }
            }
            this.json.ng_comment.push(split_row[SPR_INDEX_COMMENT]);
        } else {
            return false;
        }
        return true;
    }
    import(csv) {
        var csv_array = text_utility.split_by_new_line(csv);
        for (const csv_row of csv_array) {
            if (!this.import_row(StoragePorter.split_import_csv_row(csv_row))) {
                return false;
            }
        }
        return true;
    }
}
