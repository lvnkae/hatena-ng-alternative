/*!
 *  @brief  click時にfrontへ送り返すミュート対象情報
 *  @note   v3対応でinstance化できなくなったのでstorageに入れる
 *  @note   (global-workも併用)
 */
class MuteParam {
    constructor(click_command = '', domain = '', userid = '') {
        this.click_command = click_command;
        this.domain = domain;
        this.userid = userid;
    }
}

/*!
 *  @brief  右クリックメニュー制御(background側)
 */
class BGContextMenuController {

    static CONTEXT_MENUS_ID = "HatenaFilter1.0.5";

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    static on_message(request) {
        const menusid = BGContextMenuController.CONTEXT_MENUS_ID;
        if (request.title == null) {
            chrome.contextMenus.update(menusid, { 
                "visible": false
            });
        } else {
            const click_command = request.click_command;
            if (click_command == MessageUtil.command_filtering_domain() ||
                click_command == MessageUtil.command_filtering_user()) {
                gMuteParam = new MuteParam(request.click_command,
                                           request.domain,
                                           request.userid);
                // service_workerが破棄されたときのためにstorageに書いておく
                {
                    var mute_obj = {};
                    mute_obj[menusid] = gMuteParam;
                    chrome.storage.local.set(mute_obj, ()=> {});
                }
            }
            chrome.contextMenus.update(menusid, {
                "title": request.title,
                "visible": true
            });
        }                                                
    }

    /*!
     *  @brief  固有右クリックメニュー登録
     */
    static create_menu() {
        chrome.contextMenus.create({
            "title": "<null>",
            "id": BGContextMenuController.CONTEXT_MENUS_ID,
            "type": "normal",
            "contexts" : ["all"],
            "visible" : true,
        }, () => { /*chrome.untime.lastError;*/ });
    }

    static add_listener() {
        chrome.contextMenus.onClicked.addListener((info)=> {
            if (info.menuItemId != BGContextMenuController.CONTEXT_MENUS_ID) {
                return;
            }
            const click_command = gMuteParam.click_command;
            if (click_command == MessageUtil.command_filtering_domain() ||
                click_command == MessageUtil.command_filtering_user()) {
                BGMessageSender.send_reply(
                    {command: click_command,
                     domain: gMuteParam.domain,
                     userid: gMuteParam.userid});
            }
        });
    }

}
var gMuteParam = new MuteParam();
chrome.storage.local.get(BGContextMenuController.CONTEXT_MENUS_ID, (item) => {
    if (item != null) {
        if (gMuteParam.domain == '' && gMuteParam.userid == '') {
            gMuteParam = item[BGContextMenuController.CONTEXT_MENUS_ID];
        }
    }
});
