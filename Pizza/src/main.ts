import './style.css'
import { IngredientService, PizzaBaseService, PizzaService, CrustService, OrderService } from './services'
import { CostSplitter } from './repository'
import { CrustListMode, SavedPizzaItem, CustomPizzaItem, CombinedPizzaItem, SlicedPizzaItem, PizzaSlice, PizzaSize } from './models'
import type { OrderItem } from './models'
import { createPizzaCircle } from './pizza-circle'

const ingredientService = new IngredientService()
const pizzaBaseService = new PizzaBaseService()
const pizzaService = new PizzaService()
const crustService = new CrustService()
const orderService = new OrderService()

const tabs = document.getElementById('tabs')!
const app = document.getElementById('app')!

const pages = ['ingredients', 'bases', 'pizzas', 'crusts', 'new-order', 'orders'] as const
const pageNames: Record<string, string> = {
  ingredients: 'Ингредиенты',
  bases: 'Основы',
  pizzas: 'Пиццы',
  crusts: 'Бортики',
  'new-order': 'Новый заказ',
  orders: 'Заказы',
}

for (const page of pages) {
  const btn = document.createElement('button')
  btn.textContent = pageNames[page]
  btn.addEventListener('click', () => openPage(page))
  tabs.appendChild(btn)
}

function openPage(page: string) {
  tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'))
  tabs.querySelector(`button:nth-child(${pages.indexOf(page as any) + 1})`)?.classList.add('active')
  app.innerHTML = ''

  switch (page) {
    case 'ingredients': renderIngredients(); break
    case 'bases': renderBases(); break
    case 'pizzas': renderPizzas(); break
    case 'crusts': renderCrusts(); break
    case 'new-order': renderNewOrder(); break
    case 'orders': renderOrders(); break
  }
}

// ===== СТРАНИЦА ИНГРЕДИЕНТОВ =====
function renderIngredients() {
  app.innerHTML = `
    <h2>Ингредиенты</h2>
    <div class="add-form">
      <input id="ing-name" placeholder="Название" />
      <input id="ing-cost" type="number" placeholder="Стоимость" />
      <button id="ing-add">Добавить</button>
    </div>
    <input id="ing-search" placeholder="Поиск..." />
    <table id="ing-table">
      <thead><tr><th>Название</th><th>Стоимость</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `
  const nameInput = document.getElementById('ing-name') as HTMLInputElement
  const costInput = document.getElementById('ing-cost') as HTMLInputElement
  const searchInput = document.getElementById('ing-search') as HTMLInputElement

  document.getElementById('ing-add')!.addEventListener('click', () => {
    const name = nameInput.value.trim()
    const cost = Number(costInput.value)
    if (!name || cost < 0) return alert('Введите название и стоимость')
    ingredientService.add(name, cost)
    nameInput.value = ''
    costInput.value = ''
    updateTable()
  })
  searchInput.addEventListener('input', () => updateTable())

  function updateTable() {
    const query = searchInput.value
    const items = query ? ingredientService.search(query) : ingredientService.getAll()
    const tbody = document.querySelector('#ing-table tbody')!
    tbody.innerHTML = ''
    for (const ing of items) {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${ing.name}</td>
        <td>${ing.cost}</td>
        <td><button data-id="${ing.id}" class="delete-btn">Удалить</button></td>
      `
      tbody.appendChild(tr)
    }
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ingredientService.delete((btn as HTMLElement).dataset.id!)
        updateTable()
      })
    })
  }
  updateTable()
}

// ===== СТРАНИЦА ОСНОВ =====
function renderBases() {
  app.innerHTML = `
    <h2>Основы</h2>
    <div class="add-form">
      <input id="base-name" placeholder="Название" />
      <input id="base-cost" type="number" placeholder="Стоимость" />
      <select id="base-type">
        <option value="classic">Классическая</option>
        <option value="black">Чёрная</option>
        <option value="thick">Толстая</option>
      </select>
      <button id="base-add">Добавить</button>
    </div>
    <input id="base-search" placeholder="Поиск..." />
    <table id="base-table">
      <thead><tr><th>Название</th><th>Тип</th><th>Стоимость</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `
  const nameInput = document.getElementById('base-name') as HTMLInputElement
  const costInput = document.getElementById('base-cost') as HTMLInputElement
  const typeSelect = document.getElementById('base-type') as HTMLSelectElement
  const searchInput = document.getElementById('base-search') as HTMLInputElement

  document.getElementById('base-add')!.addEventListener('click', () => {
    const name = nameInput.value.trim()
    const cost = Number(costInput.value)
    const type = typeSelect.value as any
    if (!name || cost < 0) return alert('Введите название и стоимость')
    try {
      pizzaBaseService.add(type, name, cost)
      nameInput.value = ''
      costInput.value = ''
      updateTable()
    } catch (e: any) {
      alert(e.message)
    }
  })
  searchInput.addEventListener('input', () => updateTable())

  function updateTable() {
    const query = searchInput.value
    const items = query ? pizzaBaseService.search(query) : pizzaBaseService.getAll()
    const tbody = document.querySelector('#base-table tbody')!
    tbody.innerHTML = ''
    for (const base of items) {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${base.name}</td>
        <td>${base.type}</td>
        <td>${base.cost}</td>
        <td><button data-id="${base.id}" class="delete-btn">Удалить</button></td>
      `
      tbody.appendChild(tr)
    }
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pizzaBaseService.delete((btn as HTMLElement).dataset.id!)
        updateTable()
      })
    })
  }
  updateTable()
}

