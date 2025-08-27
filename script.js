document.addEventListener('DOMContentLoaded', () => {
    // --- DATA (uit de XML-bestanden) ---
    const rechtsgebieden = [
        { name: 'Bestuursrecht', id: 'http://psi.rechtspraak.nl/rechtsgebied#bestuursrecht' },
        { name: 'Civiel recht', id: 'http://psi.rechtspraak.nl/rechtsgebied#civielRecht' },
        { name: 'Internationaal publiekrecht', id: 'http://psi.rechtspraak.nl/rechtsgebied#internationaalPubliekrecht' },
        { name: 'Strafrecht', id: 'http://psi.rechtspraak.nl/rechtsgebied#strafrecht' }
    ];

    const proceduresoorten = [
        { name: 'Artikel 81 RO-zaken', id: 'http://psi.rechtspraak.nl/procedure#artikel81ROzaken' },
        { name: 'Bodemzaak', id: 'http://psi.rechtspraak.nl/procedure#bodemzaak' },
        { name: 'Cassatie', id: 'http://psi.rechtspraak.nl/procedure#cassatie' },
        { name: 'Eerste aanleg - enkelvoudig', id: 'http://psi.rechtspraak.nl/procedure#eersteAanlegEnkelvoudig' },
        { name: 'Eerste aanleg - meervoudig', id: 'http://psi.rechtspraak.nl/procedure#eersteAanlegMeervoudig' },
        { name: 'Hoger beroep', id: 'http://psi.rechtspraak.nl/procedure#hogerBeroep' },
        { name: 'Kort geding', id: 'http://psi.rechtspraak.nl/procedure#kortGeding' },
        { name: 'Voorlopige voorziening', id: 'http://psi.rechtspraak.nl/procedure#voorlopigeVoorziening' }
    ];
    
    const instanties = [
        { name: "Hoge Raad", id: "http://standaarden.overheid.nl/owms/terms/Hoge_Raad_der_Nederlanden" },
        { name: "Raad van State", id: "http://standaarden.overheid.nl/owms/terms/Raad_van_State" },
        { name: "Centrale Raad van Beroep", id: "http://standaarden.overheid.nl/owms/terms/Centrale_Raad_van_Beroep" },
        { name: "College van Beroep voor het bedrijfsleven", id: "http://standaarden.overheid.nl/owms/terms/College_van_Beroep_voor_het_bedrijfsleven" },
        { name: "Rechtbank Amsterdam", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Amsterdam" },
        { name: "Rechtbank Den Haag", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Den_Haag" },
        { name: "Rechtbank Gelderland", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Gelderland" },
        { name: "Rechtbank Limburg", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Limburg" },
        { name: "Rechtbank Midden-Nederland", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Midden-Nederland" },
        { name: "Rechtbank Noord-Holland", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Noord-Holland" },
        { name: "Rechtbank Noord-Nederland", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Noord-Nederland" },
        { name: "Rechtbank Oost-Brabant", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Oost-Brabant" },
        { name: "Rechtbank Overijssel", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Overijssel" },
        { name: "Rechtbank Rotterdam", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Rotterdam" },
        { name: "Rechtbank Zeeland-West-Brabant", id: "http://standaarden.overheid.nl/owms/terms/Rechtbank_Zeeland-West-Brabant" },
        { name: "Gerechtshof Amsterdam", id: "http://standaarden.overheid.nl/owms/terms/Gerechtshof_Amsterdam" },
        { name: "Gerechtshof Arnhem-Leeuwarden", id: "http://standaarden.overheid.nl/owms/terms/Gerechtshof_Arnhem-Leeuwarden" },
        { name: "Gerechtshof Den Haag", id: "http://standaarden.overheid.nl/owms/terms/Gerechtshof_Den_Haag" },
        { name: "Gerechtshof 's-Hertogenbosch", id: "http://standaarden.overheid.nl/owms/terms/Gerechtshof_'s-Hertogenbosch" }
    ];

    // --- DOM ELEMENTEN ---
    const elements = {
        jurisprudenceCard: document.getElementById('jurisprudenceCard'),
        apiSearchButton: document.getElementById('apiSearchButton'),
        smartFilterButton: document.getElementById('smartFilterButton'),
        dateFrom: document.getElementById('dateFrom'), dateTo: document.getElementById('dateTo'),
        modifiedFrom: document.getElementById('modifiedFrom'), modifiedTo: document.getElementById('modifiedTo'),
        subject: document.getElementById('subject'), procedure: document.getElementById('procedure'),
        type: document.getElementById('type'), creator: document.getElementById('creator'),
        creatorSuggestions: document.getElementById('creatorSuggestions'),
        smartSearchSection: document.getElementById('smartSearchSection'),
        smartSearchInput: document.getElementById('smartSearchInput'),
        searchInCheckboxes: document.querySelectorAll('input[name="searchIn"]'),
        jurisprudenceStatus: document.getElementById('jurisprudenceStatus'),
        jurisprudenceResults: document.getElementById('jurisprudenceResults'),
        jurisprudencePagination: document.getElementById('jurisprudencePagination'),
        wettenbankSearchButton: document.getElementById('wettenbankSearchButton'),
        wettenbankKeyword: document.getElementById('wettenbankKeyword'),
        wettenbankStatus: document.getElementById('wettenbankStatus'),
        wettenbankResults: document.getElementById('wettenbankResults'),
        pinnedItemContainer: document.getElementById('pinnedItemContainer'),
        pinnedItemContent: document.getElementById('pinnedItemContent')
    };

    // --- GLOBALE STATE ---
    let masterResults = [];
    let currentFilteredResults = [];
    let currentPage = 1;
    const resultsPerPage = 50;

    // --- INITIALISATIE ---
    const initializeApp = () => {
        populateSelect(elements.subject, rechtsgebieden);
        populateSelect(elements.procedure, proceduresoorten);
        setupEventListeners();
    };

    const populateSelect = (select, items) => { items.forEach(item => { const opt = document.createElement('option'); opt.value = item.id; opt.textContent = item.name; select.appendChild(opt); }); };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        elements.apiSearchButton.addEventListener('click', handleJurisprudenceSearch);
        elements.creator.addEventListener('input', () => handleAutocomplete(elements.creator, elements.creatorSuggestions, instanties));
        elements.smartFilterButton.addEventListener('click', handleSmartSearch);
        elements.smartSearchInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSmartSearch(); });
        elements.jurisprudenceResults.addEventListener('click', handleResultsClick);
        elements.wettenbankSearchButton.addEventListener('click', handleWettenbankSearch);
        document.addEventListener('click', (e) => { if (!e.target.closest('.autocomplete-container')) { elements.creatorSuggestions.innerHTML = ''; } });
    };

    // --- JURISPRUDENTIE ZOEKER ---
    const handleJurisprudenceSearch = async () => {
        showStatus(elements.jurisprudenceStatus, 'Resultaten laden... Dit kan even duren.');
        unpinItem();
        elements.jurisprudenceResults.innerHTML = '';
        elements.jurisprudencePagination.innerHTML = '';
        elements.smartSearchSection.classList.remove('visible');
        elements.smartSearchSection.classList.add('hidden');

        const params = new URLSearchParams();
        if (elements.dateFrom.value) params.append('date', elements.dateFrom.value);
        if (elements.dateTo.value) params.append('date', elements.dateTo.value);
        if (elements.modifiedFrom.value) params.append('modified', elements.modifiedFrom.value);
        if (elements.modifiedTo.value) params.append('modified', elements.modifiedTo.value);
        if (elements.subject.value) {
            const subjectValue = elements.subject.value.split('#')[1] || elements.subject.value;
            params.append('subject', subjectValue);
        }
        if (elements.procedure.value) params.append('procedure', elements.procedure.value);
        if (elements.type.value) params.append('type', elements.type.value);
        if (elements.creator.dataset.id) params.append('creator', elements.creator.dataset.id);
        
        params.append('return', 'DOC');
        params.append('max', '1000');
        params.append('sort', 'DESC');

        const proxyUrl = 'https://corsproxy.io/?';
        const baseUrl = 'https://data.rechtspraak.nl/uitspraken/zoeken';
        const targetUrl = `${baseUrl}?${params.toString()}`;
        const requestUrl = `${proxyUrl}${targetUrl}`;

        try {
            const response = await fetch(requestUrl);
            if (!response.ok) throw new Error(`API-verzoek mislukt: ${response.status}`);
            
            const xmlString = await response.text();
            const xmlDoc = new DOMParser().parseFromString(xmlString, "application/xml");
            
            if (xmlDoc.getElementsByTagName("parsererror").length) throw new Error("Fout bij het verwerken van de XML-data.");

            const entries = xmlDoc.getElementsByTagName('entry');
            
            masterResults = Array.from(entries).map(entry => {
                const zaaknummerNode = entry.querySelector('zaaknummer, \\:zaaknummer');
                return {
                    title: entry.querySelector('title')?.textContent || 'Geen titel',
                    ecli: entry.querySelector('id')?.textContent || '',
                    summary: entry.querySelector('summary')?.textContent || 'Geen samenvatting.',
                    updated: new Date(entry.querySelector('updated')?.textContent),
                    zaaknummer: zaaknummerNode?.textContent || 'Niet gevonden'
                };
            });

            currentFilteredResults = [...masterResults];
            
            if (masterResults.length === 0) {
                showStatus(elements.jurisprudenceStatus, 'Geen resultaten gevonden voor deze filters.', 'success');
                return;
            }

            showStatus(elements.jurisprudenceStatus, `Totaal ${masterResults.length} resultaten gevonden.`, 'success');
            currentPage = 1;
            renderJurisprudencePage(currentPage);
            elements.smartSearchSection.classList.remove('hidden');
            elements.smartSearchSection.classList.add('visible');

        } catch (error) {
            showStatus(elements.jurisprudenceStatus, `Fout: ${error.message}. Probeer het opnieuw.`, 'error');
            console.error(error);
        }
    };

    // --- SLIMME FILTER ---
    const handleSmartSearch = () => {
        const keyword = elements.smartSearchInput.value.toLowerCase().trim();
        const searchIn = Array.from(elements.searchInCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

        currentFilteredResults = masterResults.filter(item => {
            if (!keyword) return true;
            const searchTargets = [];
            if (searchIn.includes('title')) searchTargets.push(item.title);
            if (searchIn.includes('summary')) searchTargets.push(item.summary);
            if (searchIn.includes('ecli')) searchTargets.push(item.ecli);
            if (searchIn.includes('zaaknummer')) searchTargets.push(item.zaaknummer);
            return searchTargets.some(target => target.toLowerCase().includes(keyword));
        });
        
        showStatus(elements.jurisprudenceStatus, `${currentFilteredResults.length} van de ${masterResults.length} resultaten komen overeen.`, 'success');
        currentPage = 1;
        renderJurisprudencePage(currentPage);
    };

    // --- WETTENBANK ZOEKER ---
    const handleWettenbankSearch = async () => {
        showStatus(elements.wettenbankStatus, 'Wettenbank wordt doorzocht...');
        elements.wettenbankResults.innerHTML = '';
        const keyword = elements.wettenbankKeyword.value.trim();
        
        if (!keyword) {
            showStatus(elements.wettenbankStatus, 'Voer een trefwoord in.', 'error');
            return;
        }

        const params = new URLSearchParams({
            query: keyword,
            version: '1.2',
            operation: 'searchRetrieve',
            'x-connection': 'w',
            maximumRecords: '50'
        });

        const proxyUrl = 'https://corsproxy.io/?';
        const baseUrl = 'https://zoekdienst.overheid.nl/sru/Search';
        const targetUrl = `${baseUrl}?${params.toString()}`;
        const requestUrl = `${proxyUrl}${targetUrl}`;

        try {
            const response = await fetch(requestUrl);
            if (!response.ok) throw new Error(`API-verzoek mislukt: ${response.status}`);
            
            const xmlString = await response.text();
            const xmlDoc = new DOMParser().parseFromString(xmlString, "application/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length) throw new Error("Fout bij het verwerken van de XML-data.");

            const records = xmlDoc.querySelectorAll('record');
            showStatus(elements.wettenbankStatus, `${records.length} resultaten gevonden in Wettenbank.`, 'success');

            if (records.length === 0) return;

            let html = '<ul>';
            records.forEach(record => {
                const titleNode = record.querySelector('title, \\:title');
                const identifierNode = record.querySelector('identifier, \\:identifier');
                const title = titleNode?.textContent || 'Geen titel';
                const link = identifierNode?.textContent || '#';
                html += `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
            });
            html += '</ul>';
            elements.wettenbankResults.innerHTML = html;

        } catch (error) {
            showStatus(elements.wettenbankStatus, `Fout: ${error.message}.`, 'error');
            console.error(error);
        }
    };
    
    // --- PIN FUNCTIE ---
    const handlePinClick = (ecli) => {
        const itemToPin = masterResults.find(item => item.ecli === ecli);
        if (!itemToPin) return;

        elements.jurisprudenceCard.classList.add('focus-mode');
        document.querySelectorAll('.result-item').forEach(el => el.classList.remove('is-focused'));
        document.querySelector(`.result-item[data-ecli="${ecli}"]`).classList.add('is-focused');
        
        renderPinnedItem(itemToPin);
        elements.pinnedItemContainer.classList.remove('hidden');
    };

    const unpinItem = () => {
        elements.jurisprudenceCard.classList.remove('focus-mode');
        const focusedItem = document.querySelector('.result-item.is-focused');
        if (focusedItem) {
            focusedItem.classList.remove('is-focused');
        }
        elements.pinnedItemContainer.classList.add('hidden');
    };

    const renderPinnedItem = (item) => {
        const lawRegex = /(artikel\s*\d+(?::\d+)?\s*\w*)|(\w*wetboek|\w*wet)/gi;
        const foundLaws = item.summary.match(lawRegex) || [];
        const uniqueLaws = [...new Set(foundLaws)];

        const triggersHTML = uniqueLaws.map(law => 
            `<button class="tertiary-button search-trigger" data-query="${law}">${law}</button>`
        ).join('');

        elements.pinnedItemContent.innerHTML = `
            <h4>${item.title}</h4>
            <div class="meta-info">
                <span><strong>ECLI:</strong> ${item.ecli}</span>
            </div>
            <div class="search-triggers">
                <h5>Gevonden verwijzingen:</h5>
                ${triggersHTML || "<p>Geen directe wetsverwijzingen gevonden.</p>"}
            </div>
            <button id="unpinButton" class="tertiary-button">Terug naar volledige lijst</button>
        `;
        document.getElementById('unpinButton').addEventListener('click', unpinItem);
        document.querySelectorAll('.search-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                elements.wettenbankKeyword.value = e.target.dataset.query;
                handleWettenbankSearch();
            });
        });
    };

    // --- DYNAMISCHE EVENTS & WEERGAVE ---
    const handleResultsClick = (e) => {
        const target = e.target;
        if (target.classList.contains('read-more')) {
            e.preventDefault();
            const summaryContainer = target.closest('.result-item').querySelector('.summary');
            summaryContainer.classList.toggle('expanded');
            target.textContent = summaryContainer.classList.contains('expanded') ? 'Lees minder' : 'Lees meer';
        }
        if (target.classList.contains('pin-button')) {
            const ecli = target.closest('.result-item').dataset.ecli;
            handlePinClick(ecli);
        }
    };
    
    const renderJurisprudencePage = (page) => {
        elements.jurisprudenceResults.innerHTML = '';
        if (currentFilteredResults.length === 0) {
            elements.jurisprudencePagination.innerHTML = '';
            return;
        }

        currentPage = page;
        const start = (page - 1) * resultsPerPage;
        const end = start + resultsPerPage;
        const paginatedItems = currentFilteredResults.slice(start, end);
        const keyword = elements.smartSearchInput.value.trim().toLowerCase();
        
        paginatedItems.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.dataset.ecli = item.ecli;

            const deeplink = `http://deeplink.rechtspraak.nl/uitspraak?id=${encodeURIComponent(item.ecli)}`;

            let titleHTML = item.title;
            let summaryHTML = item.summary;
            let ecliHTML = item.ecli;
            let zaaknummerHTML = item.zaaknummer;

            if (keyword) {
                const searchIn = Array.from(elements.searchInCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
                const regex = new RegExp(keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
                if (searchIn.includes('title')) titleHTML = titleHTML.replace(regex, match => `<mark>${match}</mark>`);
                if (searchIn.includes('summary')) summaryHTML = summaryHTML.replace(regex, match => `<mark>${match}</mark>`);
                if (searchIn.includes('ecli')) ecliHTML = ecliHTML.replace(regex, match => `<mark>${match}</mark>`);
                if (searchIn.includes('zaaknummer')) zaaknummerHTML = zaaknummerHTML.replace(regex, match => `<mark>${match}</mark>`);
            }

            resultItem.innerHTML = `
                <div class="result-item-header">
                    <h3><a href="${deeplink}" target="_blank" rel="noopener noreferrer">${titleHTML}</a></h3>
                    <button class="pin-button" title="Pin dit dossier">📌</button>
                </div>
                <div class="meta-info">
                    <span><strong>ECLI:</strong> ${ecliHTML}</span>
                    <span><strong>Zaaknr:</strong> ${zaaknummerHTML}</span>
                    <span><strong>Laatst gewijzigd:</strong> ${item.updated.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="summary">${summaryHTML}</div>
                <a href="#" class="read-more">Lees meer</a>
                <div class="full-link">
                    <a href="${deeplink}" target="_blank" rel="noopener noreferrer">Link naar officiële document op Rechtspraak.nl:</a>
                </div>
            `;
            elements.jurisprudenceResults.appendChild(resultItem);
        });
        renderJurisprudencePagination();
    };
    
    const renderJurisprudencePagination = () => {
        elements.jurisprudencePagination.innerHTML = '';
        const pageCount = Math.ceil(currentFilteredResults.length / resultsPerPage);
        if (pageCount <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.textContent = '< Vorige';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => { if (currentPage > 1) renderJurisprudencePage(currentPage - 1); });

        const pageIndicator = document.createElement('span');
        pageIndicator.id = 'pageIndicator';
        pageIndicator.textContent = `Pagina ${currentPage} van ${pageCount}`;

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Volgende >';
        nextButton.disabled = currentPage === pageCount;
        nextButton.addEventListener('click', () => { if (currentPage < pageCount) renderJurisprudencePage(currentPage + 1); });
        
        elements.jurisprudencePagination.append(prevButton, pageIndicator, nextButton);
    };

    // --- UTILITIES ---
    const handleAutocomplete = (input, suggestions, items) => {
        const value = input.value.toLowerCase();
        suggestions.innerHTML = '';
        if (!value) {
            input.dataset.id = '';
            return;
        }

        const filtered = items.filter(item => item.name.toLowerCase().includes(value)).slice(0, 5);
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.name;
            div.addEventListener('click', () => {
                input.value = item.name;
                input.dataset.id = item.id;
                suggestions.innerHTML = '';
            });
            suggestions.appendChild(div);
        });
    };

    const showStatus = (element, message, type = 'info') => {
        element.textContent = message;
        element.style.display = 'block';
        if (type === 'error') { element.style.color = '#dc3545'; }
        else if (type === 'success') { element.style.color = '#28a745'; }
        else { element.style.color = '#555'; }
    };
    
    // --- START DE APP ---
    initializeApp();
});
