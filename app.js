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

    const API_ENDPOINT = '/.netlify/functions/search'; 

    let currentQuery = '';
    let currentPage = 1;
    let totalResults = 0;
    let activeFilters = {};

    const availableFilters = {
        'dt.type': 'Documenttype',
        'dt.creator': 'Organisatie',
        'dt.subject': 'Thema',
        'w.organisatietype': 'Organisatietype'
    };

    const initializeFilters = () => {
        filtersContainer.innerHTML = '';
        for (const index in availableFilters) {
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group';
            filterGroup.innerHTML = `<h3>${availableFilters[index]}</h3><div class="filter-options"></div>`;
            filtersContainer.appendChild(filterGroup);
        }
        filtersContainer.innerHTML += `<p style="font-style: italic; font-size: 0.9em; color: var(--dark-gray); margin-top: 1rem;">Filteropties verschijnen na een zoekopdracht.</p>`;
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
            
            const identifier = record['dcterms:identifier'] || '';
            const title = record['dcterms:title'] || 'Geen titel';
            const type = record['dcterms:type'] || 'Onbekend';
            const subject = Array.isArray(record['dcterms:subject']) ? record['dcterms:subject'].join(', ') : record['dcterms:subject'] || 'Onbekend';
            const creator = Array.isArray(record['dcterms:creator']) ? record['dcterms:creator'].join(', ') : record['dcterms:creator'] || 'Onbekend';
            const issued = record['dcterms:issued'] || 'Onbekend';
            const productArea = record['overheidwetgeving:product-area'] || 'Onbekend';
            const organizationType = record['overheidwetgeving:organisatietype'] || 'Onbekend';

            item.innerHTML = `
                <h3>${title}</h3>
                <div class="result-meta">
                    ${identifier ? `<strong>Identifier:</strong> ${identifier}<br>` : ''}
                    <strong>Type:</strong> ${type}<br>
                    <strong>Thema:</strong> ${subject}<br>
                    <strong>Uitgever:</strong> ${creator} | <strong>Organisatietype:</strong> ${organizationType}<br>
                    <strong>Datum van uitgifte:</strong> ${issued}<br>
                    <strong>Productgebied:</strong> ${productArea}
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
        
        const createPaginationButton = (text, page, isActive = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = isActive;
            if (isActive) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                currentPage = page;
                searchData();
                window.scrollTo(0, 0);
            });
            return button;
        };

        const firstButton = createPaginationButton('Eerste', 1, currentPage === 1);
        paginationContainer.appendChild(firstButton);

        const prevButton = createPaginationButton('Vorige', currentPage - 1, currentPage === 1);
        paginationContainer.appendChild(prevButton);
        
        let startPage = Math.max(1, currentPage - 4);
        let endPage = Math.min(totalPages, currentPage + 5);

        if (endPage - startPage < 9) {
            if (currentPage <= 5) {
                endPage = Math.min(totalPages, 10);
            } else if (totalPages - currentPage < 5) {
                startPage = Math.max(1, totalPages - 9);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPaginationButton(i, i, i === currentPage);
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = createPaginationButton('Volgende', currentPage + 1, currentPage === totalPages);
        paginationContainer.appendChild(nextButton);

        const lastButton = createPaginationButton('Laatste', totalPages, currentPage === totalPages);
        paginationContainer.appendChild(lastButton);
    };

    const updateFilters = (facets) => {
        const filterGroups = filtersContainer.querySelectorAll('.filter-group');
        filterGroups.forEach(group => {
            const filterOptions = group.querySelector('.filter-options');
            filterOptions.innerHTML = '';
            const h3Text = group.querySelector('h3').textContent;
            const index = Object.keys(availableFilters).find(key => availableFilters[key] === h3Text);

            if (!facets) return;

            const facetData = facets.find(f => f.index === index);
            if (!facetData) return;
            
            facetData.terms.forEach(term => {
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
    initializeFilters();
    searchData();
});
