#!/usr/bin/env nodejs
'use strict';

const url = 'https://controlequadropessoal.educacao.mg.gov.br/divulgacao';
const baseDados = 'crawler.db3';
let tokenKey = '';
let tokenFields = '';

const browserHeaders = {
    'Accept-Language': 'pt-BR,pt;q=0.9,es-CO;q=0.8,es;q=0.7,en-US;q=0.6,en;q=0.5',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*.*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'max-age=0',
    'Host': 'controlequadropessoal.educacao.mg.gov.br',
    'Origin': 'https://controlequadropessoal.educacao.mg.gov.br',
    'Referer': 'https://controlequadropessoal.educacao.mg.gov.br/divulgacao',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
}

let cookies = {};
let needleOptions = {
    headers: browserHeaders,
};

const request = require('needle');
const cheerio = require('cheerio');
const Iconv = require('iconv').Iconv;
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(baseDados);

const log = (message) => {
    const formatDateTime = (date) => {
        let a = new Date();
        let y = a.getFullYear();
        let m = ('' + (a.getMonth() + 1)).padStart(2, '0');
        let d = ('' + a.getDate()).padStart(2, '0');
        let hh = ('' + a.getHours()).padStart(2, '0');
        let mm = ('' + a.getMinutes()).padStart(2, '0');
        let ss = ('' + a.getSeconds()).padStart(2, '0'); 
        
        return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    }
    
    const dateTime = formatDateTime(new Date());
    console.log(`${dateTime}: ${message}`);
}

const getCookiesAndTokenFields = (okCallback) => {
    return new Promise((resolve, reject) => {
        request.get(url, (error, response) => {
            if (response && response.statusCode == 200) {
                let $ = cheerio.load(response.body);
                tokenKey = $('input[name="data[_Token][key]"]').val();
                tokenFields = $('input[name="data[_Token][fields]"]').val();
                
                cookies = response.cookies;
                resolve();
            } else {
                let msg = error == null ? `HTTP ${response.statusCode}` : error;
                reject(`getCookiesAndTokenFields: ${msg}`);
            }
        });
    });
};

const getRawResultByFilters = (regional, municipio, cargo, categoria, page) => {
    return new Promise((resolve, reject) => {
            const postData = [
                `_method=POST`,
                `data[_Token][key]=${tokenKey}`,
                `data[Filtro][BuscaEscola]=`,
                `data[Filtro][Vaga][regional_id]=${regional}`,
                `data[Filtro][Escola][municipio_id]=${municipio}`,
                `data[Filtro][Vaga][escola_id]=`,
                `data[Filtro][Vaga][carreira_id]=${cargo}`,
                `data[Filtro][Vaga][funcao_id]=${categoria}`,
                `Filtrar=`,
                `data[_Token][fields]=${tokenFields}`,
                `data[_Token][unlocked]=Filtrar`
	    ].join('&');
        
        
            if (page == 1) {
                request.post(url, postData, { headers: browserHeaders, cookies: cookies }, (error, response) => {
                    if (response && response.statusCode == 200) {
			            cookies = response.cookies;
                        resolve(response.body);
                    } else {  
                        let msg = error == null ? `HTTP ${response.statusCode}` : error;
                        reject(`getRawResultByFilters(regional: ${regional}, municipio: ${municipio}, cargo: ${cargo}, categoria: ${categoria}, page: ${page}): ${msg}`);
                    }
                });
            } else {
                let nextPageUrl = `${url}/page:${page}`;
            
                request.get(nextPageUrl, { headers: browserHeaders, cookies: cookies }, (error, response) => {
                    if (response && response.statusCode == 200) {
			            cookies = response.cookies;
                        log(`getRawResultByFilters(regional: ${regional}, municipio: ${municipio}, cargo: ${cargo}, categoria: ${categoria}, page: ${page}): ${body.length} bytes`);
                        resolve(response.body);
                    } else {
                        let msg = error == null ? `HTTP ${response.statusCode}` : error;
                        reject(`getRawResultByFilters(regional: ${regional}, municipio: ${municipio}, cargo: ${cargo}, categoria: ${categoria}, page: ${page}): ${msg}`);
                    }
                });
            }
    });
};

const getUrlsFromDB = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all('SELECT url FROM designacao', (err, rows) => {
                if (err) {
                    log(`getUrlsFromDB: ${err}`);
                    reject(err);
                }
                let urls = rows.map((r) => r.url);
                resolve(urls);
            });
        });
    });
}

const getUsuariosFromDB = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, email FROM usuario', (err, rows) => {
            if (err) {
                reject(err);
            }
            
            resolve(rows);
        });
    });
}

