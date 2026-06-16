import fs from 'fs';
import path from 'path';

const ROOT = '/Users/ruthlessravan/neet-pg';
const TR = '/Users/ruthlessravan/.claude/projects/-Users-ruthlessravan/9c2ee4a2-cf3c-4dd3-8782-db2d22c1f475/tool-results';

// Balanced-bracket extractor: returns the first top-level JSON array found in text,
// respecting string literals and escapes so trailing prose is ignored.
function extractFirstArray(text) {
  const start = text.indexOf('[');
  if (start < 0) throw new Error('no [ found');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
  }
  throw new Error('unbalanced array');
}

function loadToolResult(file) {
  const raw = fs.readFileSync(path.join(TR, file), 'utf8');
  const blocks = JSON.parse(raw);
  const text = blocks.map(b => b.text || '').join('\n');
  return JSON.parse(extractFirstArray(text));
}

function loadJson(p) { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }

// Canonical subject names
const SUBJECT_CANON = {
  'social and preventive medicine': 'Social and Preventive Medicine',
  'psm': 'Social and Preventive Medicine',
  'community medicine': 'Social and Preventive Medicine',
  'forensic medicine': 'Forensic Medicine',
  'obstetrics & gynaecology': 'Obstetrics & Gynaecology',
  'obstetrics and gynaecology': 'Obstetrics & Gynaecology',
  'obg': 'Obstetrics & Gynaecology',
  'ent': 'ENT', 'otorhinolaryngology': 'ENT',
  'dermatology / skin & std': 'Dermatology', 'dermatology': 'Dermatology', 'skin': 'Dermatology',
};
function canonSubject(s) {
  const k = String(s || '').trim().toLowerCase();
  return SUBJECT_CANON[k] || String(s).trim();
}

const VALID_SUBJECTS = new Set([
  'Anatomy','Physiology','Biochemistry','Pathology','Pharmacology','Microbiology',
  'Forensic Medicine','Social and Preventive Medicine','Medicine','Surgery',
  'Obstetrics & Gynaecology','Pediatrics','Orthopedics','ENT','Ophthalmology',
  'Anaesthesia','Radiology','Dermatology','Psychiatry'
]);

