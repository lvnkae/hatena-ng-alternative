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
    /*!
     *  @brief  有効tabへsendMessage
     *  @note   popup→extention、dashboard
     *  @note   dashboard→extention
     */
    static send_message_to_relative_tab(message) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, message).catch((error)=>{
                });
            }
        });
    }

    static command_start_content() { return "start_content"; }
    static command_update_storage() { return "update_storage"; }
    static command_get_hatena_json() { return "get_hatena_json"; }
    static command_update_contextmenu() { return "update_contextmenu"; }
    static command_filtering_domain() { return "filtering_bookmark_domain"; }
    static command_filtering_user() { return "filtering_bookmark_user"; }

    static command_update_storage() { return "update_storage"; }
    static command_add_mute_item() { return "add_mute_item"}
}