const getFiltrosByUsuarioFromDB = (idUsuario) => {
    return new Promise((resolve, reject) => {
        const sql = 
            `SELECT regional, municipio, cargo, categoria FROM filtro
            WHERE idUsuario = ${idUsuario}`;
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            }
            
            resolve(rows);
        });
    });
}

const addDesignacaoToDB = (id, url, conteudo) => {
    const sql = `SELECT COUNT(*) AS numDesignacoes FROM designacao WHERE id = '${id}'`;
    db.serialize(() => {
        db.all(sql, (err, rows) => {
            if (err) {
                log(`addDesignacaoToDB: ${err}`);
            }
            
            if (rows && rows.length > 0) {
                if (rows[0].numDesignacoes == 0) {
                    const sqlInsert = 'INSERT INTO designacao (id, url, conteudo) VALUES (?, ?, ?)';
                    db.serialize(() => {
                        db.run(sqlInsert, [id, url, conteudo]);
                    });
                }
            }
        });
    });
}

const addNewEnvioToDB = (idUsuario, idDesignacao, callback) => {
    const sql = 
        `SELECT COUNT(*) AS numEnvios
        FROM envio
        WHERE idUsuario = ${idUsuario} AND idDesignacao = '${idDesignacao}'`;
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(sql, (err, rows) => {
                if (err) {
                    log(`addNewEnvioToDB: ${err}`);
                    resolve();
                } else {
                    if (rows && rows.length > 0 && rows[0].numEnvios == 0) {
                        const sqlInsert = 'INSERT INTO envio (idUsuario, idDesignacao) VALUES (?, ?)';
                        db.serialize(() => {
                            db.run(sqlInsert, [ idUsuario, idDesignacao ], resolve);
                        });
                    } else {
                        resolve();
                    }
                }
            });
        });
    });
}

const markDesignacaoAsSent = (idUsuario, idDesignacao) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE envio SET enviado = 1 WHERE idUsuario = ${idUsuario} AND idDesignacao = '${idDesignacao}'`;
        db.serialize(() => {
            db.run(sql, () => {
                log(`marcando designação ${idDesignacao} como enviada para o usuário com id ${idUsuario}`);
                resolve();
            });
        });
    });
}

const getAllDesignacoesNotSent = () => {
    return new Promise((resolve, reject) => {
        const sql = 
            `SELECT 
            	envio.idUsuario AS idUsuario, 
            	usuario.email as email,
            	designacao.id as id, 
            	designacao.conteudo as conteudo 
            FROM envio INNER JOIN designacao
            ON envio.idDesignacao = designacao.id
            INNER JOIN usuario ON envio.idUsuario = usuario.id
            WHERE envio.enviado = 0`;
        db.serialize(() => {
            db.all(sql, (err, rows) => {
                if (err) {
                    reject('getAllDesignacoesNotSent:', err);
                }
                
                resolve(rows);
            });
        });
    });
}

let urls = [];

const getDesignacoesByFiltersRec = (regional, municipio, cargo, categoria, page) => {
    return new Promise((resolve, reject) => {

        getRawResultByFilters(regional, municipio, cargo, categoria, page).then((body) => {
	    if (body != null) {
                let $ = cheerio.load(body)
                var moreResults = $('.next').length > 0;
                
                $('.popup.icone').each((i, e) => { 
                    urls.push($(e).attr('url')); 
                });
                
                if (moreResults) {
                    resolve(getDesignacoesByFiltersRec(regional, municipio, cargo, categoria, page + 1));
                } else {
                    resolve(urls);
                }
            }
        }, (err) => {
            log(err);
            resolve([]);
        });
    });
};

const downloadHtml = (url) => {
    return new Promise((resolve, reject) => {
        request.get(url, { headers: browserHeaders, cookies: cookies }, (error, response) => {
            if (response && response.statusCode == 200) {
                resolve(response.body);
            } else {
                resolve(null); 
            }
        });
    });
};

const downloadDesignacao = (url) => {
    //const regexIdEdital = /[0-9]+/;
    const regexIdEdital = /[0-9a-zA-Z]+%3D/
    
    return downloadHtml(url).then((html) => {
        let $ = cheerio.load(html);
                        
        let conteudo = `
            <!DOCTYPE html>
            	<html lang="pt-br" dir="ltr">
            		<head>
            			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            			<style>
            				body {
            					font-family: Arial, Helvetica, sans-serif;
            					font-size: 10px;
            				}
            				
            				.tabela {
            					border-collapse: collapse;
            				}
            				.tabela td, th{
            					border: 1px solid black;
            				}
            				.tabela th {
            					background-color: gray;
            				}
            			</style>	
            		</head>
            	<body>
                    ${$.html('.endereco')}
                    ${$.html('.tabela')}
                    <br />
                    <a href="${url}" target="_blank">Confira mais no site da designação</a>
                </body>
            </html>`;
    
    
        return {
            id: regexIdEdital.exec(url)[0].replace(/%3D/, ''),
            url: url,
            html: conteudo
        };
    });
}

const addDesignacoesToDBByFiltersAndUsuario = (idUsuario, regional, municipio, cargo, categoria) => {
    return new Promise((resolve, reject) => {
        urls = [];
        
        getDesignacoesByFiltersRec(regional, municipio, cargo, categoria, 1).then((urlList) => {
            return new Promise((resolve, reject) => {
                let urlPromises = urlList.map((url) => downloadDesignacao(url));
                
                Promise.all(urlPromises).then((items) => {
                    let processNovasDesignacoes = items.map((i) => {
                        return getUrlsFromDB().then((oldUrls) => {
                            return new Promise((resolve, reject) => {
                                // Excluir urls já baixadas
                                if (oldUrls.indexOf(i.url) < 0) {
                                    log(`nova designação encontrada, id: ${i.id}, url: ${i.url}`);
                                    addDesignacaoToDB(i.id, i.url, i.html);
                                }
                                resolve(addNewEnvioToDB(idUsuario, i.id));
                            });
                        });
                    });
                    Promise.all(processNovasDesignacoes).then(resolve());
                });
            });
        }, err => {
            log(`addDesignacoesToDBByFiltersAndUsuario: ${err}`);
            resolve();
        })
        .then(resolve());
    });
};

const sendEmail = (to, subject, html) => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT nome, tipoServico, email, login, senha FROM configEmail',
        (err, rows) => {
            if (err) {
                log(`sendMail: ${err}`);
            }
            
            const configEmail = rows[0];
                
            let from = `${configEmail.nome} <${configEmail.email}>`;
            let transporter = nodemailer.createTransport({
                service: configEmail.tipoServico,
                auth: {
                    user: configEmail.login,
                    pass: configEmail.senha
                }
            });
        
            let mailOptions = {
                from: from,
                to: to,
                subject: subject,
                html: html,
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    log(`sendEmail: ${error}`);
                    resolve();
                }
                
                log(`Mensagem '${subject} enviada para ${to}`);
                resolve();
            });
        });
    });
}

