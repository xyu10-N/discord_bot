// config.js
// このファイルにBotの設定をまとめます。
const CHANNEL_ID = {
    test: '1217851455332028488',
    kikisen: '1209134295529037874',
    heyaban: '1222179543771512945'
}
const EMOJI_ID = {
    otukare: '1220761762278801589',
    life: '1217870516820639815',
    hona_1: '1209131366193700875',
    hona_4: '1498733118289350758'
}

const REGULAR_TIME = {
    check: 42,
    result: 50,
    remind: 58,
}

// 占いの運勢と確率、コメントの設定
const FORTUNES = [
    { name: 'ほな吉', chance: 3, comment: '3%の確率でほな吉...？\nよく分かりませんがとっても良いってことだと思います！' },
    { name: '大吉', chance: 10, comment: '大吉です！！\n美味しいアップルパイのお店を見つけられたりするかもしれないですよ！' },
    { name: '吉', chance: 11, comment: '今日は良いことがありそうです！\nふしぎな種が落ちていたのでお渡ししますね！' },
    { name: '吉', chance: 10, comment: '今日は良いことがありそうです！\n綺麗な糸が落ちてたのってもしかしてあなたの？' },
    { name: '中吉', chance: 21, comment: '穏やかな1日になりそうです。\nわたしもしばおの散歩に行こうかな。' },
    { name: '小吉', chance: 21, comment: 'ちょっとした幸せがあるかもしれません。\nわたしもドラムの練習がんばるね！' },
    { name: '凶', chance: 14, coment: '今日はちょっと気をつけて過ごしたほうが良さそうです。\nチャレンジライブを忘れたりしないように気をつけてくださいね！' },
    { name: '大凶', chance: 10, comment: 'ど、どうして他の人のおみくじでも大凶を引いちゃうの〜！！\n今日は気をつけてお過ごしください...' }
];

module.exports = {
    // 絵文字ID
    EMOJI_ID,

    // 時間設定
    REGULAR_TIME,

    // 数字を監視するチャンネルのID（複数可）
    CHANNELS_FOR_NUMBER: [CHANNEL_ID.test, CHANNEL_ID.kikisen, CHANNEL_ID.heyaban],

    // 名前を変更する固定チャンネルのID
    RENAME_CHANNEL_ID: CHANNEL_ID.heyaban,

    // 定期メッセージを送信するチャンネルのID
    LOOP_CHANNEL_ID: CHANNEL_ID.test,

    // 占い設定
    FORTUNES,

    // 反応するキーワードと返信内容
    REPLY_CONFIG: [
        {
            keyword: 'アップルパイ',
            text: 'どこかからアップルパイの匂いが...？'
        },
        {
            keyword: 'あつあつ',
            text: 'あつあつの〜... アップルパーーイ！！...はっ！今のは気にしないでくださいぃ......'
        },
        {
            keyword: 'アツアツ',
            text: 'あつあつの〜... アップルパーーイ！！...はっ！今のは気にしないでくださいぃ......'
        }
    ],

    // リアクションするキーワードと絵文字ID
    REACTION_CONFIG: [
        {
            keyword: 'おつかれ',
            emojiId: EMOJI_ID.otukare
        },
        {
            keyword: 'お疲れ',
            emojiId: EMOJI_ID.otukare
        }
    ]
};
