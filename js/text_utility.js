/*!
 *  @brief  テキストユーティリティクラス
 */
class TextUtil {

    new_line_code() {
        return "\r\n";
    }
    new_line_code_lf() {
        return "\n";
    }

    split_by_new_line(string) {
        var result = string.split(/\r\n|\r|\n/);
        var ret = [];
        for (const word of result) {
            if (word.length > 0 &&
                word != "\r\n" &&
                word != "\r" &&
                word != "\n") {
                ret.push(word);
            }
        }
        return ret;
    }

    remove_new_line_and_space(string) {
        return string.replace(/[\s|\r\n|\r|\n]+/g, "");
    }

    /*!
     *  @brief  行頭スペースを削除
     */
    remove_line_head_space(string) {
        return string.replace(/^\s+/g, "");
    }
    /*!
     *  @brief  行末スペースを削除
     */
    remove_line_tail_space(string) {
        return string.replace(/\s+$/g, "");
    }

    remove_line_ht_space(string) {
        return this.remove_line_tail_space(
                this.remove_line_head_space(string));
    }


    /*!
     *  @brief  改行で連結された文字列から座標でワード検索する
     *  @param  pos     文字位置
     *  @param  text    改行で連結された文字列
     */
    search_text_connected_by_new_line(pos, text) {
        if (text.length > 0) {
            var t_len = 0;
            var split_text = text_utility.split_by_new_line(text);
            for (const word of split_text) {
                t_len += word.length + 1; // 1はsplit前改行
                if (pos < t_len) {
                    return word;
                }
            }
        }
        return null;
    }


    /*!
     *  @brief  srcがdstに含まれているか調べる(部分一致)
     *  @param  srcの頭2文字が<>だったら正規表現として扱う
     */
    regexp_indexOf(src, dst)
    {
        if (src.length > 2) {
            if (src.substr(0, 2) == "<>") {            
                var ret = dst.search(RegExp(src.slice(2)));
                return ret >= 0;
            }
        }
        return dst.indexOf(src) >= 0;
    }
}

var text_utility = new TextUtil();
