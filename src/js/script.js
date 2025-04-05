document.addEventListener('DOMContentLoaded', () => {
    const documentPaths = [
        { path: 'documents/RTB', name: 'RTB' },
        { path: 'documents/Candidatura', name: 'Candidatura' }
    ];

    loadDocumentTitles().then(docTitles => {
        window.documentTitles = docTitles;
        
        fetchDocumentStructure(documentPaths);
        
        setupSearch();
    }).catch(error => {
        console.error('Error loading document titles:', error);
        window.documentTitles = {};
        fetchDocumentStructure(documentPaths);
        setupSearch();
    });
});

async function loadDocumentTitles() {
    try {
        const response = await fetch('src/data/documents.json');
        if (!response.ok) {
            throw new Error(`Failed to load document titles: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading document titles:', error);
        return {};
    }
}

function getDocumentTitle(category, path, filename) {
    if (!window.documentTitles || !window.documentTitles[category]) {
        return null;
    }
    
    const pathParts = path.split('/').slice(2);
    
    let current = window.documentTitles[category];
    
    if (pathParts.length > 0) {
        for (const part of pathParts) {
            if (current && current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
    }
    
    return current[filename] || null;
}

async function fetchDocumentStructure(documentPaths) {
    try {
        const documentTreeContainer = document.getElementById('document-tree');
        const documentNavContainer = document.getElementById('document-nav');
        
        let treeHTML = '';
        let navHTML = '';
        
        for (const docPath of documentPaths) {
            navHTML += `<a href="#${docPath.name}" class="block px-3 py-2 rounded hover:bg-light text-gray-800 hover:text-primary transition-colors">
                <i class="fas fa-folder mr-2"></i>${docPath.name}
            </a>`;
            
            treeHTML += `
            <div id="${docPath.name}" class="mb-8">
                <h3 class="text-xl font-bold mb-4 text-primary">
                    <i class="fas fa-folder-open mr-2"></i>${docPath.name}
                </h3>
                <div class="pl-4 border-l-2 border-gray-200" id="docs-${docPath.name}">
                    ${await buildDocumentTree(docPath.path, docPath.name, 0)}
                </div>
            </div>`;
        }
        
        documentNavContainer.innerHTML = navHTML;
        documentTreeContainer.innerHTML = treeHTML;
        
        addFolderListeners();
        
    } catch (error) {
        console.error('Error loading document structure:', error);
        document.getElementById('document-tree').innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Error loading documents. Please try again later.</p>
            </div>
        `;
    }
}

async function buildDocumentTree(path, category, level) {
    let html = '<ul class="space-y-2">';
    
    const categoryData = window.documentTitles[category];
    if (!categoryData) {
        return html + '</ul>';
    }
    
    for (const filename in categoryData) {
        if (typeof categoryData[filename] !== 'string') continue;
        
        html += createFileItem(filename, `${path}/${filename}`, category, path);
    }
    
    for (const dirname in categoryData) {
        if (typeof categoryData[dirname] === 'string') continue;
        
        html += await createFolderItem(dirname, path, category);
    }
    
    html += '</ul>';
    return html;
}

async function createFolderItem(dirname, parentPath, category) {
    const folderPath = `${parentPath}/${dirname}`;
    
    let current = window.documentTitles[category];
    const pathParts = parentPath.split('/').slice(2);
    
    for (const part of pathParts) {
        if (current[part]) {
            current = current[part];
        } else {
            return '';
        }
    }
    
    const dirContents = current[dirname];
    if (!dirContents) {
        return '';
    }
    
    let folderHTML = `<li class="folder-item">
        <div class="folder-header flex items-center cursor-pointer">
            <i class="folder-icon fas fa-folder mr-2 text-yellow-500"></i>
            <span class="font-medium">${dirname}</span>
            <i class="fas fa-chevron-down ml-2 text-gray-500 text-sm transform transition-transform"></i>
        </div>
        <div class="folder-content hidden pl-6 mt-2">
            <ul class="space-y-2">`;
    
    let hasContent = false;
    for (const filename in dirContents) {
        if (typeof dirContents[filename] !== 'string') continue;
        
        const fileItem = createFileItem(filename, `${folderPath}/${filename}`, category, folderPath);
        if (fileItem) {
            folderHTML += fileItem;
            hasContent = true;
        }
    }
    
    for (const subdirname in dirContents) {
        if (typeof dirContents[subdirname] === 'string') continue;
        
        const subfolderHTML = await createFolderItem(subdirname, folderPath, category);
        if (subfolderHTML) {
            folderHTML += subfolderHTML;
            hasContent = true;
        }
    }
    
    if (!hasContent) {
        folderHTML += `<li class="text-gray-500 flex items-center p-2">
            <i class="fas fa-info-circle mr-2 text-blue-400"></i>
            <span>This folder is empty</span>
        </li>`;
    }
    
    folderHTML += `</ul>
        </div>
    </li>`;
    
    return folderHTML;
}

function createFileItem(name, path, category, parentPath) {
    const displayTitle = getDocumentTitle(category, parentPath, name);
    
    if (displayTitle === null) {
        return '';
    }
    
    const fileIcon = getFileIcon(name);
    const fileExtension = name.split('.').pop().toLowerCase();
    
    return `<li class="file-item flex items-center justify-between p-2 hover:bg-light rounded" data-filename="${name}">
        <a href="${path}" class="flex items-center text-gray-700 hover:text-primary" target="_blank">
            <i class="${fileIcon} mr-2"></i>
            <span>${displayTitle}</span>
        </a>
        <div class="flex space-x-2">
            <a href="${path}" class="text-xs bg-primary hover:bg-secondary text-white py-1 px-2 rounded transition-colors" 
                target="_blank" download>
                <i class="fas fa-download mr-1"></i>Download
            </a>
            <a href="${path}" class="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded transition-colors"
                target="_blank">
                <i class="fas fa-eye mr-1"></i>Preview
            </a>
        </div>
    </li>`;
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'pdf':
            return 'fas fa-file-pdf text-red-500';
        case 'doc':
        case 'docx':
            return 'fas fa-file-word text-blue-500';
        case 'xls':
        case 'xlsx':
            return 'fas fa-file-excel text-green-500';
        case 'ppt':
        case 'pptx':
            return 'fas fa-file-powerpoint text-orange-500';
        case 'zip':
        case 'rar':
            return 'fas fa-file-archive text-purple-500';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'fas fa-file-image text-teal-500';
        default:
            return 'fas fa-file text-gray-500';
    }
}

function addFolderListeners() {
    document.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.fa-chevron-down');
            const folderIcon = header.querySelector('.folder-icon');
            
            content.classList.toggle('hidden');
            
            icon.classList.toggle('rotate-180');
            
            if (folderIcon.classList.contains('fa-folder')) {
                folderIcon.classList.replace('fa-folder', 'fa-folder-open');
            } else {
                folderIcon.classList.replace('fa-folder-open', 'fa-folder');
            }
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-docs');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (searchTerm === '') {
            document.querySelectorAll('.file-item, .folder-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.file-item').forEach(item => {
            const displayTitle = item.querySelector('span').textContent.toLowerCase();
            const filename = item.getAttribute('data-filename').toLowerCase();
            
            if (displayTitle.includes(searchTerm) || filename.includes(searchTerm)) {
                item.style.display = '';
                
                let parent = item.parentElement;
                while (parent && !parent.classList.contains('document-tree')) {
                    if (parent.classList.contains('folder-content')) {
                        parent.classList.remove('hidden');
                        const header = parent.previousElementSibling;
                        if (header && header.classList.contains('folder-header')) {
                            const folderIcon = header.querySelector('.folder-icon');
                            if (folderIcon && folderIcon.classList.contains('fa-folder')) {
                                folderIcon.classList.replace('fa-folder', 'fa-folder-open');
                            }
                        }
                    }
                    parent = parent.parentElement;
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        document.querySelectorAll('.folder-item').forEach(folder => {
            const content = folder.querySelector('.folder-content');
            const visibleItems = content.querySelectorAll('li[style=""]').length;
            
            if (visibleItems === 0) {
                folder.style.display = 'none';
            } else {
                folder.style.display = '';
            }
        });
    });
}
