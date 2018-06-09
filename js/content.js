/*!
 *  @brief  content.js本体
 */
class Content {

    constructor() {
        this.filter = new HatenaBookmarkFilter();
        this.current_location = new currentLocation();
        this.kick();
    }

    kick() {
        this.filter.load();
    }
}

/*!
 *  @brief  現在位置
 */
class currentLocation {

    constructor() {
        var href_div = (function() {
            const href_header = [
                'http://',
                'https://'
            ];
            for (const headar of href_header) {
                if (location.href.substr(0, headar.length) == headar) {
                    return location.href.substr(headar.length).split('/');
                }
            }
            return [];
        })();
        if (href_div.length > 0) {
            this.domain = href_div[0];
        } else {
            this.domain = '';
        }
        if (href_div.length > 1) {
            this.subdir = href_div[1];
        } else {
            this.subdir = '';
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
    in_top_page()
    {
        return this.subdir == '';
    }
    in_entry_page()
    {
        return this.subdir == 'entry';
    }
    in_search_page()
    {
        return this.subdir == 'search';
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
        this.after_domloaded_observer = null;
        this.initialize();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            //
            this.search_container_timer = setInterval(()=> {
                // サムネイル除去はDOM構築と平行でやりたい
                // → timerで根っこのelement(.container)構築を待つ
                //    以降はobserverでelement追加をhookして除去実行
                var container = document.getElementById("container");
                if (container) {
                    this.container_observer.observe(container, {
                      childList: true,
                      subtree: true,
                    });
                    // timerはもういらないので捨てる
                    clearInterval(this.search_container_timer);
                }
            }, 1);
            //
            document.addEventListener("DOMContentLoaded", ()=> {
                this.filtering();
                // DOM構築完了後に追加される遅延elementもフィルタにかけたい
                // → observerでelement追加をhookしfiltering実行
                const loc = gContent.current_location;
                var elem = [];
                if (loc.in_hatena_bookmark()) {
                    if (loc.in_entry_page()) {
                        // エントリページの「関連記事」
                        elem.push($(".entry-relationContents")[0]);
                    } else if (loc.in_top_page()) {
                        // トップ記事の隣に出るPR枠
                        elem.push($(".entrylist-header")[0]);
                        // はてブトップ：キュレーション枠
                        elem.push($(".entrylist-unit.js-curation-unit1")[0]);
                        elem.push($(".entrylist-unit.js-curation-unit2")[0]);
                        elem.push($(".entrylist-unit.js-curation-unit3")[0]);
                        // はてブトップ「ブログ-日記の人気エントリー」：PR枠
                        elem.push($(".entrylist-unit.js-popular-blog-issue-unit")[0]);
                    } else if (loc.in_search_page()) {
                        // ないよ
                    } else {
                        // トップ記事の隣に出るPR枠
                        elem.push($(".entrylist-header")[0]);
                    }
                } else if(loc.in_hatena_portal()) {
                    // はてなトップのPR枠
                    elem.push($(".hotentry.box.selected")[0]);
                }
                for (var e of elem) {
                    this.after_domloaded_observer.observe(e, {
                        childList: true,
                        subtree: true,
                    });
                }
            });
        });
    }

    dispatch_thumnail()
    {
        if (this.storage.json.ng_thumbnail) {
            this.filtering_thumbnail();
        }
    }

    /*!
     *  @brief  フィルタリング
     *  @note   DOM構築完了タイミング（またはそれ以降）に実行
     */
    filtering()
    {
        if (gContent.current_location.in_hatena_bookmark()) {
            if (this.storage.json.active) {
                this.filtering_bookmark_tile();
                if (gContent.current_location.in_top_page()) {
                    this.filtering_bookmark_column();
                    this.filtering_bookmark_recommend();
                    this.filtering_bookmark_issue();
                } else if (gContent.current_location.in_entry_page()) {
                    this.filtering_bookmark_entry_relation();
                    this.filtering_bookmark_entry_recommend();
                    this.filtering_bookmark_entry_pager();
                } else if (gContent.current_location.in_search_page()) {
                    this.filtering_bookmark_centerarticle();
                } else {
                    this.filtering_bookmark_issue();
                }
            }
        } else if (gContent.current_location.in_hatena_portal()) {
            if (this.storage.json.active) {
                this.filtering_portal();
            }
        }
    }

