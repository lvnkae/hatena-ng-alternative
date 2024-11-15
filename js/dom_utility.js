/*!
 *  @brief  DOM関連Utility
 */
class DOMUtil {

    /*!
     *  @brief  要素が非表示であるか
     *  @param  e   調べる要素
     */
    static in_disappearing(e) {
        if ($(e).attr("hidden") != null) {
            return true;
        }
        const attr_style = $(e).attr("style");
        if (attr_style != null && attr_style.indexOf("display: none;") >= 0) {
            return true;
        }
        return false;
    }
    /*!
     *  @brief  key要素を探す
     *  @param  start_elem  探索起点
     *  @param  key         探索キー
     *  @note   first-hit
     *  @note   非表示(hidden, display none)は除外する
     */
    static find_first_appearing_element(start_elem, key) {
        const elements = $(start_elem).find(key)
        for (var e of elements) {
            if (!this.in_disappearing(e)) {
                return e;
            }
        }
        return null
    }

    static search_upper_node(elem, func) {
        while(elem.length > 0) {
            if (func(elem[0])) {
                return elem;
            }
            elem = elem.parent();
        }
        return {length:0};
    }

    static detach_upper_node(elem, tag) {
        const check_tag = function(e) {
            return e.localName == tag;
        }
        const nd = DOMUtil.search_upper_node(elem, check_tag);
        if (nd.length == 0) {
            return;
        }
        $(nd).detach();
    }


    /*!
     *  @brief  カーソル(caret)が何行目にあるか？
     *  @param  elem    textarea
     */
    static get_caret_row(elem) {
        let row = 0;
        if (elem.length < 0) {
            return row;
        }
        let caret_pos = elem[0].selectionStart;
        let t_len = 0;
        const split_text = text_utility.split_by_new_line(elem.val());
        for (const word of split_text) {
            t_len += word.length + 1; // 1はsplit前改行
            if (caret_pos < t_len) {
                return row;
            } else {
                row++;
            }
        }
        return row;
    }
    /*!
     *  @brief
     */
    static get_selected_element(elements) {
        let ret_elem = null;
        $(elements).each((inx, elem)=>{
            if (elem.className.indexOf("selected") >= 0) {
                ret_elem = elem;
                return false;
            }
            return true;
        });
        return ret_elem;
    }

    /*!
     *  @brief  elemのフォントサイズを得る
     *  @note   elem固有の指定がなければ根っこのcssを採用
     */
    static get_font_size(elem) {
        const font_size = elem[0].style.fontSize;
        if (font_size != "") {
            return parseFloat(font_size);
        }
        let font_size_str
            = window.getComputedStyle(elem[0]).getPropertyValue('font-size');
        return parseFloat(font_size_str);
    }
    /*!
     *  @brief  elemの行間pxを得る
     *  @note   elem固有の指定がなければ根っこのcssを採用
     */
    static get_line_height(elem) {
        const line_height = elem[0].style.lineHeight;
        if (line_height != "") {
            return parseFloat(line_height);
        }
        const line_height_str
            = window.getComputedStyle(elem[0]).getPropertyValue('line-height');
        return parseFloat(line_height_str);
    }
}
