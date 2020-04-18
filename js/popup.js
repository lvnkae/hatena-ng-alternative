/*!
 *  @brief  バッジ(拡張機能入れるとchromeメニューバーに出るアイコン)管理クラス
 */
class Badge  {

    constructor() {
        // 右クリックメニューが残ってしまうので非表示指示を出しとく
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
    }
    
    update(storage) {
        if (storage.json.active) {
            chrome.browserAction.setIcon({ path : "../img/badge_on.png"});
        } else {
            chrome.browserAction.setIcon({ path : "../img/badge_off.png"});
        }
    }
};

/*!
 *  @brief  popup.js本体
 */
class Popup {

    constructor() {
        this.initialize();
    }

    initialize() {
        this.badge = new Badge();
        this.storage = new StorageData();
        this.storage.load().then(()=> {
            this.updateCheckbox();
            this.updateTextarea();
            this.badge.update(this.storage);
        });
        this.textarea_ex_title_val = [];
        this.ex_title_domain = '';
        //
        this.checkbox_sw_filter().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_thumbnail().change(()=> {
            this.button_save_enable();
        });
        //
        this.selectbox_filter().change(()=> {
            this.selectbox_filter_change();
        });
        //
        this.textarea_filter_domain().keyup(()=> {
            this.textarea_filter_domain_keyup();
        });
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_title_keyup();
        });
        this.textarea_filter_user().keyup(()=> {
            this.textarea_filter_user_keyup();
        });
        this.textarea_filter_comment().keyup(()=> {
            this.textarea_filter_comment_keyup();
        });
        this.textarea_filter_ex_title().keyup(()=> {
            this.textarea_filter_ex_title_keyup();
        });
        this.textarea_filter_domain().dblclick(()=> {
            this.textarea_filter_domain_dblclick();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
    }

    checkbox_sw_filter() {
        return  $("input[name=sw_filter]");
    }
    checkbox_sw_thumbnail() {
        return  $("input[name=sw_thumbnail]");
    }

    textarea_filter_domain() {
        return $("textarea[name=filter_domain]");
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
    textarea_filter_ex_title() {
        return $("textarea[name=filter_ex_title]");
    }
    textarea_filter_domain_keyup() {
        if (this.textarea_filter_domain().val() != this.storage.ng_domain_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_title_keyup() {
        if (this.textarea_filter_title().val() != this.storage.ng_title_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_user_keyup() {
        if (this.textarea_filter_user().val() != this.storage.ng_user_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_comment_keyup() {
        if (this.textarea_filter_comment().val() != this.storage.ng_comment_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_ex_title_keyup() {
        if (this.textarea_filter_ex_title().val()
            != this.textarea_ex_title_val[this.ex_title_domain]) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_domain_dblclick() {
        var t = this.textarea_filter_domain();
        const domain
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (domain == null) {
            return;
        }
        // 前ex_titleの後始末
        if (this.ex_title_domain != '') {
            var prev_domain = this.ex_title_domain;
            this.textarea_ex_title_val[prev_domain] = this.textarea_filter_ex_title().val();
            //
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_title() + "]";
            $(key).remove();
        }
        this.ex_title_domain = domain;
        // selectboxに「$(domain)の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_title();
            const max_disp_domain = 32;
            const text = domain.slice(0, max_disp_domain) + 'の非表示タイトル';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // ex_title用textareaの準備
        {
            if (domain in this.textarea_ex_title_val) {
                this.textarea_filter_ex_title().val(this.textarea_ex_title_val[domain]);
            } else {
                this.textarea_filter_ex_title().val('');
                this.textarea_ex_title_val[domain] = '';
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_title());
        this.selectbox_filter_change();
    }

    selectbox_filter_key() {
        return "select[name=select_filter]";
    }
    selectbox_filter() {
        return $(this.selectbox_filter_key());
    }
    is_selected_ng_domain() {
        return this.selectbox_filter().val() == "ng_domain";
    }
    is_selected_ng_title() {
        return this.selectbox_filter().val() == "ng_title";
    }
    is_selected_ng_user() {
        return this.selectbox_filter().val() == "ng_user";
    }
    is_selected_ng_comment() {
        return this.selectbox_filter().val() == "ng_comment";
    }
    selectbox_value_ex_title() {
        return "ng_ex_title";
    }
    selectbox_filter_change()
    {
        if (this.is_selected_ng_domain()) {
            this.textarea_filter_domain().show();
            this.textarea_filter_title().hide();
            this.textarea_filter_user().hide();
            this.textarea_filter_comment().hide();
            this.textarea_filter_ex_title().hide();
        } else if (this.is_selected_ng_title()) {
            this.textarea_filter_domain().hide();
            this.textarea_filter_title().show();
            this.textarea_filter_user().hide();
            this.textarea_filter_comment().hide();
            this.textarea_filter_ex_title().hide();
        } else if (this.is_selected_ng_user()) {
            this.textarea_filter_domain().hide();
            this.textarea_filter_title().hide();
            this.textarea_filter_user().show();
            this.textarea_filter_comment().hide();
            this.textarea_filter_ex_title().hide();
        } else if (this.is_selected_ng_comment()) {
            this.textarea_filter_domain().hide();
            this.textarea_filter_title().hide();
            this.textarea_filter_user().hide();
            this.textarea_filter_comment().show();
            this.textarea_filter_ex_title().hide();
        } else {
            this.textarea_filter_domain().hide();
            this.textarea_filter_title().hide();
            this.textarea_filter_user().hide();
            this.textarea_filter_comment().hide();
            this.textarea_filter_ex_title().show();
        }
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_click() {
        this.storage.clear();
        if (this.ex_title_domain != '') {
            this.textarea_ex_title_val[this.ex_title_domain] = this.textarea_filter_ex_title().val();
        }
        //
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_domain().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_url = {};
                    ng_url.keyword = word;
                    if (word in this.textarea_ex_title_val) {
                        ng_url.black_titles =
                            text_utility.split_by_new_line(this.textarea_ex_title_val[word]);
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
            var filter = text_utility.split_by_new_line(this.textarea_filter_title().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_title.push(word);
                }
            }
        }
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_user().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_user.push(word);
                }
            }
        }
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_comment().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_comment.push(word);
                }
            }
        }
        this.storage.json.active = this.checkbox_sw_filter().prop("checked");
        this.storage.json.ng_thumbnail = this.checkbox_sw_thumbnail().prop("checked");
        this.storage.save();
        //
        this.button_save_disable();
        this.badge.update(this.storage);
        this.storage.update_text();
    }
    button_save_enable() {
        this.button_save().prop("disabled", false);
    }
    button_save_disable() {
        this.button_save().prop("disabled", true);
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.checkbox_sw_thumbnail().prop("checked", json.ng_thumbnail);
    }

    updateTextarea() {
        this.textarea_filter_domain().val(this.storage.ng_domain_text);
        this.textarea_filter_title().val(this.storage.ng_title_text);
        this.textarea_filter_user().val(this.storage.ng_user_text);
        this.textarea_filter_comment().val(this.storage.ng_comment_text);
        // ex_title用の疑似textarea
        {
            const nlc = text_utility.new_line_code();
            this.textarea_ex_title_val = [];
            for (const ngu of this.storage.json.ng_domain) {
                var bt_text = "";
                for (const bt of ngu.black_titles) {
                    bt_text += bt + nlc;
                }
                this.textarea_ex_title_val[ngu.keyword] = bt_text;
            }

        }
    }
};

var popup = new Popup();
