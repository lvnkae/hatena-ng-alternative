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
 *  @brief  はてなブックマークフィルタ
 */
class HatenaBookmarkFilter {

    constructor() {
        this.current_location = new urlWrapper(location.href);
        this.fixed_url_filter = new fixedURLFilter();
        //
        this.search_container_timer = null;
        this.container_observer = null;
        this.bookmark_observer = null;
        this.comment_observer = null;
        this.blog_observer = null;
        this.marking_observer = null;
    }

    load() {
        this.storage = new StorageData();
        this.star_filter = new HatenaStarFilter(this.storage);
        this.storage.load().then(() => {
            const ldata = this.storage.json;
            //
            if (ldata.ng_thumbnail) {
                this.container_observer = new MutationObserver((records)=> {
                    this.filtering_thumbnail();
                });
                // サムネイル除去用interval_timer登録
                this.search_container_timer = setInterval(()=> {
                    // サムネイル除去はDOM構築と平行でやりたい
                    // → timerで根っこのelement(.container)構築を待つ
                    //    以降はobserverでelement追加をhookして除去実行
                    var container = document.getElementById("container");
                    if (container == null) {
                        // mobile対応
                        container = document.getElementsByClassName("touch-container")[0];
                    }
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
            // DOM構築完了時の処理
            document.addEventListener("DOMContentLoaded", ()=> {
                const loc = this.current_location;
                //
                if (ldata.active) {
                    this.filtering_bookmark();
                    //
                    this.bookmark_observer = new MutationObserver((records)=> {
                        this.filtering_bookmark();
                    });
                    this.comment_observer = new MutationObserver((records)=> {
                        if (loc.in_entry_page()) {
                            this.star_filter.filtering_bookmark_entry_about_star();
                            this.filtering_bookmark_entry_comment();
                        } else if (loc.in_user_bookmark_page()) {
                            this.star_filter.filtering_user_bookmark_comment_stars();
                        }
                    });
                    this.blog_observer = new MutationObserver((records)=> {
                        this.filtering_bookmark_entry_blog();
                    });
                    // DOM構築完了後に追加される遅延elementもフィルタにかけたい
                    // → observerでelement追加をhookしfiltering実行
                    var elem_bookmark = [];
                    var elem_comment = [];
                    var elem_blog = [];
                    if (loc.in_hatena_bookmark()) {
                        if (loc.in_user_bookmark_page()) {
                            // ブコメ
                            elem_comment.push(this.get_user_bookmerk_item_list_node());
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
                }
                //
                if (ldata.mark_owned_star == null || ldata.mark_owned_star) {
                    // 追加機能なのでデフォルトONにして認知度を上げてみる
                    if (loc.in_hatena_bookmark()) {
                        this.marking_observer = new MutationObserver((records)=> {
                            if (loc.in_entry_page()) {
                                this.star_filter.marking_owned_star_bookmark_comment();
                            } else if (loc.in_user_bookmark_page()) {
                                this.star_filter.marking_owned_star_user_bookmark_comment();
                            }
                        });
                        var elem_marking = [];
                        if (loc.in_user_bookmark_page()) {
                            // ブコメ
                            elem_marking.push(this.get_user_bookmerk_item_list_node());
                        } else if (loc.in_entry_page()) {
                            // ブコメ
                            elem_marking.push($("div.js-bookmarks-sort-panels")[0]);
                            // 記事概要
                            elem_marking.push($("section.entry-about.js-entry-about")[0]);
                            // ブックマークしたすべてのユーザー
                            elem_marking.push($("div.entry-usersModal.js-all-bookmarkers-modal.is-hidden")[0]);
                        }
                        for (var e of elem_marking) {
                            this.marking_observer.observe(e, {
                                childList: true,
                                subtree: true,
                            });
                        }
                    }
                }
            });
        });
    }

    /*!
     *  @brief  ユーザブックマークページのブコメリスト根ノードを得る
     *  @note   PCとmobileで名前が異なるのでラップしただけ
     */
    get_user_bookmerk_item_list_node() {
        const for_pc_browser = $("ul.js-user-bookmark-item-list")[0];
        if (for_pc_browser != null) {
            return for_pc_browser;
        } else {
            return $("ul.touch-articles.js-user-bookmark-item-list")[0];
        }
    }

    /*!
     *  @brief  bookmarkフィルタリング
     */
    filtering_bookmark() {
        const loc = this.current_location;
        //
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
                this.filtering_bookmark_entry_user();
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
            if (this.storage.user_filter(username)) {
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
        if (this.fixed_url_filter.filter(href, title)) {
            return true;
        }
        if (this.storage.domain_filter(href, title)) {
            return true;
        }
        if (this.storage.title_filter(title)) {
            return true;
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
            if (this.storage.user_filter(username)) {
                $(elem_username).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  エントリページの「ブックマークしたユーザー」にフィルタをかける
     */ 
    filtering_bookmark_entry_user()
    {
        $("li.bookmarker.js-bookmarker").each((inx, elem_bookmarker)=> {
            const bookmarker = $(elem_bookmarker).attr("data-bookmarker");
            if (this.storage.user_filter(bookmarker)) {
                $(elem_bookmarker).detach();
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
            var star_filter = this.star_filter;
            //
            const parent = $(elem_username).parent();
            if (star_filter.is_filtered_node(parent)) {
                // フィルタ済みでもinner_star展開時の処理は必要
                star_filter.filtering_child_added_stars(parent);
                return;
            }
            const a_tag = $(elem_username).find("a");
            const username = $(a_tag[0]).text();
            // コメントフィルタ
            if ($(parent).attr("comment_filtered") == null) {
                if (this.storage.user_filter(username)) {
                    $(parent).detach();
                    return;
                }
                const elem_comment = $(parent).find("span.entry-comment-text");
                if (elem_comment != null) {
                    const comment = $(elem_comment[0]).text();
                    if (this.storage.comment_filter(comment)) {
                        $(parent).detach();
                        return;
                    }
                }
                $(parent).attr("comment_filtered", "");
            }
            // ★フィルタ
            star_filter.filtering_bookmark_comment_stars(username, parent);
        });
    }


    /*!
     *  @brief  サムネイルを消す
     */
    filtering_thumbnail() {
        const loc = this.current_location;
        //
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
     *  @brief  id:usernameからusernameを切り出す
     *  @param  text    ユーザID
     */
    cut_username_from_id(text) {
        return text.slice(3, text.length);
    }
}
