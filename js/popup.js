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
class Popup extends SettingBase {

    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        this.badge = new Badge();
        this.storage.load().then(()=> {
            this.updateCheckbox();
            this.updateTextarea();
            this.badge.update(this.storage);
        });
        //
        this.checkbox_sw_filter().change(()=> {
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
        this.textarea_filter_ex_domain().keyup(()=> {
            this.textarea_filter_ex_domain_keyup();
        });
        this.textarea_filter_domain().dblclick(()=> {
            this.textarea_filter_domain_dblclick();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
        this.button_detail().click(()=> {
            this.button_detail_click();
        });
    }

    checkbox_sw_filter() {
        return  $("input[name=sw_filter]");
    }
    get_flag_enable_filter() {
        return this.checkbox_sw_filter().prop("checked");
    }
    get_flag_disable_thumbnail() {
        return this.flag_disable_thumbnail;
    }

    button_detail() {
        return $("button[name=detail");
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
    textarea_filter_ex_domain_keyup() {
        if (this.textarea_filter_ex_domain().val()
            != this.ex_domain_buffer[this.ex_domain_last]) {
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
        // 前ex_domainの後始末
        if (this.ex_domain_last != '') {
            var prev_domain = this.ex_domain_last;
            this.ex_domain_buffer[prev_domain] = this.textarea_filter_ex_domain().val();
            //
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_title() + "]";
            $(key).remove();
        }
        this.ex_domain_last = domain;
        // selectboxに「$(domain)の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_title();
            const max_disp_domain = 32;
            const text = domain.slice(0, max_disp_domain) + 'の非表示タイトル';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // ex_domain用textareaの準備
        {
            if (domain in this.ex_domain_buffer) {
                this.textarea_filter_ex_domain().val(this.ex_domain_buffer[domain]);
            } else {
                this.textarea_filter_ex_domain().val('');
                this.ex_domain_buffer[domain] = '';
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

    selectbox_value_ex_title() {
        return "ng_ex_title";
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

    hide_textarea_all() {
        this.textarea_filter_domain().hide();
        this.textarea_filter_title().hide();
        this.textarea_filter_user().hide();
        this.textarea_filter_comment().hide();
        this.textarea_filter_ex_domain().hide();
    }
    
    selectbox_filter_change() {
        this.hide_textarea_all();
        this.button_save().show();
        if (this.is_selected_ng_domain()) {
            this.textarea_filter_domain().show();
        } else if (this.is_selected_ng_title()) {
            this.textarea_filter_title().show();
        } else if (this.is_selected_ng_user()) {
            this.textarea_filter_user().show();
        } else if (this.is_selected_ng_comment()) {
            this.textarea_filter_domain().hide();
            this.textarea_filter_comment().show();
        } else {
            this.textarea_filter_ex_domain().show();
        }
    }

    button_save_click() {
        if (this.ex_domain_last != '') {
            this.ex_domain_buffer[this.ex_domain_last] = this.textarea_filter_ex_domain().val();
        }
        this.save();
        //
        this.badge.update(this.storage);
    }

    button_detail_click() {
        chrome.tabs.create({url: './html/dashboard.html'}, tab => {});
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.flag_disable_thumbnail = json.ng_thumbnail;
    }
};

var popup = new Popup();
