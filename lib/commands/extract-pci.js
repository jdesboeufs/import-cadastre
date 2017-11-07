/* eslint unicorn/no-process-exit: off */
'use strict'

const Promise = require('bluebird')
const ProgressBar = require('ascii-progress')

const extractDepartement = require('../extract/departement')
const {Tree} = require('../dist/pci')

async function handler(basePath, {raw, layers}) {
  const edigeoTree = new Tree(basePath, 'dgfip-pci-vecteur', 'edigeo')
  const departementsFound = await edigeoTree.listDepartements()

  const overallBar = new ProgressBar({
    schema: `  overall conversion [:bar] :percent (:current/:total) :elapseds/:etas`,
    total: departementsFound.length
  })
  overallBar.tick(0)

  await Promise.each(departementsFound, codeDep => {
    return new Promise((resolve, reject) => {
      const extractor = extractDepartement(basePath, codeDep, raw, layers)
      let bar

      extractor
        .on('start', () => {
          bar = new ProgressBar({
            schema: `  converting ${codeDep} [:bar] :percent (:current/:total) :elapseds/:etas`,
            total: extractor.total
          })
          bar.tick(0)
        })
        .on('commune', () => bar.tick())
        .on('end', () => {
          overallBar.tick()
          bar.clear()
          resolve()
        })
        .on('error', reject)
    })
  })

  process.exit(0)
}

module.exports = handler