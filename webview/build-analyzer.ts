// Build Analyzer Webview Script
// This script runs inside the VS Code webview

declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

interface Region {
    name: string;
    startAddress: number;
    size: number;
    used: number;
    sections: Section[];
}

interface Section {
    name: string;
    startAddress: number;
    size: number;
    symbols: Symbol[];
}

interface Symbol {
    name: string;
    startAddress: number;
    size: number;
    path: string;
    row: number;
}

interface IconUris {
    icon1Uri: string;
    icon2Uri: string;
    icon3Uri: string;
}

const vscode = acquireVsCodeApi();

// Get icon URIs from data attributes on body
function getIconUris(): IconUris {
    const body = document.body;
    return {
        icon1Uri: body.dataset.icon1Uri || '',
        icon2Uri: body.dataset.icon2Uri || '',
        icon3Uri: body.dataset.icon3Uri || ''
    };
}

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes <= 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
    return `${value} ${sizes[i]}`;
}

function resetTableRegions(): void {
    const body = document.getElementById('regionsBody');
    if (body) {
        body.innerHTML = '';
    }
}

function fillTableRegions(regions: Region[]): void {
    const tableBody = document.getElementById('regionsBody');
    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = '';
    const icons = getIconUris();

    let id = 0;

    regions.forEach(region => {
        id++;
        const regionId = id;
        const percent = region.used / region.size * 100;

        const tableTr = document.createElement('tr');
        tableTr.className = 'toggleTr level-1';
        tableTr.setAttribute('data-level', '1');
        tableTr.setAttribute('data-id', regionId.toString());

        const tableTd1 = document.createElement('td');
        const plus = document.createElement('span');
        plus.className = 'toggle';
        plus.textContent = '+';
        tableTd1.appendChild(plus);

        const bar = document.createElement('div');
        bar.className = 'bar';
        const progress = document.createElement('div');
        progress.setAttribute('style', `
            width: ${percent}%; 
            background-color: ${percent > 95 ? 'var(--vscode-minimap-errorHighlight)' : 
                             percent > 75 ? 'var(--vscode-minimap-warningHighlight)' : 
                             'var(--vscode-minimap-infoHighlight)'}; 
            height: 100%;
            color: ${percent > 50 ? 'white' : 'black'};
            text-align: center;
            font-size: 12px;
            line-height: 1.5;
        `);
        progress.textContent = `${percent.toFixed(2)}%`;
        bar.appendChild(progress);
        tableTd1.appendChild(bar);

        const tableTd2 = document.createElement('td');
        const img = document.createElement('img');
        img.src = icons.icon1Uri;
        img.alt = 'Icon';
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '5px';
        tableTd2.appendChild(img); 
        tableTd2.appendChild(document.createTextNode(` ${region.name} `));

        const tableTd3 = document.createElement('td');
        tableTd3.appendChild(document.createTextNode(`0x${region.startAddress.toString(16).padStart(8,'0')}`));

        const tableTd4 = document.createElement('td');
        tableTd4.className = 'right-align';
        tableTd4.appendChild(document.createTextNode(formatBytes(region.size)));

        const tableTd5 = document.createElement('td');
        tableTd5.className = 'right-align';
        tableTd5.appendChild(document.createTextNode(formatBytes(region.used)));

        const tableTd6 = document.createElement('td');
        tableTd6.className = 'right-align';
        tableTd6.appendChild(document.createTextNode(formatBytes(region.size - region.used)));

        tableTr.appendChild(tableTd1);
        tableTr.appendChild(tableTd2);
        tableTr.appendChild(tableTd3);
        tableTr.appendChild(tableTd4);
        tableTr.appendChild(tableTd5);
        tableTr.appendChild(tableTd6);
        tableBody.appendChild(tableTr);

        region.sections.forEach(section => {
            id++;
            const sectionId = id;
            const sectionTr = document.createElement('tr');
            sectionTr.className = 'toggleTr level-2';
            sectionTr.setAttribute('data-level', '2');
            sectionTr.setAttribute('data-id', sectionId.toString());
            sectionTr.setAttribute('data-parent', regionId.toString());
            sectionTr.style.display = 'none';

            const sectionTd1 = document.createElement('td');
            const sectionPlus = document.createElement('span');
            sectionPlus.className = 'toggle';
            sectionPlus.textContent = '+';
            sectionTd1.appendChild(sectionPlus);

            const sectionTd2 = document.createElement('td');
            const sectionImg = document.createElement('img');
            sectionImg.src = icons.icon2Uri;
            sectionImg.alt = 'Icon';
            sectionImg.style.width = '16px';
            sectionImg.style.height = '16px';
            sectionImg.style.verticalAlign = 'middle';
            sectionImg.style.marginRight = '5px';
            sectionTd2.appendChild(sectionImg);
            sectionTd2.appendChild(document.createTextNode(` ${section.name} `));
            sectionTd2.style.paddingLeft = '15px';

            const sectionTd3 = document.createElement('td');
            sectionTd3.appendChild(document.createTextNode(`0x${section.startAddress.toString(16).padStart(8,'0')}`));

            const sectionTd4 = document.createElement('td');
            sectionTd4.className = 'right-align';
            sectionTd4.appendChild(document.createTextNode(formatBytes(section.size)));

            const sectionTd5 = document.createElement('td');
            sectionTd5.className = 'right-align';
            const sectionTd6 = document.createElement('td');
            sectionTd6.className = 'right-align';

            sectionTr.appendChild(sectionTd1);
            sectionTr.appendChild(sectionTd2);
            sectionTr.appendChild(sectionTd3);
            sectionTr.appendChild(sectionTd4);
            sectionTr.appendChild(sectionTd5);
            sectionTr.appendChild(sectionTd6);
            tableBody.appendChild(sectionTr);

            let symbolIndex = 0;
            section.symbols.forEach(symbol => {
                id++;
                symbolIndex++;
                const pointTr = document.createElement('tr');
                pointTr.className = 'toggleTr level-3';
                pointTr.setAttribute('data-level', '3');
                pointTr.setAttribute('data-id', id.toString());
                pointTr.setAttribute('data-parent', sectionId.toString());
                pointTr.setAttribute('data-original-index', symbolIndex.toString());
                pointTr.style.display = 'none';

                const pointTd1 = document.createElement('td');
                const pointTd2 = document.createElement('td');
                pointTd2.setAttribute('title', `${symbol.path}:${symbol.row}`);

                const symbolImg = document.createElement('img');
                symbolImg.src = icons.icon3Uri;
                symbolImg.alt = 'Icon';
                symbolImg.style.width = '16px';
                symbolImg.style.height = '16px';
                symbolImg.style.verticalAlign = 'middle';
                symbolImg.style.marginRight = '5px';
                pointTd2.appendChild(symbolImg); 

                if (symbol.path === '') {
                    pointTd2.appendChild(document.createTextNode(` ${symbol.name} `));
                } else {
                    const link = document.createElement('a');
                    link.className = 'source-link';
                    link.href = '#';
                    link.dataset.file = symbol.path;
                    link.dataset.line = symbol.row.toString();
                    link.appendChild(document.createTextNode(` ${symbol.name} `));
                    pointTd2.appendChild(link);
                }
                pointTd2.style.paddingLeft = '25px';

                const pointTd3 = document.createElement('td');
                pointTd3.appendChild(document.createTextNode(`0x${symbol.startAddress.toString(16).padStart(8,'0')}`));

                const pointTd4 = document.createElement('td');
                pointTd4.className = 'right-align';
                pointTd4.appendChild(document.createTextNode(`${symbol.size} B`));

                const pointTd5 = document.createElement('td');
                pointTd5.className = 'right-align';
                const pointTd6 = document.createElement('td');
                pointTd6.className = 'right-align';

                pointTr.appendChild(pointTd1);
                pointTr.appendChild(pointTd2);
                pointTr.appendChild(pointTd3);
                pointTr.appendChild(pointTd4);
                pointTr.appendChild(pointTd5);
                pointTr.appendChild(pointTd6);
                tableBody.appendChild(pointTr);
            });
        });
    });
}