    /*!
     *  @brief  ブックマーク(tile)にフィルタをかける
     *  @note   現状メインで使われてるタイル形状のやつ
     *  @note   (1段目:users/2段目:title+link/3段目:概略/4段目:サムネ)
     */
    filtering_bookmark_tile()
    {
        $(".entrylist-contents").each((inx, elem)=> {
            var elem_title = $(elem).find(".entrylist-contents-title");
            if (elem_title.length != 1) {
                return;
            }
            var a_tag = $(elem_title[0]).find(".js-keyboard-openable");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            if (this.bookmark_filter(href, title)) {
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
        $(".entrylist-3column-title").each((inx, elem_title)=> {
            var a_tag = $(elem_title).find(".js-keyboard-openable");
            if (a_tag.length != 1) {
                return;
            }
            const href = $(a_tag[0]).attr("href");
            const title = $(a_tag[0]).attr("title");
            if (this.bookmark_filter(href, title)) {
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
            var brothers = $(elem_title).siblings();
            if (brothers.length != 1) {
                return;
            }
            var elem_favicon = brothers[0];
            if ($(elem_favicon).attr("class") != "favicon entrylist-recommend-icon") {
                return;
            }
            const attr_src = $(elem_favicon).attr("src");
            const favicon_link = "https://cdn-ak.favicon.st-hatena.com/?url=";
            const href = decodeURIComponent(attr_src).replace(favicon_link, "");
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
            var children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            var elem_favicon = children[0];
            if ($(elem_favicon).attr("class") != "favicon") {
                return;
            }
            const attr_src = $(elem_favicon).attr("src");
            const favicon_link = "https://cdn-ak.favicon.st-hatena.com/?url=";
            const href = decodeURIComponent(attr_src).replace(favicon_link, "");
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
            const title = $(elem_target[0]).attr("title");
            if (this.bookmark_filter(href, title)) {
                $(elem_target).parent().parent().detach();
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
        $(".entry-relationContents-title").each((inx, elem_title)=> {
            var children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            var a_tag = children[0];
            if ($(a_tag).attr("data-gtm-label") == null) {
                return;
            }
            const href = $(a_tag).attr("href");
            const title = $(a_tag).attr("title");
            if (this.bookmark_filter(href, title)) {
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
        $(".entry-hotentry-title").each((inx, elem_title)=> {
            var children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            var a_tag = children[0];
            if ($(a_tag).attr("data-gtm-label") == null) {
                return;
            }
            const href = $(a_tag).attr("href");
            const title = $(a_tag).attr("title");
            if (this.bookmark_filter(href, title)) {
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
        $(".entry-pager-title").each((inx, elem_title)=> {
            var children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            var a_tag = children[0];
            if ($(a_tag).attr("rel") == null) {
                return;
            }
            const href = $(a_tag).attr("href");
            const title = $(a_tag).text();
            if (this.bookmark_filter(href, title)) {
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
        $(".centerarticle-entry-title").each((inx, elem_title)=> {
            var children = $(elem_title).children();
            if (children.length != 1) {
                return;
            }
            var a_tag = children[0];
            if ($(a_tag).attr("rel") == null) {
                return;
            }
            const href = $(a_tag).attr("href");
            const title = $(a_tag).text();
            if (this.bookmark_filter(href, title)) {
                $(elem_title).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  ブックマークフィルタ
     *  @retval true    除外対象ブックマークだ
     */
    bookmark_filter(href, title)
    {
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
                    return function(title, black_titles) {
                        if (black_titles.length == 0) {
                            return true;
                        }
                        for (const btitle of black_titles) {
                            if (title.indexOf(btitle) >= 0) {
                                return true;
                            }
                        }
                    } (title, ff.black_titles);
                }
            }
        }
        for (const ngd of this.storage.json.ng_domain) {
            if (href.indexOf(ngd.keyword) >= 0) {
                if (function(href, sub_dirs) {
                    if (sub_dirs.length == 0) {
                        return true;
                    }
                    for (const subdir of sub_dirs) {
                        if (href.indexOf(subdir) >= 0) {
                            return true;
                        }
                    }
                } (href, ngd.sub_dirs)) {
                    return function(title, black_titles) {
                        if (black_titles.length == 0) {
                            return true;
                        }
                        for (const btitle of black_titles) {
                            if (title.indexOf(btitle) >= 0) {
                                return true;
                            }
                        }
                    } (title, ngd.black_titles);
                }
            }
        }
        for (const ngt of this.storage.json.ng_title) {
            if (title.indexOf(ngt) >= 0) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  サムネイルを消す
     */
    filtering_thumbnail()
    {
        const loc = gContent.current_location;
        if (loc.in_hatena_bookmark()) {
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
    }

    /*
     */
    initialize()
    {
        // observer
        {
            this.container_observer = new MutationObserver((records)=> {
                this.dispatch_thumnail();
            });
            this.after_domloaded_observer = new MutationObserver((records)=> {
                this.filtering();
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
