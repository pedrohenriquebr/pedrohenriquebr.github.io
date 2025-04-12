import google.generativeai as genai
from bs4 import BeautifulSoup
import json
import os
import time
from dotenv import load_dotenv

# Carrega variáveis de ambiente (API Key)
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

global_config = {'temperature': 0.2}

if not API_KEY:
    raise ValueError("Erro: GEMINI_API_KEY não encontrada no arquivo .env ou nas variáveis de ambiente.")

# Configura a API do Gemini
try:
    genai.configure(api_key=API_KEY)
    # Configurações de segurança (ajuste conforme necessário)
    # Veja: https://ai.google.dev/docs/safety_setting_gemini
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    model = genai.GenerativeModel(
        'gemini-2.0-flash-lite', # Modelo rápido e eficiente para tradução
         safety_settings=safety_settings
    )
    print("Modelo Gemini configurado com sucesso.")
except Exception as e:
    print(f"Erro ao configurar o modelo Gemini: {e}")
    exit()


# --- Constantes ---
HTML_FILE = 'index.html'
LOCALES_DIR = 'locales'
JSON_FILE = os.path.join(LOCALES_DIR, 'en.json')
TARGET_LANGUAGE = 'English'
SOURCE_LANGUAGE = 'Brazilian Portuguese'
TRANSLATION_DELAY_SECONDS = 5 # Delay entre chamadas API para evitar rate limiting
REQUESTS_PER_MINUTE_LIMIT = 30
MIN_INTERVAL_SECONDS = 60.0 / REQUESTS_PER_MINUTE_LIMIT

# Variável GLOBAL para rastrear o tempo da última chamada
# Inicializada para permitir a primeira chamada imediatamente
last_api_call_time = time.monotonic() - MIN_INTERVAL_SECONDS

def generate_with_ratelimit(prompt: str):
    """
    Gera uma resposta usando o modelo Gemini, aplicando rate limiting
    ANTES de fazer a chamada real à API.
    """
    global last_api_call_time # Declara que vamos modificar a variável global

    # --- Lógica do Rate Limiter ANTES da chamada ---
    current_time = time.monotonic()
    elapsed_time = current_time - last_api_call_time
    wait_time = MIN_INTERVAL_SECONDS - elapsed_time

    if wait_time > 0:
        print(f"Rate Limiter: Aguardando {wait_time:.2f} segundos...")
        time.sleep(wait_time)
    # --- Fim da Lógica do Rate Limiter ---

    # Atualiza o tempo ANTES de fazer a chamada (para contar o início da tentativa)
    last_api_call_time = time.monotonic()

    # --- Chamada Real à API ---
    try:
        print(f"Chamando API Gemini para prompt: {prompt[:50]}...")
        response = model.generate_content(prompt, generation_config={'temperature': 0.2})

        # Verifica se a resposta tem conteúdo
        if response.parts:
             # Limpa aspas extras (opcional, mas útil)
             translated_text = response.text.strip()
             if translated_text.startswith('"') and translated_text.endswith('"'):
                 translated_text = translated_text[1:-1]
             elif translated_text.startswith("'") and translated_text.endswith("'"):
                 translated_text = translated_text[1:-1]
             return translated_text
        else:
            print(f"WARN: Resposta da API vazia ou bloqueada para prompt: {prompt[:50]}...")
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                print(f"Feedback do Prompt (Possível Bloqueio): {response.prompt_feedback}")
            return None # Retorna None em caso de resposta vazia/bloqueio
    except Exception as e:
        print(f"ERRO na chamada da API Gemini para prompt '{prompt[:50]}...': {e}")
        # Em caso de erro, você pode querer adicionar um delay extra
        # ou simplesmente não retornar nada (ou relançar o erro)
        # time.sleep(5) # Delay extra opcional após erro
        # raise e # Se quiser parar o script em caso de erro
        return None # Retorna None em caso de erro na API


# --- Funções Auxiliares ---

def load_existing_translations(filename):
    """Carrega traduções existentes de um arquivo JSON."""
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                print(f"Carregando traduções existentes de: {filename}")
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Aviso: Arquivo JSON existente ('{filename}') está mal formatado. Iniciando com dicionário vazio.")
            return {}
        except Exception as e:
            print(f"Erro ao carregar JSON existente '{filename}': {e}. Iniciando com dicionário vazio.")
            return {}
    else:
        print(f"Arquivo de tradução '{filename}' não encontrado. Iniciando com dicionário vazio.")
        return {}

