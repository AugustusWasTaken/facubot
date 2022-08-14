const fs = require('node:fs');
const path = require('node:path');
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');

let clientId = '', guildId = '', token = '';
if (process.env.DB_ENVIRONMENT) {
	clientId = process.env.DISCORD_CLIENT_ID;
	guildId = process.env.DISCORD_GUILD_ID;
	token = process.env.DISCORD_TOKEN;
} else {
	clientId = require('./config.json')['clientId'];
	guildId = require('./config.json')['guildId'];
	token = require('./config.json')['token'];
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);