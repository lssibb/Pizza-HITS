import './style.css'
import { IngredientService, PizzaBaseService, PizzaService } from './services'

const ingredientService = new IngredientService()
const pizzaBaseService = new PizzaBaseService()
const pizzaService = new PizzaService()

const tabs = document.getElementById('tabs')!
const app = document.getElementById('app')!


const pages = ['ingredients', 'bases', 'pizzas'] as const
const pageNames: Record<string, string> = {
  ingredients: 'Ингредиенты',
  bases: 'Основы',
  pizzas: 'Пиццы',
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
    case 'ingredients':
      renderIngredients()
      break
    case 'bases':
      renderBases()
      break
    case 'pizzas':
      renderPizzas()
      break
  }
}

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

  // Заполняем выпадающий список основ
  const baseSelect = document.getElementById('pizza-base') as HTMLSelectElement
  for (const base of pizzaBaseService.getAll()) {
    const opt = document.createElement('option')
    opt.value = base.id
    opt.textContent = `${base.name} (${base.cost}₽)`
    baseSelect.appendChild(opt)
  }

  // Чекбоксы ингредиентов
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

    // Собираем выбранные ингредиенты
    const checkedBoxes = ingContainer.querySelectorAll('input[type="checkbox"]:checked')
    const ingredients = Array.from(checkedBoxes).map(cb => {
      return ingredientService.getById((cb as HTMLInputElement).value)!
    }).filter(Boolean)

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

openPage('ingredients')
