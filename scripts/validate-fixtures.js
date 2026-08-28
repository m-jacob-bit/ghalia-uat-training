#!/usr/bin/env node
/*
 * Fixture-consistency check for Big Sister test identities.
 *
 * Verifies, for every Big Sister record in apps/cda-staff, apps/fc, apps/apm:
 *   - nationalId structurally encodes dob (century/year/month/day) and governorate
 *   - nationalId's gender digit (position 13) is even (female)
 *   - age at entryDate is 18-22 inclusive (Ghalia Big Sister eligibility policy)
 *   - the same-named person has an identical dob + nationalId across every app
 *     that includes her (shared narrative-continuity characters)
 *
 * Run: node scripts/validate-fixtures.js
 * Exits non-zero if any check fails.
 */
const fs = require('fs');
const path = require('path');

const GOV_CODES = { 'أسيوط': '25', 'المنيا': '24' };
const APPS = ['cda-staff', 'fc', 'apm'];

function extractBigSisters(fileContent) {
  const marker = 'bigSisters:';
  const start = fileContent.indexOf(marker);
  if (start === -1) throw new Error('bigSisters not found');
  const bracketStart = fileContent.indexOf('[', start);
  let depth = 0, i = bracketStart;
  for (; i < fileContent.length; i++) {
    if (fileContent[i] === '[') depth++;
    else if (fileContent[i] === ']') { depth--; if (depth === 0) break; }
  }
  const arrayText = fileContent.slice(bracketStart, i + 1);
  const fn = new Function('ASSOCIATION_NAME', 'return ' + arrayText + ';');
  return fn('جمعية النور للتنمية');
}

function ageAt(dob, onDate) {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [oy, om, od] = onDate.split('-').map(Number);
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age--;
  return age;
}

function checkRecord(rec, appName) {
  const errors = [];
  const id = rec.nationalId;
  if (!/^\d{14}$/.test(id)) {
    errors.push(`nationalId "${id}" is not 14 digits`);
    return errors;
  }
  const century = id[0];
  const yy = id.slice(1, 3);
  const mm = id.slice(3, 5);
  const dd = id.slice(5, 7);
  const gg = id.slice(7, 9);
  const genderDigit = Number(id[12]);
  const expectedDob = `${century === '3' ? '20' : '19'}${yy}-${mm}-${dd}`;
  if (expectedDob !== rec.dob) {
    errors.push(`nationalId encodes dob ${expectedDob} but record.dob is ${rec.dob}`);
  }
  const expectedGg = GOV_CODES[rec.governorate];
  if (!expectedGg) {
    errors.push(`unknown governorate "${rec.governorate}" (add it to GOV_CODES if legitimate)`);
  } else if (gg !== expectedGg) {
    errors.push(`nationalId governorate code ${gg} does not match ${rec.governorate} (expected ${expectedGg})`);
  }
  if (genderDigit % 2 !== 0) {
    errors.push(`nationalId gender digit (${genderDigit}) is odd — Big Sisters are female, expected even`);
  }
  const entryDate = rec.entryDate;
  if (entryDate) {
    const age = ageAt(rec.dob, entryDate);
    if (age < 18 || age > 22) {
      errors.push(`age at entry (${entryDate}) is ${age}, outside the 18-22 policy window`);
    }
  }
  return errors;
}

function main() {
  const root = path.join(__dirname, '..');
  const byApp = {};
  let failCount = 0;

  APPS.forEach(app => {
    const filePath = path.join(root, 'apps', app, 'index.html');
    const content = fs.readFileSync(filePath, 'utf8');
    const bigSisters = extractBigSisters(content);
    byApp[app] = bigSisters;
    bigSisters.forEach(rec => {
      const errors = checkRecord(rec, app);
      if (errors.length) {
        failCount += errors.length;
        console.log(`FAIL [${app}] ${rec.id} (${rec.name}):`);
        errors.forEach(e => console.log(`  - ${e}`));
      } else {
        console.log(`ok   [${app}] ${rec.id} (${rec.name}) — dob ${rec.dob}, id ${rec.nationalId}`);
      }
    });
  });

  // Cross-app identity consistency: the same record id (a specific person, e.g. "bs-heba")
  // must carry an identical dob + nationalId in every app that includes her. Two different
  // ids that happen to share a display name (e.g. "bs-heba" vs "bs-heba-decoy") are two
  // different fictional people on purpose and are NOT compared here.
  const byId = {};
  APPS.forEach(app => {
    byApp[app].forEach(rec => {
      byId[rec.id] = byId[rec.id] || [];
      byId[rec.id].push({ app, name: rec.name, dob: rec.dob, nationalId: rec.nationalId });
    });
  });
  Object.entries(byId).forEach(([id, entries]) => {
    if (entries.length < 2) return;
    const first = entries[0];
    entries.slice(1).forEach(e => {
      if (e.dob !== first.dob || e.nationalId !== first.nationalId || e.name !== first.name) {
        failCount++;
        console.log(`FAIL [identity] "${id}" differs between ${first.app} (${first.name}, ${first.dob}, ${first.nationalId}) and ${e.app} (${e.name}, ${e.dob}, ${e.nationalId})`);
      }
    });
  });

  // Same-name collision check: two DIFFERENT ids sharing the same display name are only
  // valid as an intentional decoy pair — flag it here as informational, not a failure,
  // so a real accidental duplicate is still visible in the output.
  const byName = {};
  APPS.forEach(app => {
    byApp[app].forEach(rec => { (byName[rec.name] = byName[rec.name] || new Set()).add(rec.id); });
  });
  Object.entries(byName).forEach(([name, ids]) => {
    if (ids.size > 1) console.log(`info [decoy pair] "${name}" is shared by distinct ids: ${[...ids].join(', ')}`);
  });

  console.log('\n' + (failCount ? `${failCount} problem(s) found.` : 'All Big Sister fixtures are consistent.'));
  process.exit(failCount ? 1 : 0);
}

main();