def save_translations(filename, data):
    """Salva o dicionário de traduções em um arquivo JSON."""
    try:
        # Garante que o diretório 'locales' existe
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Traduções salvas com sucesso em: {filename}")
    except Exception as e:
        print(f"Erro ao salvar traduções em '{filename}': {e}")


def translate_text_gemini(text_to_translate):
    """Traduz o texto usando a API do Gemini."""
    if not text_to_translate or not text_to_translate.strip():
        return None # Não traduz texto vazio

    prompt = f"Translate the following text from {SOURCE_LANGUAGE} to {TARGET_LANGUAGE}. Provide ONLY the translation, without any introductory phrases like 'Here is the translation:' or explanations:\n\n'{text_to_translate}'"

    try:
        translated_text = generate_with_ratelimit(prompt)
        return translated_text
    except Exception as e:
        print(f"Erro ao traduzir texto: {e}")
        return None

# --- Lógica Principal ---

print("Iniciando processo de tradução...")

# Carrega traduções existentes
translations = load_existing_translations(JSON_FILE)

# Lê e parseia o arquivo HTML
try:
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    print(f"Arquivo HTML '{HTML_FILE}' lido e parseado.")
except FileNotFoundError:
    print(f"Erro: Arquivo HTML '{HTML_FILE}' não encontrado.")
    exit()
except Exception as e:
    print(f"Erro ao ler/parsear o arquivo HTML: {e}")
    exit()


# Encontra todos os elementos com o atributo data-i18n-key
elements_to_process = soup.find_all(attrs={'data-i18n-key': True})
print(f"Encontrados {len(elements_to_process)} elementos com 'data-i18n-key'.")

new_translations_count = 0
updated_keys = []

# Itera pelos elementos
for element in elements_to_process:
    key = element['data-i18n-key']
    target_attr = element.get('data-i18n-target-attr') # Usar .get para segurança
    original_text = ''

    # Extrai o texto original (do atributo ou do conteúdo)
    if target_attr:
        if element.has_attr(target_attr):
            original_text = element[target_attr]
        else:
            print(f"AVISO: Elemento com key '{key}' não possui o atributo alvo '{target_attr}'. Pulando.")
            continue
    else:
        # Pega o texto, removendo espaços extras e tratando múltiplos nós de texto
        original_text = element.get_text(separator=' ', strip=True)

    # Pula se a chave já existe no JSON (a menos que queiramos forçar retradução)
    # Mantenha comentado se quiser sempre atualizar com base no HTML atual
    # if key in translations:
    #     print(f"INFO: Chave '{key}' já existe. Pulando.")
    #     continue

    if not original_text or not original_text.strip():
        print(f"AVISO: Texto original vazio para a chave '{key}'. Pulando.")
        continue

    print(f"\nProcessando chave: '{key}'")
    print(f"  Texto Original: '{original_text[:80]}...'")

    if key in translations and translations[key]:
        print(f"  Tradução existente encontrada. Pulando API.")
        continue


    # Chama a API do Gemini para traduzir
    translated_text = translate_text_gemini(original_text)

    if translated_text:
        print(f"  Tradução Gemini: '{translated_text[:80]}...'")
        # Adiciona/Atualiza no dicionário apenas se for diferente da existente (ou se não existir)
        if key not in translations:
            translations[key] = translated_text
            updated_keys.append(key)
            new_translations_count += 1
        else:
             print(f"  Tradução é idêntica à existente. Nenhuma atualização necessária.")
    else:
        print(f"ERRO: Falha ao traduzir a chave '{key}'. A tradução anterior (se existir) será mantida.")

 
# Salva o arquivo JSON final se houve alterações
if new_translations_count > 0:
    # Ordena o dicionário alfabeticamente pelas chaves para consistência
    sorted_translations = dict(sorted(translations.items()))
    save_translations(JSON_FILE, sorted_translations)
    print(f"\nTradução concluída. {new_translations_count} chaves foram adicionadas/atualizadas.")
    print("Chaves atualizadas:", updated_keys)
else:
    print("\nTradução concluída. Nenhuma chave nova ou modificada precisou ser adicionada/atualizada.")

print("Processo finalizado.")