// ===== СТРАНИЦА ПИЦЦ =====
function renderPizzas() {
  app.innerHTML = `
    <h2>Пиццы</h2>
    <div class="add-form">
      <input id="pizza-name" placeholder="Название пиццы" />
      <select id="pizza-base"><option value="">-- Выберите основу --</option></select>
      <div id="pizza-ingredients"></div>
      <button id="pizza-add">Создать пиццу</button>
    </div>
    <input id="pizza-search" placeholder="Поиск..." />
    <table id="pizza-table">
      <thead><tr><th>Название</th><th>Основа</th><th>Ингредиенты</th><th>Стоимость</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `
  const baseSelect = document.getElementById('pizza-base') as HTMLSelectElement
  for (const base of pizzaBaseService.getAll()) {
    const opt = document.createElement('option')
    opt.value = base.id
    opt.textContent = `${base.name} (${base.cost}₽)`
    baseSelect.appendChild(opt)
  }
  const ingContainer = document.getElementById('pizza-ingredients')!
  for (const ing of ingredientService.getAll()) {
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${ing.id}" /> ${ing.name} (${ing.cost}₽) `
    ingContainer.appendChild(label)
  }
  const nameInput = document.getElementById('pizza-name') as HTMLInputElement
  const searchInput = document.getElementById('pizza-search') as HTMLInputElement

  document.getElementById('pizza-add')!.addEventListener('click', () => {
    const name = nameInput.value.trim()
    const baseId = baseSelect.value
    if (!name) return alert('Введите название пиццы')
    if (!baseId) return alert('Выберите основу')
    const base = pizzaBaseService.getById(baseId)
    if (!base) return alert('Основа не найдена')
    const checkedBoxes = ingContainer.querySelectorAll('input[type="checkbox"]:checked')
    const ingredients = Array.from(checkedBoxes).map(cb =>
      ingredientService.getById((cb as HTMLInputElement).value)!
    ).filter(Boolean)
    pizzaService.add(name, ingredients, base)
    nameInput.value = ''
    baseSelect.value = ''
    ingContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      (cb as HTMLInputElement).checked = false
    })
    updateTable()
  })
  searchInput.addEventListener('input', () => updateTable())

  function updateTable() {
    const query = searchInput.value
    const items = query ? pizzaService.search(query) : pizzaService.getAll()
    const tbody = document.querySelector('#pizza-table tbody')!
    tbody.innerHTML = ''
    for (const pizza of items) {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${pizza.name}</td>
        <td>${pizza.base.name}</td>
        <td>${pizza.ingredients.map(i => i.name).join(', ')}</td>
        <td>${pizza.calculateCost()}₽</td>
        <td><button data-id="${pizza.id}" class="delete-btn">Удалить</button></td>
      `
      tbody.appendChild(tr)
    }
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pizzaService.delete((btn as HTMLElement).dataset.id!)
        updateTable()
      })
    })
  }
  updateTable()
}

// ===== СТРАНИЦА БОРТИКОВ =====
function renderCrusts() {
  app.innerHTML = `
    <h2>Бортики</h2>
    <div class="add-form">
      <input id="crust-name" placeholder="Название бортика" />
      <div id="crust-ingredients"><strong>Ингредиенты:</strong></div>
      <select id="crust-mode">
        <option value="whitelist">Whitelist (только для выбранных пицц)</option>
        <option value="blacklist">Blacklist (для всех кроме выбранных)</option>
      </select>
      <div id="crust-pizzas"><strong>Пиццы:</strong></div>
      <button id="crust-add">Добавить бортик</button>
    </div>
    <table id="crust-table">
      <thead><tr><th>Название</th><th>Ингредиенты</th><th>Режим</th><th>Стоимость</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `

  // Чекбоксы ингредиентов для бортика
  const ingContainer = document.getElementById('crust-ingredients')!
  for (const ing of ingredientService.getAll()) {
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${ing.id}" /> ${ing.name} `
    ingContainer.appendChild(label)
  }

  // Чекбоксы пицц для whitelist/blacklist
  const pizzaContainer = document.getElementById('crust-pizzas')!
  for (const pizza of pizzaService.getAll()) {
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${pizza.id}" /> ${pizza.name} `
    pizzaContainer.appendChild(label)
  }

  const nameInput = document.getElementById('crust-name') as HTMLInputElement
  const modeSelect = document.getElementById('crust-mode') as HTMLSelectElement

  document.getElementById('crust-add')!.addEventListener('click', () => {
    const name = nameInput.value.trim()
    if (!name) return alert('Введите название')

    const ingredients = Array.from(ingContainer.querySelectorAll('input:checked')).map(cb =>
      ingredientService.getById((cb as HTMLInputElement).value)!
    ).filter(Boolean)

    const pizzaIds = Array.from(pizzaContainer.querySelectorAll('input:checked')).map(cb =>
      (cb as HTMLInputElement).value
    )

    crustService.add(name, ingredients, modeSelect.value as CrustListMode, pizzaIds)
    nameInput.value = ''
    ingContainer.querySelectorAll('input').forEach(cb => (cb as HTMLInputElement).checked = false)
    pizzaContainer.querySelectorAll('input').forEach(cb => (cb as HTMLInputElement).checked = false)
    updateTable()
  })

  function updateTable() {
    const items = crustService.getAll()
    const tbody = document.querySelector('#crust-table tbody')!
    tbody.innerHTML = ''
    for (const crust of items) {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${crust.name}</td>
        <td>${crust.ingredients.map(i => i.name).join(', ')}</td>
        <td>${crust.listMode}</td>
        <td>${crust.calculateCost()}₽</td>
        <td><button data-id="${crust.id}" class="delete-btn">Удалить</button></td>
      `
      tbody.appendChild(tr)
    }
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        crustService.delete((btn as HTMLElement).dataset.id!)
        updateTable()
      })
    })
  }
  updateTable()
}

// ===== СТРАНИЦА НОВОГО ЗАКАЗА =====
function renderNewOrder() {
  app.innerHTML = `
    <h2>Новый заказ</h2>
    <div id="order-items"></div>
    <div class="add-form">
      <h3>Добавить пиццу в заказ:</h3>
      <select id="order-type">
        <option value="saved">Готовая пицца</option>
        <option value="custom">Кастомная пицца</option>
        <option value="combined">Комбинированная (половинки)</option>
        <option value="sliced">Покусочная пицца</option>
      </select>

      <div id="order-saved" class="order-section">
        <select id="order-pizza"><option value="">-- Выберите пиццу --</option></select>
      </div>

      <div id="order-custom" class="order-section" style="display:none">
        <div id="order-custom-ings"><strong>Ингредиенты:</strong></div>
      </div>

      <div id="order-combined" class="order-section" style="display:none">
        <select id="order-halfA"><option value="">-- Половина A --</option></select>
        <select id="order-halfB"><option value="">-- Половина B --</option></select>
      </div>

      <div id="order-sliced" class="order-section" style="display:none">
        <div id="pizza-circle-container"></div>
      </div>

      <select id="order-size">
        <option value="small">Маленькая</option>
        <option value="medium">Средняя</option>
        <option value="large">Большая</option>
      </select>

      <select id="order-base"><option value="">-- Основа --</option></select>
      <select id="order-crust"><option value="">Без бортика</option></select>

      <button id="order-add-item">Добавить в заказ</button>
    </div>

    <hr />
    <input id="order-comment" placeholder="Комментарий к заказу" />
    <div>
      <label>Количество гостей: <input id="order-guests" type="number" min="1" value="1" style="width:60px" /></label>
    </div>
    <div>
      <label><input type="checkbox" id="order-deferred" /> Отложенный заказ</label>
      <input type="datetime-local" id="order-deferred-time" style="display:none" />
    </div>
    <button id="order-submit">Оформить заказ</button>
  `

  const orderItems: OrderItem[] = []
  const itemsContainer = document.getElementById('order-items')!

  // Заполняем селекты
  const pizzaSelect = document.getElementById('order-pizza') as HTMLSelectElement
  const halfASelect = document.getElementById('order-halfA') as HTMLSelectElement
  const halfBSelect = document.getElementById('order-halfB') as HTMLSelectElement
  const baseSelect = document.getElementById('order-base') as HTMLSelectElement
  const crustSelect = document.getElementById('order-crust') as HTMLSelectElement

  for (const pizza of pizzaService.getAll()) {
    for (const sel of [pizzaSelect, halfASelect, halfBSelect]) {
      const opt = document.createElement('option')
      opt.value = pizza.id
      opt.textContent = pizza.name
      sel.appendChild(opt)
    }
  }
  for (const base of pizzaBaseService.getAll()) {
    const opt = document.createElement('option')
    opt.value = base.id
    opt.textContent = `${base.name} (${base.cost}₽)`
    baseSelect.appendChild(opt)
  }
  for (const crust of crustService.getAll()) {
    const opt = document.createElement('option')
    opt.value = crust.id
    opt.textContent = `${crust.name} (${crust.calculateCost()}₽)`
    crustSelect.appendChild(opt)
  }

  // Ингредиенты для кастомной пиццы
  const customIngs = document.getElementById('order-custom-ings')!
  for (const ing of ingredientService.getAll()) {
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${ing.id}" /> ${ing.name} (${ing.cost}₽) `
    customIngs.appendChild(label)
  }

  // Покусочная пицца — хранилище кусков
  let currentSlices: PizzaSlice[] = []
  const sizeSelect = document.getElementById('order-size') as HTMLSelectElement

  function rebuildPizzaCircle() {
    const circleContainer = document.getElementById('pizza-circle-container')!
    const size = sizeSelect.value as PizzaSize
    createPizzaCircle(circleContainer, size, ingredientService.getAll(), (slices) => {
      currentSlices = slices
    })
  }

  // Переключение типа пиццы
  const typeSelect = document.getElementById('order-type') as HTMLSelectElement
  typeSelect.addEventListener('change', () => {
    document.getElementById('order-saved')!.style.display = typeSelect.value === 'saved' ? '' : 'none'
    document.getElementById('order-custom')!.style.display = typeSelect.value === 'custom' ? '' : 'none'
    document.getElementById('order-combined')!.style.display = typeSelect.value === 'combined' ? '' : 'none'
    document.getElementById('order-sliced')!.style.display = typeSelect.value === 'sliced' ? '' : 'none'
    if (typeSelect.value === 'sliced') rebuildPizzaCircle()
  })

  // При смене размера — перестроить круг если покусочная
  sizeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'sliced') rebuildPizzaCircle()
  })

  // Отложенный заказ
  const deferredCheck = document.getElementById('order-deferred') as HTMLInputElement
  const deferredTime = document.getElementById('order-deferred-time') as HTMLInputElement
  deferredCheck.addEventListener('change', () => {
    deferredTime.style.display = deferredCheck.checked ? '' : 'none'
  })

  // Добавить пиццу в заказ
  document.getElementById('order-add-item')!.addEventListener('click', () => {
    const size = (document.getElementById('order-size') as HTMLSelectElement).value as PizzaSize
    const baseId = baseSelect.value
    if (!baseId) return alert('Выберите основу')
    const base = pizzaBaseService.getById(baseId)!

    const crustId = crustSelect.value
    const crust = crustId ? crustService.getById(crustId) ?? undefined : undefined

    let item: OrderItem

    switch (typeSelect.value) {
      case 'saved': {
        const pizzaId = pizzaSelect.value
        if (!pizzaId) return alert('Выберите пиццу')
        const pizza = pizzaService.getById(pizzaId)!
        item = new SavedPizzaItem(pizza, size, base, crust)
        break
      }
      case 'custom': {
        const ings = Array.from(customIngs.querySelectorAll('input:checked')).map(cb =>
          ingredientService.getById((cb as HTMLInputElement).value)!
        ).filter(Boolean)
        if (ings.length === 0) return alert('Выберите ингредиенты')
        item = new CustomPizzaItem(ings, size, base, crust)
        break
      }
      case 'combined': {
        const aId = halfASelect.value
        const bId = halfBSelect.value
        if (!aId || !bId) return alert('Выберите обе половинки')
        item = new CombinedPizzaItem(pizzaService.getById(aId)!, pizzaService.getById(bId)!, size, base, crust)
        break
      }
      case 'sliced': {
        const hasAny = currentSlices.some(s => s.ingredients.length > 0)
        if (!hasAny) return alert('Назначьте ингредиенты хотя бы на один кусок')
        item = new SlicedPizzaItem([...currentSlices], size, base, crust)
        break
      }
      default: return
    }

    orderItems.push(item)
    updateItemsList()
  })

  function updateItemsList() {
    itemsContainer.innerHTML = '<h3>Пиццы в заказе:</h3>'
    if (orderItems.length === 0) {
      itemsContainer.innerHTML += '<p>Пусто</p>'
      return
    }
    let total = 0
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i]
      const cost = item.calculateCost()
      total += cost
      const div = document.createElement('div')
      div.innerHTML = `${i + 1}. ${item.describe()} (${item.size}) — ${cost}₽ <button data-idx="${i}" class="remove-item">✕</button>`
      itemsContainer.appendChild(div)
    }
    const totalDiv = document.createElement('div')
    totalDiv.innerHTML = `<strong>Итого: ${total}₽</strong>`
    itemsContainer.appendChild(totalDiv)

    itemsContainer.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        orderItems.splice(Number((btn as HTMLElement).dataset.idx), 1)
        updateItemsList()
      })
    })
  }
  updateItemsList()

  // Оформить заказ
  document.getElementById('order-submit')!.addEventListener('click', () => {
    if (orderItems.length === 0) return alert('Добавьте хотя бы одну пиццу')
    const comment = (document.getElementById('order-comment') as HTMLInputElement).value
    const guestCount = Number((document.getElementById('order-guests') as HTMLInputElement).value) || 1
    const deferred = deferredCheck.checked ? new Date(deferredTime.value) : undefined
    orderService.create([...orderItems], comment, guestCount, deferred)
    alert('Заказ оформлен!')
    openPage('orders')
  })
}

