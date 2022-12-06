/*!
 *  @brief  はてな固有DOM関連Utility
 */
class HatenaDOMUtil {

    /*!
     *  @brief  ブックマークコメントの根ノードを探して返す
     *  @param  node    キーノード
     */
    static find_comment_root(node) {
        return DOMUtil.search_upper_node($(node), (e)=>{
            return e.localName == 'div' &&
                e.classList.length > 0 &&
                e.classList[0] == 'entry-comment-contents';
        });
    }

    /*!
     *  @brief  ユーザブックマークページコメントの根ノードを探して返す
     *  @param  node    キーノード
     */
    static find_usrcomment_root(node) {
        return DOMUtil.search_upper_node($(node), (e)=>{
            return e.localName == 'div' &&
                e.className == 'centerarticle-reaction-main';
        });
    }

    /*!
     *  @brief  検索結果エントリの根ノードを探して返す
     *  @param  node    キーノード
     */
    static find_searched_entry_root(node) {
        return DOMUtil.search_upper_node($(node), (e)=> {
            return e.localName == 'li' &&
                   e.className != null &&
                   e.className.indexOf('js-user-bookmark-item') >= 0;
        });
    }

    /*!
     *  @brief  ★関連の根ノードを探して返す
     *  @param  node    キーノード
     */
    static find_stars_root(node) {
        return $(node).find("span.hatena-star-star-container");
    }

    /*!
     *  @brief  フィルタ済みマークを消す
     */
    static remove_filtered_marker() {
        $("span.entry-comment-username").each((inx, elem_username)=> {
            var nd_root = HatenaDOMUtil.find_comment_root(elem_username);
            if (nd_root.length > 0) {
                $(nd_root).removeAttr("star_filtered");
                $(nd_root).removeAttr("comment_filtered")
                var elem_stars = HatenaDOMUtil.find_stars_root(nd_root);
                if (elem_stars.length > 0) {
                    var elem_button = $(elem_stars).find("img.hatena-star-add-button");
                    elem_button.removeAttr("star_filtered")
                }
            }
        });
    }

    /*!
     *  @brief  検索ページの縦余白を消す
     *  @note   サムネイル用のスペース
     */
    static remove_min_height_in_search_page() {
        const anti_min_height =
        '.page-entrysearch .has-image{min-height: 0px;}'
        $('body').append('<style>' + anti_min_height + '</style>');
    }
}
