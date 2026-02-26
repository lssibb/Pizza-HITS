import { Ingredient, PizzaSlice, SLICE_COUNTS, PizzaSize } from './models'

export function createPizzaCircle(
  container: HTMLElement,
  size: PizzaSize,
  allIngredients: Ingredient[],
  onUpdate: (slices: PizzaSlice[]) => void
): void {
  const sliceCount = SLICE_COUNTS[size]
  const slices: PizzaSlice[] = []
  for (let i = 0; i < sliceCount; i++) {
    slices.push(new PizzaSlice(i, []))
  }

  const selectedSlices = new Set<number>()

  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'pizza-circle-wrapper'

  // SVG круг
  const svgNS = 'http://www.w3.org/2000/svg'
  const svgSize = 300
  const cx = svgSize / 2
  const cy = svgSize / 2
  const radius = 130

  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', String(svgSize))
  svg.setAttribute('height', String(svgSize))
  svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`)

  // Рисуем секторы
  function drawCircle() {
    svg.innerHTML = ''

    // Фон круга
    const bgCircle = document.createElementNS(svgNS, 'circle')
    bgCircle.setAttribute('cx', String(cx))
    bgCircle.setAttribute('cy', String(cy))
    bgCircle.setAttribute('r', String(radius))
    bgCircle.setAttribute('fill', '#f5deb3')
    bgCircle.setAttribute('stroke', '#8b4513')
    bgCircle.setAttribute('stroke-width', '3')
    svg.appendChild(bgCircle)

    const angleStep = (2 * Math.PI) / sliceCount

    for (let i = 0; i < sliceCount; i++) {
      const startAngle = i * angleStep - Math.PI / 2
      const endAngle = (i + 1) * angleStep - Math.PI / 2

      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)

      const largeArc = angleStep > Math.PI ? 1 : 0

      // Сектор (кликабельная область)
      const path = document.createElementNS(svgNS, 'path')
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
      path.setAttribute('d', d)

      const hasIngredients = slices[i].ingredients.length > 0
      const isSelected = selectedSlices.has(i)

      let fillColor = 'transparent'
      if (isSelected) fillColor = 'rgba(255, 165, 0, 0.4)'
      else if (hasIngredients) fillColor = 'rgba(220, 50, 50, 0.25)'

      path.setAttribute('fill', fillColor)
      path.setAttribute('stroke', '#8b4513')
      path.setAttribute('stroke-width', '1')
      path.setAttribute('cursor', 'pointer')

      path.addEventListener('click', () => {
        if (selectedSlices.has(i)) {
          selectedSlices.delete(i)
        } else {
          selectedSlices.add(i)
        }
        drawCircle()
        updateInfo()
      })

      svg.appendChild(path)

      // Номер куска
      const midAngle = (startAngle + endAngle) / 2
      const labelR = radius * 0.6
      const lx = cx + labelR * Math.cos(midAngle)
      const ly = cy + labelR * Math.sin(midAngle)

      const text = document.createElementNS(svgNS, 'text')
      text.setAttribute('x', String(lx))
      text.setAttribute('y', String(ly))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.setAttribute('font-size', '12')
      text.setAttribute('fill', '#333')
      text.textContent = String(i + 1)
      svg.appendChild(text)
    }
  }

  wrapper.appendChild(svg)

  // Панель управления
  const controls = document.createElement('div')
  controls.className = 'pizza-circle-controls'

  // Кнопки выбора
  const btnSelectAll = document.createElement('button')
  btnSelectAll.textContent = 'Выбрать все'
  btnSelectAll.addEventListener('click', () => {
    for (let i = 0; i < sliceCount; i++) selectedSlices.add(i)
    drawCircle()
    updateInfo()
  })

  const btnDeselectAll = document.createElement('button')
  btnDeselectAll.textContent = 'Снять выделение'
  btnDeselectAll.addEventListener('click', () => {
    selectedSlices.clear()
    drawCircle()
    updateInfo()
  })

  controls.appendChild(btnSelectAll)
  controls.appendChild(btnDeselectAll)

  // Чекбоксы ингредиентов для назначения на выбранные куски
  const ingPanel = document.createElement('div')
  ingPanel.className = 'slice-ingredients'
  ingPanel.innerHTML = '<strong>Ингредиенты для выбранных кусков:</strong>'

  for (const ing of allIngredients) {
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${ing.id}" /> ${ing.name} (${ing.cost}₽) `
    ingPanel.appendChild(label)
  }

  const btnApply = document.createElement('button')
  btnApply.textContent = 'Назначить на выбранные куски'
  btnApply.addEventListener('click', () => {
    if (selectedSlices.size === 0) return alert('Выберите хотя бы один кусок')

    const checkedIds = Array.from(ingPanel.querySelectorAll('input:checked')).map(
      cb => (cb as HTMLInputElement).value
    )
    const selectedIngs = checkedIds.map(id => allIngredients.find(i => i.id === id)!).filter(Boolean)

    for (const idx of selectedSlices) {
      slices[idx].ingredients = selectedIngs
    }

    selectedSlices.clear()
    drawCircle()
    updateInfo()
    onUpdate(slices)
  })

  ingPanel.appendChild(btnApply)
  controls.appendChild(ingPanel)

  // Информация о кусках
  const infoDiv = document.createElement('div')
  infoDiv.className = 'slice-info'

  function updateInfo() {
    infoDiv.innerHTML = '<strong>Кусочки:</strong>'
    for (let i = 0; i < sliceCount; i++) {
      const ings = slices[i].ingredients
      const names = ings.length > 0 ? ings.map(ig => ig.name).join(', ') : 'пусто'
      const isSelected = selectedSlices.has(i) ? ' [выбран]' : ''
      const p = document.createElement('p')
      p.textContent = `Кусок ${i + 1}: ${names}${isSelected}`
      infoDiv.appendChild(p)
    }
  }

  controls.appendChild(infoDiv)
  wrapper.appendChild(controls)
  container.appendChild(wrapper)

  drawCircle()
  updateInfo()
}
