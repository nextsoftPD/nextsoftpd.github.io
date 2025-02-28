fetch('https://raw.githubusercontent.com/nextsoftPD/Documenti/main/assets/utils/directory_structure.xml')
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(data, 'application/xml');
                const directories = xml.getElementsByTagName('directory');

                Array.from(directories).forEach(directory => {
                    const sectionId = `directory-structure-${directory.getAttribute('name')}`;
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.innerHTML = generateDirectoryHTML(directory);
                    }
                });
            });

function generateDirectoryHTML(directory) {
    let html = '<ul class="list-disc pl-5 text-lg md:text-xl">';
    Array.from(directory.children).forEach(child => {
    if (child.tagName === 'file') {
        html += `<li class="file-item flex flex-col md:flex-row items-start md:items-center justify-between p-1">
        <a href="${child.getAttribute('path')}" target="_blank" class="mb-2 md:mb-0">${child.getAttribute('name')}</a>
        <a href="${child.getAttribute('path')}" class="download-btn flex items-center" target="_blank" download>
        <button class="bg-[#0088ff] text-white  rounded">
        Download PDF
        </button>
        </a>
        </li>`;
    } else if (child.tagName === 'directory') {
        html += `<li class="directory-item">
        <h3 class="font-bold pt-2">${child.getAttribute('name')}</h3>
        ${generateDirectoryHTML(child)}
        </li>`;
    }
    });
    html += '</ul>';
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.file-item').forEach(item => {
    const firstLink = item.querySelector('a:first-of-type');
    item.addEventListener('mouseover', () => {
        firstLink.style.textDecoration = 'underline';
    });
    item.addEventListener('mouseout', () => {
        firstLink.style.textDecoration = 'none';
    });
    });
});