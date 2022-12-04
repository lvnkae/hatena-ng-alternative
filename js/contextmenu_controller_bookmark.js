/*!
 *  @brief  右クリックメニュー制御(はてなブクマ用)
 */
class ContextMenuController_Bookmark extends ContextMenuController {

    /*!
     *  @brief  非表示対象名を返す
     *  @param  element 起点ノード
     */
    get_mute_keyword(element) {
        const nd_domain = $(element).find("p.entrylist-contents-domain");
        if (nd_domain.length == 0) {
            return null;
        }
        const sp_tag = $(nd_domain).find("span");
        if (sp_tag.length == 0) {
            return null;
        }
        return $(sp_tag[0]).text();
    }
    
    /*!
     *  @brief  起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_base_node(element) {
        return DOMUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'div' &&
                   e.className == 'entrylist-contents';
        });
    }

    get_command_function() {
        return ContextMenuController.update_contextmenu_by_domain;
    }

    /*!
     */
    constructor(active) {
        super(active);
    }
}
