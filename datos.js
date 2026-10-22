/* =========================================
   NAUTIGO — DATOS Y LÓGICA DE NEGOCIO
   ========================================= */

/* 1. TEMPORADAS */
var temporadas = [
    {
        id: "alta", nombre: "Temporada alta", multiplicador: 1.30,
        fechas: [
            { inicio: "2026-03-28", fin: "2026-04-05" },
            { inicio: "2026-06-15", fin: "2026-08-31" },
            { inicio: "2026-12-15", fin: "2027-01-05" }
        ]
    },
    {
        id: "baja", nombre: "Temporada baja", multiplicador: 0.85,
        fechas: [
            { inicio: "2026-05-01", fin: "2026-05-31" },
            { inicio: "2026-09-01", fin: "2026-10-31" }
        ]
    },
    {
        id: "media", nombre: "Temporada media", multiplicador: 1.00, fechas: []
    }
];

function obtenerTemporada(fecha) {
    var f = new Date(fecha + "T00:00:00");
    for (var i = 0; i < temporadas.length; i++) {
        var t = temporadas[i];
        for (var j = 0; j < t.fechas.length; j++) {
            var r = t.fechas[j];
            var ini = new Date(r.inicio + "T00:00:00");
            var fin = new Date(r.fin + "T23:59:59");
            if (f >= ini && f <= fin) return t;
        }
    }
    return temporadas.find(function (t) { return t.id === "media"; });
}

/* 2. CATEGORÍAS DE DESTINO */
/* Etiqueta visible de cada categoría. El orden de las claves es el orden
   de los chips del filtro. */
var CATEGORIAS = {
    playa:       'Playa',
    rio:         'Río',
    hotel:       'Hotel',
    restaurante: 'Restaurante',
    piscina:     'Piscina',
    pozas:       'Pozas',
    bungalows:   'Bungalows',
    termales:    'Aguas termales',
    kayak:       'Kayak',
    tirolesa:    'Tirolesa',
    caballo:     'Paseos a caballo',
    toboganes:   'Toboganes',
    lancha:      'Paseos en lancha',
    snacks:      'Snacks y bebidas'
};

/* 3. DESTINOS
   `categorias` manda en el filtro; `tipo` es solo la etiqueta del detalle.
   Todos tienen un tour en la lista de abajo y se cobran por persona. */
