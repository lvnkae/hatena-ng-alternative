/*!
 *  @brief  はてなブックマークフィルタ
 */
class HatenaBookmarkFilter {

    initialize() {
        const active = this.storage.json.active;
        const loc = this.current_location;
        if (loc.in_entry_page()) {
            this.contextmenu_controller = new ContextMenuController_Entry(active);
        } else if (loc.in_top_page() ||
                   loc.in_hotentry_page() ||
                   loc.in_entrylist_page()) {
            this.contextmenu_controller = new ContextMenuController_Bookmark(active);
        } else if (loc.in_search_page()) {
            this.contextmenu_controller
                = new ContextMenuController_SearchedBookmark(active);
        } else {
            this.contextmenu_controller = null;
        }
    }

    /*!
     *  @param storage  ストレージインスタンス(shared_ptr的なイメージ)
     */
    constructor(storage) {
        this.storage = storage;
        this.fixed_url_filter = new fixedURLFilter();
        //
        this.current_location = new urlWrapper(location.href);
        this.search_container_timer = null;
        this.container_observer = null;
        this.bookmark_observer = null;
        this.comment_observer = null;

        this.initialize();
    }

    callback_domloaded() {
        const loc = this.current_location;
        const ldata = this.storage.json;
        if (ldata.ng_thumbnail) {
            // observerによるサムネイル除去が行われないことがあるのでこのタイミングでも一発叩いておく
            // (mobile版ではcontainerノード発見が遅すぎてはelement追加し終えてることがある)
            this.filtering_thumbnail();
            //
            this.container_observer = new MutationObserver((records)=> {
                this.filtering_thumbnail();
            });
            // サムネイル除去用interval_timer登録
            this.search_container_timer = setInterval(()=> {
                // サムネイル除去はDOM構築と並行でやりたい
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
        //
        if (ldata.active) {
            this.filtering_bookmark();
            //
            this.bookmark_observer = new MutationObserver((records)=> {
                this.filtering_bookmark();
            });
            this.comment_observer = new MutationObserver((records)=> {
                if (loc.in_entry_page()) {
                    this.filtering_bookmark_entry_comment();
                }
            });
            // DOM構築完了後に追加される遅延elementもフィルタにかけたい
            // → observerでelement追加をhookしfiltering実行
            var elem_bookmark = [];
            var elem_comment = [];
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
                if (e != null) {
                    this.bookmark_observer.observe(e, {
                        childList: true,
                        subtree: true,
                    });
                }
            }
            if ((ldata.ng_user != null && ldata.ng_user.length > 0) ||
                (ldata.ng_comment != null && ldata.ng_comment.length > 0)) {
                for (var e of elem_comment) {
                    if (e != null) {
                        this.comment_observer.observe(e, {
                            childList: true,
                            subtree: true,
                        });
                    }
                }
            }
        }
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
                this.filtering_bookmark_ranking();
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
        $(".entrylist-issue-list-contents").each((inx, elem_title)=> {
            const a_tag = $(elem_title).find("a");
            if (a_tag.length == 0) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            if (this.bookmark_filter(href, title)) {
                $(elem_title).parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマーク(ranking)にフィルタをかける
     *  @note   トップページに「あとで読むランキング」
     *  @note   (1列目:users/2列目:title+link/3列目:"あとでよむ"スイッチ)
     */
    filtering_bookmark_ranking() {
        $("section#btop-ranking").each((inx, sec)=> {
            $("div.entrylist-readlater-ranking-body").each((inx, e_body)=> {
                const e_title = $(e_body).find("h3.entrylist-readlater-ranking-title");
                const e_domain = $(e_body).find("p.entrylist-readlater-ranking-domain");
                if (e_title.length == 0 || e_domain.length == 0) {
                    return;
                }
                const a_tag = $(e_title).find("a");
                if (a_tag.length == 0) {
                    return;
                }
                const href = $(a_tag).attr("href");
                const title = $(a_tag).text();
                //
                const span_tag = $(e_domain).find("span");
                if (span_tag.length == 0) {
                    return;
                }
                const domain = $(span_tag).text();
                const url = this.decide_filtering_url(href, domain);
                if (this.bookmark_filter(url, title)) {
                    $(e_title).detach();
                    $(e_domain).parent().detach();
                }
            });
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
                const e = HatenaDOMUtil.find_searched_entry_root(elem_title);
                if (e != null) {
                    $(e).detach();
                }
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
     *  @brief  エントリページの「ブックマークしたユーザー」にフィルタをかける
     */ 
    filtering_bookmark_entry_user() {
        $("li.bookmarker.js-bookmarker").each((inx, elem_bookmarker)=> {
            const bookmarker = $(elem_bookmarker).attr("data-user-name");
            if (bookmarker && this.storage.user_filter(bookmarker)) {
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
            //
            const parent = HatenaDOMUtil.find_comment_root(elem_username);
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
        });
    }

    /*!
     *  @brief  エントリページのユーザ関連のみフィルタリング
     */
    filtering_entry_user() {
        if (!this.current_location.in_entry_page()) {
            return;
        }
        this.filtering_bookmark_entry_comment();
        this.filtering_bookmark_entry_user();
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
                    HatenaDOMUtil.remove_min_height_in_search_page();
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