const sources = [
  // Original batches
  { name: 'pre-clinical', load: () => loadToolResult('toolu_01HAFLTYYdnDy7BQQvNp3Kqz.json') },
  { name: 'pathology', load: () => loadToolResult('toolu_01SoDMP2SY5TZQjnEGCseFHE.json') },
  { name: 'peds-ent-ophthal', load: () => loadToolResult('toolu_01RM2DUSGRhEGWMucQgxoP9z.json') },
  { name: 'pharma', load: () => loadJson('src/data/raw/pharma.json') },
  { name: 'micro', load: () => loadJson('src/data/raw/micro.json') },
  { name: 'obg', load: () => loadJson('src/data/raw/obg.json') },
  { name: 'psm-forensic', load: () => loadJson('src/data/raw/psm-forensic.json') },
  { name: 'medicine-derm-psych', load: () => loadJson('src/data/raw/medicine-derm-psych.json') },
  { name: 'surgery-ortho', load: () => loadJson('src/data/raw/surgery-ortho.json') },
  // Deep expansion batches (43 topic clusters)
  { name: 'pharma-doc', load: () => loadJson('src/data/raw/pharma-doc.json') },
  { name: 'pharma-antidotes', load: () => loadJson('src/data/raw/pharma-antidotes.json') },
  { name: 'pharma-antimicro', load: () => loadJson('src/data/raw/pharma-antimicro.json') },
  { name: 'pharma-cns', load: () => loadJson('src/data/raw/pharma-cns.json') },
  { name: 'pharma-cardio', load: () => loadJson('src/data/raw/pharma-cardio.json') },
  { name: 'pharma-interactions', load: () => loadJson('src/data/raw/pharma-interactions.json') },
  { name: 'micro-culture', load: () => loadJson('src/data/raw/micro-culture.json') },
  { name: 'micro-toxins', load: () => loadJson('src/data/raw/micro-toxins.json') },
  { name: 'micro-parasites', load: () => loadJson('src/data/raw/micro-parasites.json') },
  { name: 'micro-viral', load: () => loadJson('src/data/raw/micro-viral.json') },
  { name: 'micro-immunology', load: () => loadJson('src/data/raw/micro-immunology.json') },
  { name: 'path-tumors', load: () => loadJson('src/data/raw/path-tumors.json') },
  { name: 'path-heme-malignancy', load: () => loadJson('src/data/raw/path-heme-malignancy.json') },
  { name: 'path-inflammation', load: () => loadJson('src/data/raw/path-inflammation.json') },
  { name: 'path-genetics', load: () => loadJson('src/data/raw/path-genetics.json') },
  { name: 'path-amyloid', load: () => loadJson('src/data/raw/path-amyloid.json') },
  { name: 'obg-eclampsia', load: () => loadJson('src/data/raw/obg-eclampsia.json') },
  { name: 'obg-figo', load: () => loadJson('src/data/raw/obg-figo.json') },
  { name: 'obg-labour', load: () => loadJson('src/data/raw/obg-labour.json') },
  { name: 'obg-contraception', load: () => loadJson('src/data/raw/obg-contraception.json') },
  { name: 'med-cardio', load: () => loadJson('src/data/raw/med-cardio.json') },
  { name: 'med-rheum', load: () => loadJson('src/data/raw/med-rheum.json') },
  { name: 'med-endo', load: () => loadJson('src/data/raw/med-endo.json') },
  { name: 'med-neuro', load: () => loadJson('src/data/raw/med-neuro.json') },
  { name: 'med-nephro', load: () => loadJson('src/data/raw/med-nephro.json') },
  { name: 'psm-biostats', load: () => loadJson('src/data/raw/psm-biostats.json') },
  { name: 'psm-programs', load: () => loadJson('src/data/raw/psm-programs.json') },
  { name: 'psm-epidemio', load: () => loadJson('src/data/raw/psm-epidemio.json') },
  { name: 'psm-forensic-deep', load: () => loadJson('src/data/raw/psm-forensic.json') },
  { name: 'surg-trauma', load: () => loadJson('src/data/raw/surg-trauma.json') },
  { name: 'surg-endocrine', load: () => loadJson('src/data/raw/surg-endocrine.json') },
  { name: 'surg-gi', load: () => loadJson('src/data/raw/surg-gi.json') },
  { name: 'ortho-fractures', load: () => loadJson('src/data/raw/ortho-fractures.json') },
  { name: 'peds-milestones', load: () => loadJson('src/data/raw/peds-milestones.json') },
  { name: 'peds-neonatal', load: () => loadJson('src/data/raw/peds-neonatal.json') },
  { name: 'peds-chd', load: () => loadJson('src/data/raw/peds-chd.json') },
  { name: 'peds-nutrition', load: () => loadJson('src/data/raw/peds-nutrition.json') },
  { name: 'anatomy-nerves', load: () => loadJson('src/data/raw/anatomy-nerves.json') },
  { name: 'physio-cardiac-renal', load: () => loadJson('src/data/raw/physio-cardiac-renal.json') },
  { name: 'biochem-vitamins', load: () => loadJson('src/data/raw/biochem-vitamins.json') },
  { name: 'ent-ophthal', load: () => loadJson('src/data/raw/ent-ophthal.json') },
  { name: 'derm-psych', load: () => loadJson('src/data/raw/derm-psych.json') },
  { name: 'anaes-radio', load: () => loadJson('src/data/raw/anaes-radio.json') },
  // 90%-hit-rate gap-fill batches (10 agents × ~37 Qs)
  { name: 'psm-deep-fill', load: () => loadJson('src/data/raw/psm-deep-fill.json') },
  { name: 'forensic-deep-fill', load: () => loadJson('src/data/raw/forensic-deep-fill.json') },
  { name: 'surgery-deep-fill', load: () => loadJson('src/data/raw/surgery-deep-fill.json') },
  { name: 'anatomy-image-style', load: () => loadJson('src/data/raw/anatomy-image-style.json') },
  { name: 'ophthal-deep-fill', load: () => loadJson('src/data/raw/ophthal-deep-fill.json') },
  { name: 'ent-deep-fill', load: () => loadJson('src/data/raw/ent-deep-fill.json') },
  { name: 'radiology-image-style', load: () => loadJson('src/data/raw/radiology-image-style.json') },
  { name: 'path-image-style', load: () => loadJson('src/data/raw/path-image-style.json') },
  { name: 'medicine-gaps', load: () => loadJson('src/data/raw/medicine-gaps.json') },
  { name: 'neet-2025-style-mimic', load: () => loadJson('src/data/raw/neet-2025-style-mimic.json') },
  // Blind spot fill — BNS 2024, SPM fringe, Nobel physiology, rare tox/fungi
  { name: 'bns-forensic-v2', load: () => loadJson('src/data/raw/bns-forensic-v2.json') },
  { name: 'spm-fringe-v2', load: () => loadJson('src/data/raw/spm-fringe-v2.json') },
  { name: 'frontier-physio-v2', load: () => loadJson('src/data/raw/frontier-physio-v2.json') },
  { name: 'rare-tox-fungi-v2', load: () => loadJson('src/data/raw/rare-tox-fungi-v2.json') },
  { name: 'spm-fringe-direct', load: () => loadJson('src/data/raw/spm-fringe-direct.json') },
  { name: 'frontier-physio-direct', load: () => loadJson('src/data/raw/frontier-physio-direct.json') },
  { name: 'rare-tox-fungi-direct', load: () => loadJson('src/data/raw/rare-tox-fungi-direct.json') },
  // Mock Test 1 gap fill — 2 MISSes + 29 PARTIALs
  { name: 'mock1-miss-neubauer', load: () => loadJson('src/data/raw/mock1-miss-neubauer.json') },
  { name: 'mock1-miss-eog', load: () => loadJson('src/data/raw/mock1-miss-eog.json') },
  { name: 'mock1-partials-fill', load: () => loadJson('src/data/raw/mock1-partials-fill.json') },
];

