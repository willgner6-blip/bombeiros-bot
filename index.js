require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const cargos = JSON.parse(fs.readFileSync('./cargos.json'));
const registrosFile = './registros.json';

client.once(Events.ClientReady, () => {
  console.log(`🔥 Bot online como ${client.user.tag}`);
});

// COMANDO /registrar
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'registrar') {
    const modal = new ModalBuilder()
      .setCustomId('registroModal')
      .setTitle('Registro Bombeiros');

    const nome = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const id = new TextInputBuilder()
      .setCustomId('id')
      .setLabel('ID')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const cargo = new TextInputBuilder()
      .setCustomId('cargo')
      .setLabel('Cargo')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const telefone = new TextInputBuilder()
      .setCustomId('telefone')
      .setLabel('Telefone')
      .setStyle(TextInputStyle.Short);

    const recrutador = new TextInputBuilder()
      .setCustomId('recrutador')
      .setLabel('Recrutador')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(id),
      new ActionRowBuilder().addComponents(cargo),
      new ActionRowBuilder().addComponents(telefone),
      new ActionRowBuilder().addComponents(recrutador)
    );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'registroModal') {
    const data = {
      nome: interaction.fields.getTextInputValue('nome'),
      id: interaction.fields.getTextInputValue('id'),
      cargo: interaction.fields.getTextInputValue('cargo'),
      telefone: interaction.fields.getTextInputValue('telefone'),
      recrutador: interaction.fields.getTextInputValue('recrutador'),
      data: new Date().toLocaleString('pt-BR')
    };

    const registros = JSON.parse(fs.readFileSync(registrosFile));
    registros.push(data);
    fs.writeFileSync(registrosFile, JSON.stringify(registros, null, 2));

    await interaction.reply({ content: '✅ Registro salvo com sucesso!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Bombeiros Nacional online');
}).listen(process.env.PORT || 3000);

