/*!
 *  @brief  右クリックメニュー制御(はてブエントリ用)
 */
class ContextMenuController_Entry extends ContextMenuController {

    /*!
     *  @brief  非表示対象名を返す
     *  @param  element 起点ノード
     */
    get_mute_keyword(element) {
        const nd_userid = $(element).find("span.entry-comment-username");
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
     *  @brief  起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_base_node(element) {
        return HatenaDOMUtil.find_comment_root(element);
    }

    get_command_function() {
        return ContextMenuController.update_contextmenu_by_userid;
    }    
}
