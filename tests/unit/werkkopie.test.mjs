import { test } from 'node:test';
import assert from 'node:assert/strict';
import { laadVoorLeerkracht, bewaarWerkkopie } from '../../app/js/set.js';
import { versleutelFragment } from '../../app/js/codec.js';

const beginset = {
  naam: 'Beginset',
  datum: '2026-01-01',
  zinnen: [{ niveau: 'B', soort: 'og', tekst: 'Het regende, [dus] bleven we binnen.' }],
};

function nepStorage(initieel = {}) {
  const data = { ...initieel };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}

test('geen werkkopie -> laadt uit de link', async () => {
  const set = { naam: 'Groep 8', datum: '2026-02-01', zinnen: beginset.zinnen };
  const fragment = await versleutelFragment(set);
  const storage = nepStorage();
  const r = await laadVoorLeerkracht(`#z=${fragment}`, storage, beginset);
  assert.equal(r.set.naam, 'Groep 8');
  assert.equal(r.gewijzigd, false);
});

test('bron komt overeen -> gebruikt werkkopie + gewijzigd', async () => {
  const set = { naam: 'Groep 8', datum: '2026-02-01', zinnen: beginset.zinnen };
  const fragment = await versleutelFragment(set);
  const storage = nepStorage();
  bewaarWerkkopie(storage, fragment, { ...set, naam: 'Groep 8 (gewijzigd)' }, true);
  const r = await laadVoorLeerkracht(`#z=${fragment}`, storage, beginset);
  assert.equal(r.set.naam, 'Groep 8 (gewijzigd)');
  assert.equal(r.gewijzigd, true);
});

test('bron verschilt -> negeert de werkkopie en laadt uit de link', async () => {
  const set = { naam: 'Groep 8', datum: '2026-02-01', zinnen: beginset.zinnen };
  const fragment = await versleutelFragment(set);
  const storage = nepStorage();
  bewaarWerkkopie(storage, '1.helemaal-anders', { ...set, naam: 'Oude werkkopie' }, true);
  const r = await laadVoorLeerkracht(`#z=${fragment}`, storage, beginset);
  assert.equal(r.set.naam, 'Groep 8');
  assert.equal(r.gewijzigd, false);
});

test('lege hash -> beginset', async () => {
  const storage = nepStorage();
  const r = await laadVoorLeerkracht('', storage, beginset);
  assert.equal(r.set.naam, 'Beginset');
  assert.equal(r.gewijzigd, false);
  assert.equal(r.bron, '');
});
