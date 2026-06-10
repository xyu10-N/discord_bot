// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Botの権限（Intents）設定
// ※Developer Portal側でも「Message Content Intent」をONにする必要があります
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const config = require('./config');
const EMOJI_ID = config.EMOJI_ID;
// ==========================================

// タイマー管理用の変数
let timeout1Hour = null;
let interval1Hour = null;
let interval2Hours = null;
let nextServerResponses = { yes: new Set(), no: new Set(), koko: new Set() };
let isChecking = false;

// 定期送信を開始する関数
function startTimers(targetChannel) {
    const now = new Date();
    let msUntilNextCheck = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), config.REGULAR_TIME.check, 0, 0) - now;
    if (msUntilNextCheck <= 0) msUntilNextCheck += 60 * 60 * 1000;

    const sendCheckMessage = () => {
        isChecking = true;
        nextServerResponses = { yes: new Set(), no: new Set(), koko: new Set() };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('next_server_yes').setLabel('あり').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('next_server_no').setLabel('なし').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('next_server_koko').setLabel('ココ').setStyle(ButtonStyle.Primary)
            );

        targetChannel.send({
            content: '**次鯖に関して、以下から選択してください！**',
            components: [row]
        });

        const delayToResult = (config.REGULAR_TIME.result - config.REGULAR_TIME.check) * 60 * 1000;
        setTimeout(() => {
            const yesRes = Array.from(nextServerResponses.yes);
            const noRes = Array.from(nextServerResponses.no);
            const kokoRes = Array.from(nextServerResponses.koko);

            let resultMessage = '>>> ## **【次鯖結果確認】**\n\n';
            resultMessage += '**🟢 あり:**\n' + (yesRes.length > 0 ? yesRes.map(id => `<@${id}>`).join(' ') : '') + '\n';
            resultMessage += '**🔴 なし:**\n' + (noRes.length > 0 ? noRes.map(id => `<@${id}>`).join(' ') : '') + '\n';
            resultMessage += '**🔵 ココ:**\n' + (kokoRes.length > 0 ? kokoRes.map(id => `<@${id}>`).join(' ') : '') + '\n(敬称略)';

            // メンション通知を発生させないように送信
            targetChannel.send({
                content: resultMessage,
                allowedMentions: { parse: [] }
            });

            const delayToRemind = (config.REGULAR_TIME.remind - config.REGULAR_TIME.result) * 60 * 1000;
            setTimeout(() => {
                targetChannel.send(`時速の確認などもお願いします<:hona_1:${EMOJI_ID.hona_1}>`);
                isChecking = false;
            }, delayToRemind);
        }, delayToResult);
    };

    timeout1Hour = setTimeout(() => {
        sendCheckMessage();
        interval1Hour = setInterval(() => {
            sendCheckMessage();
        }, 1000 * 60 * 60);
    }, msUntilNextCheck);

    interval2Hours = setInterval(() => {
        targetChannel.send(`炊いてくださーい！<:life:${EMOJI_ID.life}>`);
    }, 1000 * 60 * 60 * 2.5);
}

// 🟢 Bot起動時の処理（スラッシュコマンド登録を含む）
client.once('clientReady', async () => {
    console.log(`[起動完了] ${client.user.tag} がオンラインになりました！`);

    // スラッシュコマンド /hona を登録
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [
        new SlashCommandBuilder()
            .setName('hona')
            .setDescription('定期送信の管理')
            .addSubcommand(sub => sub.setName('start').setDescription('定期送信を開始'))
            .addSubcommand(sub => sub.setName('stop').setDescription('定期送信を停止'))
            .addSubcommand(sub => sub.setName('reminds').setDescription('リマインド時間の確認と変更')
                .addIntegerOption(opt => opt.setName('check').setDescription('確認時間（分）0-59').setMinValue(0).setMaxValue(59))
                .addIntegerOption(opt => opt.setName('result').setDescription('結果時間（分）0-59').setMinValue(0).setMaxValue(59))
                .addIntegerOption(opt => opt.setName('remind').setDescription('リマインド時間（分）0-59').setMinValue(0).setMaxValue(59))
            )
            .addSubcommand(sub => sub.setName('oracle').setDescription('今日の運勢を占う'))
            .toJSON()
    ];

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('[スラッシュコマンド] /hona を登録しました。');
    } catch (error) {
        console.error('[スラッシュコマンド] 登録に失敗しました:', error);
    }
});

