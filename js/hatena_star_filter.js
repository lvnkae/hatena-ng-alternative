/*!
 *  @brief  はてな★フィルタクラス
 */
class HatenaStarFilter {

    /*!
     *  @brief  ブコメの★にフィルタをかける
     *  @param  username    注目ブコメのオーサ名
     *  @param  parent      注目ブコメの親ノード
     */
    filtering_bookmark_comment_stars(username, parent) {
        //  Promise返すようにしたら負荷が跳ね上がったのでcallback式で妥協
        //  ブクマ数+inner_star数(多い時は1000over)分のPromiseが同時生成されるので重い
        ((callback)=>{
            const elem_stars = this.find_stars_root(parent);
            if (!this.enable_stars_root(elem_stars)) {
                return; // まだフィルタかけられない
            }
            const elem_inner_star = this.get_elem_inner_star(elem_stars);
            if (!$.isEmptyObject(elem_inner_star)) {
                const json = this.star_json[username];
                if (json != null) {
                    // 取得済み
                    // ※popular/recent/bookmark-allと同じブコメが最大で3回フィルタされるので
                    // ※その度にAPIを叩かないようキャッシュしておく
                    this.filtering_bookmark_entry_starset_core(json,
                                                               elem_stars,
                                                               elem_inner_star);
                    callback();
                } else {
                    const anchor = $($(parent).find("a.js-bookmark-anchor-path")[0]).attr("href");
                    this.filtering_bookmark_entry_starset(username,
                                                          anchor,
                                                          elem_stars,
                                                          elem_inner_star,
                                                          callback);
                }
            } else {
                this.filtering_added_stars(elem_stars);
                callback();
            }
        })(()=>{
            this.filtered_node(parent);
        });

    }

