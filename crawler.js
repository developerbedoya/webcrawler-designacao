'use strict';

const url = 'http://controlequadropessoal.educacao.mg.gov.br/divulgacao';
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
const fs = require('fs');

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
        // console.log(`tokenKey: '${tokenKey}'`);
        // console.log(`tokenFields: '${tokenFields}'`);
        // console.log(`cookies: '${cookies.getCookieString(url)}'`);
        
        // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        // // console.log('body:', body); // Print the HTML for the Google homepage. 
    });
};


    const regionais = {
         1: 'BH - Metropolitana A - 1ª SRE',
        42: 'BH - Metropolitana B - 44ª SRE',
        43: 'BH - Metropolitana C - 43ª SRE',
    };

    const municípios = {
         620: 'Belo Horizonte',
         670: 'Betim',
        1860: 'Contagem'
    };
    
    const cargos = {
        1: 'AEB - ANALISTA DE EDUCAÇÃO BÁSICA',
        2: 'ANE - ANALISTA EDUCACIONAL',
        3: 'ATB - ASSISTENTE TÉCNICO DE EDUCAÇÃO BÁSICA',
        5: 'ASB - AUXILIAR DE SERVIÇOS DE EDUCAÇÃO BÁSICA',
        6: 'EEB - ESPECIALISTA EM EDUCAÇÃO BÁSICA',
        7: 'PEB - PROFESSOR DE EDUCAÇÃO BÁSICA',
    };
    
    // categorias profissionais (para cargo 7: PEB - PROFESSOR DE EDUCAÇÃO BÁSICA):
    const categoriasPEB = {
      12: 'PROFESSOR EVENTUAL',
      13: 'PROFESSOR REGENTE DE TURMA',
      14: 'PROFESSOR PARA ENSINO DO USO DA BIBLIOTECA',
      15: 'PROFESSOR REGENTE DE AULAS',
      16: 'PROFESSOR REGENTE - PROJETO TELECURSO MINAS GERAIS',
      17: 'PROFESSOR REGENTE DE TURMA (ACOMPANHAMENTO PEDAGÓGICO DIFERENCIADO)',
     274: 'PROFESSOR APOIO/AEE',
     275: 'PROFESSOR GUIA INTÉRPRETE/AEE',
     276: 'PROFESSOR INTÉRPRETE DE LIBRAS/AEE',
     277: 'PROFESSOR SALA DE RECURSO/AEE',
     278: 'PROFESSOR DE PROJETO',
     300: 'PROFESSOR DE PROJETO/ACELERAÇÃO DE APRENDIZAGEM',
     302: 'PROFESSOR DE PROJETO/CURSO NORMAL',
     301: 'PROFESSOR DE PROJETO/EDUCAÇÃO DO CAMPO',
     284: 'PROFESSOR DE PROJETO/EDUCACAO INTEGRAL',
     309: 'PROFESSOR DE PROJETO/PROJETO REDE',
     285: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC',
     279: 'PROFESSOR OFICINA PEDAGÓGICA',
     280: 'PROFESSOR ORIENTADOR DE APRENDIZAGEM - CESEC',
     282: 'PROFESSOR DE PROJETO/EDUCACAO INTEGRAL/COORDENADOR',
     288: 'PROFESSOR DE PROJETO/EDUCACAO INTEGRAL/MONITOR DE OFICINAS',
     287: 'PROFESSOR DE PROJETO/EDUCACAO INTEGRAL/ORIENTADOR DE APREND. ANOS FINAIS',
     283: 'PROFESSOR DE PROJETO/EDUCACAO INTEGRAL/ORIENTADOR DE APREND. ANOS INICIAIS ',
     286: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/ADMINISTRAÇÃO',
     289: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/AGROPECUÁRIA',
     290: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/CONTABILIDADE',
     291: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/COOPERATIVISMO',
     299: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/COORDENADOR',
     292: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/ELETROTÉCNICA',
     293: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/INFORMÁTICA',
     294: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/LOGÍSTICA',
     295: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/MULTIMÍDIA',
     307: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/RECURSOS HUMANOS',
     297: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/SECRETARIADO',
     298: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/SECRETARIADO ESCOLAR',
     296: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/SERVIÇOS PÚBLICOS',
     308: 'PROFESSOR DE PROJETO/PRONATEC/MEDIOTEC/TÉCNICO EM JOALHERIA',
     305: 'PROFESSOR INSTRUTOR DE LIBRAS',
     310: 'PROFESSOR DE PROJETO/PROJETO REDE/ADMINISTRAÇÃO',
     311: 'PROFESSOR DE PROJETO/PROJETO REDE/AGENTE COMUNITÁRIO DE SAÚDE',
     325: 'PROFESSOR DE PROJETO/PROJETO REDE/AGRICULTURA',
    1052: 'PROFESSOR DE PROJETO/PROJETO REDE/AGRONEGÓCIO',
     327: 'PROFESSOR DE PROJETO/PROJETO REDE/AGROPECUÁRIA',
    1051: 'PROFESSOR DE PROJETO/PROJETO REDE/ARTES CIRCENSES',
    1053: 'PROFESSOR DE PROJETO/PROJETO REDE/COMÉRCIO EXTERIOR',
     312: 'PROFESSOR DE PROJETO/PROJETO REDE/COOPERATIVISMO',
     324: 'PROFESSOR DE PROJETO/PROJETO REDE/COORDENADOR',
     329: 'PROFESSOR DE PROJETO/PROJETO REDE/ELETROELETRÔNICA',
     330: 'PROFESSOR DE PROJETO/PROJETO REDE/ELETROMECÂNICA',
     331: 'PROFESSOR DE PROJETO/PROJETO REDE/ELETRÔNICA',
     313: 'PROFESSOR DE PROJETO/PROJETO REDE/ENFERMAGEM',
     332: 'PROFESSOR DE PROJETO/PROJETO REDE/GUIA DE TURISMO',
     333: 'PROFESSOR DE PROJETO/PROJETO REDE/HOSPEDAGEM',
     314: 'PROFESSOR DE PROJETO/PROJETO REDE/INFORMÁTICA',
     315: 'PROFESSOR DE PROJETO/PROJETO REDE/INFORMÁTICA PARA INTERNET',
    1050: 'PROFESSOR DE PROJETO/PROJETO REDE/INSTRUMENTO MUSICAL',
     316: 'PROFESSOR DE PROJETO/PROJETO REDE/LOGÍSTICA',
     317: 'PROFESSOR DE PROJETO/PROJETO REDE/MARKETING',
     318: 'PROFESSOR DE PROJETO/PROJETO REDE/MASSOTERAPIA',
     334: 'PROFESSOR DE PROJETO/PROJETO REDE/MECÂNICA',
     335: 'PROFESSOR DE PROJETO/PROJETO REDE/MULTIMEIOS DIDÁTICOS',
     319: 'PROFESSOR DE PROJETO/PROJETO REDE/RECURSOS HUMANOS',
     336: 'PROFESSOR DE PROJETO/PROJETO REDE/REFRIGERAÇÃO E CLIMATIZAÇÃO',
     320: 'PROFESSOR DE PROJETO/PROJETO REDE/SECRETARIA ESCOLAR',
     321: 'PROFESSOR DE PROJETO/PROJETO REDE/SECRETARIADO',
     337: 'PROFESSOR DE PROJETO/PROJETO REDE/SEGURANÇA DO TRABALHO',
     322: 'PROFESSOR DE PROJETO/PROJETO REDE/SERVIÇOS PÚBLICOS',
     328: 'PROFESSOR DE PROJETO/PROJETO REDE/TELECOMUNICAÇÕES',
    1054: 'PROFESSOR DE PROJETO/PROJETO REDE/TRADUÇÃO E INTERPRETAÇÃO DE LIBRAS',
     323: 'PROFESSOR DE PROJETO/PROJETO REDE/TRANSAÇÕES IMOBILIÁRIAS',
    1055: 'PROFESSOR DE PROJETO/PROJETO REDE/VENDAS',
     326: 'PROFESSOR PARA ATUAR NO CAS, CAP E NÚCLEOS'
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
                        reject('sem dados');
                    }
                });
            } else {
                let nextPageUrl = `${url}/page:${page}`;
            
                request.get(nextPageUrl, { encoding: null, }, (error, response, buffer) => {
                    if (response && response.statusCode == 200) {
                        let body = convertISO88591ToUTF8(buffer);
                        resolve(body);
                    } else {
                        reject('sem dados');
                    }
                });
            }
        });
    });
};

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
            console.log(err);
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

const getDesignacoesByFilters = (regional, municipio, cargo, categoria) => {
    
    return new Promise((resolve, reject) => {
        getDesignacoesByFiltersRec(regional, municipio, cargo, categoria, 1).then((urlList) => {
            const regexIdEdital = /[0-9]+/;
            
            let urlPromises = urlList.map((url) => {
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
                let resultado = [];
                items.forEach((i) => resultado.push(i));
                
                resolve(resultado);
            });
        });
    });
};

getDesignacoesByFilters(1, 620, 7, '').then((result) => {
    //console.log(result);
    var info = result[1];
    fs.writeFileSync(`${info.id}.html`, info.html);
});
// var promise = getDesignacoesByFiltersRec(1, 620, 7, '', 1);
// promise.then((result) => { console.log(result.length); });