// ===== СТРАНИЦА ЗАКАЗОВ =====
function renderOrders() {
  app.innerHTML = `
    <h2>Заказы</h2>
    <input id="order-search" placeholder="Поиск..." />
    <div id="orders-list"></div>
  `
  const searchInput = document.getElementById('order-search') as HTMLInputElement
  searchInput.addEventListener('input', () => updateList())

  function updateList() {
    const query = searchInput.value
    const orders = query ? orderService.search(query) : orderService.getAll()
    const container = document.getElementById('orders-list')!
    container.innerHTML = ''

    if (orders.length === 0) {
      container.innerHTML = '<p>Нет заказов</p>'
      return
    }

    for (const order of orders) {
      const div = document.createElement('div')
      div.className = 'order-card'
      const itemsList = order.items.map(item => `${item.describe()} (${item.size}) — ${item.calculateCost()}₽`).join('<br/>')

      // Разделение стоимости по гостям
      let guestSplitHtml = ''
      if (order.guestCount > 1) {
        const splitter = new CostSplitter(order.items)
        const amounts = splitter.split(order.guestCount)
        const lines = amounts.map((amount, i) => `Гость ${i + 1}: ${amount}₽`).join('<br/>')
        guestSplitHtml = `<p><strong>Разделение на ${order.guestCount} гостей:</strong><br/>${lines}</p>`
      }

      div.innerHTML = `
        <h3>Заказ #${order.number}</h3>
        <p>${itemsList}</p>
        <p><strong>Итого: ${order.totalCost}₽</strong></p>
        ${guestSplitHtml}
        <p>Комментарий: ${order.comment || '—'}</p>
        <p>Время: ${order.orderTime.toLocaleString()}</p>
        ${order.deferredTime ? `<p>Отложен на: ${order.deferredTime.toLocaleString()}</p>` : ''}
        <button data-id="${order.id}" class="delete-btn">Удалить</button>
      `
      container.appendChild(div)
    }

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        orderService.delete((btn as HTMLElement).dataset.id!)
        updateList()
      })
    })
  }
  updateList()
}

openPage('ingredients')
