import os
import random
import time
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import aiohttp
import asyncio

# Import discord with voice disabled
import discord
from discord import app_commands
from discord.ext import commands, tasks

# Create a custom bot class that disables voice
class NoVoiceBot(commands.Bot):
    def _get_voice_client(self, guild):
        return None

    async def setup_hook(self) -> None:
        # Adiciona a view persistente no setup_hook (recomendado pelo discord.py)
        self.add_view(VerificationView())
        
        # Sincroniza os comandos uma única vez no início (evita limites de taxa)
        try:
            await self.tree.sync()
            print("Comandos slash sincronizados globalmente no setup_hook!")
        except Exception as e:
            print(f"Erro ao sincronizar comandos no setup_hook: {e}")

# Initialize the bot with default intents (no privileged intents)
intents = discord.Intents.default()
intents.messages = True
intents.guilds = True

bot = NoVoiceBot(
    command_prefix='!',
    intents=intents
)

load_dotenv()

# Configurações do bot
TOKEN = os.getenv('DISCORD_TOKEN')
VERIFIED_ROLE_ID = int(os.getenv('VERIFIED_ROLE_ID'))
LOG_CHANNEL_ID = int(os.getenv('LOG_CHANNEL_ID'))
CHANNEL_ID = int(os.getenv('CHANNEL_ID'))
EVENT_ROLE_NAME = os.getenv('EVENT_ROLE_NAME', 'Evento')

# Configuração da API do Habbo
HABBO_API_URL = "https://origins.habbo.com.br/api/public/users"

# Dicionário para armazenar códigos de verificação e seus tempos de expiração
verification_codes = {}

