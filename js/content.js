/*!
 *  @brief  content.js本体
 */
class Content {

    constructor() {
        this.filter = new HatenaBookmarkFilter();
        this.current_location = new urlWrapper(location.href);
        this.kick();
    }

    kick() {
        this.filter.load();
    }
}

/*!
 *  @brief  urlを扱いやすくしたもの
 */
class urlWrapper {

    constructor(url) {
        const href_header = [
            'http://',
            'https://'
        ];
        this.url = (function() {
            for (const headar of href_header) {
                if (url.substr(0, headar.length) == headar) {
                    return url;
                }
            }
            return "https://" + url;
        })();
        var href_div = (()=> {
            for (const headar of href_header) {
                if (this.url.substr(0, headar.length) == headar) {
                    return this.url.substr(headar.length).split('/');
                }
            }
            return [];
        })();
        if (href_div.length > 0) {
            this.domain = href_div[0];
        } else {
            this.domain = '';
        }
        this.subdir = [];
        if (href_div.length > 1) {
            for (var i = 1; i < href_div.length; i++) {
                if (i < href_div.length-1 || href_div[i].length > 0) {
                    this.subdir.push(href_div[i]);
                }
            }
        }
    }

    in_hatena_bookmark()
    {
        return this.domain == 'b.hatena.ne.jp';
    }
    in_hatena_portal()
    {
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

/*!
 *  @brief  はてブフィルタ
 */
class HatenaBookmarkFilter {

    constructor() {
        this.fixed_filter = [];
        this.search_container_timer = null;
        this.container_observer = null;
        this.bookmark_observer = null;
        this.comment_observer = null;
        this.blog_observer = null;
        this.initialize();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            // サムネイル除去用interval_timer登録
            if (this.storage.json.ng_thumbnail) {
                this.search_container_timer = setInterval(()=> {
                    // サムネイル除去はDOM構築と平行でやりたい
                    // → timerで根っこのelement(.container)構築を待つ
                    //    以降はobserverでelement追加をhookして除去実行
                    var container = document.getElementById("container");
                    if (container != null) {
                        this.container_observer.observe(container, {
                          childList: true,
                          subtree: true,
                        });
                        // timerはもういらないので捨てる
                        clearInterval(this.search_container_timer);
                    }
                }, 1);
            }
            //
            document.addEventListener("DOMContentLoaded", ()=> {
                const ldata = this.storage.json;
                if (!ldata.active) {
                    return;
                }
                this.filtering_bookmark();
                // DOM構築完了後に追加される遅延elementもフィルタにかけたい
                // → observerでelement追加をhookしfiltering実行
                const loc = gContent.current_location;
                var elem_bookmark = [];
                var elem_comment = [];
                var elem_blog = [];
                if (loc.in_hatena_bookmark()) {
                    if (loc.in_user_bookmark_page()) {
                        // ブコメ
                        elem_comment.push($("ul.js-user-bookmark-item-list.js-keyboard-controllable-container")[0]);
                    } else if (loc.in_entry_page()) {
                        // ブコメ
                        elem_comment.push($("div.js-bookmarks-sort-panels")[0]);
                        // 記事概要
                        elem_comment.push($("section.entry-about.js-entry-about")[0]);
                        // ブックマークしたすべてのユーザー
                        elem_comment.push($("div.entry-usersModal.js-all-bookmarkers-modal.is-hidden")[0]);
                        // ブログでの反応
                        elem_blog.push($("ul.entry-blogOpinion-list.js-entry-blogOpinion-list-all")[0]);
                        // エントリページの「関連記事」
                        elem_bookmark.push($("section.entry-relationContents")[0]);
                    } else if (loc.in_top_page()) {
                        // トップ記事の隣に出るPR枠
                        elem_bookmark.push($(".entrylist-header")[0]);
                        // はてブトップ：キュレーション枠
                        elem_bookmark.push($(".entrylist-unit.js-curation-unit1")[0]);
                        elem_bookmark.push($(".entrylist-unit.js-curation-unit2")[0]);
                        elem_bookmark.push($(".entrylist-unit.js-curation-unit3")[0]);
                        // はてブトップ「ブログ-日記の人気エントリー」：PR枠
                        elem_bookmark.push($(".entrylist-unit.js-popular-blog-issue-unit")[0]);
                    } else if (loc.in_search_page() ||
                               loc.in_my_unread_bookmark_page() ||
                               loc.in_my_add_page()) {
                        // ないよ
                    } else {
                        // トップ記事の隣に出るPR枠
                        elem_bookmark.push($(".entrylist-header")[0]);
                    }
                } else if(loc.in_hatena_portal()) {
                    // はてなトップのPR枠
                    elem_bookmark.push($(".hotentry.box.selected")[0]);
                }
                //
                for (var e of elem_bookmark) {
                    this.bookmark_observer.observe(e, {
                        childList: true,
                        subtree: true,
                    });
                }
                if ((ldata.ng_user != null && ldata.ng_user.length > 0) ||
                    (ldata.ng_comment != null && ldata.ng_comment.length > 0)) {
                    for (var e of elem_comment) {
                        this.comment_observer.observe(e, {
                            childList: true,
                            subtree: true,
                        });
                    }
                }
                if (ldata.ng_user != null && ldata.ng_user.length > 0) {
                    for (var e of elem_blog) {
                        this.blog_observer.observe(e, {
                            childList: true,
                            subtree: true,
                        });
                    }
                }
            });
        });
    }