function parseSizeToBytes(sizeText: string): number {
    const match = sizeText.match(/([\d.]+)\s*(B|KB|MB|GB|TB)?/i);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers: Record<string, number> = { 
        'B': 1, 
        'KB': 1024, 
        'MB': 1024 * 1024, 
        'GB': 1024 * 1024 * 1024, 
        'TB': 1024 * 1024 * 1024 * 1024 
    };
    return value * (multipliers[unit] || 1);
}

function performSearch(query: string): void {
    const searchMatchCount = document.getElementById('searchMatchCount');
    const allRows = document.querySelectorAll('.toggleTr');
    const caseSensitiveBtn = document.getElementById('caseSensitive');
    const wholeWordBtn = document.getElementById('wholeWord');
    const useRegexBtn = document.getElementById('useRegex');

    const caseSensitive = caseSensitiveBtn?.classList.contains('active') ?? false;
    const wholeWord = wholeWordBtn?.classList.contains('active') ?? false;
    const useRegex = useRegexBtn?.classList.contains('active') ?? false;

    // Remove previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
    });

    let matchCount = 0;

    if (!query) {
        // Reset to default view - hide all child rows
        allRows.forEach(row => {
            const htmlRow = row as HTMLElement;
            const level = parseInt(htmlRow.getAttribute('data-level') || '0', 10);
            if (level === 1) {
                htmlRow.style.display = '';
                const toggle = htmlRow.querySelector('.toggle');
                if (toggle) {
                  toggle.textContent = '+';
                }
            } else {
                const toggle = htmlRow.querySelector('.toggle');
                if (toggle) {
                  toggle.textContent = '+';
                }
                htmlRow.style.display = 'none';
            }
        });
        if (searchMatchCount) {
          searchMatchCount.textContent = '';
        }
        return;
    }

    // Build matcher function based on options
    let matcher: (text: string) => boolean;
    try {
        if (useRegex) {
            const flags = caseSensitive ? '' : 'i';
            const pattern = wholeWord ? '\\b' + query + '\\b' : query;
            const regex = new RegExp(pattern, flags);
            matcher = (text: string) => regex.test(text);
        } else {
            const searchQuery = caseSensitive ? query : query.toLowerCase();
            if (wholeWord) {
                matcher = (text: string) => {
                    const searchIn = caseSensitive ? text : text.toLowerCase();
                    const idx = searchIn.indexOf(searchQuery);
                    if (idx === -1) {
                      return false;
                    }
                    const before = idx === 0 || !/[a-zA-Z0-9_]/.test(searchIn[idx - 1]);
                    const after = idx + searchQuery.length >= searchIn.length || !/[a-zA-Z0-9_]/.test(searchIn[idx + searchQuery.length]);
                    return before && after;
                };
            } else {
                matcher = (text: string) => {
                    const searchIn = caseSensitive ? text : text.toLowerCase();
                    return searchIn.includes(searchQuery);
                };
            }
        }
    } catch (e) {
        if (searchMatchCount) {
          searchMatchCount.textContent = 'Invalid regex';
        }
        return;
    }

    const parentsToShow = new Set<string>();

    // First pass: find matching symbols (level 3)
    allRows.forEach(row => {
        const htmlRow = row as HTMLElement;
        const level = parseInt(htmlRow.getAttribute('data-level') || '0', 10);
        if (level === 3) {
            const nameCell = htmlRow.querySelector('td:nth-child(2)');
            const symbolName = nameCell ? nameCell.textContent?.trim() || '' : '';

            if (matcher(symbolName)) {
                matchCount++;
                htmlRow.style.display = '';
                nameCell?.classList.add('search-highlight');

                // Mark parent section and region to show
                const sectionId = htmlRow.getAttribute('data-parent');
                if (sectionId) {
                  parentsToShow.add(sectionId);
                }

                const sectionRow = document.querySelector(`tr[data-id="${sectionId}"]`);
                if (sectionRow) {
                    const regionId = sectionRow.getAttribute('data-parent');
                    if (regionId) {
                      parentsToShow.add(regionId);
                    }
                }
            } else {
                htmlRow.style.display = 'none';
            }
        }
    });

    // Second pass: show/hide sections and regions based on matches
    allRows.forEach(row => {
        const htmlRow = row as HTMLElement;
        const level = parseInt(htmlRow.getAttribute('data-level') || '0', 10);
        const id = htmlRow.getAttribute('data-id') || '';
        const toggle = htmlRow.querySelector('.toggle');

        if (level === 1) {
            if (parentsToShow.has(id)) {
                htmlRow.style.display = '';
                if (toggle) {
                  toggle.textContent = '−';
                }
            } else {
                htmlRow.style.display = 'none';
                if (toggle) {
                  toggle.textContent = '+';
                }
            }
        } else if (level === 2) {
            if (parentsToShow.has(id)) {
                htmlRow.style.display = '';
                if (toggle) {
                  toggle.textContent = '−';
                }
            } else {
                htmlRow.style.display = 'none';
                if (toggle) {
                  toggle.textContent = '+';
                }
            }
        }
    });

    if (searchMatchCount) {
        searchMatchCount.textContent = matchCount > 0 
            ? 'Found: ' + matchCount + ' symbols'
            : 'No matches';
    }
}

