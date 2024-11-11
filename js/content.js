/*!
 *  @brief  content.js本体
 */
class Content {

    initialize() {
        // background用Listener
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == MessageUtil.command_filtering_domain()) {
                    const update
                        = this.storage.add_domain_filter_with_check(request.domain);
                    if (update && request.tab_active) {
                        this.storage.save();
                        if (this.storage.json.active) {
                            this.filter_instance.filtering_bookmark();
                        }
                        MessageUtil.send_message(
                            {command:MessageUtil.command_add_mute_item()});
                    }
                } else
                if (request.command == MessageUtil.command_filtering_user()) {
                    const update
                        = this.storage.add_user_filter_with_check(request.userid);
                    if (update && request.tab_active) {
                        this.storage.save();
                        if (this.storage.json.active) {
                            HatenaDOMUtil.remove_filtered_marker();
                            this.filter_instance.filtering_entry_user();
                        }
                        MessageUtil.send_message(
                            {command:MessageUtil.command_add_mute_item()});
                    }
                }
                return true;
            }
        );
    }

    callback_domloaded() {
        // titleのタグ削除
        $("title").each((inx, elem)=> {
            const title = $(elem).text().replace(/^\[B!.*?\]/, "");
            $(elem).text(title);
        });
        //
        this.filter_instance = new HatenaBookmarkFilter(this.storage);
        this.filter_instance.callback_domloaded();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            this.storage_loaded = true;
            if (this.dom_content_loaded) {
                this.callback_domloaded();
            }
        });
    }

    kick() {
        this.load();
    }

    constructor() {
        this.filter_instance = null;
        this.storage_loaded = false;
        this.dom_content_loaded = false;
        //
        this.initialize();
        this.kick();
        //
        document.addEventListener("DOMContentLoaded", ()=> {
            this.dom_content_loaded = true;
            if (this.storage_loaded) {
                this.callback_domloaded();
            }
        });
        document.addEventListener('visibilitychange', ()=> {
            if (document.visibilityState === 'visible') {
                if (this.filter_instance != null) {
                    this.filter_instance.clear_context_menu();
                }
            } else {
                // focusを失ったらcontextMenuを消しとく
                MessageUtil.send_message(
                    {command: MessageUtil.command_update_contextmenu()});
            }
        });
        window.addEventListener('beforeunload', ()=> {
            // URL遷移するならcontextMenuを消す
            MessageUtil.send_message(
                {command: MessageUtil.command_update_contextmenu()});
        });        
    }
}

var gContent = new Content();
