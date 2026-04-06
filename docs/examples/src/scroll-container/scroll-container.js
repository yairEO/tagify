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
