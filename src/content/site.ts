// Revisar textos pastorales antes de publicar. Fotografías en photos.json.
export const site = {
  name: 'Misterio',
  description: 'Un espacio para rezar, encontrar esperanza y confiar tus intenciones a una comunidad de oración.',
  editorialPending: true,
};

export const prayers = [
  { slug: 'ave-maria', title: 'Ave María', subtitle: 'Una oración de confianza', text: 'Dios te salve, María, llena eres de gracia; el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.\n\nSanta María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.' },
  { slug: 'salve', title: 'La Salve', subtitle: 'Madre de misericordia', text: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas.\n\nEa, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María!\n\nRuega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.' },
  { slug: 'rosario', title: 'El Rosario', subtitle: 'Rezar paso a paso', text: 'Comienza con la señal de la cruz y el Credo. Reza un Padrenuestro, tres Avemarías y un Gloria.\n\nPara cada uno de los cinco misterios del día, anuncia el misterio, dedica un momento a contemplarlo, reza un Padrenuestro, diez Avemarías y un Gloria. Termina con la Salve.\n\nMisterios gozosos: lunes y sábados. Dolorosos: martes y viernes. Gloriosos: miércoles y domingos. Luminosos: jueves.\n\nNo necesitas apresurarte. Puedes comenzar por una decena y rezar a tu ritmo.' },
  { slug: 'angelus', title: 'El Ángelus', subtitle: 'Recordar la anunciación', text: 'El ángel del Señor anunció a María.\nY concibió por obra y gracia del Espíritu Santo.\nReza un Ave María.\n\nHe aquí la esclava del Señor.\nHágase en mí según tu palabra.\nReza un Ave María.\n\nY el Verbo se hizo carne.\nY habitó entre nosotros.\nReza un Ave María.\n\nRuega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo.\n\nDerrama, Señor, tu gracia en nuestros corazones, para que, quienes hemos conocido por el anuncio del ángel la encarnación de tu Hijo, lleguemos por su pasión y su cruz a la gloria de la resurrección. Por Jesucristo, nuestro Señor. Amén.' },
  { slug: 'bajo-tu-amparo', title: 'Bajo tu amparo', subtitle: 'Confiar nuestro camino', text: 'Bajo tu amparo nos acogemos, Santa Madre de Dios; no desprecies las súplicas que te dirigimos en nuestras necesidades; antes bien, líbranos de todo peligro, ¡oh Virgen gloriosa y bendita! Amén.' },
  { slug: 'acuerdate', title: 'Acuérdate', subtitle: 'Acercarnos con esperanza', text: 'Acuérdate, ¡oh piadosísima Virgen María!, que jamás se ha oído decir que ninguno de los que han acudido a tu protección, implorando tu asistencia y reclamando tu socorro, haya sido abandonado por ti.\n\nAnimado con esta confianza, a ti también acudo, oh Madre, Virgen de las vírgenes; y, aunque gimiendo bajo el peso de mis pecados, me atrevo a comparecer ante tu presencia soberana.\n\nOh Madre de Dios, no deseches mis súplicas; antes bien, escúchalas y acógelas benignamente. Amén.' },
  { slug: 'magnificat', title: 'Magníficat', subtitle: 'Una oración de gratitud', text: 'Proclama mi alma la grandeza del Señor, se alegra mi espíritu en Dios, mi salvador; porque ha mirado la humildad de su esclava.\n\nDesde ahora me felicitarán todas las generaciones, porque el Poderoso ha hecho obras grandes por mí: su nombre es santo, y su misericordia llega a sus fieles de generación en generación.\n\nÉl hace proezas con su brazo: dispersa a los soberbios de corazón, derriba del trono a los poderosos y enaltece a los humildes; a los hambrientos los colma de bienes y a los ricos los despide vacíos.\n\nAuxilia a Israel, su siervo, acordándose de la misericordia, como lo había prometido a nuestros padres, en favor de Abrahán y su descendencia por siempre.' },
].map((prayer, index) => ({ ...prayer, image: `/images/maria-${index + 1}.svg`, photoId: ['virgen-lujan', 'virgen-milagrosa', 'virgen-lourdes', 'virgen-fatima', 'virgen-lujan-2', 'virgen-lourdes-2', 'virgen-fatima-2'][index], number: index + 1 }));

export const gallery = [
  { name: 'Virgen de Luján', photoId: 'virgen-lujan' },
  { name: 'Nuestra Señora de la Medalla Milagrosa', photoId: 'virgen-milagrosa' },
  { name: 'Nuestra Señora de Lourdes', photoId: 'virgen-lourdes' },
  { name: 'Nuestra Señora de Fátima', photoId: 'virgen-fatima' },
];

export const temples = [
  {
    name: 'Basílica de Nuestra Señora de Luján',
    city: 'Luján, Argentina',
    description: 'Sus dos torres y su arquitectura neogótica distinguen uno de los principales lugares de peregrinación de Argentina. Dedicada a Nuestra Señora de Luján, patrona del país, la basílica recibe a quienes se acercan a rezar, agradecer y compartir sus intenciones ante María.',
    address: 'San Martín 51',
    photoId: 'templo-lujan',
    website: 'https://basilicadelujan.org.ar/',
  },
  {
    name: 'Capilla de Nuestra Señora de la Medalla Milagrosa',
    city: 'París, Francia',
    description: 'En la rue du Bac, esta capilla está vinculada a santa Catalina Labouré y a la tradición de las apariciones marianas de 1830, de la que nace la Medalla Milagrosa. Su interior ofrece un espacio de recogimiento, oración y encuentro para peregrinos de distintos países.',
    address: '140 rue du Bac',
    photoId: 'templo-milagrosa',
    website: 'https://www.chapellenotredamedelamedaillemiraculeuse.com/',
  },
  {
    name: 'Santuario de Nuestra Señora de Lourdes',
    city: 'Lourdes, Francia',
    description: 'Al pie de los Pirineos, el santuario se organiza alrededor de la gruta de Massabielle, vinculada a las apariciones relatadas por santa Bernardita en 1858. Sus basílicas y espacios de oración acogen a peregrinos, enfermos y acompañantes que buscan consuelo y esperanza.',
    address: '1 avenue Monseigneur Théas',
    photoId: 'templo-lourdes',
    website: 'https://www.lourdes-france.org/',
  },
  {
    name: 'Santuario de Nuestra Señora de Fátima',
    city: 'Fátima, Portugal',
    description: 'Situado en Cova da Iria, recuerda las apariciones marianas relatadas en 1917 por los tres pastorcitos: Lucía, Francisco y Jacinta. La Capilla de las Apariciones, la Basílica de Nuestra Señora del Rosario y la gran explanada invitan a rezar por la paz y compartir la fe.',
    address: 'Cova da Iria',
    photoId: 'templo-fatima',
    website: 'https://www.fatima.pt/',
  },
].map(temple => ({ ...temple, mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${temple.name}, ${temple.city}`)}` }));
