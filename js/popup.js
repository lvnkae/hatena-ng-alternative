/*!
 *  @brief  バッジ(拡張機能入れるとchromeメニューバーに出るアイコン)管理クラス
 */
class Badge  {

    constructor() {
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
        //
        this.checkbox_sw_filter().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_thumbnail().change(()=> {
            this.button_save_enable();
        });
        //
        this.selectbox_filter().change(()=> {
            if (this.is_selected_ng_domain()) {
                this.textarea_filter_domain().show();
                this.textarea_filter_title().hide();
            } else if (this.is_selected_ng_title()) {
                this.textarea_filter_domain().hide();
                this.textarea_filter_title().show();
            } else {
                this.textarea_filter_domain().hide();
                this.textarea_filter_title().hide();
            }
        });
        //
        this.textarea_filter_domain().keyup(()=> {
            this.textarea_filter_keyup();
        });
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_keyup();
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
    textarea_filter_keyup() {
        var change = false;
        if (this.is_selected_ng_domain()) {
            const text = this.textarea_filter_domain().val();
            change = text != this.storage.ng_domain_text;
        } else if (this.is_selected_ng_title()) {
            const text = this.textarea_filter_title().val();
            change = text != this.storage.ng_title_text;
        }
        if (change) {
            this.button_save().prop("disabled", false);
        }
    };

    selectbox_filter() {
        return $("select[name=select_filter]");
    }
    is_selected_ng_domain() {
        return this.selectbox_filter().val() == "ng_domain";
    }
    is_selected_ng_title() {
        return this.selectbox_filter().val() == "ng_title";
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_click() {
        this.storage.clear();
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_domain().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_url = {};
                    ng_url.keyword = word;
                    // >ToDo< ドメイン固有タイトルフィルタ/サブディレクトリのインターフェース作成
                    ng_url.black_titles = [];
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
    }
};

var popup = new Popup();
