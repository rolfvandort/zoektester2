// netlify/functions/search.js
const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });

exports.handler = async (event) => {
    const { query, page, filters } = event.queryStringParameters;
    const maximumRecords = 10;
    const startRecord = (parseInt(page) - 1) * maximumRecords + 1;
    const parsedFilters = filters ? JSON.parse(filters) : {};

    let cqlQuery = 'c.product-area==officielepublicaties';
    if (query) {
        cqlQuery += ` AND cql.textAndIndexes="${query}"`;
    }

    for (const filterIndex in parsedFilters) {
        const filterValues = parsedFilters[filterIndex];
        if (filterValues.length > 0) {
            const filterString = filterValues.map(val => `"${val}"`).join(' OR ');
            cqlQuery += ` AND (${filterIndex}=any(${filterString}))`;
        }
    }

    const apiUrl = `https://repository.overheid.nl/sru?operation=searchRetrieve&version=2.0&query=${encodeURIComponent(cqlQuery)}&startRecord=${startRecord}&maximumRecords=${maximumRecords}&httpAccept=application/xml&facetLimit=100:dt.type,100:dt.creator,100:dt.subject,100:w.organisatietype`;

    try {
        const response = await axios.get(apiUrl);
        const xmlData = response.data;
        
        const result = await parser.parseStringPromise(xmlData);

        const records = [];
        const recordsRaw = result['sru:searchRetrieveResponse']['sru:records']['sru:record'];

        if (Array.isArray(recordsRaw)) {
            recordsRaw.forEach(record => {
                const originalData = record['sru:recordData']['gzd:gzd']['gzd:originalData']['overheidwetgeving:meta'];
                const enrichedData = record['sru:recordData']['gzd:gzd']['gzd:enrichedData'];

                const urlData = {};
                if (enrichedData['gzd:preferredUrl']) {
                    urlData.preferredUrl = enrichedData['gzd:preferredUrl'];
                }
                if (enrichedData['gzd:itemUrl']) {
                    if (Array.isArray(enrichedData['gzd:itemUrl'])) {
                        enrichedData['gzd:itemUrl'].forEach(item => {
                            urlData[item['@manifestation']] = item['#text'];
                        });
                    } else {
                         urlData[enrichedData['gzd:itemUrl']['@manifestation']] = enrichedData['gzd:itemUrl']['#text'];
                    }
                }

                const enrichedDetails = {};
                if (enrichedData['gzd:productArea']) {
                    enrichedDetails['overheidwetgeving:product-area'] = enrichedData['gzd:productArea'];
                }
                if (enrichedData['gzd:organizationType']) {
                    enrichedDetails['overheidwetgeving:organisatietype'] = enrichedData['gzd:organizationType'];
                }


                records.push({
                    ...originalData,
                    ...enrichedDetails,
                    urls: urlData
                });
            });
        } else if (recordsRaw) {
             const originalData = recordsRaw['sru:recordData']['gzd:gzd']['gzd:originalData']['overheidwetgeving:meta'];
             const enrichedData = recordsRaw['sru:recordData']['gzd:gzd']['gzd:enrichedData'];
             
             const urlData = {};
             if (enrichedData['gzd:preferredUrl']) {
                 urlData.preferredUrl = enrichedData['gzd:preferredUrl'];
             }
             if (enrichedData['gzd:itemUrl']) {
                if (Array.isArray(enrichedData['gzd:itemUrl'])) {
                    enrichedData['gzd:itemUrl'].forEach(item => {
                        urlData[item['@manifestation']] = item['#text'];
                    });
                } else {
                     urlData[enrichedData['gzd:itemUrl']['@manifestation']] = enrichedData['gzd:itemUrl']['#text'];
                }
            }
            
            const enrichedDetails = {};
             if (enrichedData['gzd:productArea']) {
                 enrichedDetails['overheidwetgeving:product-area'] = enrichedData['gzd:productArea'];
             }
             if (enrichedData['gzd:organizationType']) {
                 enrichedDetails['overheidwetgeving:organisatietype'] = enrichedData['gzd:organizationType'];
             }

             records.push({
                ...originalData,
                ...enrichedDetails,
                urls: urlData
             });
        }

        const facets = result['sru:searchRetrieveResponse']['sru:facetedResults']['facet:facet'];
        const totalResults = result['sru:searchRetrieveResponse']['sru:numberOfRecords'];

        return {
            statusCode: 200,
            body: JSON.stringify({
                totalResults,
                records,
                facets: Array.isArray(facets) ? facets : [facets]
            })
        };
    } catch (error) {
        console.error('API Error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from API' })
        };
    }
};