const all = [];
const report = [];
let dropped = 0;
const seenStems = new Set();

for (const src of sources) {
  let arr;
  try { arr = src.load(); }
  catch (e) { report.push(`${src.name}: LOAD FAILED - ${e.message}`); continue; }
  let kept = 0;
  for (const q of arr) {
    const subject = canonSubject(q.subject);
    const opts = q.options;
    const ans = q.answer;
    const ok = q && typeof q.stem === 'string' && q.stem.length > 5
      && Array.isArray(opts) && opts.length === 4 && opts.every(o => typeof o === 'string' && o.length)
      && Number.isInteger(ans) && ans >= 0 && ans <= 3
      && typeof q.explanation === 'string' && q.explanation.length > 5
      && VALID_SUBJECTS.has(subject);
    if (!ok) { dropped++; continue; }
    const key = q.stem.trim().toLowerCase().slice(0, 80);
    if (seenStems.has(key)) { dropped++; continue; }
    seenStems.add(key);
    all.push({
      id: 'q' + String(all.length + 1).padStart(4, '0'),
      subject,
      topic: q.topic || subject,
      difficulty: ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      stem: q.stem.trim(),
      options: opts.map(o => o.trim()),
      answer: ans,
      explanation: q.explanation.trim(),
      highYield: (q.highYield || '').trim(),
      pyqNote: (q.pyqNote || '').trim(),
      tags: Array.isArray(q.tags) ? q.tags : [],
    });
    kept++;
  }
  report.push(`${src.name}: kept ${kept} / ${arr.length}`);
}

// Counts by subject
const bySubject = {};
for (const q of all) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;

// Notes / revision cards
let cards = [];
try {
  cards = loadJson('src/data/raw/cards.json').map((c, i) => ({
    id: 'c' + String(i + 1).padStart(3, '0'),
    subject: canonSubject(c.subject) === c.subject ? (c.subject) : (c.subject),
    title: c.title,
    kind: c.kind === 'table' ? 'table' : 'points',
    headers: Array.isArray(c.headers) ? c.headers : [],
    rows: Array.isArray(c.rows) ? c.rows : [],
    points: Array.isArray(c.points) ? c.points : [],
  }));
} catch (e) { report.push('cards: LOAD FAILED - ' + e.message); }

fs.writeFileSync(path.join(ROOT, 'src/data/questions.json'), JSON.stringify(all, null, 0));
fs.writeFileSync(path.join(ROOT, 'src/data/notes.json'), JSON.stringify(cards, null, 0));

console.log('=== BUILD REPORT ===');
report.forEach(r => console.log('  ' + r));
console.log('  dropped (invalid/dupe):', dropped);
console.log('=== TOTAL QUESTIONS:', all.length, '===');
console.log('=== REVISION CARDS:', cards.length, '===');
console.log('--- by subject ---');
Object.entries(bySubject).sort((a,b)=>b[1]-a[1]).forEach(([s,n]) => console.log(`  ${s}: ${n}`));
const diff = {};
all.forEach(q => diff[q.difficulty] = (diff[q.difficulty]||0)+1);
console.log('--- by difficulty ---', diff);
