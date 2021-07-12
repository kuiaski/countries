const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const os = require('os');

const HEADERS = {
    PaisOuTerritorioDependente: 'País (ou território dependente)',
    EstimativaDaONU: 'Estimativa da ONU',
    Data: 'Data',
    Posicao: 'Posição',
    EstimativaOficial: 'Estimativa Oficial'
}

const saveAsCsv = (countries) => {
    // Save it as CSV
    let divider = ';';
    let csv = ['Pais', 'Bandeira', 'Wikipedia', 'População'].join(divider) + os.EOL;
    countries.forEach((country) => {
        csv += [country.name, country.flag, country.wikipedia_url, country.population].join(divider) + os.EOL;
    });
    fs.writeFileSync('./output/countries.csv', csv, 'utf8');
}

const saveAsJson = (countries) => {
    // Save as JSON
    fs.writeFileSync('./output/countries.json', JSON.stringify(countries, null, 2), 'utf8');
}

(async() => {
    const countriesListWikipediaUrl = 'https://pt.wikipedia.org/wiki/Lista_de_pa%C3%ADses_por_popula%C3%A7%C3%A3o';
    const contents = await axios.get(countriesListWikipediaUrl);
    const $ = cheerio.load(contents.data);
    const countries = [];
    const headers = [];
    const table = $('#mw-content-text table').first();
    table.find('th').each((i, element) => {
        headers.push($(element).text().trim());
    });

    const asInt = (value) => {
        return parseInt(value.trim().replace(/\s/g, ''));
    }

    table.find('tr').each((i, element) => {
        if (i > 0) { // Skip HEADER
            let country = {};
            $(element).find('td').each((idx, td) => {
                if (headers[idx] === HEADERS.PaisOuTerritorioDependente) {
                    // Flag Image URL
                    let img = $(td).find('img').first();

                    // Wikipedia Article for Country in PT-BR
                    let a = $(td).find('a').first();

                    country.name = $(td).text().trim();
                    country.wikipedia_url = `https://wikipedia.org/${a.attr('href')}`;
                    country.flag = `https:${img.attr('src')}`;
                } else if (headers[idx] === HEADERS.EstimativaDaONU) {
                    country.population = asInt($(td).text());
                } else if (headers[idx] === HEADERS.Data) {
                    country.date = asInt($(td).text());
                } else if (headers[idx] === HEADERS.Posicao) {
                    country.position = $(td).text().trim();
                } else if (headers[idx] === HEADERS.EstimativaOficial) {
                    country.official_estimate = $(td).text().trim();
                } else {
                    country[headers[idx]] = $(td).text().trim();
                }
            });
            countries.push(country);
        }
    });

    saveAsJson(countries);
    saveAsCsv(countries);

    console.log('Done!');
    
})();
