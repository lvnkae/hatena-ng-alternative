/*!
 *  @brief  右クリックメニュー制御(はてブエントリ用)
 */
class ContextMenuController_Entry extends ContextMenuController {

    /*!
     *  @brief  ユーザIDを得る
     *  @param  nd_cm   ブックマークコメントノード
     */
    get_userid(nd_cm) {
        const nd_userid = $(nd_cm).find("span.entry-comment-username");
        if (nd_userid.length == 0) {
            return null;
        }
        const a_tag = $(nd_userid).find("a");
        if (a_tag.length == 0) {
            return null;
        }
        return $(a_tag[0]).text();
    }
    
    /*!
     *  @brief  右クリックメニューの「$(domain)を非表示化」を有効化
     *  @param  element
     */
    on_commentfilter(element) {
        const userid = this.get_userid(element);
        if (userid == null) {
            return false;
        }
        const max_disp_userid = 24;
        const userid_st = userid.slice(0, max_disp_userid-1);
        const title = userid_st + "を非表示化";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_filtering_user(),
            title: title,
            userid: userid_st,
        });
        return true;
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  element 右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_entry_page()) {
            return;
        }
        if (this.filter_active) {
            const nd_cm = HatenaDOMUtil.find_comment_root(element);
            if (nd_cm.length > 0 && this.on_commentfilter(nd_cm)) {
                return;
            }
        }
        ContextMenuController.off_original_menu();
    }

    /*!
     */
    constructor(active) {
        super();
        this.filter_active = active;
    }
}
