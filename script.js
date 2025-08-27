// app.js
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsInfo = document.getElementById('results-info');
    const resultsList = document.getElementById('results-list');
    const paginationContainer = document.getElementById('pagination-container');
    const noResultsMessage = document.querySelector('.no-results-message');
    const filtersContainer = document.getElementById('filters-container');
    const resetFiltersButton = document.getElementById('reset-filters');
    const overlay = document.getElementById('overlay');
    const detailsModal = document.getElementById('details-modal');
    const closeModalButton = document.getElementById('close-modal');

    // Vercel/Netlify Serverless Function endpoint
    const API_ENDPOINT = '/.netlify/functions/search'; 
    // const API_ENDPOINT = '/api/search'; // Example for Vercel

    let currentQuery = '';
    let currentPage = 1;
    let totalResults = 0;
    let activeFilters = {};

    const availableFilters = {
        'dt.type': 'Documenttype',
        'dt.creator': 'Organisatie',
        'dt.subject': 'Thema'
    };

    const searchData = async () => {
        resultsInfo.textContent = 'Zoeken...';
        resultsList.innerHTML = '';
        noResultsMessage.style.display = 'none';
        
        const params = new URLSearchParams({
            query: currentQuery,
            page: currentPage,
            filters: JSON.stringify(activeFilters)
        });

        try {
            const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            totalResults = data.totalResults;
            displayResults(data.records);
            updateResultsInfo();
            updatePagination();
            updateFilters(data.facets);

        } catch (error) {
            console.error('Er is een fout opgetreden bij het ophalen van data:', error);
            resultsInfo.textContent = 'Er is een fout opgetreden bij het zoeken.';
            resultsList.innerHTML = '';
        }
    };

    const displayResults = (records) => {
        resultsList.innerHTML = '';
        if (records.length === 0) {
            noResultsMessage.style.display = 'block';
            resultsInfo.textContent = '';
            paginationContainer.innerHTML = '';
            return;
        }

        records.forEach(record => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            const title = record['dcterms:title'] || record['dcterms:identifier'] || 'Geen titel beschikbaar';
            const creator = record['dcterms:creator'] || 'Onbekend';
            const date = record['dcterms:issued'] || 'Onbekend';
            const type = record['dcterms:type'] || 'Onbekend';

            item.innerHTML = `
                <h3>${title}</h3>
                <div class="result-meta">
                    <strong>Type:</strong> ${type} | <strong>Uitgever:</strong> ${creator} | <strong>Datum:</strong> ${date}
                </div>
            `;
            
            item.addEventListener('click', () => {
                showDetails(record);
            });

            resultsList.appendChild(item);
        });
    };

    const showDetails = (record) => {
        const detailsContent = document.getElementById('details-content');
        detailsContent.innerHTML = '';

        const title = record['dcterms:title'] || 'Geen titel';
        detailsContent.innerHTML += `<h2>${title}</h2>`;

        const allFields = {
            ...record['overheidwetgeving:owmskern'],
            ...record['overheidwetgeving:owmsmantel'],
            ...record['overheidwetgeving:tpmeta'],
            ...record.urls
        };

        const detailsList = document.createElement('ul');
        for (const key in allFields) {
            if (Object.hasOwnProperty.call(allFields, key)) {
                let value = allFields[key];
                if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value, null, 2).replace(/{|}|"/g, '').replace(/,/g, '<br>');
                }
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${key.replace('dcterms:', '').replace('overheidwetgeving:', '').replace('gzd:', '')}:</strong> ${value}`;
                detailsList.appendChild(listItem);
            }
        }
        detailsContent.appendChild(detailsList);

        // Add links to full documents
        if (record.urls) {
            const linksContainer = document.createElement('div');
            linksContainer.innerHTML = '<h3>Volledige documenten</h3>';
            if (record.urls.preferredUrl) {
                linksContainer.innerHTML += `<a href="${record.urls.preferredUrl}" target="_blank">Bekijk op officielebekendmakingen.nl</a><br>`;
            }
            if (record.urls.html) {
                linksContainer.innerHTML += `<a href="${record.urls.html}" target="_blank">HTML-versie</a><br>`;
            }
            if (record.urls.pdf) {
                linksContainer.innerHTML += `<a href="${record.urls.pdf}" target="_blank">PDF-versie</a>`;
            }
            detailsContent.appendChild(linksContainer);
        }

        overlay.style.display = 'flex';
    };

    const updateResultsInfo = () => {
        if (totalResults > 0) {
            const start = (currentPage - 1) * 10 + 1;
            const end = Math.min(start + 9, totalResults);
            resultsInfo.textContent = `Resultaten ${start} - ${end} van ${totalResults}`;
        } else {
            resultsInfo.textContent = '';
        }
    };

    const updatePagination = () => {
        paginationContainer.innerHTML = '';
        if (totalResults <= 10) return;

        const totalPages = Math.ceil(totalResults / 10);
        
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Vorige';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            currentPage--;
            searchData();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(prevButton);

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                searchData();
                window.scrollTo(0, 0);
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Volgende';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            currentPage++;
            searchData();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(nextButton);
    };

    const updateFilters = (facets) => {
        filtersContainer.innerHTML = '';
        if (!facets) return;

        facets.forEach(facet => {
            const index = facet.index;
            if (!availableFilters[index]) return;

            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group';
            filterGroup.innerHTML = `<h3>${availableFilters[index]}</h3>`;
            
            const filterOptions = document.createElement('div');
            filterOptions.className = 'filter-options';
            
            facet.terms.forEach(term => {
                const labelText = term.actualTerm;
                const count = term.count;
                const checkboxId = `filter-${index}-${labelText.replace(/\s/g, '-')}`;

                const optionDiv = document.createElement('div');
                optionDiv.className = 'filter-option';
                optionDiv.innerHTML = `
                    <input type="checkbox" id="${checkboxId}" data-index="${index}" value="${labelText}" ${activeFilters[index] && activeFilters[index].includes(labelText) ? 'checked' : ''}>
                    <label for="${checkboxId}">${labelText} (${count})</label>
                `;

                optionDiv.querySelector('input').addEventListener('change', (e) => {
                    const { index, value } = e.target.dataset;
                    if (e.target.checked) {
                        if (!activeFilters[index]) {
                            activeFilters[index] = [];
                        }
                        activeFilters[index].push(value);
                    } else {
                        activeFilters[index] = activeFilters[index].filter(v => v !== value);
                        if (activeFilters[index].length === 0) {
                            delete activeFilters[index];
                        }
                    }
                    currentPage = 1;
                    searchData();
                });
                filterOptions.appendChild(optionDiv);
            });

            filterGroup.appendChild(filterOptions);
            filtersContainer.appendChild(filterGroup);
        });
    };

    // Event listeners
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentQuery = searchInput.value;
        currentPage = 1;
        searchData();
    });
    
    closeModalButton.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', (e) => {
        if (e.target.id === 'overlay') {
            overlay.style.display = 'none';
        }
    });

    resetFiltersButton.addEventListener('click', () => {
        activeFilters = {};
        currentPage = 1;
        searchData();
    });

    // Initial load
    searchData(); 
});
