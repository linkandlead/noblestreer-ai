import { test } from 'node:test'
import assert from 'node:assert/strict'
import { haalContent, CmsFout } from '../src/lib/cms/client.mjs'

test('stuurt het token als Bearer naar /api/cms/content', async () => {
  let gezien
  const fetchImpl = async (url, init) => {
    gezien = { url, auth: init.headers.authorization }
    return new Response(JSON.stringify({ ok: true, site: {}, paginas: [] }), { status: 200 })
  }
  await haalContent({ base: 'https://cms.test/', token: 'cms_abc', fetchImpl })
  assert.equal(gezien.url, 'https://cms.test/api/cms/content')
  assert.equal(gezien.auth, 'Bearer cms_abc')
})

test('weigert zonder geldig token', async () => {
  await assert.rejects(haalContent({ base: 'https://cms.test', token: '' }), CmsFout)
  await assert.rejects(haalContent({ base: 'https://cms.test', token: 'geheim' }), CmsFout)
})

test('401 en netwerkfout → CmsFout (build stopt, vorige deploy blijft live)', async () => {
  const f401 = async () => new Response('{"ok":false}', { status: 401 })
  await assert.rejects(haalContent({ base: 'https://cms.test', token: 'cms_x', fetchImpl: f401 }), (e) => e instanceof CmsFout && e.status === 401)
  const kapot = async () => {
    throw new TypeError('fetch failed')
  }
  await assert.rejects(haalContent({ base: 'https://cms.test', token: 'cms_x', fetchImpl: kapot }), /onbereikbaar/)
})
