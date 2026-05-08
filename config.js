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

    // 反応するキーワードと返信内容
    REPLY_CONFIG: [
        {
            keyword: 'アップルパイ',
            text: 'どこかからアップルパイの匂いが...？'
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