function applySorting(field: string, isAscending: boolean): void {
    const tableBody = document.getElementById('regionsBody');
    if (!tableBody) {
      return;
    }

    const allRows = Array.from(tableBody.querySelectorAll('.toggleTr'));

    // Group rows by hierarchy
    interface RegionGroup {
        row: Element;
        sections: SectionGroup[];
    }
    interface SectionGroup {
        row: Element;
        symbols: Element[];
    }

    const regions: RegionGroup[] = [];
    let currentRegion: RegionGroup | null = null;
    let currentSection: SectionGroup | null = null;

    allRows.forEach(row => {
        const level = parseInt(row.getAttribute('data-level') || '0', 10);
        if (level === 1) {
            currentRegion = { row: row, sections: [] };
            regions.push(currentRegion);
            currentSection = null;
        } else if (level === 2 && currentRegion) {
            currentSection = { row: row, symbols: [] };
            currentRegion.sections.push(currentSection);
        } else if (level === 3 && currentSection) {
            currentSection.symbols.push(row);
        }
    });

    // Sort symbols within each section (only level 3 - symbols)
    regions.forEach(region => {
        region.sections.forEach(section => {
            section.symbols.sort((a, b) => {
                let valA: number | string, valB: number | string;
                if (field === 'original') {
                    valA = parseInt(a.getAttribute('data-original-index') || '0', 10);
                    valB = parseInt(b.getAttribute('data-original-index') || '0', 10);
                    return valA - valB;
                } else if (field === 'name') {
                    valA = (a.querySelector('td:nth-child(2)')?.textContent?.trim() || '').toLowerCase();
                    valB = (b.querySelector('td:nth-child(2)')?.textContent?.trim() || '').toLowerCase();
                    return isAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else if (field === 'address') {
                    const addrTextA = a.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
                    const addrTextB = b.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
                    valA = parseInt(addrTextA, 16) || 0;
                    valB = parseInt(addrTextB, 16) || 0;
                    return isAscending ? valA - valB : valB - valA;
                } else if (field === 'size') {
                    const sizeTextA = a.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
                    const sizeTextB = b.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
                    valA = parseSizeToBytes(sizeTextA);
                    valB = parseSizeToBytes(sizeTextB);
                    return isAscending ? valA - valB : valB - valA;
                }
                return 0;
            });
        });
    });

    // Rebuild table with updated IDs
    tableBody.innerHTML = '';
    let newId = 0;
    regions.forEach(region => {
        newId++;
        const regionId = newId;
        region.row.setAttribute('data-id', regionId.toString());
        tableBody.appendChild(region.row);

        region.sections.forEach(section => {
            newId++;
            const sectionId = newId;
            section.row.setAttribute('data-id', sectionId.toString());
            section.row.setAttribute('data-parent', regionId.toString());
            tableBody.appendChild(section.row);

            section.symbols.forEach(symbol => {
                newId++;
                symbol.setAttribute('data-id', newId.toString());
                symbol.setAttribute('data-parent', sectionId.toString());
                tableBody.appendChild(symbol);
            });
        });
    });
}

function updateSortIndicators(currentSortField: string | null, isAscending: boolean): void {
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.textContent = '↕';
        indicator.classList.remove('active');
    });

    if (currentSortField) {
        const indicator = document.getElementById('sort-' + currentSortField);
        if (indicator) {
            indicator.textContent = isAscending ? '↑' : '↓';
            indicator.classList.add('active');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'requestRefresh' });

    const refreshButton = document.getElementById('refreshButton');
    const refreshPathsButton = document.getElementById('refreshPathsButton');

    refreshButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'requestRefresh' });
    });

    refreshPathsButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'refreshPaths' });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const caseSensitiveBtn = document.getElementById('caseSensitive');
    const wholeWordBtn = document.getElementById('wholeWord');
    const useRegexBtn = document.getElementById('useRegex');

    let searchTimeout: ReturnType<typeof setTimeout>;

    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(searchInput.value.trim());
        }, 200);
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            performSearch('');
        }
    });

    // Toggle search options
    [caseSensitiveBtn, wholeWordBtn, useRegexBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
            btn.classList.toggle('active');
            if (searchInput) {
              performSearch(searchInput.value.trim());
            }
        });
    });

    // Sort functionality - clickable headers
    let currentSortField: string | null = null;
    let isAscending = true;

    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');
            if (!field) {
              return;
            }

            if (currentSortField === field) {
                if (isAscending) {
                    isAscending = false;
                } else {
                    currentSortField = null;
                    isAscending = true;
                    updateSortIndicators(currentSortField, isAscending);
                    applySorting('original', isAscending);
                    return;
                }
            } else {
                currentSortField = field;
                isAscending = true;
            }
            
            updateSortIndicators(currentSortField, isAscending);
            applySorting(field, isAscending);
        });
    });
});

