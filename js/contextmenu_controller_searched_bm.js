/*!
 *  @brief  右クリックメニュー制御(はてなブクマ/検索結果用)
 */
class ContextMenuController_SearchedBookmark extends ContextMenuController {

    /*!
     *  @brief  非表示対象名を返す
     *  @param  element 起点ノード
     */
    get_mute_keyword(element) {
        const e = $(element).find("ul.centerarticle-entry-data");
        if (e.length == 0) {
            return null;
        }
        const a_tag = $(e).find("a");
        for (const a of a_tag) {
            const label = $(a).attr("data-gtm-click-label");
            if (label != null && label == "entry-search-result-item-site-search-url") {
                return $(a).text();
            }
        }
        return null;
    }
    
    /*!
     *  @brief  起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_base_node(element) {
        return DOMUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'li' &&
                   e.className != null &&
                   e.className.indexOf('js-user-bookmark-item') >= 0;
        });
    }

    get_command_function() {
        return ContextMenuController.update_contextmenu_by_domain;
    }
}
