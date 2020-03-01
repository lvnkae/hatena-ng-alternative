/*!
 *  @brief  urlWrapper
 *  @brief  urlを扱いやすくしたもの
 */
class urlWrapper {

    constructor(url) {
        this.url = url;
        this.domain = '';
        this.subdir = [];
        //
        const href_div = urlWrapper.div_href(url);
        if (href_div.length > 0) {
            this.domain = href_div[0];
        }
        if (href_div.length > 1) {
            for (var i = 1; i < href_div.length; i++) {
                this.subdir.push(href_div[i]);
            }
        }
    }

    static div_href(url) {
        const header = urlWrapper.get_header(url);
        if (header == '') {
            return [];
        } else {
            var ret = [];
            for (const div of url.substr(header.length).split('/')) {
                if (div.replace(/\s+/g, '') != '') {
                    ret.push(div);
                }
            }
            return ret;
        }
    }

    static get_header(url) {
        const href_header = [
            'http://',
            'https://'
        ];
        for (const header of href_header) {
            if (url.substr(0, header.length) == header) {
                return header;
            }
        }
        return '';
    }

    in_hatena_bookmark() {
        return this.domain == 'b.hatena.ne.jp';
    }
    in_hatena_portal() {
        return this.domain == 'www.hatena.ne.jp';
    }

    in_top_page() {
        return this.subdir.length == 0 ||
               this.subdir[0].length == 0 ||
               (this.subdir.length == 1 && this.subdir[0].indexOf("?via=") >= 0);
    }
    in_entry_page() {
        return this.subdir.length >=1 &&
               this.subdir[0] == 'entry';
    }
    in_search_page() {
        return this.subdir.length >=1 &&
               this.subdir[0] == 'search';
    }
    in_hotentry_page() {
        return this.subdir.length >=1 &&
               this.subdir[0] == 'hotentry';
    }
    in_entrylist_page() {
        return this.subdir.length >=1 &&
               (this.subdir[0] == 'entrylist' ||
                this.subdir[0].indexOf('entrylist?url=') >= 0);
    }

    in_user_bookmark_page() {
        return (this.subdir.length >=2 &&
                this.subdir[1] == 'bookmark') ||
               (!this.in_top_page() &&
                !this.in_entry_page() &&
                !this.in_search_page() &&
                !this.in_hotentry_page() &&
                !this.in_entrylist_page() &&
                !this.in_my_unread_bookmark_page() &&
                !this.in_my_add_page());
    }
    in_my_unread_bookmark_page() {
        return this.subdir.length >=2 &&
               this.subdir[1] == 'unread_bookmark';
    }
    in_my_add_page() {
        return this.subdir.length >=2 &&
               this.subdir[1] == 'add';
    }
}
