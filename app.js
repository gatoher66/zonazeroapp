const URL_API = "https://script.google.com/macros/s/AKfycbyFrABEgidH67AkQ9SMOp5MFKARYqmlFgejMHqVO6a2GwppY_omfcOOn0Ne49X56szV/exec";
let MENU_COMPLETO = []; // Variable global para almacenar los datos originales

// --- INICIO DE LA APP ---
window.onload = () => {
    cargarDatos();
    configurarTema();
};


async function cargarDatos() {
    try {
        const res = await fetch(URL_API);
        const datos = await res.json();
        MENU_COMPLETO = datos.menu;
        renderizarEstadoBillar(datos.estadoMesa);
        renderizarMenu(MENU_COMPLETO);
        // Nueva función para las promos
        if(datos.promos) {
            renderizarPromos(datos.promos);
        }
    } catch (e) {
        console.error("Error cargando datos:", e);
        document.getElementById('contenedor-principal').innerHTML = 
            `<div class="loader" style="color:red">Error de conexión.</div>`;
    }
}

let promoInterval; // Variable para controlar el movimiento automático

function renderizarPromos(promos) {
    const container = document.getElementById('banner-promos');
    if (!promos || promos.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = promos.map((p, index) => `
        <div class="promo-card" onclick="centrarPromo(this)">
            <img src="${p.imagen}" class="promo-img" onerror="this.src='https://placehold.co/200x150?text=ZONAZERO'">
            <div class="promo-info">
                <span class="promo-tag">${p.etiqueta || 'HOY'}</span>
                <div class="promo-titulo">${p.titulo}</div>
                <div class="promo-precio" style="color: #0ff; font-weight: bold;">${p.subtitulo || ''}</div>
            </div>
        </div>
    `).join('');

    iniciarAutoplayPromos();
}

// Función para centrar el item al hacer clic
function centrarPromo(elemento) {
    elemento.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
    });
    
    // Reiniciamos el autoplay para que no salte inmediatamente después de que el usuario interactúe
    clearInterval(promoInterval);
    iniciarAutoplayPromos();
}

// Función de desplazamiento automático
function iniciarAutoplayPromos() {
    const container = document.getElementById('banner-promos');
    
    clearInterval(promoInterval); // Limpiar cualquier intervalo previo
    
    promoInterval = setInterval(() => {
        const scrollStep = container.clientWidth * 0.8; // Desplazar casi una tarjeta
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 5) {
            // Si llegamos al final, volvemos al inicio
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            // Si no, avanzamos
            container.scrollBy({ left: scrollStep, behavior: 'smooth' });
        }
    }, 4000); // Cambia cada 4 segundos
}


// --- RENDERIZAR ESTADO DEL BILLAR ---
function renderizarEstadoBillar(estado) {
    const txt = document.getElementById('texto-estado');
    const punto = document.getElementById('punto-estado');
    const isDisp = (estado == 1 || estado == "1");
    txt.textContent = isDisp ? 'Mesa de Billar Disponible' : 'Mesa de Billar Ocupada';
    punto.className = `estado-dot ${isDisp ? 'bg-disponible' : 'bg-ocupada'}`;
}


// --- RENDERIZAR MENÚ Y CATEGORÍAS ---
function renderizarMenu(productos) {
    const bar = document.getElementById('category-bar');
    const categoriasUnicas = [...new Set(productos.map(p => p.categoria))];
    const listaCategorias = ["Todos", ...categoriasUnicas];
    
    bar.innerHTML = "";

    listaCategorias.forEach((cat, index) => {
        const btn = document.createElement('div');
        btn.className = `cat-pill ${index === 0 ? 'active' : ''}`;
        btn.textContent = cat;
        
        btn.onclick = () => {
            // UI: Activar botón y scroll horizontal
            document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

            // Lógica de Filtrado
            if (cat === "Todos") {
                renderizarContenido(MENU_COMPLETO, true);
            } else {
                const filtrados = MENU_COMPLETO.filter(p => p.categoria === cat);
                renderizarContenido(filtrados, false); // false para no repetir el título
            }
        };
        bar.appendChild(btn);
    });

    // Renderizado por defecto al cargar (Todos)
    renderizarContenido(productos, true);
}

