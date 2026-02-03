require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const fs = require('fs');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== ARQUIVOS =====
const cargos = JSON.parse(fs.readFileSync('./cargos.json'));
const registrosPath = './registros.json';

// ===== FUNÇÃO SALVAR REGISTRO =====
function salvarRegistro(dado) {
  const registros = JSON.parse(fs.readFileSync(registrosPath));
  registros.push(dado);
  fs.writeFileSync(registrosPath, JSON.stringify(registros, null, 2));
}

// ===== BOT ONLINE =====
client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online como ${client.user.tag}`);

  const comandos = [
    new SlashCommandBuilder()
      .setName('registrar')
      .setDescription('Registrar bombeiro'),

    new SlashCommandBuilder()
      .setName('promover')
      .setDescription('Promover bombeiro')
      .addUserOption(o =>
        o.setName('usuario')
          .setDescription('Usuário')
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName('rebaixar')
      .setDescription('Rebaixar bombeiro')
      .addUserOption(o =>
        o.setName('usuario')
          .setDescription('Usuário')
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName('exonerar')
      .setDescription('Exonerar bombeiro')
      .addUserOption(o =>
        o.setName('usuario')
          .setDescription('Usuário')
          .setRequired(true)
      )
  ];

  await client.application.commands.set(comandos);
});

// ===== INTERAÇÕES =====
client.on(Events.InteractionCreate, async interaction => {

  // ===== REGISTRO =====
  if (interaction.isChatInputCommand() && interaction.commandName === 'registrar') {
    const modal = new ModalBuilder()
      .setCustomId('registroModal')
      .setTitle('Registro Bombeiros');

    const campos = [
      ['nome', 'Nome'],
      ['id', 'ID'],
      ['cargo', 'Cargo'],
      ['telefone', 'Telefone'],
      ['recrutador', 'Recrutador']
    ];

    campos.forEach(([id, label]) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    });

    await interaction.showModal(modal);
  }

  // ===== SALVAR MODAL =====
  if (interaction.isModalSubmit() && interaction.customId === 'registroModal') {
    const dados = {
      usuario: interaction.user.tag,
      nome: interaction.fields.getTextInputValue('nome'),
      id: interaction.fields.getTextInputValue('id'),
      cargo: interaction.fields.getTextInputValue('cargo'),
      telefone: interaction.fields.getTextInputValue('telefone'),
      recrutador: interaction.fields.getTextInputValue('recrutador'),
      data: new Date().toLocaleString('pt-BR')
    };

    salvarRegistro(dados);
    return interaction.reply({
      content: '✅ Registro salvo com sucesso!',
      ephemeral: true
    });
  }

  // ===== PROMOVER / REBAIXAR / EXONERAR =====
  if (!interaction.isChatInputCommand()) return;

  if (!['promover', 'rebaixar', 'exonerar'].includes(interaction.commandName)) return;

  const membro = interaction.options.getMember('usuario');
  if (!membro) {
    return interaction.reply({ content: '❌ Usuário inválido.', ephemeral: true });
  }

  const cargosMembro = membro.roles.cache.map(r => r.name);
  const cargoAtual = cargos.find(c => cargosMembro.includes(c));
  let index = cargos.indexOf(cargoAtual);

  if (interaction.commandName === 'promover') index++;
  if (interaction.commandName === 'rebaixar') index--;
  if (interaction.commandName === 'exonerar') index = -1;

  if (index < 0 && interaction.commandName !== 'exonerar') {
    return interaction.reply({ content: '❌ Cargo inválido.', ephemeral: true });
  }

  // Remove cargos antigos
  for (const role of membro.roles.cache.values()) {
    if (cargos.includes(role.name)) {
      await membro.roles.remove(role);
    }
  }

  if (interaction.commandName !== 'exonerar') {
    const novoCargo = interaction.guild.roles.cache.find(r => r.name === cargos[index]);
    if (!novoCargo) {
      return interaction.reply({ content: '❌ Cargo não encontrado no servidor.', ephemeral: true });
    }
    await membro.roles.add(novoCargo);
  }

  salvarRegistro({
    usuario: membro.user.tag,
    acao: interaction.commandName,
    novoCargo: interaction.commandName === 'exonerar' ? 'Exonerado' : cargos[index],
    data: new Date().toLocaleString('pt-BR')
  });

  return interaction.reply(`✅ Ação **${interaction.commandName}** aplicada com sucesso.`);
});

// ===== SERVIDOR HTTP (RAILWAY) =====
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Bombeiros Nacional online');
}).listen(process.env.PORT || 3000);

// ===== LOGIN =====
client.login(process.env.TOKEN);