const registerExitHandlers = () => {
    process.on('exit', (code) => { db.close(); log(`---- finalizando com código ${code}`); });
    process.on('uncaughtException', (err, origin) => { db.close(); log(`---- exceção sem tratamento: ${err}\n---- origem: ${origin}`); });
}

const main = () => {
    registerExitHandlers();
    log('obtendo chaves do site da designação...');
    getCookiesAndTokenFields().then(() => {
        log('procurando designações para adicionar à base de dados...')
    }).then(() => {
        return getUsuariosFromDB();
    }).then(listUsuarios => {
        // Forçar pausa duante o processamento de todos os usuários
        return new Promise((resolve, reject) => {
            if (listUsuarios.length == 0) {
                resolve();
            }
            
            let processUsuarios = listUsuarios.map((usuario) => {
                log(`Usuário atual: ${usuario.email}`);
                
                // Forçar pausa durante o processamento de cada usuário
                return new Promise((resolve, reject) => {
                    getFiltrosByUsuarioFromDB(usuario.id).then((filtros) => {
                        let processFiltros = filtros.map((f) => {
                            log(`procurando designações para o usuário ${usuario.email} com filtro de regional '${f.regional}', município '${f.municipio}', cargo '${f.cargo}', categoria '${f.categoria}'`);
                            
                            // Forçar pausa durante o processamento de cada filtro
                            return new Promise((resolve, reject) => {
                                addDesignacoesToDBByFiltersAndUsuario(usuario.id, f.regional, f.municipio, f.cargo, f.categoria).then(resolve());
                            });
                        });
                        
                        // Pausar até processar todos os filtros
                        Promise.all(processFiltros).then(resolve());
                    });
                });
            });
            
            // Pausar até processar todos os usuários
            Promise.all(processUsuarios).then(resolve());
        });
    }).then(() => {
        log('buscando designações na base de dados, ainda não enviadas por e-mail...');
    }).then(() => {
        return getAllDesignacoesNotSent();
    }).then(designacoes => {
        // Forçar pausa durante o envio das designações
        return new Promise((resolve, reject) => {
            log(`foram encontradas ${designacoes.length} designações ainda não enviadas por e-mail`);
            if (designacoes.length == 0) {
                resolve();
            }
            
            let processEmails = designacoes.map((d) => {
                let subject = `Designação #${d.id}`;
                sendEmail(d.email, subject, d.conteudo).then(markDesignacaoAsSent(d.idUsuario, d.id));
            });
            
            Promise.all(processEmails).then(resolve());
        });
    }).then(() => { log('fim do processo de busca')});
}

main();
