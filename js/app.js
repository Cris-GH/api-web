// Configuración
const apiBaseUrl = 'http://localhost:8000'; // Cambia esto por tu URL de API
let currentEditId = null;
let confirmModal = null;

// Elementos del DOM
const articuloForm = document.getElementById('articulo-form');
const articulosContainer = document.getElementById('articulos-container');
const loadingElement = document.getElementById('loading');
const cancelEditBtn = document.getElementById('cancel-edit');
const confirmDeleteBtn = document.getElementById('confirm-delete');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar modal de Bootstrap
    confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    
    // Cargar artículos al iniciar
    loadArticulos();
    
    // Event listeners
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Formulario
    articuloForm.addEventListener('submit', handleFormSubmit);
    
    // Botón cancelar edición
    cancelEditBtn.addEventListener('click', resetForm);
    
    // Botón confirmar eliminación
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Delegación de eventos para los botones dinámicos
    articulosContainer.addEventListener('click', handleContainerClick);
}

// Manejar clics en el contenedor de artículos
function handleContainerClick(e) {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    
    if (editBtn) {
        editArticulo(parseInt(editBtn.dataset.id));
    }
    
    if (deleteBtn) {
        showDeleteModal(parseInt(deleteBtn.dataset.id));
    }
}

// Cargar artículos desde la API
async function loadArticulos() {
    try {
        showLoading();
        
        const response = await fetch(`${apiBaseUrl}/articulos`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const articulos = await response.json();
        
        if (articulos.length === 0) {
            showEmptyMessage();
            return;
        }
        
        renderArticulos(articulos);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Mostrar estado de carga
function showLoading() {
    loadingElement.style.display = 'block';
    articulosContainer.innerHTML = '';
}

// Ocultar estado de carga
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Mostrar mensaje cuando no hay artículos
function showEmptyMessage() {
    articulosContainer.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
            <i class="fas fa-box-open fa-3x mb-3"></i>
            <h4>No hay artículos registrados</h4>
        </div>`;
}

// Mostrar mensaje de error
function showError(message) {
    articulosContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${message}
            </div>
        </div>`;
}

// Renderizar todos los artículos
function renderArticulos(articulos) {
    articulosContainer.innerHTML = '';
    
    articulos.forEach(articulo => {
        const articleElement = createArticuloElement(articulo);
        articulosContainer.appendChild(articleElement);
    });
}

// Crear elemento HTML para un artículo
function createArticuloElement(articulo) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${articulo.nombre || 'Sin nombre'}</h5>
                <h6 class="card-subtitle mb-2 text-muted">ID: ${articulo.idarticulo}</h6>
                <p class="card-text">${articulo.descripcion || 'Sin descripción'}</p>
                <ul class="list-group list-group-flush mb-3">
                    <li class="list-group-item"><strong>Categoría:</strong> ${articulo.idcategoria || 'No especificada'}</li>
                    <li class="list-group-item"><strong>Stock:</strong> ${articulo.stock || 0}</li>
                </ul>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${articulo.idarticulo}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${articulo.idarticulo}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const articuloData = {
        idcategoria: document.getElementById('idcategoria').value,
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        stock: document.getElementById('stock').value
    };
    
    try {
        if (currentEditId) {
            await updateArticulo(currentEditId, articuloData);
        } else {
            await createArticulo(articuloData);
        }
        
        resetForm();
        await loadArticulos();
        showToast('Artículo guardado correctamente', 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
    }
}

// Crear nuevo artículo
async function createArticulo(articuloData) {
    const response = await fetch(`${apiBaseUrl}/articulos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(articuloData)
    });
    
    if (!response.ok) {
        throw new Error('Error al crear el artículo');
    }
}

// Actualizar artículo existente
async function updateArticulo(id, articuloData) {
    const response = await fetch(`${apiBaseUrl}/articulos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(articuloData)
    });
    
    if (!response.ok) {
        throw new Error('Error al actualizar el artículo');
    }
}

// Editar artículo
async function editArticulo(id) {
    try {
        const response = await fetch(`${apiBaseUrl}/articulos/${id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el artículo');
        }
        
        const articulo = await response.json();
        
        // Llenar formulario
        document.getElementById('idarticulo').value = articulo.idarticulo;
        document.getElementById('idcategoria').value = articulo.idcategoria || '';
        document.getElementById('nombre').value = articulo.nombre || '';
        document.getElementById('descripcion').value = articulo.descripcion || '';
        document.getElementById('stock').value = articulo.stock || '';
        
        // Cambiar a modo edición
        document.getElementById('form-title').textContent = 'Editar Artículo';
        cancelEditBtn.style.display = 'inline-block';
        currentEditId = id;
        
        // Scroll al formulario
        articuloForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
    }
}

// Mostrar modal de confirmación para eliminar
function showDeleteModal(id) {
    currentEditId = id;
    confirmModal.show();
}

// Confirmar eliminación
async function confirmDelete() {
    try {
        const response = await fetch(`${apiBaseUrl}/articulos/${currentEditId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el artículo');
        }
        
        confirmModal.hide();
        await loadArticulos();
        showToast('Artículo eliminado correctamente', 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
    } finally {
        currentEditId = null;
    }
}

// Resetear formulario
function resetForm() {
    articuloForm.reset();
    document.getElementById('form-title').textContent = 'Agregar Nuevo Artículo';
    cancelEditBtn.style.display = 'none';
    currentEditId = null;
}

// Mostrar notificación toast
function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true" style="position: fixed; top: 20px; right: 20px; z-index: 1100;">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}