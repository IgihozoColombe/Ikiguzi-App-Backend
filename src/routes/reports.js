const express = require('express')
const { z } = require('zod')
const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')

const { requireAuth } = require('../middleware/auth')
const Crop = require('../models/Crop')
const CostEntry = require('../models/CostEntry')
const { predictPrice } = require('../services/predictionService')

const reportsRouter = express.Router()
reportsRouter.use(requireAuth)

function fmtRwf(n) {
  return `RWF ${Number(n || 0).toLocaleString('en-US')}`
}

reportsRouter.get('/export', async (req, res, next) => {
  try {
    const schema = z.object({
      format: z.enum(['pdf', 'excel']).default('pdf'),
      windowDays: z.coerce.number().int().min(7).max(60).optional(),
    })
    const q = schema.parse(req.query)

    const format = q.format
    const windowDays = q.windowDays ?? 14

    const crops = await Crop.find({ userId: req.user.id }).lean()
    const costs = await CostEntry.find({ userId: req.user.id }).lean()

    const totalCostsRwf = costs.reduce((sum, c) => sum + (c.amountRwf || 0), 0)

    const costsByCrop = new Map()
    for (const c of costs) {
      const k = String(c.cropId)
      if (!costsByCrop.has(k)) costsByCrop.set(k, {})
      const byCat = costsByCrop.get(k)
      byCat[c.category] = (byCat[c.category] || 0) + (c.amountRwf || 0)
      byCat.total = (byCat.total || 0) + (c.amountRwf || 0)
    }

    const cropSummaries = crops.map((crop) => {
      const { predictedPriceRwfPerKg, confidence } = predictPrice({
        cropName: crop.name,
        cropId: String(crop._id),
        windowDays,
      })
      const expectedYieldKg = crop.expectedYieldKg || 0
      const revenueRwf = predictedPriceRwfPerKg * expectedYieldKg
      const costTotal = costsByCrop.get(String(crop._id))?.total || 0
      const profitRwf = revenueRwf - costTotal

      return {
        cropId: String(crop._id),
        cropName: crop.name,
        predictedPriceRwfPerKg,
        confidence,
        expectedYieldKg,
        revenueRwf,
        costTotalRwf: costTotal,
        profitRwf,
        costBreakdown: costsByCrop.get(String(crop._id)) || {},
      }
    })

    const totalRevenueRwf = cropSummaries.reduce((s, x) => s + x.revenueRwf, 0)
    const expectedProfitRwf = totalRevenueRwf - totalCostsRwf

    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const buffers = []
      doc.on('data', (chunk) => buffers.push(chunk))

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ikiguzi-report-${Date.now()}.pdf"`,
      )

      doc.fontSize(18).text('Ikiguzi • Farmer Report', { align: 'left' })
      doc.moveDown(0.5)
      doc.fontSize(11).text(`Generated: ${new Date().toISOString()}`)
      doc.text(`Price window: next ${windowDays} days`)
      doc.moveDown()

      doc.fontSize(13).text('Summary', { underline: true })
      doc.moveDown(0.2)
      doc.fontSize(11).text(`Total costs: ${fmtRwf(totalCostsRwf)}`)
      doc.text(`Expected revenue: ${fmtRwf(totalRevenueRwf)}`)
      doc.text(`Expected profit: ${fmtRwf(expectedProfitRwf)}`)
      doc.moveDown()

      doc.fontSize(13).text('Crops', { underline: true })
      doc.moveDown(0.2)
      for (const s of cropSummaries) {
        doc.fontSize(12).text(`${s.cropName}`, { continued: false })
        doc.fontSize(11).text(
          `Predicted: ${fmtRwf(s.predictedPriceRwfPerKg)}/kg (confidence ${Math.round(
            s.confidence * 100,
          )}%)`,
        )
        doc.text(`Expected yield: ${s.expectedYieldKg} kg`)
        doc.text(`Revenue: ${fmtRwf(s.revenueRwf)}`)
        doc.text(`Costs: ${fmtRwf(s.costTotalRwf)}`)
        doc.text(`Profit: ${fmtRwf(s.profitRwf)}`)
        doc.moveDown(0.7)
      }

      // Wait until PDFKit flushes everything into buffers.
      const endPromise = new Promise((resolve) => {
        doc.on('end', resolve)
      })
      doc.end()
      await endPromise

      const buf = Buffer.concat(buffers)
      res.status(200).send(buf)
      return
    }

    // Excel
    const workbook = new ExcelJS.Workbook()
    const wsSummary = workbook.addWorksheet('Summary')
    wsSummary.columns = [
      { header: 'Crop', key: 'cropName', width: 20 },
      { header: 'Predicted Price (RWF/kg)', key: 'predictedPrice', width: 26 },
      { header: 'Confidence %', key: 'confidencePct', width: 14 },
      { header: 'Expected Yield (kg)', key: 'yieldKg', width: 18 },
      { header: 'Revenue (RWF)', key: 'revenue', width: 18 },
      { header: 'Costs (RWF)', key: 'costs', width: 16 },
      { header: 'Profit (RWF)', key: 'profit', width: 16 },
    ]

    wsSummary.addRow({
      cropName: 'TOTAL',
      predictedPrice: '',
      confidencePct: '',
      yieldKg: '',
      revenue: totalRevenueRwf,
      costs: totalCostsRwf,
      profit: expectedProfitRwf,
    })

    for (const s of cropSummaries) {
      wsSummary.addRow({
        cropName: s.cropName,
        predictedPrice: s.predictedPriceRwfPerKg,
        confidencePct: Math.round(s.confidence * 100),
        yieldKg: s.expectedYieldKg,
        revenue: s.revenueRwf,
        costs: s.costTotalRwf,
        profit: s.profitRwf,
      })
    }

    const wsCosts = workbook.addWorksheet('Cost breakdown')
    wsCosts.columns = [
      { header: 'Crop', key: 'cropName', width: 18 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Amount (RWF)', key: 'amount', width: 18 },
    ]

    const categories = ['seeds', 'fertilizer', 'labor', 'pesticide', 'irrigation', 'transport', 'other']
    for (const s of cropSummaries) {
      for (const cat of categories) {
        const amount = s.costBreakdown?.[cat] || 0
        if (amount === 0) continue
        wsCosts.addRow({
          cropName: s.cropName,
          category: cat,
          amount,
        })
      }
    }

    const fileBuffer = await workbook.xlsx.writeBuffer()
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ikiguzi-report-${Date.now()}.xlsx"`,
    )
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.status(200).send(fileBuffer)
  } catch (err) {
    next(err)
  }
})

module.exports = { reportsRouter }

