// src/config/categoryPages.js
// SEO y presentación por categoría, fijo en el código (no viene de la base
// de datos). Agregar una categoría nueva = una entrada acá + su fila en la
// tabla `categorias`. El slug es la clave y debe coincidir con el de la DB.

const categoryPages = {
  mates: {
    icon: "fa-mug-hot",
    title: "Mates de Algarrobo Personalizados en Tucumán | DecoMotivo",
    description:
      "Mates de algarrobo personalizados en Tucumán. Incluyen bombilla de aluminio. Grabado láser. Envíos a toda Argentina. ¡Consultá precios!",
    keywords:
      "mates tucumán, mates personalizados tucumán, mates algarrobo, mates con bombilla, DecoMotivo, San Miguel de Tucumán, mates argentina",
    ogImage: "https://www.decomotivo.com.ar/images/mates-bg.jpg",
  },
  // Tazas y Vasos, Descartables, Cumpleaños, Bijouterie, Cosmética Capilar,
  // Mercería, Bienestar y Perfumería y Belleza: contenido nuevo (categorías
  // agregadas en migración 028), conviene que el dueño lo revise/ajuste, no
  // vienen de un texto anterior. Sin ogImage propia todavía -- cae al
  // fallback genérico de getCategorySeo hasta que se suba una imagen de
  // fondo real para cada una.
  "tazas-vasos": {
    icon: "fa-mug-saucer",
    title: "Tazas y Vasos Personalizados en Tucumán | DecoMotivo",
    description:
      "Tazas y vasos personalizados en Tucumán, ideales para regalar o para uso diario. Diseños a pedido. ¡Consultá precios!",
    keywords:
      "tazas personalizadas tucumán, vasos personalizados tucumán, vasos ferneteros tucumán, jarras nórdicas tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  descartables: {
    icon: "fa-box-open",
    title: "Artículos Descartables en Tucumán | DecoMotivo",
    description:
      "Vasos, platos y cubiertos descartables en Tucumán. Ideal para cumpleaños, eventos y reuniones. ¡Consultanos disponibilidad!",
    keywords:
      "descartables tucumán, vasos descartables tucumán, platos descartables tucumán, cotillón tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  cumpleanos: {
    icon: "fa-birthday-cake",
    title: "Artículos para Cumpleaños en Tucumán | DecoMotivo",
    description:
      "Todo para tu cumpleaños en Tucumán: cotillón, decoración y artículos para fiestas en un solo lugar. ¡Consultanos!",
    keywords:
      "cumpleaños tucumán, cotillón tucumán, artículos fiesta tucumán, decoración cumpleaños tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  bijouterie: {
    icon: "fa-gem",
    title: "Bijouterie en Tucumán | DecoMotivo",
    description:
      "Bijouterie y accesorios en Tucumán: aros, collares, pulseras y anillos. Encontrá tu estilo en DecoMotivo. ¡Consultanos!",
    keywords:
      "bijouterie tucumán, accesorios tucumán, aros tucumán, collares tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  "cosmetica-capilar": {
    icon: "fa-pump-soap",
    title: "Cosmética Capilar en Tucumán | DecoMotivo",
    description:
      "Productos de cosmética capilar en Tucumán: tratamientos, cremas y accesorios para el cuidado del cabello. ¡Consultanos disponibilidad!",
    keywords:
      "cosmética capilar tucumán, cuidado del cabello tucumán, tratamientos capilares tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  merceria: {
    icon: "fa-cut",
    title: "Mercería en Tucumán | DecoMotivo",
    description:
      "Artículos de mercería en Tucumán: hilos, botones, cintas y accesorios de costura para tus proyectos. ¡Consultanos!",
    keywords:
      "mercería tucumán, artículos de costura tucumán, hilos tucumán, botones tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  bienestar: {
    icon: "fa-spa",
    title: "Bienestar en Tucumán | Incienso, Sales y Flores de Bach | DecoMotivo",
    description:
      "Incienso, lámparas de sal, sales y Flores de Bach en Tucumán. Todo para tu espacio de bienestar y relajación. ¡Consultanos!",
    keywords:
      "bienestar tucumán, incienso tucumán, lámparas de sal tucumán, flores de bach tucumán, sales tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  "perfumeria-belleza": {
    icon: "fa-spray-can",
    title: "Perfumería y Belleza en Tucumán | DecoMotivo",
    description:
      "Perfumes de ambiente, esmaltes, maquillaje y máscaras faciales en Tucumán. Todo para tu rutina de belleza. ¡Consultanos!",
    keywords:
      "perfumería tucumán, belleza tucumán, perfumes de ambiente tucumán, esmaltes tucumán, maquillaje tucumán, DecoMotivo, San Miguel de Tucumán",
  },
  tablas: {
    icon: "fa-utensils",
    title: "Tablas de Algarrobo Personalizadas en Tucumán | DecoMotivo",
    description:
      "Tablas de algarrobo personalizadas en Tucumán. Pizzeras, tablas para asado, picadas y desayuno. Calidad premium, grabado láser. Envíos a todo Tucumán. ¡Consultá precios!",
    keywords:
      "tablas algarrobo tucumán, tablas personalizadas tucumán, pizzeras tucumán, tablas asado tucumán, tablas picada, DecoMotivo, San Miguel de Tucumán, tablas madera argentina",
    ogImage: "https://www.decomotivo.com.ar/images/tablas-bg.jpg",
  },
  combos: {
    icon: "fa-gift",
    title: "Combos y Sets Personalizados en Tucumán | DecoMotivo",
    description:
      "Combos personalizados en Tucumán: sets de tablas, platos de algarrobo, combos para regalo. Armá tu propio combo. Ideal para regalar. ¡Consultá precios!",
    keywords:
      "combos personalizados tucumán, sets regalo tucumán, combos tablas asado, platos algarrobo, regalos personalizados tucumán, sets picada, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/combos-bg.jpg",
  },
  decoraciones: {
    icon: "fa-image",
    title: "Decoración para el Hogar en Tucumán | Cuadros y Adornos | DecoMotivo",
    description:
      "Decoración para el hogar en Tucumán: cuadros en MDF y polifan personalizados, pesebres, adornos pintados a mano. Diseños únicos para tu espacio. ¡Consultá precios!",
    keywords:
      "decoración hogar tucumán, cuadros personalizados tucumán, cuadros mdf, cuadros polifan, pesebres tucumán, adornos decorativos, decoración tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/decoraciones-bg.jpg",
  },
  mdf: {
    icon: "fa-cube",
    title: "Productos en MDF Personalizados en Tucumán | DecoMotivo",
    description:
      "Artículos en MDF personalizados en Tucumán: porta bijouterie, porta celulares, relojes de pared, rompecabezas. Diseños únicos con grabado láser. ¡Consultá precios!",
    keywords:
      "mdf tucumán, productos mdf personalizados, porta bijouterie tucumán, relojes mdf, rompecabezas personalizados, artículos mdf, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/mdf-bg.jpg",
  },
  otros: {
    icon: "fa-ellipsis-h",
    title: "Artesanías y Productos Decorativos en Tucumán | DecoMotivo",
    description:
      "Productos artesanales en Tucumán: bolsos materos, percheros de algarrobo, porta gorras, yerberas, bombillas personalizadas. Artesanías únicas. ¡Consultá precios!",
    keywords:
      "artesanías tucumán, productos decorativos tucumán, bolsos materos, percheros algarrobo, porta gorras tucumán, yerberas, bombillas personalizadas, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/otros-bg.jpg",
  },
  // Libreria, Tecnologia e Impresiones son contenido nuevo, escrito para
  // esta entrega - conviene que el dueño los revise/ajuste, no vienen de un
  // texto anterior.
  libreria: {
    icon: "fa-book",
    title: "Librería en Tucumán | DecoMotivo",
    description:
      "Cuadernos, lapiceras, mapas y artículos de librería en Tucumán. Todo para la escuela y la oficina.",
    keywords:
      "libreria tucumán, articulos escolares tucumán, cuadernos tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/libreria-bg.jpg",
  },
  tecnologia: {
    icon: "fa-mobile-alt",
    title: "Accesorios de Tecnología en Tucumán | DecoMotivo",
    description:
      "Cargadores, pilas, adaptadores y fundas para celular en Tucumán. Accesorios de tecnología a buen precio. ¡Consultanos disponibilidad!",
    keywords:
      "accesorios tecnologia tucumán, cargadores celular tucumán, pilas tucumán, adaptadores tucumán, fundas celular tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/tecnologia-bg.jpg",
  },
  regaleria: {
    icon: "fa-ribbon",
    title: "Regalería en Tucumán | DecoMotivo",
    description:
      "Artículos para regalar en Tucumán, ideales para cada ocasión. Encontrá el regalo perfecto en DecoMotivo.",
    keywords:
      "regaleria tucumán, regalos tucumán, articulos para regalar tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/regaleria-bg.jpg",
  },
  jugueteria: {
    icon: "fa-puzzle-piece",
    title: "Juguetería en Tucumán | DecoMotivo",
    description:
      "Juguetes y artículos para jugar en Tucumán. Encontrá opciones originales y de calidad en DecoMotivo.",
    keywords:
      "jugueteria tucumán, juguetes tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/jugueteria-bg.jpg",
  },
  impresiones: {
    icon: "fa-print",
    title: "Fotocopias e Impresiones en Tucumán | DecoMotivo",
    description:
      "Fotocopias e impresiones en blanco y negro y color en Tucumán. Atención rápida para trabajos escolares y de oficina. ¡Consultanos!",
    keywords:
      "fotocopias tucumán, impresiones tucumán, copias blanco y negro tucumán, impresiones color tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/impresiones-bg.jpg",
  },
  indumentaria: {
    icon: "fa-tshirt",
    title: "Indumentaria Personalizada en Tucumán | DecoMotivo",
    description:
      "Remeras, buzos y prendas personalizadas en Tucumán. Estampado y diseños a pedido. ¡Consultanos disponibilidad!",
    keywords:
      "indumentaria personalizada tucumán, remeras personalizadas tucumán, buzos personalizados tucumán, DecoMotivo, San Miguel de Tucumán",
    ogImage: "https://www.decomotivo.com.ar/images/indumentaria-bg.jpg",
  },
};

export const defaultCategoryIcon = "fa-box";

// Fallback para una categoría que existe en la tabla `categorias` pero
// todavía no tiene su entrada acá arriba (paso manual que se puede olvidar).
// Sin esto, CategoryPage se queda sin título/meta description/OG en silencio.
export const getCategorySeo = (slug, nombreCategoria) => {
  if (categoryPages[slug]) return categoryPages[slug];

  const nombre =
    nombreCategoria ||
    slug
      .split("-")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ");

  return {
    icon: defaultCategoryIcon,
    title: `${nombre} en Tucumán | DecoMotivo`,
    description: `Descubrí nuestra selección de ${nombre.toLowerCase()} en DecoMotivo, San Miguel de Tucumán. ¡Consultanos!`,
    keywords: `${nombre.toLowerCase()} tucumán, DecoMotivo, San Miguel de Tucumán`,
    ogImage: "https://www.decomotivo.com.ar/images/hero-bg.jpg",
  };
};

export default categoryPages;