var destinos = [
    {
        id: "playa-blanca", nombre: "Playa Blanca", tipo: "playa",
        categorias: ["playa", "snacks"],
        descripcionCorta: "Arena blanca y aguas tranquilas en Livingston.",
        descripcionLarga: "Playa Blanca es una de las playas más famosas de Livingston, con arena blanca y aguas cristalinas del Caribe. Ideal para nadar, tomar el sol y desconectarse. Se llega en lancha desde el muelle de Livingston (15 min).",
        ubicacion: "Livingston, Izabal", imagen: "img/playa.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas", "Guía local"],
        noIncluye: ["Comida", "Bebidas", "Protector solar"]
    },
    {
        id: "punta-cocoli", nombre: "Punta de Cocolí", tipo: "playa",
        categorias: ["playa"],
        descripcionCorta: "Playa serena de la costa de Livingston.",
        descripcionLarga: "Punta de Cocolí es una playa de la costa de Livingston, de acceso en lancha y ambiente tranquilo. Buena opción para un día de sol y mar sin multitudes.",
        ubicacion: "Livingston, Izabal", imagen: "img/punta-cocoli.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "siete-altares", nombre: "Siete Altares", tipo: "rio",
        categorias: ["rio", "pozas"],
        descripcionCorta: "Cascadas escalonadas de agua dulce.",
        descripcionLarga: "Siete Altares es un conjunto de cascadas y pozas naturales de agua dulce, rodeadas de selva. Se llega caminando desde Playa Blanca o en lancha por el río. Perfecto para refrescarse y tomar fotos.",
        ubicacion: "Livingston, Izabal", imagen: "img/siete-altares.jpg",
        incluye: ["Lancha", "Guía local", "Entrada al parque"],
        noIncluye: ["Comida", "Calzado adecuado (traer)"]
    },
    {
        id: "bahia-azul", nombre: "Bahía Azul", tipo: "playa",
        categorias: ["playa", "restaurante"],
        descripcionCorta: "Playa con restaurante frente al mar.",
        descripcionLarga: "Bahía Azul reúne playa y restaurante en el mismo lugar: se llega en lancha desde Livingston, se come ahí mismo y se regresa tranquilo.",
        ubicacion: "Livingston, Izabal", imagen: "img/bahia-azul.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el restaurante", "Guía (opcional)"]
    },
    {
        id: "salvador-gaviota", nombre: "Salvador Gaviota", tipo: "playa",
        categorias: ["playa", "restaurante", "hotel"],
        descripcionCorta: "Playa, restaurante y hospedaje en un solo lugar.",
        descripcionLarga: "Salvador Gaviota es un destino de playa con restaurante y habitaciones, pensado para quedarse más de un día. Se llega en lancha desde Livingston.",
        ubicacion: "Livingston, Izabal", imagen: "img/salvador-gaviota.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "playa-quehueche", nombre: "Playa Quehueche", tipo: "playa",
        categorias: ["playa", "restaurante", "hotel"],
        descripcionCorta: "Playa con hotel y restaurante a pie de mar.",
        descripcionLarga: "Playa Quehueche combina la playa con servicio de restaurante y hospedaje, así que funciona tanto para un día de visita como para quedarse a dormir.",
        ubicacion: "Livingston, Izabal", imagen: "img/playa-quehueche.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "vuelbe-mujer", nombre: "Vuelbe Mujer", tipo: "rio",
        categorias: ["rio", "pozas"],
        descripcionCorta: "Río de pozas naturales y sombra.",
        descripcionLarga: "Vuelbe Mujer es un tramo de río con pozas de agua dulce rodeadas de vegetación. Parada frecuente en lancha para refrescarse a mitad del recorrido.",
        ubicacion: "Livingston, Izabal", imagen: "img/vuelbe-mujer.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "flamingo", nombre: "Flamingo", tipo: "restaurante",
        categorias: ["restaurante", "piscina"],
        descripcionCorta: "Restaurante y piscina para el día de salida.",
        descripcionLarga: "Flamingo es un punto de restaurante con piscina, pensado para la visita de un día: se llega en lancha, se come y se disfruta del agua.",
        ubicacion: "Livingston, Izabal", imagen: "img/flamingo.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el restaurante", "Entrada a la piscina", "Guía (opcional)"]
    },
    {
        id: "livingston-resort", nombre: "Livingston Resort", tipo: "hotel",
        categorias: ["hotel", "restaurante"],
        descripcionCorta: "Hotel con restaurante en la zona de Livingston.",
        descripcionLarga: "Livingston Resort es la opción de hospedaje con restaurante incluido en el servicio, para armar un paquete de más de un día en la costa.",
        ubicacion: "Livingston, Izabal", imagen: "img/livingston-resort.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "playa-barique", nombre: "Playa Barique", tipo: "playa",
        categorias: ["playa"],
        descripcionCorta: "Playa tranquila de la costa caribeña.",
        descripcionLarga: "Playa Barique es una playa de la costa de Izabal a la que se llega en lancha. Ambiente tranquilo, ideal para quien busca mar sin tanta concurrencia.",
        ubicacion: "Livingston, Izabal", imagen: "img/playa-barique.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "playa-capitania", nombre: "Playa Capitanía", tipo: "playa",
        categorias: ["playa"],
        descripcionCorta: "Playa de acceso en lancha, poco concurrida.",
        descripcionLarga: "Playa Capitanía es una playa a la que se llega por lancha y se mantiene poco concurrida. Buena parada intermedia en un recorrido por la costa.",
        ubicacion: "Livingston, Izabal", imagen: "img/playa-capitania.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "Villa-caribe", nombre: "Villa Caribe", tipo: "hotel",
        categorias: ["hotel", "playa"],
        descripcionCorta: "Hotel con playa para quedarse más de un día.",
        descripcionLarga: "Villa Caribe combina hospedaje y playa en el mismo destino, pensado para paquetes de noche con traslado en lancha.",
        ubicacion: "Livingston, Izabal", imagen: "img/villa-caribe.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "buga-mama", nombre: "Buga Mama", tipo: "restaurante",
        categorias: ["restaurante"],
        descripcionCorta: "Restaurante para comer entre viaje y viaje.",
        descripcionLarga: "Buga Mama es un punto de restaurante que funciona como parada de comida dentro de un recorrido en lancha por la costa.",
        ubicacion: "Livingston, Izabal", imagen: "img/buga-mama.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el restaurante", "Guía (opcional)"]
    },
    {
        id: "casa-nostra", nombre: "Casa Nostra", tipo: "hotel",
        categorias: ["hotel", "restaurante"],
        descripcionCorta: "Hotel con restaurante.",
        descripcionLarga: "Casa Nostra es un destino de hospedaje con restaurante, cómodo para quien quiere quedarse a dormir sin salir del lugar.",
        ubicacion: "Livingston, Izabal", imagen: "img/casa-nostra.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "casa-rosada", nombre: "Casa Rosada", tipo: "hotel",
        categorias: ["hotel", "restaurante"],
        descripcionCorta: "Hotel con restaurante.",
        descripcionLarga: "Casa Rosada combina habitaciones y servicio de restaurante en el mismo destino, para visitas de más de un día.",
        ubicacion: "Livingston, Izabal", imagen: "img/casa-rosada.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "posada-el-delfin", nombre: "Posada El Delfín", tipo: "hotel",
        categorias: ["hotel", "restaurante"],
        descripcionCorta: "Posada con restaurante.",
        descripcionLarga: "Posada El Delfín es un hospedaje con restaurante, de ambiente más pequeño y tranquilo, para quedarse la noche tras el recorrido en lancha.",
        ubicacion: "Livingston, Izabal", imagen: "img/posada-el-delfin.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "punta-palma", nombre: "Punta Palma", tipo: "playa",
        categorias: ["playa"],
        descripcionCorta: "Un rincón remoto y virgen del Caribe.",
        descripcionLarga: "Punta Palma es una playa poco visitada, de arena blanca y aguas transparentes. Ideal para quien busca tranquilidad y naturaleza sin multitudes. Se llega en lancha desde Livingston.",
        ubicacion: "Livingston, Izabal", imagen: "img/punta-palma.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Comida", "Bebidas", "Guía (opcional)"]
    },
    {
        id: "isla-pajaros", nombre: "Isla de Pájaros", tipo: "playa",
        categorias: ["playa", "lancha"],
        descripcionCorta: "Isla santuario de aves frente a Livingston.",
        descripcionLarga: "La Isla de Pájaros es un santuario natural donde anidan cientos de aves. El tour incluye un recorrido alrededor de la isla para observar aves y luego una parada en una playa cercana.",
        ubicacion: "Livingston, Izabal", imagen: "img/isla-pajaros.jpg",
        incluye: ["Lancha", "Guía", "Chaleco salvavidas"],
        noIncluye: ["Comida", "Bebidas"]
    },

    /* --- Zona de ríos --- */
    {
        id: "happy-fish", nombre: "Happy Fish", tipo: "rio",
        categorias: ["rio", "restaurante"],
        descripcionCorta: "Restaurante a la orilla del río.",
        descripcionLarga: "Happy Fish es un destino de río con restaurante, para combinar el paseo en lancha con la comida del día.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/happy-fish.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el restaurante", "Guía (opcional)"]
    },
    {
        id: "casa-maya", nombre: "Casa Maya", tipo: "rio",
        categorias: ["rio", "restaurante", "bungalows"],
        descripcionCorta: "Restaurante y bungalows junto al río.",
        descripcionLarga: "Casa Maya reúne río, restaurante y bungalows, así que sirve tanto para el día como para quedarse a dormir en la orilla.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/casa-maya.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "el-viajero", nombre: "El Viajero", tipo: "rio",
        categorias: ["rio", "hotel", "restaurante", "piscina", "toboganes", "bungalows"],
        descripcionCorta: "Hotel, restaurante, piscina y toboganes al río.",
        descripcionLarga: "El Viajero es el destino más completo de la zona de ríos: hospedaje, restaurante, piscina y toboganes que bajan al río, con opción de bungalows. Funciona para paquetes de varios días.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/el-viajero.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "finca-tatin", nombre: "Finca Tatin", tipo: "rio",
        categorias: ["rio", "restaurante", "bungalows", "kayak"],
        descripcionCorta: "Río, restaurante, bungalows y kayak.",
        descripcionLarga: "Finca Tatin es un destino de río con restaurante, bungalows y recorrido en kayak. Uno de los puntos más pedidos para combinar naturaleza y hospedaje.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/finca-tatin.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Renta de kayak", "Guía (opcional)"]
    },
    {
        id: "agua-termales", nombre: "Agua Termales", tipo: "rio",
        categorias: ["rio", "restaurante", "termales"],
        descripcionCorta: "Restaurante y aguas termales.",
        descripcionLarga: "Agua Termales es el destino de aguas termales de la ruta, con restaurante en el lugar. Parada pensada para relajarse a mitad del recorrido.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/aguas-termales.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Guía (opcional)"]
    },
    {
        id: "canon-del-rio", nombre: "Cañón del Río", tipo: "rio",
        categorias: ["rio", "restaurante"],
        descripcionCorta: "Restaurante con vista al cañón del Río Dulce.",
        descripcionLarga: "Cañón del Río es el punto de restaurante sobre el cañón, para comer viendo las paredes de selva y el paso de las lanchas.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/canon-del-rio.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el restaurante", "Guía (opcional)"]
    },
    {
        id: "ak-tenamit", nombre: "Ak' Tenamit", tipo: "rio",
        categorias: ["rio", "restaurante", "tirolesa", "caballo", "kayak", "lancha"],
        descripcionCorta: "Aventura en el río: tirolesa, caballo, kayak y lancha.",
        descripcionLarga: "Ak' Tenamit es el destino de aventura de la ruta: restaurante junto al río más tirolesa, paseos a caballo, kayak y recorridos en lancha. El más completo para un día activo.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/ak-tenamit.jpg",
        incluye: ["Lancha ida y vuelta", "Chaleco salvavidas"],
        noIncluye: ["Consumo en el destino", "Actividades de aventura", "Guía (opcional)"]
    },
    {
        id: "rio-dulce", nombre: "Río Dulce", tipo: "rio",
        categorias: ["rio", "lancha"],
        descripcionCorta: "Cañón espectacular y manglares.",
        descripcionLarga: "El cañón del Río Dulce es uno de los paisajes más impresionantes de Guatemala: paredes de selva, manglares, aves y un castillo colonial (Castillo de San Felipe). El tour en lancha dura varias horas y es una experiencia imperdible.",
        ubicacion: "Río Dulce, Izabal", imagen: "img/rio-dulce.jpg",
        incluye: ["Lancha", "Guía bilingüe", "Entrada al Castillo de San Felipe"],
        noIncluye: ["Comida", "Bebidas"]
    }
];

