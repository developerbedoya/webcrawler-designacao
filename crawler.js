#!/usr/bin/env nodejs
'use strict';

const url = 'http://controlequadropessoal.educacao.mg.gov.br/divulgacao';
const baseDados = 'designacao.db3';
let tokenKey = '';
let tokenFields = '';

const browserHeaders = {
    'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7,es;q=0.6,fr;q=0.5',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36'
}

let request = require('request');
let cookies = request.jar();

request = request.defaults({
    encoding: 'latin1', 
    followAllRedirects: false,
    gzip: true,
    headers: browserHeaders,
    jar: cookies
});

//require('request-debug')(request);


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

const convertISO88591ToUTF8 = (buffer) => {
    let iconv = new Iconv('ISO-8859-1', 'UTF-8');
    return iconv.convert(buffer).toString('utf8');
}

const getCookiesAndTokenFields = (okCallback) => {
    request.get(url, (error, response, body) => {
        if (response && response.statusCode == 200) {
            let $ = cheerio.load(body);
            tokenKey = $('input[name="data[_Token][key]"]').val();
            tokenFields = $('input[name="data[_Token][fields]"]').val();
            
            okCallback();
        }
    });
};

const getRawResultByFilters = (regional, municipio, cargo, categoria, page) => {
    return new Promise((resolve, reject) => {
        getCookiesAndTokenFields(() => {
            const postData = {
                '_method':'POST',
                'data[_Token][key]': tokenKey,
                'data[Filtro][BuscaEscola]': '',
                'data[Filtro][Vaga][regional_id]': regional,
                'data[Filtro][Escola][municipio_id]': municipio,
                'data[Filtro][Vaga][escola_id]': '',
                'data[Filtro][Vaga][carreira_id]': cargo,
                'data[Filtro][Vaga][funcao_id]': categoria,
                'Filtrar': '',
                'data[_Token][fields]': tokenFields,
                'data[_Token][unlocked]': 'Filtrar'
            };
        
        
            if (page == 1) {
                request.post(url, { form: postData, encoding: null, }, (error, response, buffer) => {
                    if (response && response.statusCode == 200) {
                        let body = convertISO88591ToUTF8(buffer);
                        resolve(body);
                    } else {   
                        reject('getRawResultByFilters: sem dados');
                    }
                });
            } else {
                let nextPageUrl = `${url}/page:${page}`;
            
                request.get(nextPageUrl, { encoding: null, }, (error, response, buffer) => {
                    if (response && response.statusCode == 200) {
                        let body = convertISO88591ToUTF8(buffer);
                        resolve(body);
                    } else {
                        reject('getRawResultByFilters: sem dados');
                    }
                });
            }
        });
    });
};

const getUrlsFromDB = () => {
    return new Promise((resolve, reject) => {
        //const db = new sqlite3.Database(baseDados);
        db.all('SELECT url FROM designacao', (err, rows) => {
            if (err) {
                reject(err);
            }
            let urls = rows.map((r) => r.url);
            resolve(urls);
        });
        
        //db.close();
    });
}

const getUsuariosFromDB = () => {
    return new Promise((resolve, reject) => {
        //const db = new sqlite3.Database(baseDados);
        db.all('SELECT id, email FROM usuario', (err, rows) => {
            if (err) {
                reject(err);
            }
            
            resolve(rows);
        });
        
        //db.close();
    });
}

const getFiltrosByUsuarioFromDB = (idUsuario) => {
    return new Promise((resolve, reject) => {
        //const db = new sqlite3.Database(baseDados);
        const sql = 
`SELECT regional, municipio, cargo, categoria FROM filtro
WHERE idUsuario = ${idUsuario}`;
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            }
            
            resolve(rows);
        });
        
        //db.close();
    });
}

const addDesignacaoToDB = (id, url, conteudo) => {
    //const db = new sqlite3.Database(baseDados);
    const sql = 'INSERT INTO designacao (id, url, conteudo) VALUES (?, ?, ?)';
    
    db.serialize(() => {
        const stmt = db.prepare(sql);
        
        stmt.run(id, url, conteudo);
        stmt.finalize();
    });
    //db.close();
}

const addNewEnvioToDB = (idUsuario, idDesignacao) => {
    //const db = new sqlite3.Database(baseDados);
    const sql = 
`SELECT COUNT(*) AS numEnvios
FROM envio
WHERE idUsuario = ${idUsuario} AND idDesignacao = ${idDesignacao}`;

        db.all(sql, (err, rows) => {
            if (rows && rows.length > 0) {
                if (rows[0].numEnvios == 0) {
                    const sqlInsert = 'INSERT INTO envio (idUsuario, idDesignacao) VALUES (?, ?)';
    
                    db.serialize(() => {
                        const stmt = db.prepare(sqlInsert);
                        
                        stmt.run(idUsuario, idDesignacao);
                        stmt.finalize();
                    });
                }
            }
        });
    
    //db.close();
}

