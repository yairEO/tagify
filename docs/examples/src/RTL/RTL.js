// The DOM element you wish to replace with Tagify
var input = document.querySelector('input[name=rtl-example]');

// initialize Tagify on the above input node reference
new Tagify(input, {
    whitelist: [
        { value: "מיכאל כהן", full: "<em>מיכאל כהן</em> - פיתוח תוכנה מתקדם ויישום טכנולוגיות חדשניות בתחום התעשייה והייצור" },
        { value: "שרה לוי", full: "<em>שרה לוי</em> - ניהול ופיתוח פתרונות אקולוגיים וסביבתיים למתן יתרון תחרותי לעסקים" },
        { value: "אברהם גולן", full: "<em>אברהם גולן</em> - יישום ופיתוח טכנולוגיות מתקדמות לשיפור פרודוקטיביות ויצירתיות בארגונים" },
        { value: "רחל רביבו", full: "<em>רחל רביבו</em> - מחקר ופיתוח טכנולוגי בתחום החדשנות והיזמות לקידום עסקים ותעשיות" },
        { value: "דוד כהן", full: "<em>דוד כהן</em> - פיתוח ויישום טכנולוגיות מתקדמות לשיפור תשתיות מידע עסקיות" },
        { value: "רבקה אריאל", full: "<em>רבקה אריאל</em> - ייזום ופיתוח מוצרים חדשניים עבור תעשיות יצירתיות ומתקדמות" }
    ],
    dropdown: {
        mapValueTo: 'full',
        classname: 'tagify__dropdown--rtl-example',
        enabled: 0, // shows the suggestiosn dropdown once field is focused
        RTL: true,
        escapeHTML: false // allows HTML inside each suggestion item
    }
})