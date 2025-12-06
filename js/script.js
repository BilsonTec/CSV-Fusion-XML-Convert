// @ts-nocheck
let mergedData = [];
        let selectedFiles = [];
        let allColumns = new Set(); // Pour garder toutes les colonnes uniques
        let columnFilesMap = new Map(); // Pour savoir quelles colonnes sont dans quels fichiers

        // Éléments DOM
        const uploadArea = document.getElementById('uploadArea');
        const csvFilesInput = document.getElementById('csvFiles');
        const fileList = document.getElementById('fileList');
        const filesGrid = document.getElementById('filesGrid');
        const fileCount = document.getElementById('fileCount');
        const fileCountStat = document.getElementById('fileCountStat');
        const recordCount = document.getElementById('recordCount');
        const uniqueColumns = document.getElementById('uniqueColumns');
        const columnsSummary = document.getElementById('columnsSummary');
        const columnsCount = document.getElementById('columnsCount');
        const columnsList = document.getElementById('columnsList');
        const clearFilesBtn = document.getElementById('clearFiles');
        const mergeBtn = document.getElementById('mergeBtn');
        const convertBtn = document.getElementById('convertBtn');
        const status = document.getElementById('status');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const dataPreview = document.getElementById('dataPreview');
        const previewTableHeader = document.getElementById('previewTableHeader');
        const previewTableBody = document.getElementById('previewTableBody');
        const previewColumns = document.getElementById('previewColumns');
        const previewRows = document.getElementById('previewRows');
        const downloadSection = document.getElementById('downloadSection');
        const downloadBtn = document.getElementById('downloadBtn');

        // Écouteurs d'événements
        csvFilesInput.addEventListener('change', handleFileSelection);
        uploadArea.addEventListener('click', () => csvFilesInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        clearFilesBtn.addEventListener('click', clearAllFiles);
        mergeBtn.addEventListener('click', mergeCSV);
        convertBtn.addEventListener('click', convertToXML);

        // Gestion du drag and drop
        function handleDragOver(e) {
            e.preventDefault();
            uploadArea.classList.add('active');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            uploadArea.classList.remove('active');
        }

        function handleDrop(e) {
            e.preventDefault();
            uploadArea.classList.remove('active');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.name.toLowerCase().endsWith('.csv')
            );
            
            if (files.length > 0) {
                const dataTransfer = new DataTransfer();
                files.forEach(file => dataTransfer.items.add(file));
                csvFilesInput.files = dataTransfer.files;
                handleFileSelection({ target: csvFilesInput });
            }
        }

        // Gestion de la sélection des fichiers
        function handleFileSelection(event) {
            const newFiles = Array.from(event.target.files);
            
            // Filtrer les doublons
            const existingFileNames = selectedFiles.map(f => f.name);
            const uniqueNewFiles = newFiles.filter(file => !existingFileNames.includes(file.name));
            
            if (uniqueNewFiles.length === 0 && newFiles.length > 0) {
                showStatus('Certains fichiers sont déjà sélectionnés', 'warning');
                return;
            }
            
            selectedFiles = [...selectedFiles, ...uniqueNewFiles];
            updateFileList();
            
            if (selectedFiles.length > 0) {
                mergeBtn.disabled = false;
                showStatus(`${uniqueNewFiles.length} nouveau(x) fichier(s) ajouté(s)`, 'success');
            }
        }

        // Mise à jour de la liste des fichiers
        function updateFileList() {
            filesGrid.innerHTML = '';
            
            if (selectedFiles.length === 0) {
                fileList.classList.remove('visible');
                dataPreview.classList.remove('visible');
                columnsSummary.style.display = 'none';
                return;
            }
            
            fileList.classList.add('visible');
            fileCount.textContent = selectedFiles.length;
            fileCountStat.textContent = selectedFiles.length;
            
            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                    <div class="file-actions">
                        <button class="action-btn delete" onclick="removeFile(${index})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                `;
                filesGrid.appendChild(fileItem);
            });
        }

        // Supprimer un fichier
        function removeFile(index) {
            selectedFiles.splice(index, 1);
            
            // Mettre à jour l'input file
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(file => dataTransfer.items.add(file));
            csvFilesInput.files = dataTransfer.files;
            
            updateFileList();
            
            if (selectedFiles.length === 0) {
                mergeBtn.disabled = true;
                convertBtn.disabled = true;
                showStatus('Tous les fichiers ont été effacés', 'info');
            }
        }

        // Effacer tous les fichiers
        function clearAllFiles() {
            selectedFiles = [];
            mergedData = [];
            allColumns.clear();
            columnFilesMap.clear();
            csvFilesInput.value = '';
            updateFileList();
            mergeBtn.disabled = true;
            convertBtn.disabled = true;
            dataPreview.classList.remove('visible');
            columnsSummary.style.display = 'none';
            recordCount.textContent = '0';
            uniqueColumns.textContent = '0';
            showStatus('Tous les fichiers et données ont été effacés', 'info');
        }

        // Formatage de la taille
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // Parsing CSV amélioré
        function parseCSV(text, filename) {
            const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
            if (rows.length === 0) return { headers: [], data: [] };
            
            // Détection du séparateur
            let separator = ',';
            const firstLine = rows[0];
            if (firstLine.includes(';') && !firstLine.includes(',') || firstLine.split(';').length > firstLine.split(',').length) {
                separator = ';';
            }
            
            // Parseur CSV qui gère les guillemets
            const parseCSVLine = (line) => {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    
                    if (char === '"' && inQuotes && nextChar === '"') {
                        current += '"';
                        i++; // Skip next quote
                    } else if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === separator && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                result.push(current.trim());
                return result.map(cell => cell.replace(/^"|"$/g, ''));
            };
            
            const headers = parseCSVLine(rows[0]).map(h => h.trim());
            const data = rows.slice(1).map(row => {
                const values = parseCSVLine(row);
                let obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] || '';
                });
                return obj;
            }).filter(item => Object.values(item).some(v => v !== ''));
            
            return { headers, data };
        }

        // Fusion des CSV en gardant TOUTES les colonnes
        async function mergeCSV() {
            if (selectedFiles.length === 0) {
                showStatus('Veuillez sélectionner au moins un fichier CSV', 'error');
                return;
            }

            mergeBtn.disabled = true;
            progressBar.classList.add('visible');
            progressFill.style.width = '0%';
            
            showStatus('Démarrage de la fusion...', 'info');

            mergedData = [];
            allColumns.clear();
            columnFilesMap.clear();
            let processedFiles = 0;
            let totalRecords = 0;

            try {
                // Première passe : collecter toutes les colonnes uniques
                showStatus('Analyse des colonnes...', 'info');
                
                for (let file of selectedFiles) {
                    const text = await readFileAsText(file);
                    const { headers } = parseCSV(text, file.name);
                    
                    headers.forEach(header => {
                        allColumns.add(header);
                        if (!columnFilesMap.has(header)) {
                            columnFilesMap.set(header, new Set());
                        }
                        columnFilesMap.get(header).add(file.name);
                    });
                    
                    processedFiles++;
                    const progress = (processedFiles / selectedFiles.length) * 50;
                    progressFill.style.width = `${progress}%`;
                }
                
                showStatus(`Toutes les colonnes collectées (${allColumns.size} uniques)`, 'success');
                
                // Deuxième passe : fusionner les données
                showStatus('Fusion des données...', 'info');
                processedFiles = 0;
                
                const allColumnsArray = Array.from(allColumns);
                
                for (let file of selectedFiles) {
                    const text = await readFileAsText(file);
                    const { headers, data } = parseCSV(text, file.name);
                    
                    // Créer un mapping des index des colonnes
                    const headerIndexMap = {};
                    headers.forEach((header, index) => {
                        headerIndexMap[header] = index;
                    });
                    
                    // Pour chaque ligne du fichier actuel
                    data.forEach(row => {
                        const mergedRow = {};
                        
                        // Pour chaque colonne globale
                        allColumnsArray.forEach(col => {
                            if (headerIndexMap[col] !== undefined) {
                                // Si la colonne existe dans ce fichier, prendre la valeur
                                mergedRow[col] = row[headers[headerIndexMap[col]]];
                            } else {
                                // Sinon, laisser vide
                                mergedRow[col] = '';
                            }
                        });
                        
                        mergedData.push(mergedRow);
                        totalRecords++;
                    });
                    
                    processedFiles++;
                    const progress = 50 + (processedFiles / selectedFiles.length) * 50;
                    progressFill.style.width = `${progress}%`;
                    
                    showStatus(`Traitement de ${file.name}... (${processedFiles}/${selectedFiles.length})`, 'info');
                    
                    // Petite pause pour l'animation
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                mergeBtn.disabled = false;
                convertBtn.disabled = false;
                progressFill.style.width = '100%';
                
                setTimeout(() => {
                    progressBar.classList.remove('visible');
                }, 500);
                
                // Mettre à jour les statistiques
                recordCount.textContent = mergedData.length.toLocaleString();
                uniqueColumns.textContent = allColumns.size;
                
                // Afficher le résumé des colonnes
                updateColumnsSummary();
                
                // Afficher l'aperçu des données
                showDataPreview();
                
                showStatus(`Fusion réussie ! ${mergedData.length} enregistrements fusionnés avec ${allColumns.size} colonnes uniques.`, 'success');
                
            } catch (error) {
                console.error('Erreur lors de la fusion:', error);
                showStatus(`Erreur lors de la fusion: ${error.message}`, 'error');
                mergeBtn.disabled = false;
                progressBar.classList.remove('visible');
            }
        }

        // Mettre à jour le résumé des colonnes
        function updateColumnsSummary() {
            columnsSummary.style.display = 'block';
            columnsCount.textContent = allColumns.size;
            columnsList.innerHTML = '';
            
            const allColumnsArray = Array.from(allColumns);
            const totalFiles = selectedFiles.length;
            
            allColumnsArray.forEach(col => {
                const filesWithColumn = columnFilesMap.get(col)?.size || 0;
                const presentInAll = filesWithColumn === totalFiles;
                const presentInSome = filesWithColumn > 0 && filesWithColumn < totalFiles;
                
                const columnTag = document.createElement('span');
                columnTag.className = 'column-tag';
                if (presentInAll) {
                    columnTag.classList.add('present-in-all');
                } else if (presentInSome) {
                    columnTag.classList.add('present-in-some');
                }
                
                columnTag.innerHTML = `
                    ${col}
                    <span style="font-size: 10px; opacity: 0.8;">(${filesWithColumn}/${totalFiles})</span>
                `;
                columnsList.appendChild(columnTag);
            });
        }

        // Afficher l'aperçu des données
        function showDataPreview() {
            dataPreview.classList.add('visible');
            previewColumns.textContent = `${allColumns.size} colonnes`;
            previewRows.textContent = `${Math.min(mergedData.length, 10)} sur ${mergedData.length}`;
            
            // Créer l'en-tête du tableau
            const allColumnsArray = Array.from(allColumns);
            previewTableHeader.innerHTML = '';
            const headerRow = document.createElement('tr');
            
            allColumnsArray.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                
                // Ajouter un indicateur si la colonne n'est pas dans tous les fichiers
                const filesWithColumn = columnFilesMap.get(col)?.size || 0;
                if (filesWithColumn < selectedFiles.length) {
                    th.title = `Présente dans ${filesWithColumn}/${selectedFiles.length} fichiers`;
                    th.style.color = '#f59e0b';
                }
                
                headerRow.appendChild(th);
            });
            previewTableHeader.appendChild(headerRow);
            
            // Créer le corps du tableau (10 premières lignes max)
            previewTableBody.innerHTML = '';
            const rowsToShow = Math.min(mergedData.length, 10);
            
            for (let i = 0; i < rowsToShow; i++) {
                const row = document.createElement('tr');
                
                allColumnsArray.forEach(col => {
                    const td = document.createElement('td');
                    td.textContent = mergedData[i][col] || '';
                    if (mergedData[i][col] === '') {
                        td.style.color = '#9ca3af';
                        td.style.fontStyle = 'italic';
                    }
                    row.appendChild(td);
                });
                
                previewTableBody.appendChild(row);
            }
            
            // Si plus de 10 lignes, ajouter une ligne d'information
            if (mergedData.length > 10) {
                const infoRow = document.createElement('tr');
                const infoCell = document.createElement('td');
                infoCell.colSpan = allColumnsArray.length;
                infoCell.textContent = `... et ${mergedData.length - 10} lignes supplémentaires`;
                infoCell.style.textAlign = 'center';
                infoCell.style.fontStyle = 'italic';
                infoCell.style.color = '#6b7280';
                infoRow.appendChild(infoCell);
                previewTableBody.appendChild(infoRow);
            }
        }

        // Lecture de fichier
        function readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
                reader.readAsText(file, 'UTF-8');
            });
        }

        // Conversion en XML avec TOUTES les colonnes
        async function convertToXML() {
            if (mergedData.length === 0) {
                showStatus('Veuillez d\'abord fusionner les fichiers CSV', 'error');
                return;
            }

            convertBtn.disabled = true;
            showStatus('Conversion en XML...', 'info');

            try {
                const allColumnsArray = Array.from(allColumns);
                
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
                xml += '<!-- Généré par CSV to XML Converter -->\n';
                xml += `<!-- Date: ${new Date().toLocaleString('fr-FR')} -->\n`;
                xml += `<!-- Fichiers sources: ${selectedFiles.map(f => f.name).join(', ')} -->\n`;
                xml += `<!-- Enregistrements: ${mergedData.length} | Colonnes: ${allColumns.size} -->\n`;
                xml += '<dataset>\n';
                
                mergedData.forEach((item, index) => {
                    xml += `  <record id="${index + 1}">\n`;
                    
                    allColumnsArray.forEach(col => {
                        const safeKey = col
                            .replace(/[^a-zA-Z0-9À-ÿ\s_-]/g, '_')
                            .replace(/\s+/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_+|_+$/g, '');
                        
                        const value = escapeXML(item[col] || '');
                        xml += `    <${safeKey}>${value}</${safeKey}>\n`;
                    });
                    
                    xml += '  </record>\n';
                });
                
                xml += '</dataset>';

                const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                downloadBtn.href = url;
                const dateStr = new Date().toISOString().split('T')[0];
                downloadBtn.download = `export_${dateStr}_${mergedData.length}_records.xml`;
                downloadSection.classList.add('visible');
                
                showStatus('Conversion terminée avec succès !', 'success');
                
                // Défilement vers la section de téléchargement
                downloadSection.scrollIntoView({ behavior: 'smooth' });
                
                // Réactiver le bouton après un délai
                setTimeout(() => {
                    convertBtn.disabled = false;
                }, 1000);
                
            } catch (error) {
                console.error('Erreur lors de la conversion:', error);
                showStatus(`Erreur lors de la conversion: ${error.message}`, 'error');
                convertBtn.disabled = false;
            }
        }

        // Échappement XML
        function escapeXML(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        // Affichage des statuts
        function showStatus(message, type) {
            const icon = {
                success: '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                error: '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                info: '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                warning: '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            };
            
            status.innerHTML = icon[type] + '<span>' + message + '</span>';
            status.className = `status visible ${type}`;
            
            // Auto-dissimulation pour les messages de succès/erreur
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    status.classList.remove('visible');
                }, 5000);
            }
        }