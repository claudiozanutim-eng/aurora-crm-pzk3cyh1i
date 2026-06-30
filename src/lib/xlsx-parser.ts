const XLSX_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([compressed]).stream().pipeThrough(ds)
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

async function unzip(data: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(data)
  const files = new Map<string, Uint8Array>()

  let eocdOffset = -1
  for (let i = data.byteLength - 22; i >= Math.max(0, data.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) throw new Error('ZIP inválido: EOCD não encontrado')

  const cdOffset = view.getUint32(eocdOffset + 16, true)
  const cdEntries = view.getUint16(eocdOffset + 10, true)

  let offset = cdOffset
  for (let i = 0; i < cdEntries; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const compMethod = view.getUint16(offset + 10, true)
    const compSize = view.getUint32(offset + 20, true)
    const uncompSize = view.getUint32(offset + 24, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)

    const filename = new TextDecoder().decode(new Uint8Array(data, offset + 46, nameLen))
    const localNameLen = view.getUint16(localOffset + 26, true)
    const localExtraLen = view.getUint16(localOffset + 28, true)
    const dataOffset = localOffset + 30 + localNameLen + localExtraLen

    if (compMethod === 0) {
      files.set(filename, new Uint8Array(data, dataOffset, uncompSize))
    } else if (compMethod === 8) {
      files.set(filename, await inflateRaw(new Uint8Array(data, dataOffset, compSize)))
    }

    offset += 46 + nameLen + extraLen + commentLen
  }

  return files
}

function parseSharedStrings(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const sis = doc.getElementsByTagNameNS('*', 'si')
  const strings: string[] = []
  for (let i = 0; i < sis.length; i++) {
    const ts = sis[i].getElementsByTagNameNS('*', 't')
    let text = ''
    for (let j = 0; j < ts.length; j++) text += ts[j].textContent || ''
    strings.push(text)
  }
  return strings
}

function colRefToIndex(ref: string): number {
  let col = 0
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i)
    if (c >= 65 && c <= 90) col = col * 26 + (c - 64)
  }
  return col - 1
}

function parseSheet(xml: string, sharedStrings: string[]): { headers: string[]; rows: string[][] } {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const rowElems = doc.getElementsByTagNameNS('*', 'row')
  const allRows: string[][] = []

  for (let i = 0; i < rowElems.length; i++) {
    const cellElems = rowElems[i].getElementsByTagNameNS('*', 'c')
    const rowData: string[] = []
    for (let j = 0; j < cellElems.length; j++) {
      const cell = cellElems[j]
      const ref = cell.getAttribute('r') || ''
      const colIdx = colRefToIndex(ref)
      const type = cell.getAttribute('t')
      const vElem = cell.getElementsByTagNameNS('*', 'v')[0]
      const isElem = cell.getElementsByTagNameNS('*', 'is')[0]

      let value = ''
      if (type === 's' && vElem) {
        value = sharedStrings[parseInt(vElem.textContent || '0', 10)] || ''
      } else if (type === 'inlineStr' && isElem) {
        const tElem = isElem.getElementsByTagNameNS('*', 't')[0]
        value = tElem?.textContent || ''
      } else if (vElem) {
        value = vElem.textContent || ''
      }

      while (rowData.length < colIdx) rowData.push('')
      if (colIdx >= 0) rowData[colIdx] = value
    }
    allRows.push(rowData)
  }

  if (allRows.length === 0) return { headers: [], rows: [] }

  const maxCols = Math.max(...allRows.map((r) => r.length))
  const normalized = allRows.map((r) => {
    while (r.length < maxCols) r.push('')
    return r
  })

  const headers = normalized[0].map((h) => h.trim())
  const rows = normalized.slice(1).filter((r) => r.some((c) => c.trim() !== ''))
  return { headers, rows }
}

export async function parseXLSX(
  arrayBuffer: ArrayBuffer,
): Promise<{ headers: string[]; rows: string[][] }> {
  const files = await unzip(arrayBuffer)

  const ssKey = Array.from(files.keys()).find((k) => k.includes('sharedStrings'))
  const sharedStrings = ssKey ? parseSharedStrings(new TextDecoder().decode(files.get(ssKey)!)) : []

  const sheetKey = Array.from(files.keys()).find((k) => /worksheets\/sheet\d*\.xml$/.test(k))
  if (!sheetKey) throw new Error('Nenhuma planilha encontrada no arquivo XLSX')

  return parseSheet(new TextDecoder().decode(files.get(sheetKey)!), sharedStrings)
}