/* 4. TOURS
   Todos los destinos tienen tour para reservar. `lugares` es
   cuántos sitios visita el recorrido (los tours combinados
   cobran un pequeño extra por lugar adicional). */
var tours = [
    { id: "tour-playa-blanca", destinoId: "playa-blanca", nombre: "Playa Blanca ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-siete-altares", destinoId: "siete-altares", nombre: "Siete Altares + Playa Blanca", lugares: 2, duracionMinutos: 180, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-rio-dulce", destinoId: "rio-dulce", nombre: "Cañón del Río Dulce + Castillo", lugares: 2, duracionMinutos: 240, minPersonas: 2, maxPersonas: 12 },
    { id: "tour-punta-palma", destinoId: "punta-palma", nombre: "Punta Palma ida y vuelta", lugares: 1, duracionMinutos: 150, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-isla-pajaros", destinoId: "isla-pajaros", nombre: "Isla de Pájaros ida y vuelta", lugares: 1, duracionMinutos: 90, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-punta-cocoli", destinoId: "punta-cocoli", nombre: "Punta de Cocolí ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-bahia-azul", destinoId: "bahia-azul", nombre: "Bahía Azul ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-salvador-gaviota", destinoId: "salvador-gaviota", nombre: "Salvador Gaviota ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-playa-quehueche", destinoId: "playa-quehueche", nombre: "Playa Quehueche ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-vuelbe-mujer", destinoId: "vuelbe-mujer", nombre: "Vuelbe Mujer ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-flamingo", destinoId: "flamingo", nombre: "Flamingo ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-livingston-resort", destinoId: "livingston-resort", nombre: "Livingston Resort ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-playa-barique", destinoId: "playa-barique", nombre: "Playa Barique ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-playa-capitania", destinoId: "playa-capitania", nombre: "Playa Capitanía ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-villa-caribe", destinoId: "Villa-caribe", nombre: "Villa Caribe ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-buga-mama", destinoId: "buga-mama", nombre: "Buga Mama ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-casa-nostra", destinoId: "casa-nostra", nombre: "Casa Nostra ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-casa-rosada", destinoId: "casa-rosada", nombre: "Casa Rosada ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-posada-el-delfin", destinoId: "posada-el-delfin", nombre: "Posada El Delfín ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-happy-fish", destinoId: "happy-fish", nombre: "Happy Fish ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-casa-maya", destinoId: "casa-maya", nombre: "Casa Maya ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-el-viajero", destinoId: "el-viajero", nombre: "El Viajero ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-finca-tatin", destinoId: "finca-tatin", nombre: "Finca Tatin ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-agua-termales", destinoId: "agua-termales", nombre: "Agua Termales ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-canon-del-rio", destinoId: "canon-del-rio", nombre: "Cañón del Río ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 },
    { id: "tour-ak-tenamit", destinoId: "ak-tenamit", nombre: "Ak' Tenamit ida y vuelta", lugares: 1, duracionMinutos: 120, minPersonas: 1, maxPersonas: 12 }
];

/* 5. LANCHEROS Y LANCHAS */
var lancheros = [
    { id: "lan-001", nombre: "Matthew Zapata", telefono: "5555-1001", aprobado: true },
    { id: "lan-002", nombre: "Valeria Suarez", telefono: "5555-1002", aprobado: true },
    { id: "lan-003", nombre: "Carlos García", telefono: "5555-1003", aprobado: true }
];

var lanchas = [
    { id: "lancha-perla", lancheroId: "lan-001", nombre: "Licuadora", capacidad: 15, motorHP: 40, costoGasolinaHora: 80, horarioInicio: "06:00", horarioFin: "18:00", activa: true },
    { id: "lancha-tiburon", lancheroId: "lan-002", nombre: "Wilson", capacidad: 8, motorHP: 90, costoGasolinaHora: 150, horarioInicio: "06:00", horarioFin: "18:00", activa: true },
    { id: "lancha-caribe", lancheroId: "lan-003", nombre: "Caribe I", capacidad: 12, motorHP: 60, costoGasolinaHora: 110, horarioInicio: "07:00", horarioFin: "17:00", activa: true }
];

/* 6. HOTELES */
var hoteles = [
    { id: "hotel-palmeras", nombre: "Hotel Las Palmeras", categoria: "economico", precioNoche: 300, estrellas: 2, ubicacion: "Livingston centro", imagen: "img/hotel-palmeras.jpg", descripcion: "Hotel sencillo, limpio y céntrico." },
    { id: "hotel-rio-dulce-lodge", nombre: "Río Dulce Lodge", categoria: "medio", precioNoche: 800, estrellas: 4, ubicacion: "Río Dulce", imagen: "img/hotel-rio-dulce.jpg", descripcion: "Cabañas frente al río, con desayuno incluido." },
    { id: "hotel-boutique-izabal", nombre: "Izabal Boutique", categoria: "boutique", precioNoche: 1500, estrellas: 5, ubicacion: "Livingston, frente al mar", imagen: "img/hotel-boutique.jpg", descripcion: "Hotel boutique con vista al Caribe." }
];

/* 7. PAQUETES */
var paquetes = [
    { id: "paq-rio-dulce-2d", nombre: "Río Dulce + Siete Altares (2 días)", descripcionCorta: "2 días, 1 noche. Lancha, hotel medio y guía.", descripcionLarga: "Recorre el cañón del Río Dulce y las cascadas de Siete Altares. Incluye hotel medio con desayuno.", duracionDias: 2, precioPorPersona: 2500, minPersonas: 2, maxPersonas: 12, imagen: "img/paquete-rio-dulce.jpg", destacado: true, badge: "⭐ Más vendido", destinosIds: ["rio-dulce", "siete-altares"], hotelId: "hotel-rio-dulce-lodge", incluye: ["Lancha", "Guía bilingüe", "1 noche hotel", "Desayuno", "Entradas"], noIncluye: ["Almuerzos", "Cenas", "Bebidas"] },
    { id: "paq-playa-familiar", nombre: "Playa Blanca Familiar (1 día)", descripcionCorta: "1 día. Ideal para familias con niños.", descripcionLarga: "Día completo en Playa Blanca con lancha privada y guía.", duracionDias: 1, precioPorPersona: 450, minPersonas: 4, maxPersonas: 12, imagen: "img/paquete-playa.jpg", destacado: true, badge: "👨‍👩‍👧 Familiar", destinosIds: ["playa-blanca"], hotelId: null, incluye: ["Lancha privada", "Chalecos para niños", "Guía", "Snacks"], noIncluye: ["Almuerzo", "Bebidas"] },
    { id: "paq-aventura-3d", nombre: "Aventura Caribe (3 días)", descripcionCorta: "3 días, 2 noches. Playas + ríos + hotel boutique.", descripcionLarga: "La experiencia completa con hotel boutique frente al mar.", duracionDias: 3, precioPorPersona: 4800, minPersonas: 2, maxPersonas: 10, imagen: "img/paquete-aventura.jpg", destacado: false, badge: "🎒 Aventura", destinosIds: ["playa-blanca", "siete-altares", "rio-dulce", "isla-pajaros"], hotelId: "hotel-boutique-izabal", incluye: ["Todas las lanchas", "Guía bilingüe", "2 noches hotel boutique", "Desayunos", "Entradas"], noIncluye: ["Almuerzos", "Cenas", "Bebidas", "Propinas"] }
];

/* 8. CÁLCULO
   Solo se cobra por persona; la ida y vuelta ya va incluida.
   Mientras más gente viaja, menos paga cada uno:
   11 a 15 pasajeros Q40 c/u · 10 o menos Q50 c/u.
   Los tours de varios lugares suman Q5 por lugar extra.
   Los infantes de 0 a 3 no pagan (van en brazos) pero sí
   cuentan para el aforo de Capitanía. */
var TARIFA_GRUPO = [
    { min: 11, precio: 40 },
    { min: 1,  precio: 50 }
];
var RECARGO_POR_LUGAR = 5;

function tarifaPorPersona(cantidad) {
    for (var i = 0; i < TARIFA_GRUPO.length; i++) {
        if (cantidad >= TARIFA_GRUPO[i].min) return TARIFA_GRUPO[i].precio;
    }
    return TARIFA_GRUPO[TARIFA_GRUPO.length - 1].precio;
}

function calcularPrecioReserva(opciones) {
    var tour   = tours.find(function (t) { return t.id === opciones.tourId; });
    var lancha = lanchas.find(function (l) { return l.id === opciones.lanchaId; });
    var temporada = obtenerTemporada(opciones.fecha);

    var adultos = opciones.adultos || 0;
    var ninos   = opciones.ninos || 0;
    var bebes   = opciones.bebes || 0;
    var personas = adultos + ninos;

    var lugares = tour.lugares || 1;
    var tarifaPersona = tarifaPorPersona(personas) + (lugares - 1) * RECARGO_POR_LUGAR;
    var basePersonas = personas * tarifaPersona;

    var total = Math.round(basePersonas * temporada.multiplicador);

    return {
        tour: tour, lancha: lancha, temporada: temporada,
        desglose: {
            lugares: lugares,
            tarifaPersona: tarifaPersona,
            personas: personas,
            basePersonas: basePersonas,
            bebes: bebes,
            multiplicador: temporada.multiplicador, total: total
        }
    };
}

function pasajerosDeReserva(adultos, ninos, bebes) {
    return (adultos || 0) + (ninos || 0) + (bebes || 0);
}

function textoPersonas(adultos, ninos, bebes) {
    var t = adultos + (adultos === 1 ? ' adulto' : ' adultos');
    if (ninos > 0) t += ', ' + ninos + (ninos === 1 ? ' niño' : ' niños');
    if (bebes > 0) t += ', ' + bebes + (bebes === 1 ? ' infante' : ' infantes') + ' (0-3)';
    return t;
}

/* 9. UTILIDADES */
function tourDeDestino(destinoId) {
    return tours.find(function (t) { return t.destinoId === destinoId; });
}
function destinoDeTour(tourId) {
    var tour = tours.find(function (t) { return t.id === tourId; });
    return tour ? destinos.find(function (d) { return d.id === tour.destinoId; }) : null;
}
function lancheroDeLancha(lanchaId) {
    var lancha = lanchas.find(function (l) { return l.id === lanchaId; });
    return lancha ? lancheros.find(function (p) { return p.id === lancha.lancheroId; }) : null;
}
/* Teléfono del lanchero a partir del nombre de la lancha
   (para facturas de reservas hechas en este navegador). */
function telefonoDeLanchaNombre(nombre) {
    var lancha = lanchas.find(function (l) { return l.nombre === nombre; });
    if (!lancha) return '';
    var lanchero = lancheros.find(function (p) { return p.id === lancha.lancheroId; });
    return lanchero ? lanchero.telefono : '';
}
function Q(numero) {
    return "Q" + Number(numero).toLocaleString("es-GT");
}