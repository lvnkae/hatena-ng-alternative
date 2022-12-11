/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.contextmenu_controller = new BGContextMenuController();
        //
        this.initialize();
    }

    /*!
     *  @brief  登録
     *  @param  extention_id    拡張機能ID
     */
    entry(extention_id) {
        this.contextmenu_controller.create_menu(extention_id);
    }

    initialize() {
        browser.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                if (request.command == MessageUtil.command_update_contextmenu()) {
                    this.contextmenu_controller.on_message(request);
                } else
                if (request.command == MessageUtil.command_start_content()) {
                    this.entry(sender.id);
                }
                return true;
            }
        );
    }
}

var gBackground = new Background();
