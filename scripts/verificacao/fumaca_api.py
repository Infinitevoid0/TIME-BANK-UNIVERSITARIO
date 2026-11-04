"""Roteiro de fumaça da API (parte de API da seção 12).

Uso: python3 scripts/verificacao/fumaca_api.py http://127.0.0.1:8090 MOD_EMAIL MOD_SENHA
Cria contas e ofertas de teste: rode antes do reset final, nunca durante a aula.
"""
import json, sys, time, uuid, threading, urllib.request, urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5067"
MOD_EMAIL = sys.argv[2] if len(sys.argv) > 2 else "mod.teste@ufsc.br"
MOD_SENHA = sys.argv[3] if len(sys.argv) > 3 else "ModTeste-2026"
falhas = []


def req(metodo, caminho, corpo=None, token=None, multipart=None, cru=False):
    dados = None
    cab = {}
    if token:
        cab["Authorization"] = f"Bearer {token}"
    if multipart:
        limite = uuid.uuid4().hex
        nome, conteudo, tipo = multipart
        dados = (f"--{limite}\r\nContent-Disposition: form-data; name=\"arquivo\"; filename=\"{nome}\"\r\n"
                 f"Content-Type: {tipo}\r\n\r\n").encode() + conteudo + f"\r\n--{limite}--\r\n".encode()
        cab["Content-Type"] = f"multipart/form-data; boundary={limite}"
    elif corpo is not None:
        dados = json.dumps(corpo).encode()
        cab["Content-Type"] = "application/json"
    r = urllib.request.Request(BASE + caminho, data=dados, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            texto = resp.read()
            return resp.status, (texto if cru else (json.loads(texto) if texto and texto[:1] in b"{[" else texto.decode(errors="replace")))
    except urllib.error.HTTPError as e:
        texto = e.read()
        try:
            return e.code, json.loads(texto)
        except Exception:
            return e.code, texto.decode(errors="replace")


def checa(nome, condicao, detalhe=""):
    print(("PASSOU " if condicao else "FALHOU ") + nome + ("" if condicao else f"  -> {detalhe}"))
    if not condicao:
        falhas.append(nome)


for _ in range(60):
    try:
        if req("GET", "/health")[0] == 200:
            break
    except Exception:
        pass
    time.sleep(1)

sufixo = uuid.uuid4().hex[:6]
st, cursos = req("GET", "/api/cursos")
checa("cursos públicos", st == 200 and len(cursos) > 0, cursos)
curso = cursos[0]["id"]
disciplina = cursos[0]["disciplinas"][0]["id"]


def conta(nome, extra=None):
    email = f"{nome.lower()}.{sufixo}@grad.ufsc.br"
    corpo = {"nome": f"{nome} Silva Teste", "email": email, "senhaLimpa": "senha-segura-1", "cursoId": curso, "aceiteAviso": True}
    corpo.update(extra or {})
    st, r = req("POST", "/api/usuarios", corpo)
    checa(f"cadastro {nome}", st == 201, r)
    st, r = req("POST", "/api/usuarios/login", {"email": email.upper(), "senha": "senha-segura-1"})
    checa(f"login {nome} (e-mail em maiúsculas)", st == 200 and "token" in r, r)
    return r["token"], r["usuario"]["id"]


ta, ida = conta("Ana")
tb, idb = conta("Bruno")
tc, idc = conta("Carla")
tt, idt = conta("Tipo", {"tipo": 3})
st, me = req("GET", "/api/usuarios/me", token=tt)
checa("cadastro com tipo=3 vira Aluno", st == 200 and me["tipo"] == 1, me)
st, r = req("POST", "/api/usuarios", {"nome": "Sem Aviso", "email": f"semaviso.{sufixo}@grad.ufsc.br", "senhaLimpa": "senha-segura-1", "cursoId": curso})
checa("cadastro sem aceite do aviso recusado (422 AVISO_NAO_ACEITO)", st == 422 and r.get("codigo") == "AVISO_NAO_ACEITO", r)

st1, r1 = req("POST", "/api/usuarios/login", {"email": "naoexiste@grad.ufsc.br", "senha": "x"})
st2, r2 = req("POST", "/api/usuarios/login", {"email": f"ana.{sufixo}@grad.ufsc.br", "senha": "errada"})
checa("login com mensagem única", st1 == st2 == 401 and r1["detail"] == r2["detail"] == "E-mail ou senha não conferem.", (r1, r2))

st, r = req("GET", "/api/atividades")
checa("sem token dá 401", st == 401 and r.get("codigo") == "NAO_AUTENTICADO", r)

st, mod = req("POST", "/api/usuarios/login", {"email": MOD_EMAIL, "senha": MOD_SENHA})
checa("login da moderação", st == 200, mod)
tm = mod["token"]

xss = '<p>Ajudo em <strong>cálculo</strong></p><img src=x onerror=alert(1)><script>alert(1)</script><a href="javascript:alert(1)">x</a><ol><li data-list="bullet">um</li></ol>'
st, of = req("POST", "/api/atividades", {"titulo": "Reforço de cálculo", "descricao": xss, "custoHoras": 1, "disciplinaId": disciplina}, token=ta)
checa("oferta criada (201, status 1)", st == 201 and of["status"] == 1, of)
d = of.get("descricao", "")
checa("descrição sanitizada", "<script" not in d and "onerror" not in d and "<img" not in d and "javascript:" not in d and 'data-list="bullet"' in d, d)
oid = of["id"]
st, r = req("POST", "/api/atividades", {"titulo": "Muito tempo", "descricao": "<p>x</p>", "custoHoras": 5}, token=ta)
checa("tempo 5 h recusado (422 TEMPO_FORA_DO_LIMITE)", st == 422 and r.get("codigo") == "TEMPO_FORA_DO_LIMITE", r)

st, r = req("PUT", f"/api/atividades/{oid}/moderar", 2, token=tb)
checa("aluno não modera (403)", st == 403, r)
st, r = req("PUT", f"/api/usuarios/{idb}/admin", {"nome": "X Y", "email": f"bruno.{sufixo}@grad.ufsc.br", "tipo": 3, "saldoHoras": 99}, token=tb)
checa("aluno não chama /admin (403)", st == 403, r)
st, r = req("GET", "/api/usuarios", token=tb)
checa("aluno não lista usuários (403)", st == 403, r)

st, r = req("PUT", f"/api/atividades/{oid}/moderar", 2, token=tm)
checa("moderação aprova", st == 200 and r["status"] == 2, r)
st, r = req("PUT", f"/api/atividades/{oid}/moderar", 2, token=tm)
checa("aprovar de novo dá 409 TRANSICAO_INVALIDA", st == 409 and r.get("codigo") == "TRANSICAO_INVALIDA", r)

st, lista = req("GET", "/api/atividades", token=tc)
checa("oferta aparece em Explorar", st == 200 and any(a["id"] == oid for a in lista), lista)
item = next(a for a in lista if a["id"] == oid)
checa("sem e-mail nem horas de outros na lista", "email" not in json.dumps(item).lower() and item["ofertante"]["nome"] == "Ana T.", item)

st, r = req("GET", f"/api/chats/{oid}", token=tc)
checa("GET do chat de oferta aberta não cria chat (409/403)", st in (403, 409), r)

st, r = req("POST", f"/api/atividades/{oid}/comprar", token=ta)
checa("pedir a própria oferta (422 PROPRIA_OFERTA)", st == 422 and r.get("codigo") == "PROPRIA_OFERTA", r)

resultados = {}
def pedir(nome, token):
    resultados[nome] = req("POST", f"/api/atividades/{oid}/comprar", token=token)
ts = [threading.Thread(target=pedir, args=(n, t)) for n, t in (("B", tb), ("C", tc), ("B2", tb))]
[t.start() for t in ts]
[t.join() for t in ts]
codigos = sorted(v[0] for v in resultados.values())
checa("pedidos simultâneos: um 200 e o resto 409", codigos.count(200) == 1 and codigos.count(409) == 2, {k: (v[0], v[1].get("codigo") if isinstance(v[1], dict) else v[1]) for k, v in resultados.items()})
quem = "B" if resultados["B"][0] == 200 or resultados["B2"][0] == 200 else "C"
tp, idp = (tb, idb) if quem == "B" else (tc, idc)
tx, idx = (tc, idc) if quem == "B" else (tb, idb)
st, h = req("GET", "/api/usuarios/me/horas", token=tp)
checa("quem pediu fica com 1 h e 1 reservada", h == {"horas": 1, "reservadas": 1, "oferecidas": 0, "recebidas": 0}, h)
st, h2 = req("GET", "/api/usuarios/me/horas", token=tx)
checa("quem perdeu continua com 2 h", h2["horas"] == 2 and h2["reservadas"] == 0, h2)

st, r = req("GET", f"/api/chats/{oid}", token=tx)
checa("terceiro abrindo o chat: 403", st == 403 and r.get("codigo") == "ACESSO_NEGADO", r)
st, r = req("GET", f"/api/atividades/{oid}", token=tx)
checa("terceiro abrindo a troca: 403", st == 403, r)
st, r = req("POST", f"/api/chats/{oid}/mensagens", {"conteudo": "oi"}, token=ta)
checa("participante manda mensagem", st == 200 and r["remetente"]["nome"] == "Ana T.", r)
st, r = req("GET", f"/api/chats/{oid}", token=tp)
checa("participante lê o chat", st == 200 and len(r["mensagens"]) == 1, r)

png = bytes.fromhex("89504E470D0A1A0A0000000D4948445200000001000000010806000000" "1F15C4890000000D49444154789C6360000002000100E221BC330000000049454E44AE426082")
st, r = req("POST", f"/api/anexos/{oid}", multipart=("foto.png", b"<html><script>alert(1)</script></html>", "image/png"), token=ta)
checa("arquivo falso com nome .png recusado (422 ARQUIVO_INVALIDO)", st == 422 and r.get("codigo") == "ARQUIVO_INVALIDO", r)
st, r = req("POST", f"/api/anexos/{oid}", multipart=("../../evil.png", png, "image/png"), token=tx)
checa("terceiro não envia comprovante (403)", st == 403, r)
st, an = req("POST", f"/api/anexos/{oid}", multipart=("../../comprovante-a.png", png, "image/png"), token=ta)
checa("comprovante de quem oferece aceito", st == 201 and an["nomeArquivo"] == "comprovante-a.png", an)
st, r = req("GET", f"/api/anexos/{an['id']}/arquivo", token=tx, cru=True)
checa("terceiro não baixa o comprovante (403)", st == 403, r)
st, r = req("GET", f"/api/anexos/{an['id']}/arquivo", token=tp, cru=True)
checa("participante baixa o comprovante", st == 200 and r[:4] == b"\x89PNG", r[:20])
st, r = req("GET", f"/uploads/atividades/{oid}/x.png", cru=True)
# Pelo nginx, caminhos desconhecidos caem no index.html do front; o que importa é nenhum arquivo sair daqui.
checa("/uploads não serve arquivo", st in (401, 404) or (st == 200 and not r.startswith(bytes([0x89]) + b"PNG")), st)
st, r = req("POST", f"/api/anexos/{oid}", multipart=("comprovante-b.jpg", png, "image/png"), token=tp)
checa("comprovante de quem pediu aceito", st == 201 and r["tipoMime"] == "image/png", r)
st, a = req("GET", f"/api/atividades/{oid}", token=tp)
checa("com os dois comprovantes vai para 7", a["status"] == 7, a)

res2 = {}
def validar(n):
    res2[n] = req("PUT", f"/api/atividades/{oid}/moderacao-final", {"acao": "Validar"}, token=tm)
ts = [threading.Thread(target=validar, args=(n,)) for n in range(3)]
[t.start() for t in ts]
[t.join() for t in ts]
cods = sorted(v[0] for v in res2.values())
checa("conferência concorrente: um 200 e o resto 409", cods.count(200) == 1 and cods.count(409) == 2, cods)
st, ha = req("GET", "/api/usuarios/me/horas", token=ta)
checa("quem ofereceu ganhou 1 h (3 h)", ha["horas"] == 3 and ha["oferecidas"] == 1, ha)
st, hp = req("GET", "/api/usuarios/me/horas", token=tp)
checa("quem pediu segue com 1 h e recebeu 1", hp["horas"] == 1 and hp["reservadas"] == 0 and hp["recebidas"] == 1, hp)
st, hist = req("GET", f"/api/atividades/{oid}/historico", token=tp)
checa("histórico com as transições", st == 200 and [e["statusNovo"] for e in hist] == [1, 2, 6, 7, 9], hist)

st, of2 = req("POST", "/api/atividades", {"titulo": "Revisão longa", "descricao": "<p>texto</p>", "custoHoras": 4}, token=ta)
req("PUT", f"/api/atividades/{of2['id']}/moderar", 2, token=tm)
st, r = req("POST", f"/api/atividades/{of2['id']}/comprar", token=tp)
checa("pedido maior que as horas (422 HORAS_INSUFICIENTES)", st == 422 and r.get("codigo") == "HORAS_INSUFICIENTES", r)

# Cancelar troca: Carla/Bruno (quem perdeu) pede, moderação cancela.
st, of3 = req("POST", "/api/atividades", {"titulo": "Ajuda com redes", "descricao": "<p>redes</p>", "custoHoras": 2}, token=ta)
req("PUT", f"/api/atividades/{of3['id']}/moderar", 2, token=tm)
st, r = req("POST", f"/api/atividades/{of3['id']}/comprar", token=tx)
checa("terceiro pede outra oferta de 2 h", st == 200, r)
st, r = req("PUT", f"/api/atividades/{of3['id']}/cancelar-troca", {"motivo": "parada"}, token=tb if tx is not tb else tc)
checa("aluno não cancela troca (403)", st == 403, r)
st, r = req("PUT", f"/api/atividades/{of3['id']}/cancelar-troca", {"motivo": "parada"}, token=tm)
checa("moderação cancela troca (status 10)", st == 200 and r["status"] == 10, r)
st, hx = req("GET", "/api/usuarios/me/horas", token=tx)
checa("horas devolvidas após cancelar", hx["horas"] == 2 and hx["reservadas"] == 0, hx)
st, r = req("PUT", f"/api/atividades/{of3['id']}/cancelar-troca", {}, token=tm)
checa("cancelar de novo dá 409", st == 409, r)

st, r = req("GET", "/api/atividades/minhas?status=abc", token=ta)
checa("?status=abc dá 400 PARAMETRO_INVALIDO", st == 400 and r.get("codigo") == "PARAMETRO_INVALIDO", r)
st, r = req("PUT", f"/api/atividades/{oid}", {"id": oid, "status": 9}, token=ta)
checa("PUT da entidade inteira não existe mais (405 ou 404)", st in (404, 405), st)

print()
print(f"{len(falhas)} falha(s)" if falhas else "TUDO PASSOU")
sys.exit(1 if falhas else 0)