// ⚡ スラッシュコマンド等が実行された時の処理
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (['next_server_yes', 'next_server_no', 'next_server_koko'].includes(interaction.customId)) {
            try {
                // 3秒タイムアウトを防ぐため、即座に応答を保留（応答制限時間を15分に延長）
                await interaction.deferReply({ ephemeral: true });

                // アンケート受付期間外（isCheckingがfalse）の場合は受付終了を通知
                if (!isChecking) {
                    await interaction.editReply({ content: '⚠️ 現在は次鯖アンケートの受付期間外です。' });
                    return;
                }

                const userId = interaction.user.id;
                let replyContent = '';

                if (interaction.customId === 'next_server_yes') {
                    nextServerResponses.no.delete(userId);
                    nextServerResponses.koko.delete(userId);
                    nextServerResponses.yes.add(userId);
                    replyContent = '次鯖ありで受付しました！';
                } else if (interaction.customId === 'next_server_no') {
                    nextServerResponses.yes.delete(userId);
                    nextServerResponses.koko.delete(userId);
                    nextServerResponses.no.add(userId);
                    replyContent = '次鯖なしで受付しました！';
                } else if (interaction.customId === 'next_server_koko') {
                    nextServerResponses.yes.delete(userId);
                    nextServerResponses.no.delete(userId);
                    nextServerResponses.koko.add(userId);
                    replyContent = '次鯖ココで受付しました！';
                }

                // 保留していた応答を結果メッセージで更新
                await interaction.editReply({ content: replyContent });
            } catch (error) {
                console.error('ボタンインタラクションでエラーが発生しました:', error);

                // エラーが発生した場合もユーザーにフィードバックを返す
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({ content: '⚠️ 処理中にエラーが発生しました。もう一度お試しください。' });
                    } else {
                        await interaction.reply({ content: '⚠️ 処理中にエラーが発生しました。もう一度お試しください。', ephemeral: true });
                    }
                } catch (e) {
                    console.error('エラー通知の送信に失敗しました:', e);
                }
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'hona') return;

    const subcommand = interaction.options.getSubcommand();

    // /hona start - 定期送信開始
    if (subcommand === 'start') {
        if (interval1Hour || interval2Hours || timeout1Hour) {
            return interaction.reply({ content: '⚠️ すでに定期送信は実行中です！', ephemeral: true });
        }

        const targetChannel = client.channels.cache.get(config.LOOP_CHANNEL_ID);
        if (!targetChannel) {
            return interaction.reply({ content: '⚠️ 送信先のチャンネルが見つかりません。設定を確認してください。', ephemeral: true });
        }

        // 毎時指定された分（check）に送信するためのスケジュール
        startTimers(targetChannel);

        return interaction.reply({
            content: `▶️ 定期送信を開始しました！(1時間毎と2時間半毎)\n🕒 **現在の設定**\n- **次鯖確認**: 毎時 ${config.REGULAR_TIME.check}分\n- **次鯖結果**: 毎時 ${config.REGULAR_TIME.result}分\n- **時速リマインド**: 毎時 ${config.REGULAR_TIME.remind}分`,
            ephemeral: false
        });
    }

    // /hona stop - 定期送信停止
    if (subcommand === 'stop') {
        if (!interval1Hour && !interval2Hours && !timeout1Hour) {
            return interaction.reply({ content: '⚠️ 定期送信は現在実行されていません。', ephemeral: true });
        }

        clearTimeout(timeout1Hour);
        clearInterval(interval1Hour);
        clearInterval(interval2Hours);
        timeout1Hour = null;
        interval1Hour = null;
        interval2Hours = null;
        isChecking = false;

        return interaction.reply({ content: '⏸️ 定期送信を停止しました。', ephemeral: true });
    }

    // /hona reminds - リマインド時間管理
    if (subcommand === 'reminds') {
        if (isChecking) {
            return interaction.reply({
                content: '⚠️ 現在アンケート期間中のため、時間の変更はできません。アンケートが終了（remindが送信）してから再度お試しください。',
                ephemeral: true
            });
        }

        const inputCheck = interaction.options.getInteger('check');
        const inputResult = interaction.options.getInteger('result');
        const inputRemind = interaction.options.getInteger('remind');

        // 入力がない項目は現在の設定を引き継ぐ
        const newCheck = inputCheck !== null ? inputCheck : config.REGULAR_TIME.check;
        const newResult = inputResult !== null ? inputResult : config.REGULAR_TIME.result;
        const newRemind = inputRemind !== null ? inputRemind : config.REGULAR_TIME.remind;

        // check < result < remind の関係性を検証
        if (newCheck >= newResult || newCheck >= newRemind) {
            return interaction.reply({
                content: '⚠️ エラー：`check` の時間は `result` や `remind` よりも前の時間に設定してください！',
                ephemeral: true
            });
        }

        if (newResult >= newRemind) {
            return interaction.reply({
                content: '⚠️ エラー：`result` の時間は `remind` よりも前の時間に設定してください！',
                ephemeral: true
            });
        }

        // 値の更新
        let isUpdated = false;
        if (inputCheck !== null || inputResult !== null || inputRemind !== null) {
            config.REGULAR_TIME.check = newCheck;
            config.REGULAR_TIME.result = newResult;
            config.REGULAR_TIME.remind = newRemind;
            isUpdated = true;

            // タイマーが実行中なら再スタート
            if (interval1Hour || timeout1Hour || interval2Hours) {
                clearTimeout(timeout1Hour);
                clearInterval(interval1Hour);
                clearInterval(interval2Hours);
                timeout1Hour = null;
                interval1Hour = null;
                interval2Hours = null;
                isChecking = false;

                const targetChannel = client.channels.cache.get(config.LOOP_CHANNEL_ID);
                if (targetChannel) {
                    startTimers(targetChannel);
                }
            }
        }

        const replyMessage = `🕒 **現在のリマインド設定**\n- **check**: 毎時 ${config.REGULAR_TIME.check}分\n- **result**: 毎時 ${config.REGULAR_TIME.result}分\n- **remind**: 毎時 ${config.REGULAR_TIME.remind}分` + (isUpdated ? `\n\n✅ 設定を更新しました<:hona_4:${EMOJI_ID.hona_4}>` : '');

        return interaction.reply({ content: replyMessage, ephemeral: false });
    }

    // /hona oracle - 占い機能
    if (subcommand === 'oracle') {
        const fortunes = config.FORTUNES;

        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedFortune = fortunes[fortunes.length - 1];

        for (const fortune of fortunes) {
            cumulative += fortune.chance;
            if (rand < cumulative) {
                selectedFortune = fortune;
                break;
            }
        }

        return interaction.reply({
            content: `${interaction.user} さんのおみくじの結果は...\n\n**【 ${selectedFortune.name} 】**\n${selectedFortune.comment}`
        });
    }
});