// --- NUEVA FUNCIÓN PARA RENDERIZAR EL CONTENIDO FILTRADO ---
function renderizarContenido(productosAMostrar, mostrarTitulos) {
    const main = document.getElementById('contenedor-principal');
    main.innerHTML = "";

    const categoriasParaDibujar = [...new Set(productosAMostrar.map(p => p.categoria))];

    categoriasParaDibujar.forEach(cat => {
        const section = document.createElement('section');
        section.id = `sec-${cat}`;
        
        if (mostrarTitulos) {
            section.innerHTML = `<h2 class="menu-section-title">${cat}</h2>`;
        }

        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        productosAMostrar.filter(p => p.categoria === cat).forEach(p => {
            const productoJSON = JSON.stringify(p).replace(/'/g, "\\'");
            grid.innerHTML += `
                <div class="producto-card" onclick='abrirModal(${productoJSON})'>
                    <div class="producto-img-wrapper">
                        <img src="${p.imagen}" class="producto-img" onerror="this.src='https://placehold.co/400x300/111/fff?text=${p.nombre}'">
                    </div>
                    <div class="producto-info">
                        <p class="producto-nombre">${p.nombre}</p>
                        <span class="mas-info-link">Más información →</span>
                        <p class="producto-precio">$${p.precio}</p>
                    </div>
                </div>`;
        });

        section.appendChild(grid);
        main.appendChild(section);
    });
}

// --- LÓGICA DEL TEMA (CLARO/OSCURO) ---
function configurarTema() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;

    btn.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', newTheme);
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// --- WIDGET Y RESERVAS ---
function toggleWidget() {
    const widget = document.getElementById('widget-billar');
    const icon = document.getElementById('widget-icon');
    widget.classList.toggle('collapsed');
    icon.textContent = widget.classList.contains('collapsed') ? '▲' : '▼';
}



// --- LOGICA DE RESERVA SIMPLIFICADA ---
function reservarPorWhatsApp() {
    // Mensaje directo sin fecha
    const mensaje = `¡Hola ZONAZERO! Me gustaría consultar la disponibilidad o reservar la mesa de billar.`;
    const url = `https://wa.me/529541336440?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

/*function reservarPorWhatsApp() {
    const input = document.getElementById('fecha-reserva');
    const fechaSeleccionada = new Date(input.value);
    
    if (!input.value) {
        alert("Por favor, selecciona una fecha y hora.");
        return;
    }

    const ahora = new Date();
    if (fechaSeleccionada < ahora) {
        alert("No puedes reservar en una fecha o hora que ya pasó.");
        return;
    }

    const hora = fechaSeleccionada.getHours();
    if (hora < 7 || hora >= 20) {
        alert("Nuestro horario de atención es de 7:00 AM a 8:00 PM.");
        return;
    }

    const opciones = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const fechaTexto = fechaSeleccionada.toLocaleString('es-MX', opciones);
    const mensaje = `¡Hola! Me gustaría reservar la mesa de billar para el día ${fechaTexto}.`;
    window.open(`https://wa.me/529541336440?text=${encodeURIComponent(mensaje)}`, '_blank');
}*/

// --- MODAL ---
function abrirModal(p) {
    const modal = document.getElementById('modal-detalle');
    const body = document.getElementById('modal-body');
    const mensajeWA = encodeURIComponent(`¡Hola ZONAZERO! Me interesa este producto: *${p.nombre}*`);

    body.innerHTML = `
        <img src="${p.imagen}" class="modal-img" onerror="this.src='https://placehold.co/400x300/111/fff?text=${p.nombre}'">
        <div class="modal-info">
            <h2 class="modal-nombre">${p.nombre}</h2>
            <p class="modal-descripcion">${p.descripcion || 'Sin descripción disponible.'}</p>
            <p class="producto-precio" style="font-size: 1.5rem; margin-bottom: 20px;">$${p.precio}</p>
            <button class="btn-whatsapp-pedido" onclick="window.open('https://wa.me/529541336440?text=${mensajeWA}', '_blank')">
                PEDIR POR WHATSAPP
            </button>
        </div>
    `;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = "none";
    document.body.style.overflow = "auto";
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-detalle');
    if (event.target == modal) cerrarModal();
}

// --- BOTÓN VOLVER ARRIBA ---
window.onscroll = function() { controlarBotonTop(); };

function controlarBotonTop() {
    const btn = document.getElementById("btn-scroll-top");
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.classList.add("show");
    } else {
        btn.classList.remove("show");
    }
}

function irArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}