    /*!
     *  @brief  bookmarkフィルタリング
     *  @note   DOM構築完了タイミング（またはそれ以降）に実行
     */
    filtering_bookmark() {
        const loc = gContent.current_location;
        if (loc.in_hatena_bookmark()) {
            this.filtering_bookmark_tile();
            if (loc.in_top_page()) {
                this.filtering_bookmark_column();
                this.filtering_bookmark_recommend();
                this.filtering_bookmark_issue();
            } else if (loc.in_entry_page()) {
                this.filtering_bookmark_entry_relation();
                this.filtering_bookmark_entry_recommend();
                this.filtering_bookmark_entry_pager();
            } else if (loc.in_search_page()) {
                this.filtering_bookmark_centerarticle();
            } else if (loc.in_user_bookmark_page() ||
                       loc.in_my_unread_bookmark_page() ||
                       loc.in_my_add_page()) {
            } else {
                this.filtering_bookmark_issue();
            }
        } else if (loc.in_hatena_portal()) {
            this.filtering_portal();
        }
    }

    /*!
     *  @brief  ブックマーク(tile)にフィルタをかける
     *  @note   現状メインで使われてるタイル形状のやつ
     *  @note   (1段目:users/2段目:title+link/3段目:概略/4段目:サムネ)
     */
    filtering_bookmark_tile()
    {
        $("div.entrylist-contents").each((inx, elem)=> {
            const elem_title = $(elem).find("h3.entrylist-contents-title");
            if (elem_title.length != 1) {
                return;
            }
            const a_tag = $(elem_title[0]).find("a.js-keyboard-openable");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            //
            const elem_domain = $(elem).find("p.entrylist-contents-domain");
            if (elem_domain.length != 1) {
                return;
            }
            const span_tag = $(elem_domain[0]).find("span");
            if (span_tag.length != 1) {
                return;
            }
            const domain = $(span_tag[0]).text();
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem).parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(column)にフィルタをかける
     *  @note   トップページにある柱状のやつ
     *  @note   (1列目:users/2列目:title+link/3列目:"あとでよむ"スイッチ)
     */
    filtering_bookmark_column()
    {
        $("h3.entrylist-3column-title").each((inx, elem_title)=> {
            const a_tag = $(elem_title).find("a.js-keyboard-openable");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            //
            const elem_domain = $(elem_title).parent().find("span.entrylist-3column-domain");
            if (elem_domain.length != 1) {
                return;
            }
            const span_tag = $(elem_domain[0]).find("span");
            if (span_tag.length != 1) {
                return;
            }
            const domain = $(span_tag[0]).text();
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem_title).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(recommend)にフィルタをかける
     *  @note   トップページのカテゴリ別新着の脇にある「人気エントリーもどうぞ」のやつ
     *  @note   (1列目:アイコン/2列目:title)
     */
    filtering_bookmark_recommend()
    {
        $(".entrylist-recommend-text").each((inx, elem_title)=> {
            const brothers = $(elem_title).siblings();
            if (brothers.length != 1) {
                return;
            }
            const elem_favicon = brothers[0];
            if ($(elem_favicon).attr("class") != "favicon entrylist-recommend-icon") {
                return;
            }
            const attr_src = $(elem_favicon).attr("src");
            const href = this.get_url_from_favicon(attr_src);
            const title = $(elem_title).text();
            if (this.bookmark_filter(href, title)) {
                $(elem_title).parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(issue)にフィルタをかける
     *  @note   ページの末尾にある「特集」のやつ
     *  @note   (1列目:アイコン/2列目:title)
     */
    filtering_bookmark_issue()
    {
        $(".entrylist-contents-list-title").each((inx, elem_title)=> {
            const children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            const elem_favicon = children[0];
            if ($(elem_favicon).attr("class") != "favicon") {
                return;
            }
            const attr_src = $(elem_favicon).attr("src");
            const href = this.get_url_from_favicon(attr_src);
            const title = $(elem_title).text();
            if (this.bookmark_filter(href, title)) {
                $(elem_title).parent().detach();
            }
        });
    }

    /*!
     *  @brief  はてなトップページにフィルタをかける
     */
    filtering_portal()
    {
        $(".js-bookmark-item").each((inx, elem)=> {
            var elem_target = $(elem).find(".js-bookmark-target");
            if (elem_target.length != 1) {
                return;
            }
            const href = $(elem_target[0]).attr("href");
            var title = $(elem_target[0]).attr("title");
            if (title == null) {
                title = $(elem_target[0]).text();
            }
            if (this.bookmark_filter(href, title)) {
                $(elem_target).parent().parent().detach();
            }
        });
        $("span.top-news-author").each((inx, elem_author)=> {
            const a_tag = $(elem_author).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const username = this.cut_username_from_id($(a_tag[0]).text());
            if (this.user_filter(username)) {
                $(elem_author).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(relation)にフィルタをかける
     *  @note   エントリページの「関連記事」のやつ
     *  @note   (1段目:icon + title/2段目:users + domain)
     */
    filtering_bookmark_entry_relation()
    {
        $("h4.entry-relationContents-title").each((inx, elem_title)=> {
            const a_tag = $(elem_title).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            //
            const elem_domain = $(elem_title).parent().find("span.entry-relationContents-domain");
            if (elem_domain.length != 1) {
                return;
            }
            const a_tag_domain = $(elem_domain[0]).find("a");
            if (a_tag_domain.length != 1) {
                return;
            }
            const domain = $(a_tag_domain[0]).text();
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem_title).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(recommend)にフィルタをかける
     *  @note   エントリページの「いま人気の記事」「いま人気の記事-同カテ」「新着記事-同カテ」「同じサイトの新着」
     *  @note   (1段目:title + link/2段目:users + icon + domain)
     */
    filtering_bookmark_entry_recommend()
    {
        $("h3.entry-hotentry-title").each((inx, elem_title)=> {
            const a_tag = $(elem_title).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            //
            const elem_domain = $(elem_title).parent().find("span.entry-hotentry-domain");
            if (elem_domain.length != 1) {
                return;
            }
            const a_tag_domain = $(elem_domain[0]).find("a");
            if (a_tag_domain.length != 1) {
                return;
            }
            const domain = $(a_tag_domain[0]).text();
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem_title).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(pager)にフィルタをかける
     *  @note   エントリページの下端の矢印付きのやつ
     *  @note   (1段目:title + link/2段目:users domain)
     */
    filtering_bookmark_entry_pager()
    {
        $("h3.entry-pager-title").each((inx, elem_title)=> {
            const a_tag = $(elem_title).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).text();
            //
            const elem_domain = $(elem_title).parent().find("span.entry-pager-domain");
            if (elem_domain.length != 1) {
                return;
            }
            const a_tag_domain = $(elem_domain[0]).find("a");
            if (a_tag_domain.length != 1) {
                return;
            }
            const domain = $(a_tag_domain[0]).text();
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem_title).parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(centerarticle)にフィルタを掛ける
     *  @note   検索ページのやつ
     *  @note   (1段目:icon + title + link/2段目:users + domain + category + yyyy/mm/dd)
     */
    filtering_bookmark_centerarticle()
    {
        $("h3.centerarticle-entry-title").each((inx, elem_title)=> {
            var a_tag = $(elem_title).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).text();
            //
            const elem_data = $(elem_title).parent().find("ul.centerarticle-entry-data");
            if (elem_data.length != 1) {
                return;
            }
            const li_tag = $(elem_data[0]).find("li");
            if (li_tag.length != 4) {
                return;
            }
            const a_tag_domain = $(li_tag[1]).find("a");
            if (a_tag_domain.length != 1) {
                return;
            }
            const domain = text_utility.remove_new_line_and_space($(a_tag_domain[0]).text());
            const url = this.decide_filtering_url(href, domain);
            if (this.bookmark_filter(url, title)) {
                $(elem_title).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマークフィルタ
     *  @retval true    除外対象ブックマークだ
     */
    bookmark_filter(href, title) {
        for (const ff of this.fixed_filter) {
            if (href.indexOf(ff.keyword) >= 0) {
                if (function(href, sub_dirs) {
                    if (sub_dirs.length == 0) {
                        return true;
                    }
                    for (const subdir of sub_dirs) {
                        if (href.indexOf(subdir) >= 0) {
                            return true;
                        }
                    }
                } (href, ff.sub_dirs)) {
                    if (function(title, black_titles) {
                        if (black_titles.length == 0) {
                            return true;
                        }
                        for (const btitle of black_titles) {
                            if (title.indexOf(btitle) >= 0) {
                                return true;
                            }
                        }
                    } (title, ff.black_titles)) {
                        return true;
                    }
                }
            }
        }
        const href_l = href.toLowerCase();
        for (const ngd of this.storage.json.ng_domain) {
            if (href_l.indexOf(ngd.keyword.toLowerCase()) >= 0) {
                if (function(href, sub_dirs) {
                    if (sub_dirs.length == 0) {
                        return true;
                    }
                    for (const subdir of sub_dirs) {
                        if (href.indexOf(subdir) >= 0) {
                            return true;
                        }
                    }
                } (href_l, ngd.sub_dirs)) {
                    if (function(title, black_titles) {
                        if (black_titles.length == 0) {
                            return true;
                        }
                        for (const btitle of black_titles) {
                            if (text_utility.regexp_indexOf(btitle, title)) {
                                return true;
                            }
                        }
                    } (title, ngd.black_titles)) {
                        return true;
                    }
                }
            }
        }
        for (const ngt of this.storage.json.ng_title) {
            if (text_utility.regexp_indexOf(ngt, title)) {
                return true;
            }
        }
        return false;
    }


    /*!
     *  @brief  エントリページの「ブログでの反応」にフィルタをかける
     */ 
    filtering_bookmark_entry_blog()
    {
        $("span.entry-blogOpinion-username").each((inx, elem_username)=> {
            const a_tag = $(elem_username).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const username = this.cut_username_from_id($(a_tag[0]).text());
            if (this.user_filter(username)) {
                $(elem_username).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  エントリページのブコメにフィルタをかける
     *  @note   コメントと★のフィルタリング
     */
    filtering_bookmark_entry_comment()
    {
        $("span.entry-comment-username").each((inx, elem_username)=> {
            const parent = $(elem_username).parent();
            if ($(parent).attr("star_filtered") != null) {
                // フィルタ済みでもinner_star展開時の処理は必要
                const elem_stars = $(parent).find("span.hatena-star-star-container");
                this.filtering_bookmark_stars(elem_stars);
                return;
            }
            const a_tag = $(elem_username).find("a");
            if (a_tag.length != 1) {
                return;
            }
            const username = $(a_tag[0]).text();
            // コメントフィルタ
            if ($(parent).attr("comment_filtered") == null) {
                if (this.user_filter(username)) {
                    $(parent).detach();
                    return;
                }
                const elem_comment = $(parent).find("span.entry-comment-text");
                if (elem_comment != null) {
                    const comment = $(elem_comment[0]).text();
                    if (this.comment_filter(comment)) {
                        $(parent).detach();
                        return;
                    }
                }
                $(parent).attr("comment_filtered", "");
            }
            // ★フィルタ
            if (this.filtering_bookmark_star_star_container(username, parent)) {
                $(parent).attr("star_filtered", "");
            }
        });
    }

    /*!
     *  @brief  ★containerフィルタ
     *  @param  username    注目ブコメのオーサ名
     *  @param  parent      注目ブコメの親ノード
     */
    filtering_bookmark_star_star_container(username, parent)
    {
        const elem_stars = $(parent).find("span.hatena-star-star-container");
        if (elem_stars.length != 1 || elem_stars.children().length <= 1) {
            return false; // まだフィルタかけられない
        }
        var elem_inner_star = [];
        this.each_inner_count(elem_stars, (elem, color)=> {
            if (elem.length == 1) {
                elem_inner_star[color] = elem[0];
            }
        });
        if (!$.isEmptyObject(elem_inner_star)) {
            const json = this.filtered_star_json[username];
            if (json != null) {
                // 取得済み
                // ※popular/recent/bookmark-allと同じブコメが最大で3回フィルタされるので
                // ※その度にAPIを叩かないようキャッシュしておく
                this.filtering_bookmark_entry_starset_core(json,
                                                           elem_stars,
                                                           elem_inner_star);
                return true;
            }
            const anchor = $($(parent).find("a.js-bookmark-anchor-path")[0]).attr("href");
            this.filtering_bookmark_entry_starset(username,
                                                  anchor,
                                                  elem_stars,
                                                  elem_inner_star);
        } else {
            this.filtering_bookmark_stars(elem_stars);
        }
        return true;
    }

    /*!
     *  @brief  ★集合フィルタ
     *  @param  username        注目ブコメのオーサ名
     *  @param  anchor          APIキー
     *  @param  elem_stars      ★関連の根ノード(span.hatena-star-star-container)
     *  @param  elem_inner_star ★集合の数表示ノード(array)
     */
    filtering_bookmark_entry_starset(username, anchor, elem_stars, elem_inner_star)
    {
        const b_req = this.requested_json[username];
        if (b_req != null) {
            // 応答待ち
            return;
        }
        //
        const api_url = 'http://s.hatena.com/entry.json?uri=' + encodeURIComponent(anchor);
        $.ajax({
            url: api_url,
            type: 'GET',
            dataType: 'json',
            timeout: 1000,
        }).done((data)=> {
            this.requested_json[username] = true;
            var b_filtered = false;
            if (data.entries.length == 0) {
                return; // 正しく取得できなかった
                        // URLによって記事★が取れないことがある。謎。
            }
            const entry = data.entries[0];
            var filtered_entry = {
                stars: [],
                uri: entry.uri,
            };
            var c_stars_buff = [];
            // normal star
            for (const n_star of entry.stars) {
                if (this.user_filter(n_star.name)) {
                    b_filtered = true;
                } else {
                    if (n_star.count != null) {
                        for (var inx = 0; inx < n_star.count; inx++) {
                            c_stars_buff.push({name: n_star.name,
                                               quote: n_star.quote});
                        }
                    } else {
                        c_stars_buff.push(n_star);
                    }
                }
                filtered_entry.stars['yellow'] = c_stars_buff.slice();
            }
            // color star
            if (entry.colored_stars != null) {
                for (const c_stars of entry.colored_stars) {
                    c_stars_buff = [];
                    for (const c_star of c_stars.stars) {
                        if (this.user_filter(c_star.name)) {
                            b_filtered = true;
                        } else {
                            if (c_star.count != null) {
                                for (var inx = 0; inx < c_star.count; inx++) {
                                    c_stars_buff.push({name: c_star.name,
                                                       quote: c_star.quote});
                                }
                            } else {
                                c_stars_buff.push(c_star);
                            }
                        }
                    }
                    filtered_entry.stars[c_stars.color] = c_stars_buff.slice();
                }
            }
            if (!b_filtered) {
                this.filtered_star_json[username] = {};
            } else {
                this.filtered_star_json[username] = filtered_entry;
                this.filtering_bookmark_entry_starset_core(filtered_entry,
                                                           elem_stars,
                                                           elem_inner_star);
            }
        }).fail((data, sub)=> {
            //console.log(data);
        });
    }

    /*!
     *  @brief  ★集合フィルタ(core)
     *  @param  json            1ブコメ/記事分の★情報(json)
     *  @param  elem_stars      ★関連の根ノード(span.hatena-star-star-container)
     *  @param  elem_inner_star ★集合の数表示ノード(array)
     */
    filtering_bookmark_entry_starset_core(json, elem_stars, elem_inner_star)
    {
        const min_set_count = 15;
        const num_subset = 2;
        const min_group_count = min_set_count + num_subset;
        //
        if (!$.isEmptyObject(json)) {
            for (const color in elem_inner_star) {
                const stars = json.stars[color];
                if (stars != null) {
                    var elem_isc = elem_inner_star[color];
                    var top_star = $(elem_isc).prev();
                    var last_star = $(elem_isc).next();
                    // inner_countとその前後の★を消す
                    $(top_star).detach();
                    $(last_star).detach();
                    var p = $(elem_isc).detach();
                    //
                    const root_class
                        = $(elem_stars).parent().parent().parent().parent().attr('class');
                    if (stars.length >= min_group_count) {
                        const twin_star = [stars[0], stars[stars.length-1]];
                        this.add_stars(color, twin_star, root_class, json.uri);
                        var children = $(elem_stars).children();
                        $(children[children.length-1]).before(p);
                        this.change_inner_star_count(elem_isc, stars.length - num_subset);
                        //
                    } else if (stars.length > 0) {
                        this.add_stars(color, stars, root_class, json.uri);
                    }
                }
            }
        }
        this.filtering_bookmark_stars(elem_stars);
    }

    /*!
     *  @brief  記事概要★フィルタ
     */
    filtering_bookmark_entry_about_star()
    {
        const elem_e_star = $("span.js-entry-star");
        if (elem_e_star.length == 1) {
            var elem_stars = $(elem_e_star).find("span.hatena-star-star-container");
            var elem_inner_star = [];
            //
            if ($(elem_e_star).attr("filtered") != null) {
                this.each_inner_count(elem_stars, (elem, color)=>{
                    for (const e of elem) {
                        elem_inner_star.push(e);
                    }
                });
                if (elem_inner_star.length == 0 ||
                    $(elem_inner_star).attr('tabindex') != null) {
                    return; // 未展開またはinner_countが存在しなければ以降の処理は不要
                }
                for (var eis of elem_inner_star) {
                    var head_star = $(eis).prev();
                    const staruser = this.cut_staruser_from_href($(head_star).attr("href"));
                    if (this.user_filter(staruser)) {
                        $(head_star).detach();
                        $(eis).detach();
                    }
                }
                this.filtering_bookmark_stars(elem_stars);
            } else {
                if (elem_stars.length != 1 || elem_stars.children().length <= 1) {
                    return; // まだフィルタかけられない
                }
                this.each_inner_count(elem_stars, (elem, color)=> {
                    if (elem.length == 1) {
                        elem_inner_star[color] = elem[0];
                    }
                });
                if (!$.isEmptyObject(elem_inner_star)) {
                    // はてぶユーザ名と当たらなければなんでもOK
                    // (3文字以上の半角英数)
                    const key_about = "**";
                    //
                    const anchor
                        = $($(elem_stars).parent()
                                         .parent()
                                         .parent()
                                         .find("a.js-entry-link.is-hidden")[0]).attr("href");
                    this.filtering_bookmark_entry_starset(key_about,
                                                          anchor,
                                                          elem_stars,
                                                          elem_inner_star);
                } else {
                    this.filtering_bookmark_stars(elem_stars);
                }
                $(elem_e_star).attr("filtered", "");
            }
        }
    }

    /*!
     *  @brief  ★フィルタ
     *  @param  elem_stars  ★関連の根ノード(span.hatena-star-star-container)
     *  @note   表示されている★にのみフィルタをかける(inner_countは無視)
     */
    filtering_bookmark_stars(elem_stars)
    {
        elem_stars.find("a").each((inx, star)=> {
            const staruser = this.cut_staruser_from_href($(star).attr("href"));
            if (this.user_filter(staruser)) {
                $(star).detach();
            }
        });
    }

    /*!
     *  @brief  ユーザブックマークページの★にフィルタをかける
     */
    filtering_user_bookmark_star()
    {
        $("span.centerarticle-reaction-username").each((inx, elem_username)=> {
            const parent = $(elem_username).parent();
            const elem_stars = $(parent).find("span.hatena-star-star-container");
            if ($(parent).attr("filtered") != null) {
                this.filtering_bookmark_stars(elem_stars);
                return;
            }
            if (elem_stars.length != 1 || elem_stars.children().length <= 1) {
                return;
            }
            var elem_inner_star = [];
            this.each_inner_count(elem_stars, (elem, color)=> {
                if (elem.length == 1) {
                    elem_inner_star[color] = elem[0];
                }
            });
            if (!$.isEmptyObject(elem_inner_star)) {
                // usernameは全部一緒なのでahchorをキーにする
                const anchor = $(elem_username).find("a")[0].href;
                this.filtering_bookmark_entry_starset(anchor,
                                                      anchor,
                                                      elem_stars,
                                                      elem_inner_star);
            } else {
                this.filtering_bookmark_stars(elem_stars);
            }
            $(parent).attr("filtered", "");
        });
    }

    /*!
     *  @brief  ユーザ名フィルタ
     *  @param  user    ユーザ名
     *  @note   完全一致
     */
    user_filter(user) {
        if (this.storage.json.ng_user != null) {
            for (const ngu of this.storage.json.ng_user) {
                if (user == ngu) {
                    return true;
                }
            }
        }
    }

    /*!
     *  @brief  コメントフィルタ
     *  @param  comment コメントテキスト
     */
    comment_filter(comment) {
        if (this.storage.json.ng_comment != null) {
            for (const ngc of this.storage.json.ng_comment) {
                if (text_utility.regexp_indexOf(ngc, comment)) {
                    return true;
                }
            }
        }
    }


    /*!
     *  @brief  サムネイルを消す
     */
    filtering_thumbnail()
    {
        const loc = gContent.current_location;
        if (loc.in_hatena_bookmark()) {
            if (loc.in_user_bookmark_page()) {
                $("a.centerarticle-entry-image").each((inx, elem)=> {
                    $(elem).detach();
                });
            } else if (loc.in_my_unread_bookmark_page() ||
                       loc.in_my_add_page()) {
            } else {
                $(".entrylist-contents-thumb").each((inx, elem)=> {
                    $(elem).detach();
                });
                $(".entrylist-issue-thumb").each((inx, elem)=> {
                    $(elem).detach();
                });
                if (loc.in_entry_page()) {
                    $(".entry-hotentry-thumb").each((inx, elem)=> {
                        $(elem).detach();
                    });
                    $(".entry-relationContents-thumb").each((inx, elem)=> {
                        $(elem).detach();
                    });
                } else if (loc.in_search_page()) {
                    $(".centerarticle-entry-image").each((inx, elem)=> {
                        $(elem).detach();
                    });
                }
            }
        } else if (loc.in_hatena_portal()) {
            $("img.top-news-img").each((inx, elem)=> {
                $(elem).detach();
            });
        }
    }

    /*!
     *  @brief  フィルタにかけるURLを決める
     *  @param  href    エントリのリンク先
     *  @param  domain  エントリ下に表示されるドメイン
     *  @note   基本的にはhrefを採用するが、食い違いがあればドメインから作ったURLを返す
     *  @note   ※短縮URL対策
     *  @note   ※短縮URLでブクマした場合、hrefには短縮URLが入るが
     *  @note   ※表示ドメインはなぜか展開後のモノになってる
     */
    decide_filtering_url(href, domain) {
        const href_url = new urlWrapper(href);
        const dom_url = new urlWrapper(domain);
        //
        if (href_url.domain == "ad-hatena.com" || /* PR記事は食い違っててもOK */
            href_url.domain == "ift.tt"        || /* IFTTTは短縮URLとして扱わない*/
            dom_url.domain.length == 0 ||         /* ドメインが取得できなければしょうがない */
            dom_url.domain == href_url.domain) {
            return href;
        } else {
            return dom_url.url; 
        }
    }

    /*!
     *  @brief  faviconからエントリURLを得る
     *  @param  src faviconのimg src
     */
    get_url_from_favicon(src) {
        const decode_src = decodeURIComponent(src);
        const favicon_link = [
            "https://cdn-ak.favicon.st-hatena.com/?url=",
            "https://cdn-ak2.favicon.st-hatena.com/?url="
        ];
        var url = decode_src;
        for (const link of favicon_link) {
            url = url.replace(link, "");
        }
        return url;
    }

    /*!
     *  @brief  ★のhrefから"送ったuser名"を得る
     *  @param  href
     */
    cut_staruser_from_href(href) {
        return href.replace("http://b.hatena.ne.jp/", "").replace("/", "");
    }

    /*!
     *  @brief  id:usernameからusernameを切り出す
     *  @param  text    ユーザID
     */
    cut_username_from_id(text) {
        return text.slice(3, text.length);
    }

    get_inner_count_tag(color) {
        const sc_tag = this.star_color[color];
        const eis_tag_base = "span.hatena-star-inner-count";
        const eis_tag = (sc_tag.length > 0) ?eis_tag_base + "-" + sc_tag
                                            :eis_tag_base;
        return eis_tag;
    }

    each_inner_count(elem_stars, func) {
        for (const sc_key in this.star_color) {
            const eis_tag = this.get_inner_count_tag(sc_key);
            const elem = $(elem_stars).find(eis_tag);
            func(elem, sc_key);
        }
    }


    /*!
     *  @brief  entryに★をN個追加する
     *  @param  color       ★カラー名
     *  @param  stars       ★情報(obj{name:, quote:})
     *  @param  root_class  追加entry根ノードclass属性
     *  @param  anchor      entryアンカー
     *  @note   単純にappendするだけだとonmouse/offmouse-eventが乗らないので
     *  @note   HatenaStar.jsの追加関数を無理やり呼ぶ
     *  @note   ※"entry"とはHatenaStar.jsで言う「★表示位置(ブコメまたは記事)単位」のこと
     */
    add_stars(color, stars, root_class, anchor) {
        var js = "<script>";
        js += "for (var entry of Hatena.Star.EntryLoader.entries) {"
        js +=   "if (entry.uri == '" + anchor + "') {"
        js +=     "if (entry.star_container.parentNode.parentNode.parentNode.parentNode.getAttribute('class') == '" + root_class + "') {";
        for (const star of stars) {
            js +=   "entry.addStar({color: '" + color + "',"
            js +=                 " name: '" + star.name + "',"
            js +=                 " quote: '" + star.quote + "'});";
        }
        js +=       "break;";
        js +=     "}";
        js +=   "}";
        js += "}";
        js += "</script>";
        var bd = $("body")[0];
        $(bd).append(js);
    }

    /*!
     *  @brief  ★集合(inner_star)の表示数を変更する
     *  @param  elem_inner_star ★集合ノード
     *  @param  count           適用する表示数
     */
    change_inner_star_count(elem_inner_star, count) {
        $(elem_inner_star).text(count);
    }


    initialize() {
        //
        {
            this.filtered_star_json = [];
            this.requested_json = [];
            this.star_color = { yellow: '',
                                green : 'green',
                                red   : 'red',
                                blue  : 'blue',
                                purple: 'purple' };
        }
        // observer
        {
            this.container_observer = new MutationObserver((records)=> {
                this.filtering_thumbnail();
            });
            this.bookmark_observer = new MutationObserver((records)=> {
                this.filtering_bookmark();
            });
            this.comment_observer = new MutationObserver((records)=> {
                const loc = gContent.current_location;
                if (loc.in_entry_page()) {
                    this.filtering_bookmark_entry_about_star();
                    this.filtering_bookmark_entry_comment();
                } else if (loc.in_user_bookmark_page()) {
                    this.filtering_user_bookmark_star();
                }
            });
            this.blog_observer = new MutationObserver((records)=> {
                this.filtering_bookmark_entry_blog();
            });
        }
        // initialize fixed filter
        {
            const fixed_ng_url_keywords = [
                //
                'alfalfalfa.com',
                'blog.esuteru.com',
                'blog.livedoor.jp',
                'hamusoku.com',
                'himasoku.com',
                'hosyusokuhou.jp',
                'i2chmeijin.blog.fc2.com',
                'jin115.com',
                'kabumatome.doorblog.jp',
                'kijosoku.com',
                'michaelsan.livedoor.biz',
                'news4vip.livedoor.biz',
                'oryouri.2chblog.jp',
                'yaraon-blog.com',
                //
                'kaigainohannoublog.blog55.fc2.com',
                'sow.blog.jp',
                'all-nationz.com',
                //
                'altema.jp',
                'game8.jp',
                'gamy.jp',
                'gamewith.jp',
                //
                'agora-web.jp',
                'buzzap.jp',
                'buzz-plus.com',
                'buzznews.jp',
                'gogotsu.com',
                'iemo.jp',
                'japan-indepth.jp',
                'lite-ra.com',
                'matomame.jp',
                'mery.jp',
                'netgeek.biz',
                'news.merumo.ne.jp',
                'skincare-univ.com',
                'snjpn.net',
                'welq.jp',
                'woman.mynavi.jp',
                'yukawanet.com',
                //
                'gunosy.com',
                'headlines.yahoo.co.jp',
                'news.livedoor.com',
                //
                'ift.tt',
            ];
            var fixed_ng_url_black_titles = [];
            fixed_ng_url_black_titles['headlines.yahoo.co.jp'] = [
                'Japan In-depth'
            ];
            var fixed_ng_url_subdirs = [];
            fixed_ng_url_subdirs['blog.livedoor.jp'] = [
                'bluejay01-review',
                'chihhylove',
                'dqnplus',
                'goldennews',
                'insidears',
                'itsoku',
                'kinisoku',
                'news23vip',
                'nwknews',
            ];
            for (const keyword of fixed_ng_url_keywords) {
                var ng_url = {};
                ng_url.keyword = keyword;
                if (keyword in fixed_ng_url_black_titles) {
                    ng_url.black_titles = fixed_ng_url_black_titles[keyword];
                } else {
                    ng_url.black_titles = [];
                }
                if (keyword in fixed_ng_url_subdirs) {
                    ng_url.sub_dirs = fixed_ng_url_subdirs[keyword];
                } else {
                    ng_url.sub_dirs = [];
                }
                this.fixed_filter.push(ng_url);
            }
        }
    }
}

var gContent = new Content();
