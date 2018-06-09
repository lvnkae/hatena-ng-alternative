/*!
 *  @brief  テキストユーティリティクラス
 */
class TextUtil {

    new_line_code() {
        return "\r\n";
    }

    split_by_new_line(string) {
        return string.split(/\r\n|\r|\n/);
    }
    
}

var text_utility = new TextUtil();
