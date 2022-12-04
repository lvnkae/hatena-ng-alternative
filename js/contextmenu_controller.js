/*!
 *  @brief  右クリックメニュー制御(ベース)
 */
class ContextMenuController {

    static update_contextmenu_by_domain(title, domain_str) {
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_filtering_domain(),
            title: title,
            domain: domain_str,
        });
    }
    static update_contextmenu_by_userid(title, userid_str) {
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_filtering_user(),
            title: title,
            userid: userid_str,
        });
    }

    /*!
     *  @brief  右クリックメニューの「$(hoge)を非表示化」を有効化
     *  @param  element
     */
    on_mute_menu(element) {
        const kw = this.get_mute_keyword(element);
        if (kw == null) {
            return false;
        }
        const keyword = text_utility.remove_line_ht_space(kw)
        if (keyword == this.context_menu.keyword) {
            return; true;
        }
        this.context_menu.keyword = keyword;
        const max_disp_keyword = 128;
        const keyword_str = keyword.slice(0, max_disp_keyword-1);
        const title = keyword_str + "を非表示化";
        this.get_command_function()(title, keyword);
        return true;
    }

    /*!
     *  @brief  右クリックメニューの拡張機能固有項目を無効化
     */
    off_original_menu() {
        if (null == this.context_menu.keyword) {
            return true; // 前回と同じなので不要
        }
        this.context_menu.keyword = null;
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
    }

    update_context_menu() {
        if (this.filter_active) {
            if (this.monitoring_target_base.length > 0 &&
                this.on_mute_menu(this.monitoring_target_base)) {
                return;
            }
        }
        this.off_original_menu();
    }    

    enable_original_menu(doc) {
        // 右クリックListener
        // 'contextmenu'では間に合わない
        // 'mouseup'でも間に合わないことがある(togetterのみ確認)
        // しかもMacOSでは右mouseupが発火しない(宗教が違う)らしい
        // よって
        //   'mousedown' 右ボタン押下時にcontextmenuをupdate
        //   'mousemove' 右ボタン押下+移動してたらtargetの変化を監視し再update
        // の2段Listener体制でねじ込む
        // ※service_workerでは'mousedown'でも間に合わないタイミングがある
        // ※cf.破棄→再生成直後(確定で間に合わない)
        // ※'mousemove'で監視対象が変化したら即updateするようにしてみる
        doc.addEventListener('mousemove', (e)=> {
            if (e.target == this.monitoring_target) {
                return;
            }
            const base_node = this.get_base_node(e.target);
            if (base_node[0] == this.monitoring_target_base[0]) {
                return;
            }
            this.monitoring_target = e.target;
            this.monitoring_target_base = base_node;
            this.update_context_menu();
        });
    }

    /*!
     *  @brief  各種バッファのクリア
     */
    clear() {
        this.monitoring_target = null;
        this.monitoring_target_base = {length:0};
        this.context_menu =  { keyword:null };
    }

    constructor(active) {
        this.filter_active = active;
        this.clear();
        this.enable_original_menu(document);
    }
}
