// Sidebar toggle for small screens
const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.getElementById('toggle-btn');
const closeBtn = document.getElementById('close-toggle-btn');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Section switching
const sections = document.querySelectorAll('.mainContent > div');
const navItems = document.querySelectorAll('.nav-sidebar');

function hideAllSections() {
    sections.forEach(section => section.style.display = 'none');
}

navItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        hideAllSections();
        sections[index].style.display = 'block';

        // Highlight active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Close sidebar on mobile after clicking
        if (window.innerWidth < 993) {
            sidebar.classList.remove('active');
        }
    });
});

// Initialize: show first section
hideAllSections();
sections[0].style.display = 'block';
navItems[0].classList.add('active');

// Optional: handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 993) {
        sidebar.classList.remove('active');
    }
});
