document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const subjectInput = document.getElementById('subject');
    const resultsContainer = document.getElementById('results');
    const statusContainer = document.getElementById('status');

    const handleSearch = async () => {
        // Leegmaken en status tonen
        statusContainer.textContent = 'Resultaten laden...';
        statusContainer.style.display = 'block';
        resultsContainer.innerHTML = '';

        // --- CORRECTE PARAMETERS VOLGENS DE HANDLEIDING ---
        const params = new URLSearchParams();

        // 1. Voeg datums toe (parameter: date)
        if (dateFromInput.value) {
            params.append('date', dateFromInput.value);
        }
        if (dateToInput.value) {
            params.append('date', dateToInput.value);
        }

        // 2. Voeg rechtsgebied toe (parameter: subject)
        if (subjectInput.value) {
            params.append('subject', subjectInput.value);
        }

        // 3. Vraag alleen resultaten met een document (parameter: return)
        params.append('return', 'DOC');

        // 4. Stel het maximale aantal resultaten in (maximaal 1000)
        params.append('max', '100');

        // 5. Sorteer op nieuwste eerst (parameter: sort)
        params.append('sort', 'DESC');
        
        // --- EINDE CORRECTIES ---
        
        if (params.toString() === "return=DOC&max=100&sort=DESC") {
             alert('Selecteer ten minste één filter (datum of rechtsgebied).');
             statusContainer.style.display = 'none';
             return;
        }

        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const baseUrl = 'https://data.rechtspraak.nl/uitspraken/zoeken';
        const requestUrl = `${proxyUrl}${encodeURIComponent(`${baseUrl}?${params.toString()}`)}`;

        try {
            const response = await fetch(requestUrl);
            if (!response.ok) throw new Error(`Fout: ${response.status}`);
            const xmlString = await response.text();
            const xmlDoc = new DOMParser().parseFromString(xmlString, "application/xml");
            displayResults(xmlDoc);
        } catch (error) {
            statusContainer.textContent = `Er is een fout opgetreden: ${error.message}.`;
        }
    };

    const displayResults = (xmlDoc) => {
        const entries = xmlDoc.getElementsByTagName('entry');
        const subtitle = xmlDoc.querySelector('subtitle')?.textContent || '';
        
        if (entries.length === 0 || subtitle.includes("Aantal gevonden ECLI's: 0")) {
            statusContainer.textContent = 'Geen resultaten gevonden voor deze filters.';
            return;
        }
        
        statusContainer.innerHTML = `<strong>${subtitle}</strong> (maximaal 100 getoond)`;
        
        Array.from(entries).forEach(entry => {
            const title = entry.querySelector('title')?.textContent || 'Geen titel';
            const ecli = entry.querySelector('id')?.textContent || '';
            const summary = entry.querySelector('summary')?.textContent || 'Geen samenvatting beschikbaar.';
            const updatedDate = new Date(entry.querySelector('updated')?.textContent).toLocaleDateString('nl-NL');
            const deeplink = `http://deeplink.rechtspraak.nl/uitspraak?id=${encodeURIComponent(ecli)}`;

            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <h2><a href="${deeplink}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                <div class="meta-info">
                    <span><strong>ECLI:</strong> ${ecli}</span>
                    <span><strong>Laatst gewijzigd:</strong> ${updatedDate}</span>
                </div>
                <p class="summary">${summary}</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    };

    searchButton.addEventListener('click', handleSearch);
});
