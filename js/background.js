chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse)=> {
        var sendReply = (message)=> {
            chrome.tabs.query({}, (tabs)=> {
                for (const tab of tabs) {
                    if (tab.id == sender.tab.id) {
                        // note
                        // "response"を設定するとerror(The message port closed before a response was received.)が出る
                        // 応答不要なのでnullにしておく
                        chrome.tabs.sendMessage(
                            tab.id,
                            message,
                            null); 
                    }
                }
            });
        };
        if (request.command == "hatenaAPI_entry") {
            var url = 'https://s.hatena.com/entry.json?uri=' + encodeURIComponent(request.anchor);
            var xhr = new XMLHttpRequest();
            xhr.ontimeout = ()=> {
                sendReply({command:request.command, result: "timeout", username: request.username});
            }
            xhr.open("GET", url);
            xhr.send();
            xhr.timeout = 16000;
            xhr.onreadystatechange = function() {
	            if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        sendReply({command:request.command, result: "success", username: request.username, text: xhr.responseText});
                    } else {
                        sendReply({command:request.command, result: "fail", username: request.username});
                    }
	            }
            }
        }
        return true;
    }
);
