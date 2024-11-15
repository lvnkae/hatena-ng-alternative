/*!
 *  @brief  固定URLフィルタ
 */
class fixedURLFilter {

    /*!
     *  @brief  フィルタ関数
     *  @param  url     URL
     *  @param  title   タイトル
     *  @retval true    除外対象だ
     */
    filter(href, title) {
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
        return false;
    }
    

    constructor() {
        this.fixed_filter = []

        const fixed_ng_url_keywords = [
            //
            '3ten5jigen.officialblog.jp',
            'alfalfalfa.com',
            'anonymous-post.mobi',
            'bimatome.weblog.to',
            'blog.esuteru.com',
            'blog.livedoor.jp',
            'exawarosu.net',
            'gahalog.2chblog.jp',
            'galapgs.com',
            'geinoucv.officialblog.jp',
            'giko-neko.com',
            'hamusoku.com',
            'himasoku.com',
            'hosyusokuhou.jp',
            'i2chmeijin.blog.fc2.com',
            'itainews.com',
            'jin115.com',
            'kabumatome.doorblog.jp',
            'katasumisokuhou.blog.jp',
            'kawaiisokuhou.com',
            'kenmomatome.blog.jp',
            'kijosoku.com',
            'machipatome.publog.jp',
            'matomedane.jp',
            'michaelsan.livedoor.biz',
            'news4vip.livedoor.biz',
            'oboega-01.blog.jp',
            'onecall2ch.com',
            'oryouri.2chblog.jp',
            'pochisoku.net',
            'syurabahazard.com',
            'tsuisoku.com',
            'tozanchannel.blog.jp',
            'v-classic.com',
            'warotanikki.com',
            'yaraon-blog.com',
            //
            'ameblo.jp',
            'aiulog.com',
            'blog.goo.ne.jp',
            'entert.jyuusya-yoshiko.com',
            'gamergate.blog.jp',
            'impressionsnote.com',
            'new-smart.info',
            //
            'all-nationz.com',
            'caramelbuzz.com',
            'chinesestyle.seesaa.net',
            'chouyakuc.blog134.fc2.com',
            'dng65.com',
            'kaigainohannoublog.blog55.fc2.com',
            'kaikore.blogspot.com',
            'pandora11.com',
            'sow.blog.jp',
            //
            'altema.jp',
            'game8.jp',
            'gamy.jp',
            'gamewith.jp',
            //
            'agora-web.jp',
            //
            'blog.amazingtalker.com',
            'sorasapo.com',
            'zakkan-vivi.com',
            'homoeopathy-saitama.com',
            'kanemotitousannninarutameni.blog.jp',
            ".awe.jp",
            ".bex.jp",
            ".ebb.jp",
            ".gob.jp",
            ".ue.bulog.jp",
            ".ub.geo.jp",
            '.st.coresv.net',
            //
            'brain-market.com',
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
            'sn-jp.com',
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
            'drazuli',
            'goldennews',
            'insidears',
            'itsoku',
            'kaikaihanno',
            'kekkongo',
            'kinisoku',
            'news23vip',
            'nwknews',
        ];
        fixed_ng_url_subdirs['blog.goo.ne.jp'] = [
            'kimito39',
        ];
        fixed_ng_url_subdirs['ameblo.jp'] = [
            'kimito3923',
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
