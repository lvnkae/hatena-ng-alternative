/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.extention_id = '';
        this.contextmenu_controller = new BGContextMenuController();
        //
        this.initialize();
    }

    /*!
     *  @brief  登録
     *  @param  extention_id    拡張機能ID
     *  @param  tab_id          タブID
     */
    entry(extention_id, tab_id) {
        this.extention_id = extention_id;
        this.contextmenu_controller.entry(tab_id);
        this.contextmenu_controller.create_menu(extention_id);
    }

    initialize() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                if (request.command == MessageUtil.command_update_contextmenu()) {
                    this.contextmenu_controller.on_message(request);
                } else
                if (request.command == MessageUtil.command_start_content()) {
                    this.entry(sender.id, sender.tab.id);
                }
                return true;
            }
        );
    }
}

var gBackground = new Background();
