const LOG_REGISTROS = '1468076065338425405';
const LOG_REGISTROS = '1467818334576971888';
const LOG_BOMBEIROS = '1467818444790694085';
const CARGOS_OFICIAIS = [
  'Sub-Comando',
  'Comando',
  'Comando Geral'
];

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
function isOficial(member) {
  return member.roles.cache.some(role =>
    CARGOS_OFICIAIS.includes(role.name)
  );
}

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
  .setName('pedirset')
  .setDescription('Solicitar set/cargo no Bombeiros')

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
// ===== PEDIR SET =====
if (interaction.isChatInputCommand() && interaction.commandName === 'pedirset') {
  const modal = new ModalBuilder()
    .setCustomId('pedirSetModal')
    .setTitle('Pedido de Set - Bombeiros');

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
    .setLabel('Cargo desejado')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const recrutador = new TextInputBuilder()
    .setCustomId('recrutador')
    .setLabel('Recrutador')
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(id),
    new ActionRowBuilder().addComponents(cargo),
    new ActionRowBuilder().addComponents(recrutador)
  );

  return interaction.showModal(modal);
}

// ===== ENVIAR PEDIDO DE SET =====
if (interaction.isModalSubmit() && interaction.customId === 'pedirSetModal') {
  const canal = interaction.guild.channels.cache.find(c => c.name === 'pedidos-set');

  if (!canal) {
    return interaction.reply({
      content: '❌ Canal pedidos-set não encontrado.',
      ephemeral: true
    });
  }

  const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('aprovar_set')
    .setLabel('✅ APROVAR')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId('reprovar_set')
    .setLabel('❌ REPROVAR')
    .setStyle(ButtonStyle.Danger)
);

canal.send({
  const logRegistro = interaction.guild.channels.cache.get(LOG_REGISTROS);

if (logRegistro) {
  logRegistro.send(
`📝 **NOVO PEDIDO DE SET**
👤 Usuário: ${interaction.user.tag}
🆔 ID: ${interaction.user.id}
🎖️ Cargo solicitado: ${interaction.fields.getTextInputValue('cargo')}
👮 Recrutador: ${interaction.fields.getTextInputValue('recrutador')}
🕒 Data: ${new Date().toLocaleString()}`
  );
}

  embeds: [{
    title: '🚒 PEDIDO DE SET',
    color: 0xff0000,
    fields: [
      { name: '👤 Nome', value: interaction.fields.getTextInputValue('nome') },
      { name: '🆔 ID', value: interaction.fields.getTextInputValue('id') },
      { name: '🎖️ Cargo', value: interaction.fields.getTextInputValue('cargo') },
      { name: '👮 Recrutador', value: interaction.fields.getTextInputValue('recrutador') },
      { name: '👤 Discord', value: `<@${interaction.user.id}>` }
    ],
    footer: { text: `UserID:${interaction.user.id}` }
  }],
  components: [row]
});
// ===== BOTÕES DE APROVAÇÃO =====
if (interaction.isButton()) {
  const embed = interaction.message.embeds[0];
  if (!embed) return;

  const userId = embed.footer.text.replace('UserID:', '');
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!membro) return interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });

  if (interaction.customId === 'aprovar_set') {
    const cargoNome = embed.fields.find(f => f.name.includes('Cargo')).value;
    const cargo = interaction.guild.roles.cache.find(r => r.name === cargoNome);
if (!isOficial(interaction.member)) {
  return interaction.reply({
    content: '❌ Apenas **OFICIAIS** podem aprovar pedidos de set.',
    ephemeral: true
  });
}

    if (!cargo) {
      return interaction.reply({ content: '❌ Cargo não encontrado no servidor.', ephemeral: true });
    }

    await membro.roles.add(cargo);

    await membro.send(`✅ Seu pedido de set foi **APROVADO**!\n🎖️ Cargo recebido: **${cargoNome}**`).catch(() => {});

    await interaction.update({
      content: `✅ Pedido aprovado por ${interaction.user}`,
      components: [],
      embeds: []
    });
  }
const logRegistro = interaction.guild.channels.cache.get(LOG_REGISTROS);

if (logRegistro) {
  logRegistro.send(
`✅ **SET APROVADO**
👤 Usuário: ${membro.user.tag}
🎖️ Cargo: ${cargoNome}
👮 Aprovado por: ${interaction.user.tag}
🕒 Data: ${new Date().toLocaleString()}`
  );
}

  if (interaction.customId === 'reprovar_set') {
    await membro.send('❌ Seu pedido de set foi **REPROVADO**.').catch(() => {});
if (interaction.customId === 'reprovar_set') {

  if (!isOficial(interaction.member)) {
    return interaction.reply({
      content: '❌ Apenas **OFICIAIS** podem reprovar pedidos de set.',
      ephemeral: true
    });
  }

  // resto do código de reprovação
}

    await interaction.update({
      content: `❌ Pedido reprovado por ${interaction.user}`,
      components: [],
      embeds: []
    });
  }
}
const logRegistro = interaction.guild.channels.cache.get(LOG_REGISTROS);

if (logRegistro) {
  logRegistro.send(
`❌ **SET REPROVADO**
👤 Usuário: ${membro.user.tag}
🎖️ Cargo solicitado: ${embed.fields.find(f => f.name.includes('Cargo')).value}
👮 Reprovado por: ${interaction.user.tag}
🕒 Data: ${new Date().toLocaleString()}`
  );
}


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