def generate_verification_code(user_id):
    """Gera um código de verificação único de 5 dígitos"""
    code = str(random.randint(10000, 99999))
    # Armazena o código e o tempo de expiração (15 minutos a partir de agora)
    verification_codes[user_id] = {
        'code': code,
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    return code

def is_code_valid(user_id, code):
    """Verifica se o código é válido e não expirou"""
    if user_id not in verification_codes:
        return False
    
    code_data = verification_codes[user_id]
    if datetime.now(timezone.utc) > code_data['expires_at']:
        # Remove o código expirado
        del verification_codes[user_id]
        return False
    
    return code_data['code'] == code

def save_verified_user(username, discord_id, figure_string):
    """Salva o usuário verificado em um arquivo JSON com as configurações do avatar"""
    filename = "verified_users.json"
    
    # Configurações solicitadas pelo usuário para o avatar
    avatar_config = "&direction=3&head_direction=3&action=std&size=l&gesture=sml"
    
    # Monta a URL de imagem do avatar usando o figureString
    avatar_url = ""
    if figure_string:
        avatar_url = f"https://gaming-avatare.onrender.com/habbo-imaging/avatarimage?figure={figure_string}{avatar_config}"
    
    user_data = {
        "username": username,
        "discord_id": str(discord_id),
        "figure": figure_string,
        "avatar_url": avatar_url,
        "verified_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Carrega dados existentes
    data = []
    if os.path.exists(filename):
        try:
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    data = []
        except Exception as e:
            print(f"Erro ao ler {filename}: {e}. Criando nova lista.")
            data = []
            
    # Remove qualquer entrada anterior para este mesmo discord_id ou username para evitar duplicidade
    data = [u for u in data if u.get("discord_id") != str(discord_id) and u.get("username", "").lower() != username.lower()]
    
    # Adiciona a nova entrada
    data.append(user_data)
    
    # Salva de volta no arquivo JSON
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Usuário {username} salvo com sucesso no arquivo JSON.")
    except Exception as e:
        print(f"Erro ao salvar dados no JSON: {e}")

@tasks.loop(minutes=1)
async def clean_expired_codes():
    """Limpa códigos expirados a cada minuto"""
    current_time = datetime.now(timezone.utc)
    expired_users = [
        user_id for user_id, data in verification_codes.items()
        if current_time > data['expires_at']
    ]
    
    for user_id in expired_users:
        del verification_codes[user_id]
    
    if expired_users:
        print(f"Removidos {len(expired_users)} códigos expirados")

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        
    @discord.ui.button(label="🔑 Gerar Código", style=discord.ButtonStyle.primary, custom_id="generate_code")
    async def generate_code_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Verifica se o usuário já está verificado
        member = interaction.user
        verified_role = interaction.guild.get_role(VERIFIED_ROLE_ID)
        
        if verified_role in member.roles:
            await interaction.response.send_message("Você já está verificado!", ephemeral=True)
            return
            
        # Gera um novo código de verificação
        verification_code = generate_verification_code(interaction.user.id)
        
        # Envia as instruções com o código
        await interaction.response.send_message(
            f"🔑 **Código de Verificação Gerado**\n"
            f"Por favor, adicione o seguinte código na sua **MISSÃO** no Habbo Origins e clique em 'Verificar':\n"
            f"```\n{verification_code}\n```\n"
            f"⚠️ **Atenção:** Este código expira em 15 minutos!",
            ephemeral=True
        )
    
    @discord.ui.button(label="✅ Verificar", style=discord.ButtonStyle.success, custom_id="verify_account")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Verifica se o usuário já está verificado
        member = interaction.user
        verified_role = interaction.guild.get_role(VERIFIED_ROLE_ID)
        
        if verified_role in member.roles:
            await interaction.response.send_message("Você já está verificado!", ephemeral=True)
            return
            
        # Verifica se o usuário tem um código de verificação ativo
        if interaction.user.id not in verification_codes:
            await interaction.response.send_modal(VerificationModal())
            return
            
        code_data = verification_codes[interaction.user.id]
        
        # Se não tiver nome do Habbo salvo, pede o nome
        if not code_data.get('habbo_name'):
            await interaction.response.send_modal(VerificationModal())
            return
            
        await verify_habbo_account(interaction, code_data['habbo_name'], already_deferred=False)

class VerificationModal(discord.ui.Modal):
    def __init__(self):
        # O título é definido aqui, no super().__init__()
        super().__init__(title="Verificação do Habbo")
        self.add_item(discord.ui.TextInput(
            label="Seu nome de usuário no Habbo",
            placeholder="Digite seu nome de usuário do Habbo",
            min_length=1,
            max_length=50,
            required=True
        ))

    async def on_submit(self, interaction: discord.Interaction):
        # Obtém o valor do campo de texto
        habbo_name = self.children[0].value.strip()
        
        # Garante que o usuário tem um código ativo antes de prosseguir
        if interaction.user.id not in verification_codes:
            await interaction.response.send_message(
                "❌ Nenhum código de verificação ativo encontrado. "
                "Por favor, clique em 'Gerar Código' primeiro.",
                ephemeral=True
            )
            return

        # Salva o nome do Habbo para este usuário
        verification_codes[interaction.user.id]['habbo_name'] = habbo_name
        
        # Envia mensagem de processamento
        await interaction.response.defer(ephemeral=True, thinking=True)
        
        try:
            # Inicia o processo de verificação sem enviar nova resposta
            await verify_habbo_account(interaction, habbo_name, already_deferred=True)
        except Exception as e:
            print(f"Erro ao verificar conta: {e}")
            try:
                await interaction.followup.send(
                    "❌ Ocorreu um erro ao processar sua verificação. Tente novamente.",
                    ephemeral=True
                )
            except:
                pass  # Se já tivermos respondido, apenas ignore

async def verify_habbo_account(interaction: discord.Interaction, habbo_name: str, already_deferred: bool = False):
    """
    Verifica a conta do Habbo do usuário
    
    Args:
        interaction: A interação do Discord
        habbo_name: Nome do usuário no Habbo
        already_deferred: Se a resposta já foi adiada (para evitar duplo defer)
    """
    deferred = already_deferred
    if not already_deferred:
        try:
            await interaction.response.defer(ephemeral=True)
            deferred = True
        except discord.NotFound:
            print("Aviso: A interação de verificação expirou (NotFound). Tentando processar mesmo assim.")
        except Exception as e:
            print(f"Erro inesperado ao adiar verificação: {e}")
            
    async def send_reply(content: str, ephemeral: bool = True):
        if deferred:
            try:
                await interaction.followup.send(content, ephemeral=ephemeral)
                return
            except discord.NotFound:
                print("Aviso: O token da interação expirou no envio do followup de verificação. Enviando para o canal.")
            except Exception as e:
                print(f"Erro ao enviar followup de verificação: {e}")
        try:
            await interaction.channel.send(f"⚠️ {interaction.user.mention} {content}")
        except Exception as e:
            print(f"Erro ao enviar fallback de verificação: {e}")
            
    try:
        # Verifica se o usuário tem um código de verificação ativo
        if interaction.user.id not in verification_codes:
            await send_reply(
                "❌ Nenhum código de verificação ativo encontrado. "
                "Por favor, clique em 'Gerar Código' primeiro.",
                ephemeral=True
            )
            return
            
        # Faz a requisição para a API do Habbo com tratamento de erros
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{HABBO_API_URL}?name={habbo_name}", timeout=10) as response:
                    if response.status == 200:
                        user_data = await response.json()
                        motto = user_data.get('motto', '')
                        
                        # Obtém o código de verificação atual do usuário
                        code_data = verification_codes[interaction.user.id]
                        
                        # Verifica se o código está no motto
                        if code_data['code'] in motto:
                            # Remove o código usado
                            del verification_codes[interaction.user.id]
                            
                            # Adiciona o cargo de verificado
                            member = interaction.user
                            verified_role = interaction.guild.get_role(VERIFIED_ROLE_ID)
                            
                            if verified_role and verified_role not in member.roles:
                                try:
                                    await member.add_roles(verified_role)
                                except Exception as e:
                                    print(f"Erro ao adicionar cargo verificado: {e}")

                            # Gerenciamento do cargo do evento
                            if EVENT_ROLE_NAME:
                                event_role = discord.utils.get(interaction.guild.roles, name=EVENT_ROLE_NAME)
                                if not event_role:
                                    try:
                                        event_role = await interaction.guild.create_role(
                                            name=EVENT_ROLE_NAME,
                                            reason="Cargo do evento criado automaticamente pelo bot de verificação."
                                        )
                                        print(f"Cargo do evento '{EVENT_ROLE_NAME}' criado com sucesso.")
                                    except discord.Forbidden:
                                        print(f"Sem permissão para criar o cargo do evento '{EVENT_ROLE_NAME}'.")
                                    except Exception as e:
                                        print(f"Erro ao criar cargo do evento '{EVENT_ROLE_NAME}': {e}")
                                
                                if event_role and event_role not in member.roles:
                                    try:
                                        await member.add_roles(event_role)
                                        print(f"Cargo '{EVENT_ROLE_NAME}' atribuído a {member}.")
                                    except discord.Forbidden:
                                        print(f"Sem permissão para adicionar o cargo do evento '{EVENT_ROLE_NAME}' a {member}.")
                                    except Exception as e:
                                        print(f"Erro ao adicionar o cargo do evento '{EVENT_ROLE_NAME}' a {member}: {e}")

                            try:
                                # Usa o nome retornado pela API ou o que o usuário digitou
                                habbo_nick = user_data.get('name', habbo_name)
                                figure_string = user_data.get('figureString', user_data.get('figure', ''))
                                
                                # Salva o usuário verificado no JSON
                                save_verified_user(habbo_nick, interaction.user.id, figure_string)
                                # Verifica se o apelido é diferente do atual
                                if member.nick != habbo_nick:
                                    await member.edit(nick=habbo_nick)
                                    print(f"Apelido de {interaction.user} atualizado para {habbo_nick}")
                                
                                # Mensagem de sucesso com o nome formatado
                                await send_reply(
                                    f"✅ Verificação concluída!\n"
                                    f"Bem-vindo(a) ao servidor, {habbo_nick}!\n"
                                    f"Seu apelido foi atualizado para **{habbo_nick}**",
                                    ephemeral=True
                                )
                            except discord.Forbidden:
                                print(f"Não foi possível atualizar o apelido do usuário {interaction.user.id}: Sem permissão")
                                await send_reply(
                                    f"✅ Verificação concluída!\n"
                                    f"Bem-vindo(a) ao servidor, {user_data.get('name', 'usuário')}!\n"
                                    "_Observação: Não foi possível atualizar seu apelido automaticamente._",
                                    ephemeral=True
                                )
                            except Exception as e:
                                print(f"Erro ao atualizar apelido do usuário {interaction.user.id}: {e}")
                                await send_reply(
                                    f"✅ Verificação concluída!\n"
                                    f"Bem-vindo(a) ao servidor, {user_data.get('name', 'usuário')}!",
                                    ephemeral=True
                                )

                            # Log da verificação
                            log_channel = interaction.guild.get_channel(LOG_CHANNEL_ID)
                            if log_channel:
                                embed = discord.Embed(
                                    title="🔒 Nova Verificação",
                                    description=(
                                        f"**Usuário:** {interaction.user.mention}\n"
                                        f"**Habbo:** {user_data.get('name', 'Desconhecido')}\n"
                                        f"**ID do Discord:** `{interaction.user.id}`"
                                    ),
                                    color=discord.Color.green()
                                )
                                await log_channel.send(embed=embed)
                            return
                        
                        # Verifica se o código expirou
                        if datetime.now(timezone.utc) > code_data['expires_at']:
                            del verification_codes[interaction.user.id]
                            await send_reply(
                                "❌ O código de verificação expirou. "
                                "Por favor, clique em 'Gerar Código' para obter um novo código.",
                                ephemeral=True
                            )
                        else:
                            remaining = int((code_data['expires_at'] - datetime.now(timezone.utc)).total_seconds() / 60)
                            await send_reply(
                                f"❌ Código de verificação não encontrado na sua missão do Habbo.\n\n"
                                f"Por favor, adicione o seguinte código à sua **MISSÃO** e tente novamente:\n"
                                f"```\n{code_data['code']}\n```\n"
                                f"⏳ Tempo restante: {remaining} minutos",
                                ephemeral=True
                            )
                        return
                    
                    # Se chegou aqui, o usuário não foi encontrado ou houve outro erro
                    error_msg = "❌ Não foi possível encontrar este usuário no Habbo. Verifique se o nome está correto."
                    if response.status != 404:
                        error_msg = "❌ Ocorreu um erro ao acessar os servidores do Habbo. Tente novamente mais tarde."
                        
                    await send_reply(error_msg, ephemeral=True)
                    
        except asyncio.TimeoutError:
            error_msg = "⏱️ A verificação está demorando muito. Por favor, tente novamente em alguns instantes."
            await send_reply(error_msg, ephemeral=True)
                
        except Exception as e:
            print(f"Erro na requisição à API do Habbo: {e}")
            error_msg = "❌ Ocorreu um erro ao processar sua verificação. Tente novamente mais tarde."
            await send_reply(error_msg, ephemeral=True)
            
    except Exception as e:
        print(f"Erro ao verificar usuário: {e}")
        error_msg = "❌ Ocorreu um erro inesperado. Por favor, tente novamente mais tarde."
        await send_reply(error_msg, ephemeral=True)

@bot.tree.command(name="addhabbo", description="Adiciona um Habbo manualmente a um membro do Discord sem precisar verificar.")
@app_commands.default_permissions(administrator=True)
async def addhabbo(interaction: discord.Interaction, member: discord.Member, habbo_name: str):
    deferred = False
    try:
        # Adia a resposta para dar tempo de consultar a API
        await interaction.response.defer(ephemeral=True)
        deferred = True
    except discord.NotFound:
        print("Aviso: A interação com /addhabbo expirou (NotFound) devido à latência. Tentando processar mesmo assim.")
    except Exception as e:
        print(f"Erro inesperado ao adiar a resposta: {e}")

    async def send_reply(content: str, ephemeral: bool = True):
        if deferred:
            try:
                await interaction.followup.send(content, ephemeral=ephemeral)
                return
            except discord.NotFound:
                print("Aviso: O token da interação expirou no envio do followup. Enviando para o canal.")
            except Exception as e:
                print(f"Erro ao enviar followup: {e}")
        try:
            # Se a interação falhou ou expirou, enviamos uma mensagem normal no canal mencionando o admin
            await interaction.channel.send(f"⚠️ {interaction.user.mention} {content}")
        except Exception as e:
            print(f"Erro ao enviar resposta de fallback no canal: {e}")

    try:
        # Consulta a API do Habbo para obter o nick correto e a figura do avatar
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{HABBO_API_URL}?name={habbo_name}", timeout=10) as response:
                if response.status == 200:
                    user_data = await response.json()
                    habbo_nick = user_data.get('name', habbo_name)
                    figure_string = user_data.get('figureString', user_data.get('figure', ''))
                elif response.status == 404:
                    await send_reply(f"❌ Não foi possível encontrar o usuário '{habbo_name}' no Habbo Origins.", ephemeral=True)
                    return
                else:
                    await send_reply(f"❌ Erro ao acessar a API do Habbo (Código: {response.status}).", ephemeral=True)
                    return
    except Exception as e:
        print(f"Erro ao consultar API do Habbo: {e}")
        await send_reply(f"❌ Ocorreu um erro ao consultar os dados do Habbo: {e}", ephemeral=True)
        return

    # Adiciona o cargo de verificado
    verified_role = interaction.guild.get_role(VERIFIED_ROLE_ID)
    if verified_role and verified_role not in member.roles:
        try:
            await member.add_roles(verified_role)
        except Exception as e:
            print(f"Erro ao adicionar cargo verificado: {e}")

    # Gerenciamento do cargo do evento
    if EVENT_ROLE_NAME:
        event_role = discord.utils.get(interaction.guild.roles, name=EVENT_ROLE_NAME)
        if not event_role:
            try:
                event_role = await interaction.guild.create_role(
                    name=EVENT_ROLE_NAME,
                    reason="Cargo do evento criado automaticamente pelo bot de verificação."
                )
                print(f"Cargo do evento '{EVENT_ROLE_NAME}' criado com sucesso.")
            except discord.Forbidden:
                print(f"Sem permissão para criar o cargo do evento '{EVENT_ROLE_NAME}'.")
            except Exception as e:
                print(f"Erro ao criar cargo do evento '{EVENT_ROLE_NAME}': {e}")
        
        if event_role and event_role not in member.roles:
            try:
                await member.add_roles(event_role)
                print(f"Cargo '{EVENT_ROLE_NAME}' atribuído a {member}.")
            except discord.Forbidden:
                print(f"Sem permissão para adicionar o cargo do evento '{EVENT_ROLE_NAME}' a {member}.")
            except Exception as e:
                print(f"Erro ao adicionar o cargo do evento '{EVENT_ROLE_NAME}' a {member}: {e}")

    # Salva o usuário verificado no JSON
    save_verified_user(habbo_nick, member.id, figure_string)

    # Atualiza o apelido do usuário para o nome do Habbo
    nick_changed = False
    try:
        if member.nick != habbo_nick:
            await member.edit(nick=habbo_nick)
            nick_changed = True
    except discord.Forbidden:
        print(f"Não foi possível alterar apelido de {member} (Sem Permissão)")
    except Exception as e:
        print(f"Erro ao alterar apelido de {member}: {e}")

    # Log da verificação manual no canal de logs
    log_channel = interaction.guild.get_channel(LOG_CHANNEL_ID)
    if log_channel:
        embed = discord.Embed(
            title="🔒 Nova Verificação Manual (Admin)",
            description=(
                f"**Usuário:** {member.mention}\n"
                f"**Habbo:** {habbo_nick}\n"
                f"**ID do Discord:** `{member.id}`\n"
                f"**Autorizado por:** {interaction.user.mention}"
            ),
            color=discord.Color.orange()
        )
        await log_channel.send(embed=embed)

    msg = f"✅ Usuário {member.mention} verificado manualmente como **{habbo_nick}** com sucesso!"
    if not nick_changed:
        msg += "\n_Nota: O apelido não pôde ser atualizado automaticamente (permissões insuficientes ou o usuário é o dono do servidor)._"
        
    await send_reply(msg, ephemeral=True)

@bot.tree.command(name="sync", description="Sincroniza os comandos slash do bot (Apenas Administradores).")
@app_commands.default_permissions(administrator=True)
async def sync(interaction: discord.Interaction):
    deferred = False
    try:
        await interaction.response.defer(ephemeral=True)
        deferred = True
    except discord.NotFound:
        print("Aviso: A interação com /sync expirou (NotFound) devido à latência. Tentando sincronizar mesmo assim.")
    except Exception as e:
        print(f"Erro inesperado ao adiar resposta do sync: {e}")

    async def send_reply(content: str):
        if deferred:
            try:
                await interaction.followup.send(content, ephemeral=True)
                return
            except discord.NotFound:
                print("Aviso: O token da interação expirou no envio do followup do sync. Enviando para o canal.")
            except Exception as e:
                print(f"Erro ao enviar followup do sync: {e}")
        try:
            await interaction.channel.send(f"⚠️ {interaction.user.mention} {content}")
        except Exception as e:
            print(f"Erro ao enviar resposta de fallback no canal: {e}")

    try:
        await bot.tree.sync()
        for guild in bot.guilds:
            bot.tree.copy_global_to(guild=guild)
            await bot.tree.sync(guild=guild)
        await send_reply("✅ Todos os comandos slash foram sincronizados com sucesso!")
    except Exception as e:
        await send_reply(f"❌ Ocorreu um erro ao sincronizar: {e}")

@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user.name}')
    
    # Evita executar a configuração inicial mais de uma vez em caso de reconexão
    if getattr(bot, 'startup_done', False):
        print("Bot reconectado. Pulando configuração inicial do canal.")
        return
    bot.startup_done = True

    try:
        # Inicia a limpeza de códigos expirados se não estiver rodando
        if not clean_expired_codes.is_running():
            clean_expired_codes.start()
        
        # DEBUG: Mostra o ID do canal que está sendo usado
        print(f"DEBUG: Procurando pelo canal com ID: {CHANNEL_ID}")
        
        # DEBUG: Lista todos os canais que o bot pode ver
        print("\nDEBUG: Lista de servidores e canais que o bot pode acessar:")
        for guild in bot.guilds:
            print(f"\nServidor: {guild.name} (ID: {guild.id})")
            for text_channel in guild.text_channels:
                print(f"  - Canal: #{text_channel.name} (ID: {text_channel.id})")
        
        # Envia a mensagem de verificação para o canal especificado
        channel = bot.get_channel(CHANNEL_ID)
        if channel:
            print(f"\nSUCESSO: Canal encontrado! Nome: #{channel.name} (ID: {channel.id})")
            
            # Verifica se já existe uma mensagem de verificação
            try:
                async for message in channel.history(limit=10):
                    if message.author == bot.user and message.components:
                        try:
                            await message.delete()
                        except discord.Forbidden:
                            print(f"AVISO: Sem permissão para apagar a mensagem antiga (ID: {message.id}).")
            except discord.Forbidden:
                print("AVISO: Sem permissão para ler o histórico de mensagens (Read Message History) no canal.")
            except Exception as e:
                print(f"Erro ao verificar mensagens antigas: {e}")
            
            # Cria a mensagem de verificação
            embed = discord.Embed(
                title="🔐 Verificação para a Imagem de Aniversário de 2 anos do Habbo Origins Brasil",
                description=(
                    "Para se verificar, siga estes passos:\n\n"
                    "1️⃣ Clique em **Gerar Código** para receber um código de verificação\n"
                    "2️⃣ Adicione o código recebido na sua **MISSÃO** no Habbo\n"
                    "3️⃣ Clique em **Verificar** e insira seu nome de usuário do Habbo\n\n"
                    "⚠️ O código expira em 15 minutos!"
                ),
                color=discord.Color.blue()
            )
            
            try:
                await channel.send(embed=embed, view=VerificationView())
                print("Mensagem de verificação enviada com sucesso!")
            except discord.Forbidden:
                print(f"ERRO: O bot não tem permissão para enviar mensagens (Send Messages) ou embeds (Embed Links) no canal #{channel.name} (ID: {channel.id}).")
            except Exception as e:
                print(f"Erro ao enviar mensagem de verificação: {e}")
        else:
            print(f"\nERRO: Não foi possível encontrar o canal com ID: {CHANNEL_ID}")
            print("Verifique se:")
            print("1. O ID do canal está correto")
            print("2. O bot tem permissão para ver o canal")
            print("3. O bot está no servidor correto")
            print("4. O canal é um canal de texto (não categoria ou voz)")
            
        print("\nBot está pronto!")
    except Exception as e:
        print(f"Erro ao iniciar o bot: {e}")

# Inicia o bot
if __name__ == "__main__":
    if not TOKEN or not VERIFIED_ROLE_ID or not LOG_CHANNEL_ID or not CHANNEL_ID:
        print("Erro: Verifique se todas as variáveis necessárias estão definidas no arquivo .env")
        print(f"TOKEN: {'Definido' if TOKEN else 'Faltando'}")
        print(f"VERIFIED_ROLE_ID: {'Definido' if VERIFIED_ROLE_ID else 'Faltando'}")
        print(f"LOG_CHANNEL_ID: {'Definido' if LOG_CHANNEL_ID else 'Faltando'}")
        print(f"CHANNEL_ID: {'Definido' if CHANNEL_ID else 'Faltando'}")
    else:
        try:
            bot.run(TOKEN)
        except discord.LoginFailure:
            print("Erro: Token do bot inválido. Verifique o TOKEN no arquivo .env")
        except Exception as e:
            print(f"Erro ao iniciar o bot: {e}")
