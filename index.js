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
// ==========================================

// タイマー管理用の変数
let timeout1Hour = null;
let interval1Hour = null;
let interval2Hours = null;
let nextServerResponses = { yes: new Set(), no: new Set(), koko: new Set() };

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
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'hona') return;

    const subcommand = interaction.options.getSubcommand();

    if (interaction.isButton()) {
        if (['next_server_yes', 'next_server_no', 'next_server_koko'].includes(interaction.customId)) {
            const userId = interaction.user.id;

            if (interaction.customId === 'next_server_yes') {
                nextServerResponses.no.delete(userId);
                nextServerResponses.koko.delete(userId);
                nextServerResponses.yes.add(userId);
                await interaction.reply({ content: '次鯖ありで受付しました！', ephemeral: true });
            } else if (interaction.customId === 'next_server_no') {
                nextServerResponses.yes.delete(userId);
                nextServerResponses.koko.delete(userId);
                nextServerResponses.no.add(userId);
                await interaction.reply({ content: '次鯖なしで受付しました！', ephemeral: true });
            } else if (interaction.customId === 'next_server_koko') {
                nextServerResponses.yes.delete(userId);
                nextServerResponses.no.delete(userId);
                nextServerResponses.koko.add(userId);
                await interaction.reply({ content: '次鯖ココで受付しました！', ephemeral: true });
            }
        }
        return;
    }

    // /hona start - 定期送信開始
    if (subcommand === 'start') {
        if (interval1Hour || interval2Hours || timeout1Hour) {
            return interaction.reply({ content: '⚠️ すでに定期送信は実行中です！', ephemeral: true });
        }

        const targetChannel = client.channels.cache.get(config.LOOP_CHANNEL_ID);
        if (!targetChannel) {
            return interaction.reply({ content: '⚠️ 送信先のチャンネルが見つかりません。設定を確認してください。', ephemeral: true });
        }

        // 毎時42分に送信するためのスケジュール
        const now = new Date();
        let msUntilNext42 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 42, 0, 0) - now;
        if (msUntilNext42 <= 0) msUntilNext42 += 60 * 60 * 1000; // 既に42分を過ぎていたら次の時間の42分

        const send42MinMessage = () => {
            nextServerResponses = { yes: new Set(), no: new Set(), koko: new Set() };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_server_yes')
                        .setLabel('あり')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('next_server_no')
                        .setLabel('なし')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('next_server_koko')
                        .setLabel('ココ')
                        .setStyle(ButtonStyle.Primary)
                );

            targetChannel.send({
                content: '>>> **次鯖に関して、以下から選択してください！**',
                components: [row]
            });

            // 8分後(50分)に結果を送信
            setTimeout(() => {
                const yesRes = Array.from(nextServerResponses.yes);
                const noRes = Array.from(nextServerResponses.no);
                const kokoRes = Array.from(nextServerResponses.koko);

                let resultMessage = '>>> ## **【次鯖結果確認】**(敬称略)\n\n';
                resultMessage += '**🟢 あり:**\n' + (yesRes.length > 0 ? yesRes.map(id => `<@${id}>`).join(' ') : '') + '\n';
                resultMessage += '**🔴 なし:**\n' + (noRes.length > 0 ? noRes.map(id => `<@${id}>`).join(' ') : '') + '\n';
                resultMessage += '**🔵 ココ:**\n' + (kokoRes.length > 0 ? kokoRes.map(id => `<@${id}>`).join(' ') : '') + '\n';

                targetChannel.send(resultMessage);

                // 8分後(58分)に時速リマインドを送信
                setTimeout(() => {
                    targetChannel.send(`時速の確認などもお願いします<:hona_1:${EMOJI_ID.hona_1}>`);
                }, 8 * 60 * 1000);
            }, 8 * 60 * 1000);
        };

        timeout1Hour = setTimeout(() => {
            send42MinMessage();
            // 以降は1時間毎に繰り返し
            interval1Hour = setInterval(() => {
                send42MinMessage();
            }, 1000 * 60 * 60);
        }, msUntilNext42);

        // 2時間半毎
        interval2Hours = setInterval(() => {
            targetChannel.send(`炊いてくださーい！<:life:${EMOJI_ID.life}>`);
        }, 1000 * 60 * 60 * 2.5);

        return interaction.reply({ content: '▶️ 定期送信を開始しました！(1時間毎と2時間半毎)', ephemeral: true });
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

        return interaction.reply({ content: '⏸️ 定期送信を停止しました。', ephemeral: true });
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
                    await renameChannel.setName(`部屋番号【${message.content}】`);
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