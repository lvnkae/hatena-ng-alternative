/*!
 *  @brief  拡張機能固有タブ
 */
class Dashboard extends SettingBase {

    constructor() {
        super();
    }

    static textarea_keydown(event, f_keyup) {
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            f_keyup();
        }
    }

    initialize() {
        super.initialize();
        this.add_message_listener();
        this.storage.load().then(()=> {
            this.update_option_checkbox();
            this.updateTextarea();
            this.presetTextarea();
        });
        //
        this.tab_buttons().each((inx, btn)=> {
            $(btn).click(()=> {
                this.tab_selected(btn);
            });
        });
        this.selectbox_imexport().change(()=> {
            this.selectbox_imexport_change();
        });
        //
        this.textarea_filter_domain().keyup(()=> {
            this.textarea_filter_domain_keyup();
        });
        this.textarea_filter_domain().keydown((event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_domain_keyup.bind(this));
        });
        this.textarea_filter_domain().scroll(()=> {
            this.textarea_filter_domain_scroll();
        });
        this.textarea_filter_domain().click(()=> {
            this.textarea_filter_domain_click();
        });
        this.textarea_filter_ex_domain().keyup(()=> {
            this.textarea_filter_ex_domain_keyup();
        });
        //
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_title_keyup();
        });
        this.textarea_filter_user().keyup(()=> {
            this.textarea_filter_user_keyup();
        });
        this.textarea_filter_comment().keyup(()=> {
            this.textarea_filter_comment_keyup();
        });
        //
        this.textarea_import_storage().on('paste',(e)=> {
            this.button_import_enable();
        });
        //
        this.checkbox_disable_thumbnail().change(()=> {
            this.button_save_enable();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
        this.button_import().click(()=> {
            this.button_import_click();
        });
    }

    //
    checkbox_disable_thumbnail() {
        return $("input#disable_thumbnail");
    }
    checkbox_label_disable_thumbnail() {
        return $("label#disable_thumbnail");
    }

    get_flag_enable_filter() {
        return this.flag_enable_filter;
    }
    get_flag_disable_thumbnail() {
        return this.checkbox_disable_thumbnail().prop("checked");
    }
    //
    textarea_export_storage() {
        return $("textarea[name=export_storage]");
    }
    textarea_import_storage() {
        return $("textarea[name=import_storage]");
    }
    tab_buttons() {
        return $("div.tabButtons").find("button");
    }

    cursor_filter_domain() {
        return $("div.cursor#filter_domain");
    }
    subheading_filter_ex_domain() {
        return $("div.subheading#filter_ex_domain");
    }

    pagetop_filter_domain() {
        return $("div.pagetop#filter_domain");
    }
    pagetop_filter_title() {
        return $("div.pagetop#filter_title");
    }
    pagetop_filter_user() {
        return $("div.pagetop#filter_user");
    }
    pagetop_filter_comment() {
        return $("div.pagetop#filter_comment");
    }
    pagetop_imexport() {
        return $("div.pagetop#imexport");
    }
    pagetop_option() {
        return $("div.pagetop#option");
    }


    //
    hide_domain_filter_textarea_all() {
        this.textarea_filter_domain().hide();
        this.textarea_filter_ex_domain().hide();
    }
    hide_domain_filter_cursor_all() {
        this.cursor_filter_domain().hide();
    }
    hide_filter_ex_domain() {
        this.subheading_filter_ex_domain().hide();
        this.textarea_filter_ex_domain().hide();
    }
    hide_domain_filter_all() {
        this.hide_domain_filter_textarea_all();
        this.hide_domain_filter_cursor_all();
        this.hide_filter_ex_domain();
    }
    //
    hide_title_filter_all() {
        this.textarea_filter_title().hide();
    }
    hide_user_filter_all() {
        this.textarea_filter_user().hide();
    }
    hide_comment_filter_all() {
        this.textarea_filter_comment().hide();
    }
    //
    hide_imexport_textarea_all() {
        this.textarea_export_storage().hide();
        this.textarea_import_storage().hide();
        this.textarea_import_storage().val("");
    }
    hide_imexport_all() {
        this.hide_imexport_textarea_all();
    }
    //
    hide_option_checkbox_all() {
        this.checkbox_disable_thumbnail().hide();
        this.checkbox_label_disable_thumbnail().hide();
    }
    show_option_checkbox_all() {
        this.checkbox_disable_thumbnail().show();
        this.checkbox_label_disable_thumbnail().show();
    }
    hide_option_all() {
        this.hide_option_checkbox_all();
    }
    //
    hide_main_all() {
        this.selectbox_imexport().hide();
        this.pagetop_filter_domain().hide();
        this.pagetop_filter_title().hide();
        this.pagetop_filter_user().hide();
        this.pagetop_filter_comment().hide();
        this.pagetop_imexport().hide();
        this.pagetop_option().hide();
        this.hide_domain_filter_all();
        this.hide_title_filter_all();
        this.hide_comment_filter_all();
        this.hide_imexport_all();
        this.hide_option_all();
    }
    //
    show_export_storage() {
        this.textarea_export_storage().val(StoragePorter.export(this.storage.json));
        this.textarea_export_storage().show();
        this.button_save().hide();
        this.button_import().hide();
    }
    show_import_storage() {
        this.textarea_import_storage().show();
        this.button_save().hide();
        this.button_import().show();
    }

    //
    textarea_filter_domain_keyup() {
        if (this.textarea_filter_domain().val() != this.storage.ng_domain_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_domain();
        this.update_filter_ex_domain_item();
    }
    textarea_filter_ex_domain_keyup() {
        if (this.textarea_filter_ex_domain().val()
            != this.ex_domain_buffer[this.ex_domain_last]) {
            this.button_save_enable();
        }
    }
    textarea_filter_title_keyup() {
        if (this.textarea_filter_title().val() != this.storage.ng_title_text) {
            this.button_save_enable();
        }
    };
    textarea_filter_user_keyup() {
        if (this.textarea_filter_user().val()
            != this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_keyup() {
        if (this.textarea_filter_comment().val()
            != this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
    }

    update_cursor_filter_domain() {
        SettingBase.update_cursor(this.textarea_filter_domain(), 
                                 this.cursor_filter_domain.bind(this));
    }

    update_filter_ex_domain_item() {
        let t = this.textarea_filter_domain();
        let t_ex = this.textarea_filter_ex_domain();
        const f_dispoff = ()=> {
            this.ex_domain_last = null;
            this.hide_filter_ex_domain();
        };
        if (t.length <= 0 || t_ex.length <= 0) {
            f_dispoff();
            return;
        }
        const domain
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (domain == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_domain();
        this.ex_domain_last = domain;
        //
        const subheading_offset_x = t[0].clientWidth + 32;
        let subheading = $("div.subheading#filter_ex_domain");
        $(subheading).text(domain + 'の非表示タイトル');
        $(subheading).attr("style", "left:" + subheading_offset_x + "px");
        //
        const t_ex_offset_x = t[0].clientWidth + 32;
        const t_ex_offset_y = 32;
        const t_ex_style = "position:absolute;" 
                         + "top:" + t_ex_offset_y + "px;"
                         + "left:" + t_ex_offset_x + "px";
        $(t_ex).attr("style", t_ex_style);
        if (domain in this.ex_domain_buffer) {
            $(t_ex).val(this.ex_domain_buffer[domain]);
        } else {
            $(t_ex).val('');
            this.ex_domain_buffer[domain] = '';
        }
    }
    //
    update_option_checkbox() {
        const json = this.storage.json;
        this.flag_enable_filter = json.active;
        this.checkbox_disable_thumbnail().prop("checked", json.ng_thumbnail);
        this.show_option_checkbox_all();
    }
    //
    textarea_filter_domain_scroll() {
        this.update_cursor_filter_domain();
    }
    textarea_filter_domain_click() {
        this.update_cursor_filter_domain();
        this.update_filter_ex_domain_item();
    }

    /*!
     *  @brief  前回「非表示domain詳細設定」の後始末
     */
    cleanup_ex_domain() {
        if (this.ex_domain_last != '') {
            this.ex_domain_buffer_to_reflect_current(this.ex_domain_last);
        }
    }

    selectbox_imexport() {
        return $("select[name=select_imexport]");
    }

    is_selected_export_storage() {
        return this.selectbox_imexport().val() == "export";
    }
    is_selected_import_storage() {
        return this.selectbox_imexport().val() == "import";
    }

    selectbox_imexport_change() {
        this.hide_imexport_all();
        if (this.is_selected_export_storage()) {
            this.show_export_storage();
        } else 
        if (this.is_selected_import_storage()) {
            this.show_import_storage();
        } else {
            return;
        }        
    }

    button_save_click() {
        this.cleanup_ex_domain();
        this.save();
    }

    button_import_click() {
        const importer = new StoragePorter(this.storage.json);
        if (importer.import(this.textarea_import_storage().val())) {
            this.storage.json = importer.json;
            this.storage.save();
            this.storage.update_text();
            this.updateTextarea();
            this.textarea_import_storage().val("[[OK]]");
        } else {
            this.textarea_import_storage().val("[[ERROR]]");
        }
    }

    static button_is_selected(btn) {
        return btn.className.indexOf('selected') > 0;
    }

    tab_selected(clicked_btn) {
        if (Dashboard.button_is_selected(clicked_btn)) {
            return;
        }
        this.tab_buttons().each((inx, btn)=>{
            if (btn == clicked_btn) {
                $(btn).attr('class', 'tabButton selected');
            } else 
            if (Dashboard.button_is_selected(btn)) {
                $(btn).attr('class', 'tabButton');
            }
        });
        this.hide_main_all();
        this.button_import().hide();
        this.button_save().hide();
        switch($(clicked_btn).attr('name')) {
        case 'tab_domain_filter':
            this.display_elem_domain_filter();
            break;
        case 'tab_title_filter':
            this.display_elem_title_filter();
            break;
        case 'tab_user_filter':
            this.display_elem_user_filter();
            break;
        case 'tab_comment_filter':
            this.display_elem_comment_filter();
            break;
        case 'tab_imexport':
            this.display_elem_imexport();
            break;
        case 'tab_option':
            this.display_elem_option();
            break;
        }
    }

    static kick_textarea(t) {
        t().show();
        t().focus();
        t().click();
    }
    //
    display_elem_domain_filter() {
        this.pagetop_filter_domain().show();
        Dashboard.kick_textarea(this.textarea_filter_domain.bind(this));
        this.button_save().show();
    }
    display_elem_title_filter() {
        this.pagetop_filter_title().show();
        this.textarea_filter_title().show();
        this.button_save().show();
    }
    display_elem_user_filter() {
        this.pagetop_filter_user().show();
        this.textarea_filter_user().show();
        this.button_save().show();
    }
    display_elem_comment_filter() {
        this.pagetop_filter_comment().show();
        this.textarea_filter_comment().show();
        this.button_save().show();
    }
    display_elem_imexport() {
        this.pagetop_imexport().show();
        this.selectbox_imexport().show();
        this.selectbox_imexport_change();
    }
    display_elem_option() {
        this.pagetop_option().show();
        this.update_option_checkbox();
        this.button_save().show();
    }

    presetTextarea() {
        SettingBase.reset_textarea_caret(this.textarea_filter_domain());
        this.textarea_filter_domain().focus();
        this.textarea_filter_domain_click();
    }

    /*!
     *  @brief  現状を「非表示domain詳細加設定」バッファへ反映する
     */
    ex_domain_buffer_to_reflect_current(domain) {
        this.ex_domain_buffer[domain] =
            this.textarea_filter_ex_domain().val();
    }

    /*! 
     *  @brief  storageを再取得し反映する
     *  @note   extentionやpopupでのstorage変更通知から呼ばれる
     */
    update_storage() {
        this.storage.load().then(()=> {
            this.update_option_checkbox();
            this.updateTextarea();
            const selected_btn = DOMUtil.get_selected_element(this.tab_buttons());
            if (selected_btn == null) {
                return;
            }
            switch ($(selected_btn).attr('name')) {
            case 'tab_imexport':
                this.selectbox_imexport_change();
                break;
            default:
                break;
            }
        });
    }

    add_message_listener() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == MessageUtil.command_update_storage() ||
                    request.command == MessageUtil.command_add_mute_item()) {
                    this.update_storage();
                }
                return true;
            }
        );
    }
};

var popup = new Dashboard();