const markDesignacaoAsSent = (idUsuario, idDesignacao) => {
    //const db = new sqlite3.Database(baseDados);
    const sql = 'UPDATE envio SET enviado = 1 WHERE idUsuario = ? AND idDesignacao = ?';
    
    db.serialize(() => {
        const stmt = db.prepare(sql);
        
        stmt.run(idUsuario, idDesignacao);
        stmt.finalize();
    });
    //db.close();
}

const getAllDesignacoesNotSent = () => {
    return new Promise((resolve, reject) => {
        //const db = new sqlite3.Database(baseDados);
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

        db.all(sql, (err, rows) => {
            if (err) {
                reject('getAllDesignacoesNotSent:', err);
            }
            
            resolve(rows);
        });
        
        //db.close();
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
            resolve([]);
        });
    });
};

const downloadHtml = (url) => {
    return new Promise((resolve, reject) => {
        request.get(url, { encoding: null }, (error, response, buffer) => {
            if (response && response.statusCode == 200) {
                resolve(convertISO88591ToUTF8(buffer));
            } else {
                resolve(null); 
            }
        });
    });
};

const addDesignacoesToDBByFiltersAndUsuario = (idUsuario, regional, municipio, cargo, categoria) => {
    return new Promise((resolve, reject) => {
        urls = [];
        
        getDesignacoesByFiltersRec(regional, municipio, cargo, categoria, 1).then((newUrlList) => {
            const regexIdEdital = /[0-9]+/;
            
            getUrlsFromDB().then((oldUrls) => {
                let urlList = newUrlList;//.filter(el => oldUrls.indexOf(el) < 0);
                
                let urlPromises = urlList.map((url) => {
                    return downloadHtml(url).then((html) => {
                        
                        let $ = cheerio.load(html);
                        
                        let conteudo = 
`<!DOCTYPE html>
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
                            id: regexIdEdital.exec(url)[0],
                            url: url,
                            html: conteudo
                        };
                    });
                });
                
                Promise.all(urlPromises).then((items) => {
                    items.forEach((i) => {
                        // Excluir urls já baixadas
                        if (oldUrls.indexOf(i.url) < 0) {
                            log(`nova designação encontrada, id: ${i.id}, url: ${i.url}`);
                            addDesignacaoToDB(i.id, i.url, i.html);
                        }
                        addNewEnvioToDB(idUsuario, i.id);
                    });
                    
                    resolve();
                });
            });
        }, err => {
            log(`addDesignacoesToDBByFiltersAndUsuario: ${err}`)
            resolve();
        });
    });
};

const sendEmail = (to, subject, html) => {
    //const db = new sqlite3.Database(baseDados);
    db.all(
        'SELECT nome, tipoServico, email, login, senha FROM configEmail',
        (err, rows) => {
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
                    return log(`sendEmail: ${error}`);
                }
                
                log(`Mensagem '${subject} enviada para ${to}`);
            });
        });
    
    //db.close();
}

const main = () => {
    log('procurando designações para adicionar à base de dados...')
    getUsuariosFromDB().then(listUsuarios => {
        return new Promise((resolve, reject) => {
            if (listUsuarios.length == 0) {
                resolve();
            }
            
            listUsuarios.forEach((usuario) => {
                log(`Usuário atual: ${usuario.email}`);
                getFiltrosByUsuarioFromDB(usuario.id).then((filtros => {
                    let promisesBusca = filtros.map((f) => {
                        log(`procurando designações para o usuário ${usuario.email} com filtro de regional '${f.regional}', município '${f.municipio}', cargo '${f.cargo}', categoria '${f.categoria}'`)
                        return addDesignacoesToDBByFiltersAndUsuario(
                                usuario.id, f.regional, f.municipio, 
                                f.cargo, f.categoria);
                    });
                    Promise.all(promisesBusca).then(() => resolve());
                }));
            });
        });
    }).then(() => {
        log('buscando designações na base de dados, ainda não enviadas por e-mail...');
        getAllDesignacoesNotSent().then((designacoes) => {
            log(`foram encontradas ${designacoes.length} designações ainda não enviadas por e-mail`);
            designacoes.forEach((d) => {
                let subject = `Designação #${d.id}`;
                sendEmail(d.email, subject, d.conteudo);
                markDesignacaoAsSent(d.idUsuario, d.id);
            }, (err) => log(`getAllDesignacoesNotSent: ${err}`));
        })
    });
}

main();