    /*!
     *  @brief  記事概要の★にフィルタをかける
     */
    filtering_bookmark_entry_about_star() {
        const elem_e_star = $("span.js-entry-star");
        if (elem_e_star.length == 1) {
            var elem_stars = this.find_stars_root(elem_e_star);
            if (this.is_filtered_node(elem_e_star)) {
                this.filtering_added_stars(elem_stars);
                return;
            }
            if (!this.enable_stars_root(elem_stars)) {
                return;
            }
            ((callback)=>{
                const elem_inner_star = this.get_elem_inner_star(elem_stars);
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
                                                            elem_inner_star,
                                                            callback);
                } else {
                    this.filtering_added_stars(elem_stars);
                    callback();
                }
            })(()=>{
                this.filtered_node(elem_e_star);
            });
        }
    }

    /*!
     *  @brief  ユーザブックマークページの★にフィルタをかける
     */
    filtering_user_bookmark_comment_stars() {
        $("span.centerarticle-reaction-username").each((inx, elem_username)=> {
            const parent = $(elem_username).parent();
            const elem_stars = this.find_stars_root(parent);
            if (this.is_filtered_node(parent)) {
                this.filtering_added_stars(elem_stars);
                return;
            }
            if (!this.enable_stars_root(elem_stars)) {
                return;
            }
            ((callback)=> {
                const elem_inner_star = this.get_elem_inner_star(elem_stars);
                if (!$.isEmptyObject(elem_inner_star)) {
                    // usernameは全部一緒なのでahchorをキーにする
                    const anchor = $(elem_username).find("a")[0].href;
                    const json = this.star_json[anchor];
                    if (json != null) {
                        this.filtering_bookmark_entry_starset_core(json,
                                                                   elem_stars,
                                                                   elem_inner_star);
                        callback();
                    } else {
                        this.filtering_bookmark_entry_starset(anchor,
                                                              anchor,
                                                              elem_stars,
                                                              elem_inner_star,
                                                              callback);
                    }
                } else {
                    this.filtering_added_stars(elem_stars);
                    callback();
                }
            })(()=> {
                this.filtered_node(parent);
            });
        });
    }

    /*!
     *  @brief  自分が★付けたブコメにマーキングする
     */
    marking_owned_star_bookmark_comment() {
        const login_user = this.get_login_username();
        if (login_user == null || login_user == "") {
            return; // 未ログイン
        }
        $("span.entry-comment-username").each((inx, elem_username)=> {
            const parent = $(elem_username).parent();
            const username = $($(elem_username).find("a")[0]).text();
            const elem_stars = this.find_stars_root(parent);
            if (!this.enable_stars_root(elem_stars)) {
                return;
            }
            var elem_button = $(elem_stars).find("img.hatena-star-add-button");
            if (this.is_own_marked_node(elem_button)) {
                return; // マーク済み
            }
            ((callback)=> {
                const elem_inner_star = this.get_elem_inner_star(elem_stars);
                if (!$.isEmptyObject(elem_inner_star)) {
                    const json = this.star_json[username];
                    if (json != null) {
                        callback(this.exist_login_user_inner_stars(json, login_user));
                    } else {
                        const anchor
                            = $($(parent).find("a.js-bookmark-anchor-path")[0]).attr("href");
                        const mosbc_cb = ()=> {
                            const get_json = this.star_json[username];
                            if (get_json != null) {
                                callback(this.exist_login_user_inner_stars(get_json, login_user));
                            } else {
                                // APIがエラー返すこともあるかもね(retryしない)
                                callback(false);
                            }
                        };
                        this.request_star_json(username, anchor, elem_stars, mosbc_cb);
                    }
                } else {
                    callback(this.exist_login_user_added_stars(elem_stars, login_user));
                }
            })((b_exist)=> {
                this.own_marked_node(elem_button);
                if (b_exist) {
                    this.marking_addstar_node(elem_button);
                }
            });
        });
    }

    /*!
     *  @brief  自分が★付けたユーザーブックマークページのブコメにマーキングする
     */
    marking_owned_star_user_bookmark_comment() {
        const login_user = this.get_login_username();
        if (login_user == null || login_user == "") {
            return;
        }
        $("span.centerarticle-reaction-username").each((inx, elem_username)=> {
            const elem_stars = this.find_stars_root($(elem_username).parent());
            if (!this.enable_stars_root(elem_stars)) {
                return;
            }
            var elem_button = $(elem_stars).find("img.hatena-star-add-button");
            if (this.is_own_marked_node(elem_button)) {
                return;
            }
            ((callback)=> {
                const elem_inner_star = this.get_elem_inner_star(elem_stars);
                if (!$.isEmptyObject(elem_inner_star)) {
                    // usernameは全部一緒なのでahchorをキーにする
                    const anchor = $(elem_username).find("a")[0].href;
                    const json = this.star_json[anchor];
                    if (json != null) {
                        callback(this.exist_login_user_inner_stars(json, login_user));
                    } else {
                        const mosubc_cb = ()=> {
                            const get_json = this.star_json[anchor];
                            if (get_json != null) {
                                callback(this.exist_login_user_inner_stars(get_json, login_user));
                            } else {
                                callback(false);
                            }
                        };
                        this.request_star_json(anchor, anchor, elem_stars, mosubc_cb);
                    }
                } else {
                    callback(this.exist_login_user_added_stars(elem_stars, login_user));
                }
            })((b_exist)=> {
                this.own_marked_node(elem_button);
                if (b_exist) {
                    this.marking_addstar_node(elem_button);
                }
            });
        });        
    }

    /*!
     *  @brief  自分が付けた★があるか
     *  @param  elem_stars  ★関連の根ノード(span.hatena-star-star-container)
     *  @param  login_user  ログインユーザ名
     *  @retval true    自分が付けた★が1つ以上ある
     *  @note   表示されている★のみ調べる(inner_countは無視)
     */
    exist_login_user_added_stars(elem_stars, login_user) {
        const stars = elem_stars.find("a");
        for (const star of stars) {
            const staruser = this.get_staruser(star);
            if (staruser == login_user) {
                return true;
            }
        }
        return false;
    }
    /*!
     *  @brief  自分が付けた★があるか
     *  @param  star_json   1ブコメ/記事分の★情報(json)
     *  @param  login_user  ログインユーザ名
     */
    exist_login_user_inner_stars(star_json, login_user) {
        for (const color in star_json.stars) {
            const lst_stars = star_json.stars[color].list;
            for (const star of lst_stars) {
                if (star.name == login_user) {
                    return true;
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  マーキング処理済み済みノードにする
     */
    own_marked_node(node) {
        $(node).attr("owned_marking", "");
    }
    /*!
     *  @brief  マーキング処理済みノードか
     */
    is_own_marked_node(node) {
        return $(node).attr("owned_marking") != null
    }
    /*!
     *  @brief  addStarノードにマーキング
     */
    marking_addstar_node(node) {
        $(node).css('border', '2px dotted red');
    }

    /*!
     *  @brief  ブクマ/記事に付いた★をJSONで得る
     *  @param  username    注目ブコメのオーサ名
     *  @param  anchor      APIキー
     *  @param  elem_stars  ★関連の根ノード(span.hatena-star-star-container)
     *  @param  callback    フィルタ完了コールバック(無名不可)
     */
    request_star_json(username, anchor, elem_stars, callback) {
        const star_json_id = this.assign_star_json_id(elem_stars);
        //
        var cblist = this.request_star_json_callback[username];
        if (cblist != null) {
            // リクエスト済み
            const search = ()=> {
                for (const cbobj of cblist) {
                    if (callback.name == cbobj.callback.name && cbobj.id == star_json_id) {
                        return true;
                    }
                }
                return false;
            };
            if (!search()) {
                cblist.push({callback:callback, id:star_json_id});
                //console.log("cb-entry(" + username + ", " + callback.name + ", " + star_json_id + ")");
            } else {
                //console.log("dbl(" + username + ", " + callback.name + ", " + star_json_id + ")");
            }
            return;
        } else {
            var cblist = [];
            cblist.push({callback:callback, id:star_json_id});
            this.request_star_json_callback[username] = cblist;
            //console.log("req(" + username + ", " + callback.name + ", " + star_json_id + ")");
        }
        //
        const api_url = 'http://s.hatena.com/entry.json?uri=' + encodeURIComponent(anchor);
        $.ajax({
            url: api_url,
            type: 'GET',
            dataType: 'json',
            timeout: 16000,
        }).done((data)=> {
            if (data.entries.length == 0) {
                this.do_request_star_json_callback(username);
                //console.log('api error(' + anchor + ')');
                return; // 正しく取得できなかった
                        // URLによって記事★が取れないことがある。謎。
            }
            const entry = data.entries[0];
            var star_json = {
                stars: [],
                uri: entry.uri,
                filtered: false,
            };
            var filtering_star_json = (stars, color)=> {
                var stars_buff = [];
                for (const star of stars) {
                    if (star.count != null) {
                        for (var inx = 0; inx < star.count; inx++) {
                            stars_buff.push({name: star.name,
                                             quote: star.quote});
                        }
                    } else {
                        stars_buff.push(star);
                    }
                }
                star_json.stars[color] = {list: stars_buff.slice(),
                                          filtered: false};
            }
            // normal star
            filtering_star_json(entry.stars, 'yellow');
            // color star
            if (entry.colored_stars != null) {
                for (const c_stars of entry.colored_stars) {
                    filtering_star_json(c_stars.stars, c_stars.color);
                }
            }
            this.star_json[username] = star_json;
            this.do_request_star_json_callback(username);
        }).fail((data, sub)=> {
            //console.log('fail to api call(' + anchor + ':' + sub + ')');
            this.do_request_star_json_callback(username);
        });
    }

    /*!
     *  @brief  star_jsonIDを割り振る
     *  @param  elem_stars  ★関連の根ノード(span.hatena-star-star-container)
     *  @return 既に持っていればそれを、なければ新規に割り振ったものを返す
     *  @note   同一ノードによる複数回のリクエストを回避するための識別子
     *  @note   ノードそのものを簡単に区別する方法がないのでIDを割り振る
     */
    assign_star_json_id(elem_stars) {
        var id = $(elem_stars).attr("jid");
        if (id != null) {
            return Number(id);
        }
        $(elem_stars).attr("jid", this.star_json_id);
        return this.star_json_id++;
    }

    /*!
     *  @brief  request_star_jsonのcallback群一括呼び出しと後処理
     *  @param  username    呼び出しキー
     */
    do_request_star_json_callback(username) {
        var cblist = this.request_star_json_callback[username];
        if (cblist != null) {
            for (const cbobj of cblist) {
                cbobj.callback();
            }
            //console.log("done(" + username + ")");
            delete this.request_star_json_callback[username]
        } else {
            //console.log('not exist callback(' + username + ')');
        }
    }

    /*!
     *  @brief  ★集合フィルタ
     *  @param  username        注目ブコメのオーサ名
     *  @param  anchor          APIキー
     *  @param  elem_stars      ★関連の根ノード(span.hatena-star-star-container)
     *  @param  elem_inner_star ★集合の数表示ノード(array)
     *  @param  callback        フィルタ完了コールバック
     *  @note   APIコールとフィルタcoreへの接続
     */
    filtering_bookmark_entry_starset(username, anchor, elem_stars, elem_inner_star, callback) {
        const fbes_cb = ()=> {
            var get_json = this.star_json[username];
            if (get_json != null) {
                if (!get_json.filtered) {
                    for (const color in get_json.stars) {
                        const stars = get_json.stars[color];
                        var filtered_stars = [];
                        var b_filtered = false;
                        for (var star of stars.list) {
                            if (this.storage.user_filter(star.name)) {
                                b_filtered = true;
                            } else {
                                filtered_stars.push(star);
                            }
                        }
                        if (b_filtered) {
                            stars.list = filtered_stars.slice();
                            stars.filtered = true;
                        }
                    }
                    get_json.filtered = true;
                }
                this.filtering_bookmark_entry_starset_core(get_json,
                                                           elem_stars,
                                                           elem_inner_star);
            }
            // APIがエラーを返してもretryしない
            callback();
        };
        this.request_star_json(username, anchor, elem_stars, fbes_cb);
    }

    /*!
     *  @brief  ★集合フィルタ(core)
     *  @param  star_json       1ブコメ/記事分の★情報(json)
     *  @param  elem_stars      ★関連の根ノード(span.hatena-star-star-container)
     *  @param  elem_inner_star ★集合の数表示ノード(array)
     */
    filtering_bookmark_entry_starset_core(star_json, elem_stars, elem_inner_star) {
        const min_set_count = 15;
        const num_subset = 2;
        const min_group_count = min_set_count + num_subset;
        //
        if (!$.isEmptyObject(star_json)) {
            for (const color in elem_inner_star) {
                const stars = star_json.stars[color];
                if (stars != null && stars.filtered) {
                    const lst_stars = stars.list;
                    const len_stars = lst_stars.length;
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
                    if (len_stars >= min_group_count) {
                        const twin_star = [lst_stars[0], lst_stars[len_stars-1]];
                        this.add_stars(color, twin_star, root_class, star_json.uri);
                        var children = $(elem_stars).children();
                        $(children[children.length-1]).before(p);
                        this.change_inner_star_count(elem_isc, len_stars-num_subset);
                        //
                    } else if (len_stars > 0) {
                        this.add_stars(color, lst_stars, root_class, star_json.uri);
                    }
                }
            }
        }
        this.filtering_added_stars(elem_stars);
    }

    /*!
     *  @brief  ★フィルタ
     *  @param  elem_stars  ★関連の根ノード(span.hatena-star-star-container)
     *  @note   表示されている★にのみフィルタをかける(inner_countは無視)
     */
    filtering_added_stars(elem_stars) {
        var elem_button = $(elem_stars).find("img.hatena-star-add-button");
        if (this.is_filtered_node(elem_button)) {
            return;
        }
        this.filtered_node(elem_button);
        //
        elem_stars.find("a").each((inx, star)=> {
            const staruser = this.get_staruser(star);
            if (this.storage.user_filter(staruser)) {
                var next = $(star).next();
                if (next != null) {
                    const nclass = $(next).attr('class');
                    if (nclass != null && nclass.indexOf('hatena-star-inner-count') >= 0) {
                        // ★300個以上のinner_starを展開すると、複数個★付けたユーザはまとめ表示される
                        // tabindexがあるinner_starは展開前、ないのはまとめ表示
                        if ($(next).attr('tabindex') == null) {
                            $(next).detach();
                        }
                    }
                }
                $(star).detach();
            }
        });
    }
    /*!
     *  @brief  ★フィルタ
     *  @param  parent  ★関連の根ノードを子に持つなんかノード
     */
    filtering_child_added_stars(parent) {
        this.filtering_added_stars(this.find_stars_root(parent));
    }

    /*!
     *  @brief  ★ノードから"送ったuser名"を得る
     *  @param  star    ★ノード(<a>タグ)
     */
    get_staruser(star) {
        return $($(star).find("img")[0]).attr("alt").split(" (")[0];
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

    get_inner_count_tag(color) {
        const sc_tag = this.star_color[color];
        const eis_tag_base = "span.hatena-star-inner-count";
        const eis_tag = (sc_tag.length > 0) ?eis_tag_base + "-" + sc_tag
                                            :eis_tag_base;
        return eis_tag;
    }

    get_elem_inner_star(elem_stars) {
        var elem_inner_star = [];
        for (const color in this.star_color) {
            const eis_tag = this.get_inner_count_tag(color);
            const elem = $(elem_stars).find(eis_tag);
            if (elem.length == 1) {
                elem_inner_star[color] = elem[0];
            }
        }
        return elem_inner_star;
    }

    /*!
     *  @brief  ★フィルタ済みノードにする
     */
    filtered_node(node) {
        $(node).attr("star_filtered", "");
    }
    /*!
     *  @brief  ★フィルタ済みノードか
     */
    is_filtered_node(node) {
        return $(node).attr("star_filtered") != null
    }

    /*!
     *  @brief  ★関連の根ノードを探して返す
     *  @param  node    キーノード
     */
    find_stars_root(node) {
        return $(node).find("span.hatena-star-star-container");
    }
    /*!
     *  @brief  ★関連の根ノードが有効か
     */
    enable_stars_root(root_stars) {
        return (root_stars.length == 1 && 1 < root_stars.children().length);
    }


    /*!
     *  @brief  ログインuser名を得る
     */
    get_login_username() {
        if (this.login_user == null) {
            const elem = $("a.bookmark");
            const len = elem.length;
            if (len == 0) {
                const elem_not_login = $("ul.gh-service-menu.is-guest.js-guest.is-hidden");
                if (elem_not_login.length == 0) {
                    this.login_user = "";
                } else {
                    return null; // まだ取得できない
                }
            } else {
                for (var inx = 0; inx < len; inx++) {
                    const label = $(elem[inx]).attr("data-gtm-label");
                    const href = $(elem[inx]).attr("href");
                    if (label != null && href != null) {
                        if (label == "gh-bookmark") {
                            this.login_user = href.split('/')[1];
                        }
                    }
                }
            }
        }
        return this.login_user;
    }


    constructor(storage) {
        this.storage = storage;
        //
        this.star_json_id = 0;
        this.star_json = [];
        this.request_star_json_callback = [];
        this.star_color = { yellow: '',
                            green : 'green',
                            red   : 'red',
                            blue  : 'blue',
                            purple: 'purple' };
    }
}
