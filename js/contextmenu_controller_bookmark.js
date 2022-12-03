/*!
 *  @brief  右クリックメニュー制御(はてなブクマ用)
 */
class ContextMenuController_Bookmark extends ContextMenuController {

    static get_searched_node_domain(nd_bk) {
        const nd_dm = $(nd_bk).find("p.entrylist-contents-domain");
        if (nd_dm.length == 0) {
            return null;
        }
        const sp_tag = $(nd_dm).find("span");
        if (sp_tag.length == 0) {
            return null;
        }
        return $(sp_tag[0]).text();
    }

    /*!
     *  @brief  ドメイン名を得る
     *  @param  nd_bkm  ブックマークノード
     */
    get_domain(nd_bkm) {
        return ContextMenuController_Bookmark.get_searched_node_domain(nd_bkm);
    }
    
    /*!
     *  @brief  検索結果起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_bookmark_node(element) {
        return DOMUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'div' &&
                   e.className == 'entrylist-contents';
        });
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  element 右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_top_page() &&
            !loc.in_hotentry_page() &&
            !loc.in_entrylist_page()) {
            return;
        }
        if (this.filter_active) {
            const nd_bkm = this.get_bookmark_node(element);
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