// Handle table click events
document.getElementById('regionsTable')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const sourceLink = target.closest('.source-link') as HTMLAnchorElement | null;

    if (sourceLink) {
        e.preventDefault();
        vscode.postMessage({
            command: 'openFile',
            filePath: sourceLink.dataset.file,
            lineNumber: parseInt(sourceLink.dataset.line || '0', 10)
        });
        return;
    }

    const toggleSpan = target.closest('.toggle');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;

    if (searchInput && searchInput.value) {
        return;
    }

    if (toggleSpan) {
        const tr = toggleSpan.closest('tr');
        if (!tr) {
          return;
        }

        const parentId = tr.getAttribute('data-id');
        const childRows = document.querySelectorAll(`tr[data-parent="${parentId}"]`);

        childRows.forEach(child => {
            const htmlChild = child as HTMLElement;
            htmlChild.style.display = htmlChild.style.display === 'none' ? '' : 'none';
            
            if (htmlChild.style.display === 'none') {
                const toggle = htmlChild.querySelector('.toggle');
                if (toggle) {
                  toggle.textContent = '+';
                }
            }

            const childId = child.getAttribute('data-id');
            const childLevel = parseInt(child.getAttribute('data-level') || '0', 10);

            if (htmlChild.style.display === 'none' && childLevel === 2) {
                const grandChildRows = document.querySelectorAll(`tr[data-parent="${childId}"]`);
                grandChildRows.forEach(grandChild => {
                    const htmlGrandChild = grandChild as HTMLElement;
                    if (htmlGrandChild.style.display !== 'none') {
                        htmlGrandChild.style.display = 'none';
                    }
                });
            }
        });

        toggleSpan.textContent = toggleSpan.textContent === '+' ? '−' : '+';
    }
});

// Handle messages from extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'showMapData':
            resetTableRegions();
            fillTableRegions(message.data);
            if (message.currentBuildFolderRelativePath) {
                const folderDiv = document.getElementById('buildFolderPath');
                if (folderDiv) {
                    folderDiv.textContent = message.currentBuildFolderRelativePath;
                }
            }
            // Reset search when data is refreshed
            const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
            if (searchInput && searchInput.value) {
                performSearch(searchInput.value.trim());
            }
            break;
    }
});
