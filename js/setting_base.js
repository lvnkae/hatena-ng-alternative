/*!
 *  @brief  設定関連ベースクラス
 */
class SettingBase {

    constructor() {
        this.initialize();
    }
    initialize() {
        this.storage = new StorageData();
        this.ex_domain_buffer = [];        // 非表示domain詳細設定バッファ(個別非表示タイトル)
        this.ex_domain_last = '';          // 最後に「非表示domain詳細設定」画面を開いたdomain(word)
    }

    get_flag_enable_filter() { return true; }
    get_flag_disable_thumbnail() { return false; }

    textarea_filter_domain() {
        return $("textarea[name=filter_domain]");
    }
    textarea_filter_ex_domain() {
        return $("textarea[name=filter_ex_domain]");
    }
    textarea_filter_title() {
        return $("textarea[name=filter_title]");
    }
    textarea_filter_user() {
        return $("textarea[name=filter_user]");
    }
    textarea_filter_comment() {
        return $("textarea[name=filter_comment]");
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_enable() {
        this.button_save().prop("disabled", false);
    }
    button_save_disable() {
        this.button_save().prop("disabled", true);
    }
    button_import() {
        return $("button[name=req_import]");
    }
    button_import_enable() {
        this.button_import().prop("disabled", false);
    }
    button_import_disable() {
        this.button_import().prop("disabled", true);
    }

    static reset_textarea_caret(t) {
        if (t.length <= 0) {
            return;
        }
        t[0].setSelectionRange(0,0);
    }

    /*!
     *  @brief  textarea用疑似カーソル更新
     *  @param  t       textarea
     *  @param  cursor  カーソル(取得関数)
     */
    static update_cursor(t, cursor) {
        if (t.length <= 0) {
            cursor().hide();
            return;
        }
        const t_elem = t[0];
        const word
            = text_utility.search_text_connected_by_new_line(
                t_elem.selectionStart,
                t.val());
        if (word == null) {
            cursor().hide();
            return;
        }
        const font_size = parseInt(DOMUtil.get_font_size(t));
        const line_height = DOMUtil.get_line_height(t);
        const caret_row = DOMUtil.get_caret_row(t);
        const scroll = t_elem.scrollTop;
        const t_width = t_elem.clientWidth;
        const t_height = t_elem.clientHeight;
        let margin = (caret_row)*(line_height)-scroll+1.6;
        let height = font_size+2;
        // スクロール対応
        // - 上下にはみ出た分縮める
        // - 完全に出たらhide
        if (margin < 0) {
            height += margin;
            if (height <= 0) {
                cursor().hide();
                return;
            }
            margin = 0;
        } else if (margin > (t_height-height)) {
            height = t_height-margin;
            if (height <= 0) {
                cursor().hide();
                return;
            }
        }
        //
        const width = t_width;
        const sty = "top:" + margin + "px;"
                    + "width:" + width + "px;"
                    + "height:" + height +"px";
        cursor().attr("style", sty);
    }
        
    updateTextarea() {
        this.textarea_filter_domain().val(this.storage.ng_domain_text);
        this.textarea_filter_title().val(this.storage.ng_title_text);
        this.textarea_filter_user().val(this.storage.ng_user_text);
        this.textarea_filter_comment().val(this.storage.ng_comment_text);
        {
            const nlc = text_utility.new_line_code_lf();
            this.ex_domain_buffer = [];
            for (const ng_url of this.storage.json.ng_domain) {
                var bt_text = "";
                for (const bt of ng_url.black_titles) {
                    bt_text += bt + nlc;
                }
                this.ex_domain_buffer[ng_url.keyword] = bt_text;
            }
        }
    }

    save() {
        this.storage.clear();
        {
            let filter
                = text_utility.split_by_new_line(this.textarea_filter_domain().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_url = {};
                    ng_url.keyword = word;
                    if (word in this.ex_domain_buffer) {
                        ng_url.black_titles =
                            text_utility.split_by_new_line(this.ex_domain_buffer[word]);
                    } else {
                        ng_url.black_titles = [];
                    }
                    ng_url.sub_dirs = [];
                    //
                    this.storage.json.ng_domain.push(ng_url);
                }
            }
        }
        {
            let filter
                = text_utility.split_by_new_line(this.textarea_filter_title().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_title.push(word);
                }
            }
        }
        {
            let filter
                = text_utility.split_by_new_line(this.textarea_filter_user().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_user.push(word);
                }
            }
        }
        {
            let filter
                = text_utility.split_by_new_line(this.textarea_filter_comment().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_comment.push(word);
                }
            }
        }
        this.storage.json.active = this.get_flag_enable_filter();
        this.storage.json.ng_thumbnail = this.get_flag_disable_thumbnail();
        this.storage.save();
        //
        MessageUtil.send_message_to_relative_tab(
            {command:MessageUtil.command_update_storage()});
        this.storage.update_text();
        this.button_save_disable();
    }
};
