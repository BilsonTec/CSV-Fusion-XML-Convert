// @ts-nocheck
let mergedData = [];
        let selectedFiles = [];

        // Éléments DOM
        const uploadArea = document.getElementById('uploadArea');
        const csvFilesInput = document.getElementById('csvFiles');
        const fileList = document.getElementById('fileList');
        const filesGrid = document.getElementById('filesGrid');
        const fileCount = document.getElementById('fileCount');
        const fileCountStat = document.getElementById('fileCountStat');
        const recordCount = document.getElementById('recordCount');
        const fileSize = document.getElementById('fileSize');
        const clearFilesBtn = document.getElementById('clearFiles');
        const mergeBtn = document.getElementById('mergeBtn');
        const convertBtn = document.getElementById('convertBtn');
        const status = document.getElementById('status');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
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
                showStatus('Certains fichiers sont déjà sélectionnés', 'error');
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
                return;
            }
            
            fileList.classList.add('visible');
            fileCount.textContent = selectedFiles.length;
            fileCountStat.textContent = selectedFiles.length;
            
            let totalSize = 0;
            
            selectedFiles.forEach((file, index) => {
                totalSize += file.size;
                
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
                        <button class="action-btn" onclick="removeFile(${index})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                `;
                filesGrid.appendChild(fileItem);
            });
            
            fileSize.textContent = formatFileSize(totalSize);
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
            }
        }

        // Effacer tous les fichiers
        function clearAllFiles() {
            selectedFiles = [];
            csvFilesInput.value = '';
            updateFileList();
            mergeBtn.disabled = true;
            convertBtn.disabled = true;
            showStatus('Tous les fichiers ont été effacés', 'info');
        }

        // Formatage de la taille
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // Parsing CSV
        function parseCSV(text) {
            const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
            if (rows.length === 0) return [];
            
            // Gestion des guillemets et des virgules dans les cellules
            const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const data = rows.slice(1).map(row => {
                const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                let obj = {};
                headers.forEach((h, i) => {
                    let value = values[i] || '';
                    value = value.trim().replace(/^"|"$/g, '');
                    obj[h] = value;
                });
                return obj;
            });
            return data.filter(item => Object.values(item).some(v => v !== ''));
        }

        // Fusion des CSV
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
            let processedFiles = 0;

            for (let file of selectedFiles) {
                try {
                    const text = await readFileAsText(file);
                    const parsedData = parseCSV(text);
                    mergedData = mergedData.concat(parsedData);
                    processedFiles++;
                    
                    // Mise à jour de la barre de progression
                    const progress = (processedFiles / selectedFiles.length) * 100;
                    progressFill.style.width = `${progress}%`;
                    
                    showStatus(`Traitement de ${file.name}... (${processedFiles}/${selectedFiles.length})`, 'info');
                    
                    // Petite pause pour l'animation
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    showStatus(`Erreur lors de la lecture de ${file.name}: ${error.message}`, 'error');
                    mergeBtn.disabled = false;
                    progressBar.classList.remove('visible');
                    return;
                }
            }

            mergeBtn.disabled = false;
            convertBtn.disabled = false;
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                progressBar.classList.remove('visible');
            }, 500);
            
            recordCount.textContent = mergedData.length.toLocaleString();
            showStatus(`Fusion réussie ! ${mergedData.length} enregistrements traités.`, 'success');
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

        // Conversion en XML
        async function convertToXML() {
            if (mergedData.length === 0) {
                showStatus('Veuillez d\'abord fusionner les fichiers CSV', 'error');
                return;
            }

            convertBtn.disabled = true;
            showStatus('Conversion en cours...', 'info');

            try {
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
                xml += '<!-- Generated by CSV to XML Converter -->\n';
                xml += '<!-- ' + new Date().toISOString() + ' -->\n';
                xml += '<dataset>\n';
                
                mergedData.forEach((item, index) => {
                    xml += `  <record id="${index + 1}">\n`;
                    for (const key in item) {
                        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+/, '');
                        const value = escapeXML(item[key]);
                        xml += `    <${safeKey}>${value}</${safeKey}>\n`;
                    }
                    xml += '  </record>\n';
                });
                
                xml += '</dataset>';

                const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                downloadBtn.href = url;
                downloadBtn.download = `export_${new Date().toISOString().split('T')[0]}.xml`;
                downloadSection.classList.add('visible');
                
                showStatus('Conversion terminée avec succès !', 'success');
                
                // Défilement vers la section de téléchargement
                downloadSection.scrollIntoView({ behavior: 'smooth' });
                
                // Réactiver le bouton après un délai
                setTimeout(() => {
                    convertBtn.disabled = false;
                }, 1000);
                
            } catch (error) {
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
                info: '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
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