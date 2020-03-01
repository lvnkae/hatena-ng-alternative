/*!
 *  @brief  HatenaAPIアクセスクラス(background側)
 */
class BGHatenaApiAccessor extends BGMessageSender{
    //
    constructor() {
        super();
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        var tab_ids = [];
        tab_ids[sender.tab.id] = null;
        var url = 'https://s.hatena.com/entry.json?uri=' + encodeURIComponent(request.anchor);
        var xhr = new XMLHttpRequest();
        xhr.ontimeout = ()=> {
            this.send_reply({command:request.command,
                             result: "timeout",
                             username: request.username},
                             tab_ids);
        }
        xhr.open("GET", url);
        xhr.send();
        xhr.timeout = 16000;
        xhr.onreadystatechange = ()=> {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    this.send_reply({command:request.command,
                                     result: "success",
                                     username: request.username,
                                     text: xhr.responseText},
                                     tab_ids);
                } else {
                    this.send_reply({command:request.command,
                                     result: "fail",
                                     username: request.username},
                                     tab_ids);
                }
            }
        }
    }
}
