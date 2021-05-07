# webcrawler-designacao
Web Crawler para obter as designações para professores do Estado de Minas Gerais

## Instalação
### Baixar este repositório
```bash
git clone https://github.com/developerbedoya/webcrawler-designacao
```
### Instalar pacotes npm
```bash
cd webcrawler-designacao
npm install
```
### Instalar sqlite3
No debian: 
```bash
sudo apt install sqlite3
```
### Criar base de dados
```bash
cat crawler.sql | sqlite3 crawler.db3
```
### Configurar o crawler
#### Configurar e-mail de envio das designações:
```sql
INSERT INTO configEmail(nome, tipoServico, email, login, senha) VALUES ('Armando Bustos', 'Gmail', 'abustos@gmail.com', 'abustos', 'senha_não_encriptada');
```
#### Criar usuários:
```sql
INSERT INTO usuario(email) VALUES('email@usuario.com');
```
#### Criar filtros
Para cada usuário criado (segue exemplo de SRE Metropolitana B, Contagem, PEB, Professor de Apoio):
```sql
INSERT INTO filtro(idUsuario, regional, municipio, cargo, categoria) VALUES (1, '42', '1860', '7', '274');
```
Um usuário pode ter mais de um filtro.
### Rodar o crawler
O crawler pode ser executado com `node crawler.js` ou `./crawler.js` se for setado como executável.

