/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.initialize();
    }

    initialize() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                if (request.command == MessageUtil.command_update_contextmenu()) {
                    BGContextMenuController.on_message(request);
                }
                return true;
            }
        );
        BGContextMenuController.add_listener();
    }
}

var gBackground = new Background();
chrome.runtime.onInstalled.addListener(()=> {
    BGContextMenuController.create_menu();
});
chrome.runtime.onStartup.addListener(()=> {
    BGContextMenuController.create_menu();
});