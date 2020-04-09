/*!
 *  @brief  messageユーティリティクラス
 */
class MessageUtil {
    /*!
     *  @brief  backgroundへのsendMessage
     *  @param  message
     *  @note   環境依存するのでラップしとく
     */
    static send_message(message) {
        browser.runtime.sendMessage(message);
    }

    static command_start_content() { return "start_content"; }
    static command_update_storage() { return "update_storage"; }
    static command_get_hatena_json() { return "get_hatena_json"; }
    static command_update_contextmenu() { return "update_contextmenu"; }
    static command_filtering_domain() { return "filtering_bookmark_domain"; }
    static command_filtering_user() { return "filtering_bookmark_user"; }
}