// 💬 メッセージが送信された時の処理
client.on('messageCreate', async (message) => {
    // Bot自身のメッセージには反応しない（無限ループ防止）
    if (message.author.bot) return;


    // --------------------------------------------------
    // 3. 5桁、6桁の数字監視とチャンネル名変更
    // --------------------------------------------------
    // メッセージが指定された監視チャンネルからのものかチェック
    if (config.CHANNELS_FOR_NUMBER.includes(message.channelId)) {
        // 正規表現で「5桁または6桁の数字のみ」で構成されているか判定
        if (/^\d{5,6}$/.test(message.content)) {
            const renameChannel = message.guild.channels.cache.get(config.RENAME_CHANNEL_ID);
            if (renameChannel) {
                try {
                    await renameChannel.setName(`🆔│【${message.content}】`);
                    renameChannel.send(message.content);
                } catch (error) {
                    renameChannel.send('❌ 部屋番号の変更に失敗しました。（※Discordの制限により、名前変更は10分間に2回までです）');
                    console.error('名前変更エラー:', error);
                }
            }
        }
    }

    // --------------------------------------------------
    // 4. 特定メッセージが送信された際にメッセージを送信 (部分一致判定 - 配列対応)
    // --------------------------------------------------
    config.REPLY_CONFIG.forEach(item => {
        if (message.content.includes(item.keyword)) {
            message.channel.send(item.text);
        }
    });

    // --------------------------------------------------
    // 5. 特定メッセージが送信された際にカスタム絵文字でリアクション (部分一致判定 - 配列対応)
    // --------------------------------------------------
    for (const item of config.REACTION_CONFIG) {
        if (message.content.includes(item.keyword)) {
            try {
                await message.react(item.emojiId);
            } catch (error) {
                console.error('リアクションエラー:', error);
            }
        }
    }
});

// Botのログイン処理
client.login(process.env.DISCORD_TOKEN);