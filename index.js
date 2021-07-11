const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const os = require('os');

const countriesListWikipediaUrl = 'https://pt.wikipedia.org/wiki/Lista_de_pa%C3%ADses_por_popula%C3%A7%C3%A3o';

(async() => {
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
        if (i > 0) {
            let country = {};
            $(element).find('td').each((idx, td) => {
                if (headers[idx] === 'País (ou território dependente)') {
                    let img = $(td).find('img').first();
                    let a = $(td).find('a').first();
                    country.name = $(td).text().trim();
                    country.wikipedia_url = `https://wikipedia.org/${a.attr('href')}`;
                    country.flag = `https:${img.attr('src')}`;
                } else if (headers[idx] === 'Estimativa da ONU') {
                    country.population = asInt($(td).text());
                } else if (headers[idx] === 'Data') {
                    country.date = asInt($(td).text());
                } else if (headers[idx] === 'Posição') {
                    country.position = $(td).text().trim();
                } else if (headers[idx] === 'Estimativa Oficial') {
                    country.official_estimate = $(td).text().trim();
                } else {
                    country[headers[idx]] = $(td).text().trim();
                }
            });
            countries.push(country);
        }
    });

    fs.writeFileSync('./data/countries.json', JSON.stringify(countries, null, 2), 'utf8');

    let divider = ';';
    let csv = `Pais${divider}Bandeira${divider}Wikipedia${divider}População${os.EOL}`;
    countries.forEach((country) => {
        csv += [country.name, country.flag, country.wikipedia_url, country.population].join(divider) + os.EOL;
    });
    fs.writeFileSync('./data/countries.csv', csv, 'utf8');
    console.log('Done!');
})();
