require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const token = process.env.DISCORD_BOT_TOKEN;
const channelIdsEnv = process.env.CHANNEL_IDS;
const verifiedRoleId = process.env.VERIFIED_ROLE_ID;

if (!token || !channelIdsEnv || !verifiedRoleId) {
        console.error('Missing one or more required environment variables: DISCORD_BOT_TOKEN, CHANNEL_IDS, VERIFIED_ROLE_ID');
    process.exit(1);
}

const channelIds = channelIdsEnv.split(',').map(id => id.trim()).filter(id => id.length > 0);

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}. Processing channels...`);

    for (const channelId of channelIds) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased?.()) {
                console.warn(`Channel ${channelId} not found or not a text-based channel.`);
                continue;
            }

            const guild = channel.guild;
            const everyoneRole = guild.roles.everyone;
            const verifiedRole = guild.roles.cache.get(verifiedRoleId);

            if (!verifiedRole) {
                console.warn(`Verified role with ID ${verifiedRoleId} not found in guild ${guild.id}.`);
                continue;
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                ViewChannel: false
            });

            await channel.permissionOverwrites.edit(verifiedRole, {
                ViewChannel: true
            });

            console.log(`Updated permissions for channel ${channelId}.`);
        } catch (error) {
            console.error(`Error processing channel ${channelId}:`, error);
        }
    }

    console.log('Permission updates complete.');
    process.exit(0);
});

client.login(token).catch(err => {
    console.error('Failed to login:', err);
    process.exit(1);
});
