// Catalog snapshot taken from the live artpic.shop on 2026-11-12.
// Each size: [w, h, salePrice, listPrice, slug?]  (w >= h, as in the Wix SKU).
// The slug is the existing /product-page/<slug> path. Keep these paths unchanged
// on the new site so Google Ads final URLs and Merchant Center links keep working.
// premium canvas prices are an ESTIMATE (canvas × 1.3); replace with real prices.

const PERSPEX_HE = (w, h) => `הדפסת-תמונה-על-זכוכית-אקרילית-${w}-על-${h}`;

window.CATALOG = {
  promo: 'קנו 2 וקבלו 1 במתנה',
  freeShippingFrom: 300,
  phone: '052-664-0424',
  materials: [
    {
      id: 'canvas', name: 'קנבס', path: '/canvas', slugPrefix: 'canvas',
      title: (w, h) => `הדפסה על קנבס ${w} על ${h}`,
      note: 'בד מתוח על מסגרת עץ. חם, קלאסי, בלי השתקפות.',
      about: 'הדפסה פיגמנטית על בד קנבס ארוג, מתוח על מסגרת עץ ייעודית. בגרסה הרגילה שולי הקנבס לבנים; בעיטוף מלא ההדפסה ממשיכה לצדדים.',
      sizes: [
        [30,20,79.90,94],[40,30,94.35,111],[60,40,143.65,169],[70,50,196.35,231],[80,60,244.80,288],
        [90,60,260.10,306],[100,70,292.40,344],[120,80,398.65,469],[130,90,397.80,468],[150,100,622.20,732],
        [180,120,1101.60,1296],[200,130,1326,1560],[225,150,1721.25,2025],
        [60,30,107.10,126],[80,40,179.35,211],[100,50,250.75,295],[120,60,300.05,353],[140,70,406.30,478],
        [160,80,435.20,512],[180,90,826.20,972],[200,100,829.60,976],[240,120,1470.50,1730],[260,130,1723.80,2028],
        [30,30,90.10,106],[40,40,122.40,144],[50,50,159.80,188],[60,60,207.40,244],[70,70,244.80,288],
        [80,80,276.25,325],[100,100,414.80,488],
      ],
    },
    {
      id: 'pcanvas', name: 'קנבס פרימיום', path: '/premium-canvas', slugPrefix: 'pcanvas', estimate: true,
      title: (w, h) => `הדפסה על קנבס פרימיום ${w} על ${h}`,
      note: 'טקסטורה מובלטת שנראית כמו ציור שמן.',
      about: 'קנבס עם שכבת טקסטורה מובלטת שמדמה ציור שמן אמיתי. מומלץ לנוף, אבסטרקט ופופ ארט.',
      sizes: null, // derived from canvas below
    },
    {
      id: 'glass', name: 'זכוכית', path: '/glass', slugPrefix: 'glass',
      title: (w, h) => `הדפסת תמונה על זכוכית ${w} על ${h}`,
      note: 'זכוכית מחוסמת 6 מ״מ. צבעים עמוקים ומבריקים.',
      about: 'זכוכית אקסטרה קליר מחוסמת בעובי 6 מ״מ, מלוטשת מסביב. ההדפסה בגב הזכוכית עם שכבת לבן אטומה. ספייסרים לתלייה כלולים.',
      sizes: [
        [21,15,144.80,181],[30,20,154.40,193],[45,30,230.40,288],[50,35,260,325],[60,40,275.20,344],
        [70,50,330.40,413],[90,60,510.40,638],[100,70,664.80,831],[120,80,915.20,1144],[150,100,1450.40,1813],
        [30,15,154,192.50],[40,20,175,218.75],[60,30,248,310],[80,40,380,475],[100,50,490.40,613],
        [120,60,680,850],[130,50,450.40,563],[180,60,1020,1275],[240,80,1800,2250],
        [20,20,116.80,146],
      ],
    },
    {
      id: 'perspex', name: 'זכוכית אקרילית', path: '/acrylic-glass', slugPrefix: 'perspex',
      title: (w, h) => `הדפסת תמונה על זכוכית אקרילית ${w} על ${h}`,
      note: 'אקריליק דק וקל. מבריק ומודרני.',
      about: 'הדפסה על זכוכית אקרילית (פרספקס) דקה. קלה משמעותית מזכוכית, מבריקה, עם אפשרות לתלייה נסתרת.',
      sizes: [
        [21,15,65.60,82],[30,20,86.40,108],[45,30,208,260,PERSPEX_HE(45,30)],[60,40,248,310,PERSPEX_HE(60,40)],
        [70,50,296,370,PERSPEX_HE(70,50)],[90,60,459.20,574,PERSPEX_HE(90,60)],[100,70,596,745],[120,80,824,1030],
        [150,100,1304.80,1631],
        [80,40,340,425,PERSPEX_HE(80,40)],[100,50,440,550],[120,60,612,765],[130,50,408,510],[180,60,916,1145],
        [200,100,1752,2190],[240,80,1620,2025],
        [20,20,65.60,82],[30,30,188,235],[40,40,232,290,PERSPEX_HE(40,40)],[50,50,264,330,PERSPEX_HE(50,50)],
        [60,60,316,395,PERSPEX_HE(60,60)],[80,80,552,690,PERSPEX_HE(80,80)],[100,100,856,1070],[120,120,1232,1540],
      ],
    },
    {
      id: 'story', name: 'בלוק סטורי', path: '/storyblock', slugPrefix: 'story', standing: true,
      title: (w, h) => `בלוק סטורי ${w} על ${h}`,
      note: 'בלוק אקריליק עבה שעומד לבד על מדף או שידה.',
      about: 'בלוק אקריליק עבה ושקוף שעומד בעצמו, בלי תלייה. מתנה קטנה למדף, לשידה או לשולחן העבודה.',
      sizes: [[10,10,100,125],[15,10,124,155],[15,15,144,180],[18,13,156,195],[21,15,156,195],[25,20,176,220],[30,20,188,235]],
    },
  ],

  // Gallery-wall sets (/canvas-wall). Slot geometry from artpic-private
  // docs/gallery-wall-prototype.html; prices from the live (hidden) products.
  walls: [
    { id: 'trio', name: 'שלישייה', scene: 'sofa', pitch: 'שלוש תמונות באותו גודל בשורה. הכי קל לתלות.',
      variants: [
        { key: 'קטנה', slug: 'canvaswall-trio-s', price: [216.45, 333], slots: 'row:30x40x3' },
        { key: 'בינונית', slug: 'canvaswall-trio-m', price: [329.55, 507], slots: 'row:40x60x3' },
        { key: 'גדולה', slug: 'canvaswall-trio-l', price: [450.45, 693], slots: 'row:50x70x3' } ] },
    { id: 'anchor', name: 'מרכז', scene: 'sofa', pitch: 'תמונה אהובה גדולה במרכז, שתיים קטנות מכל צד.',
      variants: [
        { key: 'קטן', slug: 'canvaswall-anchor-s', price: [394.55, 607], slots: [ {w:20,h:30,x:0,y:2.5},{w:20,h:30,x:0,y:37.5},{w:50,h:70,x:25,y:0},{w:20,h:30,x:80,y:2.5},{w:20,h:30,x:80,y:37.5} ] },
        { key: 'גדול', slug: 'canvaswall-anchor-l', price: [487.50, 750], slots: [ {w:30,h:40,x:0,y:2.5},{w:30,h:40,x:0,y:47.5},{w:60,h:90,x:35,y:0},{w:30,h:40,x:100,y:2.5},{w:30,h:40,x:100,y:47.5} ] } ] },
    { id: 'grid', name: 'משבצות', scene: 'sofa', pitch: 'ריבועים זהים. מושלם לסדרה: טיול, חתונה, שנה ראשונה.',
      variants: [
        { key: '\u20662×2\u2069', slug: 'canvaswall-grid-2x2', price: [374.40, 576], slots: 'grid:40x2x2' },
        { key: '\u20663×2\u2069', slug: 'canvaswall-grid-3x2', price: [561.60, 864], slots: 'grid:40x3x2' },
        { key: '\u20663×3\u2069', slug: 'canvaswall-grid-3x3', price: [842.40, 1296], slots: 'grid:40x3x3' } ] },
    { id: 'pano', name: 'פנורמה', scene: 'sofa', pitch: 'רחב ונמוך, בדיוק ברוחב של ספה.',
      variants: [ { key: '', slug: 'canvaswall-pano', price: [525.20, 808], slots: [ {w:20,h:30,x:0,y:5},{w:60,h:40,x:25,y:0},{w:60,h:40,x:90,y:0},{w:20,h:30,x:155,y:5},{w:30,h:20,x:37.5,y:45},{w:30,h:20,x:72.5,y:45},{w:30,h:20,x:107.5,y:45} ] } ] },
    { id: 'wings', name: 'כנפיים', scene: 'sofa', pitch: 'סימטרי: תמונה ראשית ושתי כנפיים. קלאסי ומסודר.',
      variants: [ { key: '', slug: 'canvaswall-wings', price: [516.75, 795], slots: [ {w:20,h:30,x:0,y:20},{w:20,h:30,x:25,y:2.5},{w:20,h:30,x:25,y:37.5},{w:50,h:70,x:50,y:0},{w:20,h:30,x:105,y:2.5},{w:20,h:30,x:105,y:37.5},{w:20,h:30,x:130,y:20} ] } ] },
    { id: 'mosaic', name: 'מוזאיקה', scene: 'sofa', pitch: 'שש תמונות שממלאות מלבן מדויק. נראה כמו יצירה אחת.',
      variants: [ { key: '', slug: 'canvaswall-mosaic', price: [675.35, 1039], slots: [ {w:40,h:40,x:0,y:0},{w:40,h:60,x:0,y:45},{w:60,h:60,x:45,y:0},{w:60,h:40,x:45,y:65},{w:40,h:60,x:110,y:0},{w:40,h:40,x:110,y:65} ] } ] },
    { id: 'salon', name: 'חופשי', scene: 'sofa', pitch: 'מראה חופשי עם מרווחים קבועים וקווים מיושרים.',
      variants: [ { key: '', slug: 'canvaswall-salon', price: [587.60, 904], slots: [ {w:50,h:70,x:35,y:25},{w:30,h:20,x:45,y:0},{w:30,h:40,x:0,y:25},{w:20,h:30,x:10,y:70},{w:40,h:60,x:90,y:35},{w:40,h:30,x:90,y:0},{w:30,h:20,x:45,y:100} ] } ] },
    { id: 'stairs', name: 'מדרגות', scene: 'stairs', pitch: 'חמש תמונות שעולות יחד עם גרם המדרגות.',
      variants: [ { key: '', slug: 'canvaswall-stairs', price: [436.15, 671], slots: [ {w:30,h:40,x:0,y:80},{w:40,h:60,x:35,y:50},{w:30,h:40,x:80,y:40},{w:40,h:60,x:115,y:10},{w:30,h:40,x:160,y:0} ] } ] },
    { id: 'column', name: 'טור', scene: 'narrow', pitch: 'שלוש תמונות בטור לקיר צר: מסדרון או בין חלונות.',
      variants: [ { key: '', slug: 'canvaswall-column', price: [254.15, 391], slots: [ {w:30,h:40,x:5,y:0},{w:40,h:60,x:0,y:45},{w:30,h:40,x:5,y:110} ] } ] },
  ],
};

(() => {
  const C = window.CATALOG;
  const canvas = C.materials.find(m => m.id === 'canvas');
  const pc = C.materials.find(m => m.id === 'pcanvas');
  const r = n => Math.round(n * 1.3 * 20) / 20;
  pc.sizes = canvas.sizes.map(([w, h, s, l]) => [w, h, r(s), r(l)]);

  const GAP = 5;
  const expand = spec => {
    if (Array.isArray(spec)) return spec;
    const [kind, args] = spec.split(':');
    const n = args.split('x').map(Number);
    if (kind === 'row') { const [w, h, c] = n; return Array.from({ length: c }, (_, i) => ({ w, h, x: i * (w + GAP), y: 0 })); }
    const [s, cols, rows] = n; const out = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) out.push({ w: s, h: s, x: x * (s + GAP), y: y * (s + GAP) });
    return out;
  };
  C.walls.forEach(L => L.variants.forEach(v => { v.slots = expand(v.slots); }));

  C.materials.forEach(m => {
    m.sizes = m.sizes.map(([w, h, sale, list, slug]) => ({
      w, h, sale, list, key: `${w}-${h}`, mid: m.id,
      slug: slug || `${m.slugPrefix}-${w}-${h}`,
    }));
  });
})();
