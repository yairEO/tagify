// Scroll only — no navigation buttons
new Tagify(document.querySelector('input.sc-basic'), {
    scrollContainer: {
        enabled: true,
        buttons: false,
    }
})

// Scroll + ← → navigation buttons
new Tagify(document.querySelector('input.sc-buttons'), {
    scrollContainer: {
        enabled: true,
        buttons: true,
    }
})

// Scroll + navigation buttons + fixed icon before the tags area
new Tagify(document.querySelector('input.sc-icon'), {
    scrollContainer: {
        enabled: true,
        buttons: true,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    }
})

// Scroll + custom SVG arrow buttons + fixed icon
new Tagify(document.querySelector('input.sc-custom-btns'), {
    scrollContainer: {
        enabled: true,
        buttons: {
            back:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
            forward: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    }
})
