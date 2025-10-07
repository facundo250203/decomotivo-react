import { preconnect } from "react-dom";

export const productosData = {
  tablas: {
    title: "Tablas",
    description: "Descubre nuestras mejores tablas, todas son personalizables para que sean únicas a tu estilo. Cada pieza está elaborada con la misma dedicación y calidad que caracteriza a DecoMotivo.",
    backgroundImage: "/images/tablas-bg.jpg",
    products: [
      {
        imagen: "/images/tablas/tablitas.jpg",
        titulo: "Tablitas",
        precio: 4000,
        descripcion: "Tablas de tamaños variados, todas personalizables.",
        material: "Algarrobo",
        medidas: "21 cm x 18 cm. Variadas",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Tablitas.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/desayuno.jpg",
        titulo: "Tabla Desayuno-Merienda",
        precio: 5000,
        descripcion: "Tabla ideal para servir tus desayunos o meriendas.",
        material: "Eucalipto",
        medidas: "27 cm x 14 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20Desayuno-Merienda.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/platos.jpg",
        titulo: "Platos",
        precio: 6000,
        descripcion: "Platos individuales de Algarrobo.",
        material: "Algarrobo",
        medidas: "23 cm x 23 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Platos%20Individuales.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/usodiario.jpg",
        titulo: "Tabla Uso Diario",
        precio: 9000,
        descripcion: "Tabla ideal para uso diario.",
        material: "Algarrobo",
        medidas: "35 cm x 20 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20Uso%20Diario.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/picar.jpg",
        titulo: "Tabla para Picar",
        precio: 10000,
        descripcion: "Tabla ideal para picar distintos alimentos.",
        material: "Algarrobo",
        medidas: "35 cm x 20 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20para%20DPicar.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/treboles.jpg",
        titulo: "Tréboles",
        precio: 12000,
        descripcion: "Tablas con cuencos en forma de Tréboles ideales para tus picadas.",
        material: "Algarrobo",
        medidas: "40 cm x 25cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Tréboles.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/tablas/pizzera.jpg",
        titulo: "Pizzera",
        precio: 13000,
        descripcion: "Tabla ideal para pizzas, duraderas y resistentes.",
        material: "Algarrobo",
        medidas: "29 cm y 32 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Pizzeras.%20¿Podrían%20darme%20más%20información?"
      },
      {
            imagen: "/images/tablas/pizzeradual.jpg",
            titulo: "Pizzera Dual",
            precio: 15000,
            descripcion: "Tabla ideal para tus pizzas y picadas.",
            material: "Algarrobo",
            medidas: "33 cm",
            personalizable: "Si",
            whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Pizzera%20Dual.%20¿Podrían%20darme%20más%20información?"
      },
      {
            imagen: "/images/tablas/tablasimple.jpg",
            titulo: "Tabla Simple",
            precio: 15000,
            descripcion: "Tabla simple, multiuso.",
            material: "Algarrobo",
            medidas: "50 cm x 25 cm",
            personalizable: "Si",
            whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20Simple.%20¿Podrían%20darme%20más%20información?"
    },
    {
            imagen: "/images/tablas/tabladual.jpg",
            titulo: "Tabla Dual",
            precio: 16000,
            descripcion: "Tabla Dual, ideal para picadas y uso diario.",
            material: "Algarrobo",
            medidas: "50 cm x 25 cm",
            personalizable: "Si",
            whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20Dual.%20¿Podrían%20darme%20más%20información?"
    },
    {
            imagen: "/images/tablas/tablamanijas.jpg",
            titulo: "Tabla con Manijas",
            precioDesde: 18000,
            descripcion: "Tabla ideal para servir tus asados. Diferentes tamaños disponibles.",
            material: "Algarrobo",
            medidas: "60 cm x 30 cm",
            personalizable: "Si",
            whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Tabla%20con%20Manijas.%20¿Podrían%20darme%20más%20información?"
    }
    ]
  },

  matesVasos: {
    title: "Mates y Vasos",
    description: "Descubre nuestros mates, vasos y jarras, todos son personalizables para que sean únicos a tu estilo. Cada pieza está elaborada con la misma dedicación y calidad que caracteriza a DecoMotivo.",
    backgroundImage: "/images/mates-bg.jpg",
    products: [
      {
        imagen: "/images/mates/perita.jpg",
        titulo: "Mate Perita",
        precio: 6500,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "9 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Perita.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/barrilito.jpg",
        titulo: "Mate Barrilito",
        precio: 7500,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "10 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Barrilito.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/geometrico.jpg",
        titulo: "Mate Geométrico",
        precio: 7500,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "8,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Geométrico.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/cilindrico.jpg",
        titulo: "Mate Cilíndrico",
        precio: 7500,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "9 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Cilíndrico.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/hexagonal.jpg",
        titulo: "Mate Hexagonal",
        precio: 8000,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "9,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Hexagonal.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/hexagonalXXL.jpg",
        titulo: "Mate Hexagonal XXL",
        precio: 9000,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "11 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20HexagonalXXL.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/cilindricoenvirolado.jpg",
        titulo: "Mate Cilíndrico Envirolado",
        precio: 9000,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "9 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla y Caja de MDF",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Cilíndrico%20Envirolado.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/camionero.jpg",
        titulo: "Mate Camionero",
        precio: 20000,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "10,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla y Caja de MDF",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Camionero.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/imperial.jpg",
        titulo: "Mate Imperial",
        precio: 22000,
        descripcion: "Mate de Algarrobo personalizable con bombilla de color a elección.",
        material: "Algarrobo",
        medidas: "10,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla y Caja de MDF",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Imperial.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/calabazaCamionero.jpg",
        titulo: "Mate Camionero de Calabaza",
        precio: 25000,
        descripcion: "Mate de calabaza forrado con cuero personalizable con bombilla chata.",
        material: "Algarrobo",
        medidas: "10,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla Chata y Caja de MDF",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Camionero%20de%20Calabaza.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/calabazaImperial.jpg",
        titulo: "Mate Imperial",
        precio: 30000,
        descripcion: "Mate de calabaza forrado con cuero personalizable con bombilla chata.",
        material: "Algarrobo",
        medidas: "10,5 cm de Alto",
        personalizable: "Si",
        incluye: "Bombilla Chata y Caja de MDF",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Mate%20Imperial%20de%20Calabaza.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/ferneteros.jpg",
        titulo: "Vasos Ferneteros",
        precio: 9500,
        descripcion: "Vasos Ferneteros personalizables de aluminio. Varios colores.",
        material: "Aluminio",
        capacidad: "1 L",
        personalizable: "Si",
        colores: "Amarillo, Azul, Negro, Rojo, Rosa",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Vaso%20Fernetero.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/jarra.jpg",
        titulo: "Jarra Nórdica",
        precioTexto: "Consultar",
        descripcion: "Jarra Nórdica personalizable.",
        material: "Algarrobo y aluminio",
        capacidad: "600 ml",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Jarro%20Nórdico.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mates/yerbera.jpg",
        titulo: "Yerberas y Azucareras",
        precio: 8000,
        descripcion: "Para azúcar como para Yerba.",
        material: "Quebracho",
        medidas: "9 cm de Alto y 8 cm de Radio",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Yerberas%20y%20Azucareras.%20¿Podrían%20darme%20más%20información?"
      }
    ]
  },

  mdf: {
    title: "MDF",
    description: "Te mostramos todos los artículos que realizamos en MDF, portaobjetos, artículos decorativos, y cajas personalizadas. Cada pieza está elaborada con la misma dedicación y calidad que caracteriza a DecoMotivo.",
    backgroundImage: "/images/mdf-bg.jpg",
    products: [
      {
        imagen: "/images/mdf/portabijou.jpg",
        titulo: "Porta Bijouterie",
        precioTexto: "Consultar",
        descripcion: "Porta Bijouterie en MDF.",
        material: "MDF",
        medidas: "23 cm de alto",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Porta%20Bijouterie.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/portacollares.jpg",
        titulo: "Porta Collares",
        precioTexto: "Consultar",
        descripcion: "Porta Collares en MDF.",
        material: "MDF",
        medidas: "26 cm de altura",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Porta%20Collares.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/portacelulares.jpg",
        titulo: "Porta Celulares",
        precioTexto: "Consultar",
        descripcion: "Porta Celulares en MDF, pintados o con imagen en vinilo.",
        material: "MDF y vinilo.",
        medidas: "18 cm de altura",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Porta%20Celulares.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/rompecabezaspalitos.jpg",
        titulo: "Rompecabezas Palitos",
        precioTexto: "Consultar",
        descripcion: "Rompecabezas en MDF, varios diseños.",
        material: "MDF y vinilo",
        medidas: "14 cm de largo x 9 cm de ancho",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Rompecabezas%20Palitos.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/rompecabezasclasico.jpg",
        titulo: "Rompecabezas Clásico",
        precioTexto: "Consultar",
        descripcion: "Rompecabezas en MDF, varios diseños.",
        material: "MDF y vinilo",
        medidas: "14 cm de largo x 14 cm de ancho",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Rompecabezas%20Clásico.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/relojes.jpg",
        titulo: "Relojes de Pared",
        precioTexto: "Consultar",
        descripcion: "Reloj de Pared en MDF, con soporte.",
        material: "MDF",
        medidas: "Variedad disponible",
        incluye: "Soporte",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Relojes.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/trofeos.jpg",
        titulo: "Trofeos",
        precioTexto: "Consultar",
        descripcion: "Trofeos en MDF con imagen en vinilo.",
        material: "MDF",
        medidas: "Variedad disponible",
        incluye: "Base.",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Trofeos.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/mdf/portasnacks.jpg",
        titulo: "Porta Snacks",
        precioTexto: "Consultar",
        descripcion: "Porta Snacks en MDF, separadores opcionales.",
        material: "MDF",
        medidas: "Variedad disponible",
        incluye: "Separadores opcionales.",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Porta%20Snacks.%20¿Podrían%20darme%20más%20información?"
      }
    ]
  },

  otros: {
    title: "Otros Productos",
    description: "Descubre nuestra selección exclusiva de productos para complementar la decoración de tu hogar, regalo personalizado o uso diario. Cada pieza está elaborada con la misma dedicación y calidad que caracteriza a DecoMotivo.",
    backgroundImage: "/images/otros-bg.jpg",
    products: [
      {
        imagen: "/images/otros/bolsosmateros.jpg",
        titulo: "Bolsos Materos",
        precioTexto: "Consultar",
        descripcion: "Bolso Matero con costura doble y base de mdf remachada",
        material: "Cuerina",
        medidas: "20 x 30 cm en total, 16 cm de profundidad",
        colores: "Rojo, Amarillo, Azul, Gris, Marrón",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Bolsos%20Materos.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/percheros.jpg",
        titulo: "Percheros de algarrobo",
        precio: 8000,
        descripcion: "Percheros de algarrobo con 5 soportes.",
        material: "Madera Algarrobo",
        medidas: "60 cm de ancho y 6 cm de alto",
        personalizable: "No.",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Percheros.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/portagorras.jpg",
        titulo: "Porta Gorras",
        precio: 10000,
        descripcion: "Porta Gorras para 8 o 16 gorras.",
        material: "Madera Pino",
        medidas: "90 cm de alto",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20PortaGorras.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/gallina.jpg",
        titulo: "Gallina Porta Huevos",
        precio: 8000,
        descripcion: "Porta huevos con forma de gallina para una docena de huevos.",
        material: "Madera Pino",
        medidas: "15 cm de Alto y 24 cm de Radio.",
        personalizable: "Si.",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Gallina%20PortaHuevos.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/bombillas.jpg",
        titulo: "Bombillas de Aluminio",
        precio: 1000,
        descripcion: "Bombillas de aluminio para todos tus mates.",
        material: "Aluminio",
        medidas: "14 cm de Alto",
        colores: "Consultar disponibles",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Bombillas.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/bombillaschatas.jpg",
        titulo: "Bombillas Chatas",
        precio: 4000,
        descripcion: "Bombillas de acero inoxidable y virola de bronce.",
        material: "Acero inoxidable y bronce",
        medidas: "17 cm de Alto",
        Personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Bombillas%20Chatas.%20¿Podrían%20darme%20más%20información?"
      },
            {
        imagen: "/images/otros/bombillaspaleta.jpg",
        titulo: "Bombillas Chatas",
        precio: 6000,
        descripcion: "Bombillas de acero inoxidable y virola de bronce.",
        material: "Acero inoxidable y bronce",
        medidas: "15 cm de Alto",
        Personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Bombillas%20Paleta.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/limpiabombillas.jpg",
        titulo: "Limpia Bombillas",
        precio: 1500,
        descripcion: "Limpia todas tus bombillas fácilmente.",
        material: "Aluminio",
        medidas: "15 cm de Alto",
        colores: "Consultar disponibles",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20LimpiaBombillas.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/carteleria.jpg",
        titulo: "Carteleria en Polifan",
        precioTexto: "Consultar",
        descripcion: "Cartelería para tu local comercial.",
        material: "Polifan",
        medidas: "A medida del cliente",
        colores: "Consultar disponibles",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20la%20Carteleria.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/vincores.jpg",
        titulo: "Vincores",
        precioTexto: "Consultar",
        descripcion: "Vincores para constelaciones familiares.",
        material: "Madera Pino",
        medidas: "Variadas.",
        colores: "Consultar disponibles",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Vincores.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/porcioneras.jpg",
        titulo: "Porcioneras",
        precio: 3000,
        descripcion: "Porcioneras de algarrobo, ideales para servir tus pizzas y canelones.",
        material: "Madera Algarrobo",
        medidas: "32 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Porcioneras.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/otros/cucharas.jpg",
        titulo: "Cucharas",
        precioDesde: 3000,
        descripcion: "Cucharas de Algarrobo personalizables.",
        material: "Madera Algarrobo",
        medidas: "32 y 40 cm de Alto",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20las%20Cucharas.%20¿Podrían%20darme%20más%20información?"
      }

    ]
  },

  combos: {
    title: "Combos",
    description: "Te mostramos algunos de nuestros combos, ideales para tu hogar o para regalar. ¿Ninguno te convence? ¡Armá el tuyo y lo sumamos!",
    backgroundImage: "/images/combos-bg.jpg",
    products: [
      {
        imagen: "/images/combos/combo1.jpg",
        titulo: "Combo 1",
        precioTexto: "Consultar",
        descripcion: "Combo de tablas, una para servir asado, y 6 platos individuales",
        material: "Algarrobo",
        medidas: "Consultar disponibilidad",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Combo%20de%20Tablas%20para%20Asado.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/combos/combo2.jpg",
        titulo: "Combo 2",
        precio: 33000,
        descripcion: "Set de 6 platos. Incluye canasto. Todo personalizable.",
        material: "Algarrobo",
        medidas: "23 cm",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Set%20de%20Platos.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/combos/combo3.jpg",
        titulo: "Combo 3",
        precioTexto: "Consultar",
        descripcion: "Tabla de madera y dos vasos ferneteros.",
        material: "Algarrobo y Aluminio",
        medidas: "Consultar Disponibilidad",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20el%20Combo%20de%20Tabla%20y%20Ferneteros.%20¿Podrían%20darme%20más%20información?"
      }
    ]
  },

  decoraciones: {
    title: "Decoraciones",
    description: "Descubre las diferentes propuestas de productos para complementar la decoración de tu hogar o para tu lugar de trabajo. Cada pieza está elaborada con la misma dedicación y calidad que caracteriza a DecoMotivo.",
    backgroundImage: "/images/decoraciones-bg.jpg",
    products: [
      {
        imagen: "/images/decoraciones/cuadrosMDF.jpg",
        titulo: "Cuadros en MDF",
        precioTexto: "Consultar",
        descripcion: "Cuadros en MDF para colgar o pegar.",
        material: "MDF",
        medidas: "Variedad disponible",
        personalizable: "Si",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Cuadros%20de%20MDF.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/decoraciones/cuadrospolifan.jpg",
        titulo: "Cuadros en Polifan",
        precioTexto: "Consultar",
        descripcion: "Cuadros en Polifan para colgar y pegar, pintados a mano.",
        material: "Polifan",
        medidas: "Variedad disponible",
        personalizable: "Consultar",
        whatsappUrl: "https://wa.me/5493816314426?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Cuadros%20en%20Polifan.%20¿Podrían%20darme%20más%20información?"
      },
      {
        imagen: "/images/decoraciones/pesebres.jpg",
        titulo: "Pesebres",
        precioTexto: "Consultar",
        descripcion: "Pesebres en MDF y vinilo.",
        material: "MDF y vinilo",
        medidas: "Variedad disponible",
        personalizable: "Varios",
        whatsappUrl: "https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20estoy%20interesado/a%20en%20los%20Pesebres.%20¿Podrían%20darme%20más%20información?"
      }
    ]
  }
};