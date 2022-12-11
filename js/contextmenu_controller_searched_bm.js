/*!
 *  @brief  右クリックメニュー制御(はてなブクマ/検索結果用)
 */
class ContextMenuController_SearchedBookmark extends ContextMenuController {

    /*!
     *  @brief  ドメイン名を得る
     *  @param  nd_bkm  ブックマークノード
     */
    get_domain(nd_bkm) {
        const e = $(nd_bkm).find("ul.centerarticle-entry-data");
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
        return HatenaDOMUtil.find_searched_entry_root(element);
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  element 右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_search_page()) {
            return;
        }
        if (this.filter_active) {
            const nd_bkm = this.get_base_node(element);
            if (nd_bkm.length > 0 && this.on_domainfilter(nd_bkm)) {
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
