import { ReadingCategory, ReadingLevel, ReadingText } from '../types';

export const CATEGORIES: ReadingCategory[] = [
  'Prelectura',
  'Cuento',
  'Rima',
  'Adivinanza',
  'Trabalenguas',
  'Informativo',
  'Instructivo',
  'Diálogo',
  'Canción',
  'Fábula',
  'Poema',
  'Noticia',
  'Científico',
  'Biografía',
  'Teatro',
  'Divulgativo',
  'Inferencial',
];

export const READING_MODES: [string, string][] = [
  ['silabico', '🔤 Silábico'],
  ['palabra', '📝 Palabra a palabra'],
  ['frase', '📖 Frase a frase'],
  ['parrafo', '📄 Párrafo'],
  ['eco', '🎤 Lectura en eco'],
  ['guiada', '🧘 Guiada con pausas'],
  ['acompanada', '👥 Coral / Acompañada'],
  ['repetida', '🔁 Lectura repetida (x3)'],
  ['expresiva', '🎭 Expresiva y prosódica'],
  ['autonomo', '👀 Lectura autónoma'],
  ['piramidal', '🔺 Piramidal progresiva'],
  ['acumulativa', '🔄 Frase acumulativa'],
  ['dramatizada', '🎬 Lectura teatral'],
  ['huecos', '🕳️ Completar huecos'],
  ['detectives', '🕵️ Detectives de errores'],
  ['escalera', '🪜 En escalera'],
];

export const DIFFICULTIES: string[] = [
  'invierte b/d',
  'omite sílabas',
  'sustituye palabras',
  'pierde renglón',
  'necesita apoyo',
  'buena entonación',
  'buen ritmo',
  'silabeo vacilante',
];

const RAW: string[] = [
  `1::0::Prelectura::Sílabas ma me mi mo mu::ma me mi mo mu\npa pe pi po pu\nsa se si so su::¿Qué letra empieza en ma?|m|p|s\n¿Cuál es una sílaba con p?|pa|ma|sa\n¿Cuál termina en u?|mu|mi|me::ma,pa,sa,mu`,
  `2::0::Prelectura::Sílabas la le li lo lu::la le li lo lu\nta te ti to tu\nda de di do du::¿Cuál tiene la letra t?|ta|la|da\n¿Cuál es una sílaba con d?|do|lo|tu\n¿Cuál termina en i?|li|la|lu::la,ta,da,li`,
  `3::0::Prelectura::Sílabas na fa ra::na ne ni no nu\nfa fe fi fo fu\nra re ri ro ru::¿Cuál tiene la letra f?|fa|na|ra\n¿Cuál empieza por r?|ro|no|fo\n¿Cuál termina en e?|ne|ni|nu::na,fa,ra,ro`,
  `4::0::Prelectura::Sílabas inversas::al el il ol ul\nas es is os us::¿Cuál es una sílaba inversa?|al|ma|pa\n¿Cuál termina en s?|os|ol|ul\n¿Cuál empieza por e?|el|al|il::al,el,os,as`,
  `5::0::Prelectura::Trabadas bra bre bri::bra bre bri bro bru::¿Qué letra va antes de la r?|b|p|m\n¿Cuál termina en i?|bri|bra|bru\n¿Cuál empieza por b?|bro|pro|tro::bra,bre,bri`,
  `6::0::Prelectura::Trabadas cra cre cri::cra cre cri cro cru::¿Cuál tiene la letra c?|cra|bra|tra\n¿Cuál termina en o?|cro|cri|cru\n¿Cuántas sílabas hay?|cinco|dos|diez::cra,cre,cro`,
  `7::0::Prelectura::Trabadas fla fle fli::fla fle fli flo flu::¿Qué letra empieza en flo?|f|p|l\n¿Cuál termina en u?|flu|fla|fle\n¿Cuál tiene la letra l?|fli|bra|tro::fla,fli,flo`,
  `8::0::Prelectura::Trabadas pra pre pri::pra pre pri pro pru::¿Cuál empieza por p?|pra|tra|cra\n¿Cuál termina en i?|pri|pro|pru\n¿Qué letra va antes de la r?|p|b|f::pra,pre,pri`,
  `9::0::Prelectura::Trabadas tra tre tri::tra tre tri tro tru::¿Cuál tiene la letra t?|tra|pra|bra\n¿Cuál termina en u?|tru|tro|tri\n¿Cuál empieza por tr?|tre|pre|bre::tra,tre,tru`,
  `10::0::Prelectura::Palabras de una sílaba::pan sol mar\nluz sal mes::¿Cuál brilla de día?|sol|pan|sal\n¿Cuál se come?|pan|mar|mes\n¿Cuál da luz?|luz|sal|mar::pan,sol,mar,luz`,
  `11::0::Prelectura::Palabras de dos sílabas::ca-sa me-sa\npe-rro ga-to\nli-bro flo-r::¿Cuál es un animal?|pe-rro|ca-sa|me-sa\n¿Cuál se lee?|li-bro|ga-to|me-sa\n¿Cuántas sílabas tiene ca-sa?|dos|tres|una::casa,mesa,perro,gato`,
  `12::0::Prelectura::Mis primeras frases::El sol.\nLa luna.\nEl perro corre.\nLa flor.::¿Qué corre?|el perro|el sol|la flor\n¿Qué sale de noche?|la luna|el sol|el pan\n¿De qué color puede ser la flor?|roja|azul o roja|negra::sol,luna,perro,flor`,
  `13::1::Cuento::El gato y el ratón::El gato mira al ratón.\nEl ratón corre a su agujero.\nEl gato se queda mirando.\nEl ratón está a salvo.::¿Dónde se esconde el ratón?|en su agujero|en el jardín|en la mesa\n¿Qué hace el gato?|mira|duerme|come\n¿Cómo acaba el ratón?|a salvo|triste|mojado::gato,ratón,agujero,mirar`,
  `14::1::Rima::Pim pam pum::Pim, pam, pum,\ncolores de pintura.\nPim, pam, pum,\nqué linda hermosura.::¿De qué son los colores?|de pintura|de comida|de ropa\n¿Qué palabra rima con pum?|hermosura|pum|mesa\n¿Cómo suena el golpe?|pim pam pum|tic tac|miau::pintar,colores,pum`,
  `15::1::Adivinanza::La pera::Blanca por dentro,\nverde por fuera.\nSi quieres que te lo diga,\nespera.::¿Qué fruta es?|la pera|la manzana|el limón\n¿De qué color es por fuera?|verde|roja|azul\n¿De qué color es por dentro?|blanca|verde|negra::pera,verde,blanca,fruta`,
  `16::1::Trabalenguas::Tres tristes tigres::Tres tristes tigres\ntragaban trigo en un trigal.\nEn tres tristes trastos.::¿Cuántos tigres hay?|tres|dos|cuatro\n¿Qué comían?|trigo|pan|carne\n¿Dónde estaban?|en un trigal|en el mar|en casa::tigre,trigo,trigal`,
  `17::1::Instructivo::Lavarse las manos::1. Moja tus manos.\n2. Pon jabón.\n3. Frota veinte segundos.\n4. Enjuaga y seca.::¿Qué pones después de mojar?|jabón|agua|crema\n¿Cuánto tiempo frotas?|veinte segundos|cinco minutos|una hora\n¿Qué haces al final?|secar|mojar|jabón::agua,jabón,lavar,toalla`,
  `18::1::Diálogo::En el parque::Ana: ¿Jugamos?\nLuis: Sí, a la pelota.\nAna: ¡Tira la pelota!\nLuis: ¡Gol!::¿A qué juegan?|a la pelota|a las cartas|al escondite\n¿Quién marca gol?|Luis|Ana|el perro\n¿Dónde juegan?|en el parque|en la cama|en el baño::jugar,pelota,parque,amigo`,
  `19::1::Canción::Estrellita::Estrellita, ¿dónde estás?\nMe pregunto qué serás.\nEn el cielo y en el mar,\nun diamante de verdad.::¿Dónde está la estrellita?|en el cielo|en la casa|en el colegio\n¿Con qué se compara?|un diamante|una pelota|una manzana\n¿De qué habla la canción?|de una estrella|de un perro|de un coche::estrella,cielo,mar`,
  `20::1::Cuento::La semilla::Una semilla cayó en la tierra.\nLlovió muchos días.\nSalió un tallo verde.\nDespués salió una flor roja.::¿Qué cayó en la tierra?|una semilla|una piedra|una hoja\n¿Qué salió primero?|un tallo verde|una flor|un árbol\n¿De qué color era la flor?|roja|azul|blanca::semilla,tierra,lluvia,flor`,
  `21::1::Adivinanza::El reloj::Tiene agujas y no sabe coser.\nTiene números y no sabe leer.::¿Qué es?|el reloj|la regla|el libro\n¿Qué tiene el reloj?|agujas y números|alas|ruedas\n¿Para qué sirve?|para saber la hora|para comer|para dormir::reloj,números,hora`,
  `22::1::Rima::Debajo de un botón::Debajo de un botón, ton, ton,\nque encontró Martín, tin, tin,\nhabía un ratón, ton, ton,\nay, qué chiquitín.::¿Qué encontró Martín?|un ratón|un gato|un perro\n¿Dónde estaba?|debajo de un botón|en el mar|en la cama\n¿Cómo era el ratón?|chiquitín|grande|largo::botón,ratón,pequeño`,
  `23::1::Informativo::El arcoíris::El arcoíris tiene siete colores.\nSale cuando llueve y hace sol.\nLos colores son rojo, naranja, amarillo, verde, azul, añil y violeta.::¿Cuántos colores tiene?|siete|cinco|diez\n¿Cuándo sale?|cuando llueve y hace sol|de noche|cuando nieva\n¿Cuál es un color del arcoíris?|verde|negro|gris::arcoíris,lluvia,sol,colores`,
  `24::1::Cuento::El patito que quería volar::El patito quería volar.\nCorrió y movió sus alas.\nSaltó otra vez más fuerte.\nPor fin hizo un vuelo corto.\nEl patito se puso contento.::¿Qué quería el patito?|volar|nadar|dormir\n¿Qué movió para volar?|las alas|las patas|la cola\n¿Cómo se sintió al final?|contento|triste|enfadado::pato,volar,alas,contento`,
  `25::2::Fábula::La liebre y la tortuga::La liebre corría muy rápido y se burlaba de la tortuga.\nLas dos hicieron una carrera.\nLa liebre se tumbó a dormir a mitad del camino.\nLa tortuga siguió andando sin parar.\nCuando la liebre despertó, la tortuga ya estaba en la meta.\nLa constancia gana a la prisa.::¿Quién ganó la carrera?|la tortuga|la liebre|el zorro\n¿Qué hizo la liebre a mitad del camino?|dormir|comer|nadar\n¿Qué enseñanza deja?|la constancia gana a la prisa|correr es malo|dormir es bueno::liebre,tortuga,carrera,meta`,
  `26::2::Fábula::El león y el ratón::Un ratón despertó a un león dormido.\nEl león lo atrapó, pero el ratón prometió ayudarle algún día.\nEl león lo dejó marchar.\nDías después el león quedó atrapado en una red.\nEl ratón royó las cuerdas y lo liberó.\nNadie es demasiado pequeño para ayudar.::¿Qué prometió el ratón?|ayudarle algún día|comer con él|dormir juntos\n¿Cómo ayudó al león?|royó la red|lo despertó|le dio agua\n¿Qué le pasó al león?|quedó atrapado en una red|se perdió|se durmió::león,ratón,red,ayudar`,
  `27::2::Fábula::La cigarra y la hormiga::La cigarra cantó todo el verano.\nLa hormiga guardó comida en su hormiguero.\nLlegó el invierno y la cigarra tuvo hambre.\nLa hormiga compartió su comida con ella.\nLa cigarra aprendió a preparar el mañana.::¿Qué hizo la cigarra en verano?|cantar|trabajar|dormir\n¿Qué guardó la hormiga?|comida|agua|hojas\n¿Qué hizo la hormiga en invierno?|compartió su comida|se fue de viaje|cerró la puerta::cigarra,hormiga,comida,invierno`,
  `28::2::Cuento::El planeta del principito::El principito vivía en un planeta muy pequeño.\nCada mañana limpiaba sus volcanes.\nTambién cuidaba una rosa con mucho cariño.\nUn día decidió viajar para conocer otros mundos.\nAl marcharse entendió que su rosa era única.::¿Qué cuidaba el principito?|una rosa|un perro|un árbol\n¿Qué limpiaba cada mañana?|sus volcanes|su casa|sus zapatos\n¿Por qué se fue de viaje?|para conocer otros mundos|para buscar comida|para dormir::planeta,rosa,volcán,viajar`,
  `29::2::Poema::Un elefante::Un elefante se balanceaba\nsobre la tela de una araña.\nComo veía que resistía,\nfue a llamar a otro elefante.::¿Sobre qué se balanceaba?|sobre la tela de una araña|sobre una silla|sobre el agua\n¿A quién llamó?|a otro elefante|a un ratón|a su mamá\n¿Cuántos elefantes hay al final?|dos|uno|tres::elefante,araña,tela`,
  `30::2::Trabalenguas::Pablito y el clavito::Pablito clavó un clavito.\n¿Qué clavito clavó Pablito?\nPablito clavó un clavito\nen la tabla de un calvito.::¿Qué clavó Pablito?|un clavito|un tornillo|una piedra\n¿Dónde lo clavó?|en la tabla|en la pared|en el suelo\n¿Qué sonido se repite?|cl|tr|br::clavito,tabla,Pablito`,
  `31::2::Diálogo::En la panadería::Cliente: Buenos días, quiero pan.\nPanadero: ¿Cuántas barras quiere?\nCliente: Dos, por favor.\nPanadero: Aquí tiene. Son dos euros.\nCliente: Gracias, hasta luego.::¿Qué compra el cliente?|pan|leche|fruta\n¿Cuántas barras pide?|dos|tres|cinco\n¿Cuánto cuesta?|dos euros|un euro|tres euros::pan,panadería,dinero`,
  `32::2::Instructivo::Plantar una semilla::1. Llena una maceta con tierra.\n2. Haz un agujero pequeño con el dedo.\n3. Pon la semilla y tápala.\n4. Riega con un poco de agua.\n5. Pon la maceta cerca de la ventana.::¿Qué se pone en la maceta?|tierra|piedras|papel\n¿Qué necesita la semilla para crecer?|agua y luz|solo oscuridad|jabón\n¿Dónde se coloca la maceta?|cerca de la ventana|dentro del armario|en el baño::maceta,tierra,semilla,regar`,
  `33::2::Informativo::Animales vertebrados::Los animales vertebrados tienen huesos por dentro.\nSe reparten en cinco grupos: mamíferos, aves, reptiles, anfibios y peces.\nLas personas somos mamíferos.\nLos mamíferos beben leche de su madre cuando son pequeños.::¿Qué tienen los vertebrados?|huesos|plumas|escamas\n¿Cuántos grupos hay?|cinco|dos|diez\n¿A qué grupo pertenecen las personas?|mamíferos|aves|peces::vertebrado,huesos,mamífero`,
  `34::2::Cuento::La gallina de los huevos de oro::Una gallina ponía cada día un huevo de oro.\nEl granjero vendía los huevos y tenía dinero.\nPero quiso tener todos los huevos de una vez.\nAbrió a la gallina y no encontró nada.\nSe quedó sin gallina y sin huevos.::¿Qué ponía la gallina?|un huevo de oro|un huevo blanco|monedas\n¿Por qué el granjero abrió a la gallina?|quería todos los huevos a la vez|quería lavarla|quería curarla\n¿Cómo terminó la historia?|se quedó sin gallina y sin huevos|se hizo rico|compró otra gallina::gallina,oro,granjero,dinero`,
  `35::2::Adivinanza::El plátano::Oro parece,\nplata no es.\nEl que no lo adivine,\nbien tonto es.::¿Qué fruta es?|el plátano|la naranja|el limón\n¿De qué color es?|amarillo|azul|verde oscuro\n¿Se come?|sí|no|solo se mira::plátano,oro,fruta`,
  `36::2::Rima::Aserrín aserrán::Aserrín, aserrán,\nlos maderos de San Juan.\nPiden pan, no les dan,\npiden queso, les dan hueso.::¿Qué piden primero?|pan|queso|agua\n¿Qué les dan al final?|hueso|pan|queso\n¿De quién son los maderos?|de San Juan|de San Pedro|del molino::madera,pan,queso`,
  `37::3::Informativo::El ciclo del agua::El sol calienta el agua del mar y de los ríos. El agua se convierte en vapor y sube al cielo. A esto se le llama evaporación.\nArriba el vapor se enfría y forma las nubes. Cuando las gotas se juntan y pesan mucho, caen en forma de lluvia o de nieve.\nEl agua vuelve a los ríos y al mar. Así empieza otra vez el ciclo.::¿Qué provoca la evaporación?|el calor del sol|el viento|la luna\n¿Qué se forma cuando el vapor se enfría?|nubes|piedras|arcoíris\n¿A dónde vuelve el agua al final?|a los ríos y al mar|al desierto|a las casas::agua,sol,nube,lluvia,río`,
  `38::3::Informativo::El sistema solar::El sistema solar tiene ocho planetas que giran alrededor del Sol.\nLa Tierra es el tercer planeta y es el único donde sabemos que hay vida.\nMercurio y Venus están más cerca del Sol, por eso son muy calientes.\nJúpiter es el planeta más grande de todos.::¿Cuántos planetas hay?|ocho|cinco|doce\n¿Qué lugar ocupa la Tierra?|el tercero|el primero|el octavo\n¿Cuál es el planeta más grande?|Júpiter|Mercurio|Marte::planeta,Sol,Tierra,Júpiter`,
  `39::3::Instructivo::Receta de sándwich::Necesitas dos rebanadas de pan, jamón y queso.\n1. Coloca las dos rebanadas sobre un plato.\n2. Pon el jamón y el queso sobre una rebanada.\n3. Tapa con la otra rebanada.\n4. Corta por la mitad con ayuda de una persona adulta.\n5. Come despacio y disfruta.::¿Cuántas rebanadas de pan se usan?|dos|una|cuatro\n¿Qué se pone dentro?|jamón y queso|lechuga y tomate|solo pan\n¿Quién ayuda a cortar?|una persona adulta|nadie|el perro::pan,jamón,queso,plato`,
  `40::3::Noticia::Limpieza en el parque::Ayer por la mañana los vecinos del barrio se reunieron para limpiar el parque.\nRecogieron plásticos del suelo y plantaron tres árboles nuevos.\nEl ayuntamiento trajo bolsas y guantes para todos.\nPor la tarde merendaron juntos y el parque quedó limpio.::¿Qué hicieron los vecinos?|limpiar el parque|pintar las casas|jugar al fútbol\n¿Cuántos árboles plantaron?|tres|diez|ninguno\n¿Quién trajo bolsas y guantes?|el ayuntamiento|el colegio|la tienda::vecinos,parque,árbol,limpiar`,
  `41::3::Científico::La fotosíntesis::Las plantas fabrican su propio alimento y no necesitan comer como los animales.\nPara hacerlo usan la luz del sol, el agua de la tierra y un gas del aire llamado dióxido de carbono.\nEste proceso se llama fotosíntesis y ocurre sobre todo en las hojas.\nDurante la fotosíntesis la planta suelta oxígeno, que es el gas que respiramos.::¿Qué usan las plantas para fabricar alimento?|luz, agua y un gas del aire|solo tierra|carne y pan\n¿Dónde ocurre la fotosíntesis?|en las hojas|en las raíces|en las flores\n¿Qué gas suelta la planta?|oxígeno|humo|helio::planta,luz,hoja,oxígeno`,
  `42::3::Informativo::Estados de la materia::La materia puede estar en tres estados: sólido, líquido y gaseoso.\nUna piedra es sólida porque mantiene su forma.\nEl agua es líquida porque se adapta al recipiente.\nEl aire es gaseoso y no lo vemos.\nEl hielo es agua en estado sólido y se derrite con el calor.::¿Qué estado tiene una piedra?|sólido|líquido|gaseoso\n¿Qué estado tiene el aire?|gaseoso|sólido|líquido\n¿Qué le pasa al hielo con el calor?|se derrite|se congela|desaparece::materia,sólido,líquido,hielo`,
  `43::3::Instructivo::Cuidar a un perro::Un perro necesita comida fresca cada día y agua limpia siempre.\nTambién necesita paseos para moverse y oler.\nHay que llevarlo al veterinario para las vacunas.\nUn perro cuidado y con cariño es un perro feliz.::¿Qué necesita el perro cada día?|comida y agua limpia|solo juguetes|televisión\n¿Para qué sirve el paseo?|para moverse y oler|para dormir|para comer\n¿Quién le pone las vacunas?|el veterinario|el panadero|el maestro::perro,agua,paseo,veterinario`,
  `44::3::Diálogo::Preparando el viaje::Madre: ¿Has hecho la maleta?\nHijo: Sí, he metido la ropa y el cepillo de dientes.\nMadre: No olvides el abrigo, hará frío por la noche.\nHijo: Vale, lo pongo arriba del todo.\nMadre: Buen viaje, te quiero mucho.::¿Qué lleva el hijo en la maleta?|ropa y cepillo|juguetes|libros\n¿Qué le recuerda la madre?|el abrigo|la pelota|el paraguas\n¿Por qué necesita abrigo?|hará frío por la noche|va a llover|va a nevar en el coche::maleta,ropa,abrigo,viaje`,
  `45::3::Informativo::Los dinosaurios::Los dinosaurios vivieron en la Tierra hace millones de años.\nAlgunos eran enormes, como el Diplodocus, y otros pequeños, como el Compsognathus.\nUnos comían plantas y otros comían carne.\nSe extinguieron hace muchísimo tiempo y hoy conocemos sus huesos por los fósiles.::¿Cuándo vivieron los dinosaurios?|hace millones de años|hace cien años|viven hoy\n¿Cómo se llaman los restos de sus huesos?|fósiles|minerales|semillas\n¿Qué comían algunos dinosaurios?|plantas y otros carne|solo pan|solo fruta::dinosaurio,fósil,planta`,
  `46::3::Noticia::Un árbol nuevo en el colegio::El colegio CEIP La Ardila ha recibido un árbol frutal de regalo.\nLos alumnos de tercero lo plantaron en el patio con ayuda del conserje.\nRegarán el árbol por turnos cada semana.\nEsperan recoger sus primeros frutos el año que viene.::¿Qué recibió el colegio?|un árbol frutal|una bicicleta|un ordenador\n¿Dónde lo plantaron?|en el patio|en el aula|en el tejado\n¿Quién regará el árbol?|los alumnos por turnos|el conserje solo|nadie::colegio,árbol,patio,regar`,
  `47::3::Científico::Por qué llueve::Dentro de las nubes hay millones de gotas de agua muy pequeñas.\nCuando la nube se enfría, las gotas se juntan unas con otras.\nPoco a poco se hacen más grandes y más pesadas.\nLa gravedad las atrae hacia el suelo y entonces cae la lluvia.::¿Qué hay dentro de las nubes?|gotas de agua|algodón|humo\n¿Qué hace que las gotas caigan?|la gravedad|el viento|el sol\n¿Qué pasa cuando la nube se enfría?|las gotas se juntan|las gotas se van|la nube crece de color::nube,gota,gravedad,lluvia`,
  `48::3::Instructivo::Normas de la biblioteca::1. Entra despacio y saluda en voz baja.\n2. Guarda silencio para que los demás puedan leer.\n3. Cuida los libros y no dobles sus páginas.\n4. Devuelve los libros a tiempo.\n5. Si no encuentras algo, pide ayuda a la bibliotecaria.::¿Cómo hay que hablar en la biblioteca?|en voz baja|gritando|cantando\n¿Qué se hace con los libros?|cuidarlos|doblarlos|pintarlos\n¿A quién pides ayuda?|a la bibliotecaria|al conserje|al médico::biblioteca,silencio,libro,ayuda`,
  `49::4::Biografía::Marie Curie::Marie Curie fue una científica pionera nacida en Polonia en 1867.\nDe joven se mudó a Francia para poder estudiar en la universidad.\nInvestigó materiales que emitían una energía invisible y descubrió el radio y el polonio.\nFue la primera mujer en recibir un Premio Nobel y la única persona en ganarlo en dos ciencias distintas: Física y Química.\nSu trabajo ayudó después a desarrollar máquinas de rayos X para los hospitales.::¿Dónde nació Marie Curie?|en Polonia|en Francia|en España\n¿En qué ciencias ganó el Nobel?|Física y Química|Medicina y Literatura|Matemáticas y Arte\n¿Qué elementos descubrió?|radio y polonio|oro y plata|oxígeno e hidrógeno\n¿Para qué sirvió su trabajo en los hospitales?|para los rayos X|para operar|para cocinar::científica,Polonia,Nobel,radio`,
  `50::4::Teatro::Escena en el aula::PROFE: Abrid el libro de matemáticas por la página veinte.\nALUMNO 1: Profe, he olvidado el libro en casa.\nALUMNO 2: Puede mirar el mío y trabajamos juntos.\nPROFE: Buena idea. Compartir también es aprender.\nALUMNO 1: Gracias, la próxima vez lo traeré.::¿Qué olvidó el Alumno 1?|el libro|el lápiz|la mochila\n¿Qué propone el Alumno 2?|compartir su libro|irse a casa|cambiar de sitio\n¿Qué página deben abrir?|la veinte|la diez|la treinta\n¿Qué dice la profe sobre compartir?|que también es aprender|que está prohibido|que es aburrido::aula,libro,compartir,aprender`,
  `51::4::Divulgativo::Las abejas y las flores::Las abejas son insectos pequeños pero muy importantes.\nCuando una abeja entra en una flor para beber su néctar, se le pega polen en el cuerpo.\nAl volar a otra flor lleva ese polen consigo y la planta puede formar semillas y frutos.\nEste viaje del polen se llama polinización.\nSin abejas tendríamos muchas menos frutas y verduras en la mesa.::¿Qué bebe la abeja de la flor?|néctar|agua del mar|leche\n¿Cómo se llama el viaje del polen?|polinización|evaporación|germinación\n¿Qué pasaría sin abejas?|habría menos frutas y verduras|habría más fruta|no pasaría nada\n¿Qué se le pega a la abeja en el cuerpo?|polen|barro|nieve::abeja,flor,polen,fruta`,
  `52::4::Inferencial::El paraguas olvidado::María salió de casa por la mañana con un sol brillante.\nAl volver del colegio el cielo estaba gris y el suelo mojado.\nBuscó en la mochila y suspiró al verla vacía por dentro.\nMiró la lluvia un momento y después corrió hasta el portal.::¿Qué olvidó María?|el paraguas|la mochila|el abrigo\n¿Qué tiempo hacía al volver?|llovía|hacía sol|nevaba\n¿Por qué suspiró?|porque no tenía paraguas|porque tenía hambre|porque estaba cansada\n¿Cómo llegó al portal?|corriendo bajo la lluvia|andando despacio|en coche::paraguas,lluvia,mochila,correr`,
  `53::4::Biografía::Frida Kahlo::Frida Kahlo fue una pintora mexicana nacida en 1907.\nDe joven sufrió un accidente muy grave que la obligó a pasar mucho tiempo en la cama.\nEmpezó a pintar desde allí y usó un espejo para retratarse a sí misma.\nSus autorretratos están llenos de colores fuertes y de símbolos de su país.\nHoy es una de las artistas más conocidas del mundo.::¿De qué país era Frida Kahlo?|México|España|Italia\n¿Qué tipo de cuadros la hicieron famosa?|autorretratos|paisajes de mar|cuadros de coches\n¿Por qué pintó desde la cama?|por un accidente grave|porque le gustaba dormir|porque llovía\n¿Qué usaba para retratarse?|un espejo|una foto|una ventana::pintora,México,autorretrato,espejo`,
  `54::4::Teatro::La cena sorpresa::PADRE: ¡Huele muy bien en esta casa!\nMADRE: Es tu plato favorito.\nHIJA: ¡Sorpresa! Lo hemos cocinado entre las dos.\nPADRE: Es el mejor regalo de cumpleaños que he tenido.\nHIJA: Y todavía queda tarta.::¿Quién cocinó el plato?|la madre y la hija|solo el padre|un cocinero\n¿Qué se celebra?|un cumpleaños|un examen|una fiesta del colegio\n¿Qué queda por comer?|tarta|sopa|pan\n¿Cómo se siente el padre?|feliz y sorprendido|enfadado|aburrido::cena,sorpresa,cumpleaños,tarta`,
  `55::4::Divulgativo::Los volcanes::Un volcán es una abertura de la corteza de la Tierra.\nPor ella salen materiales muy calientes del interior del planeta.\nCuando esa roca fundida está dentro se llama magma, y cuando sale al exterior se llama lava.\nLos volcanes también lanzan ceniza y gases.\nAunque pueden ser peligrosos, la tierra de sus alrededores es muy fértil para las plantas.::¿Cómo se llama la roca fundida cuando sale?|lava|magma|ceniza\n¿Cómo se llama cuando está dentro?|magma|lava|humo\n¿Por qué es buena la tierra cercana?|es muy fértil|es muy fría|es de color negro\n¿Qué más lanzan los volcanes?|ceniza y gases|agua con sal|nieve::volcán,magma,lava,ceniza`,
  `56::4::Inferencial::La ventana rota::Los niños jugaban a la pelota dentro del salón.\nDe repente se escuchó un golpe muy fuerte y un ruido de cristales.\nLa madre entró corriendo desde la cocina.\nLos dos miraron al suelo sin decir nada, junto a la pelota quieta.::¿Qué se rompió?|la ventana|un plato|una silla\n¿Por qué no debían jugar allí?|porque dentro se puede romper algo|porque era de noche|porque llovía\n¿Cómo se sentían los niños?|avergonzados|contentos|aburridos\n¿Qué provocó el golpe?|la pelota|el viento|el gato::pelota,ventana,salón,romper`,
  `57::4::Biografía::Leonardo da Vinci::Leonardo da Vinci fue un genio del Renacimiento italiano.\nPintó la Mona Lisa, uno de los cuadros más famosos del mundo.\nPero también dibujó máquinas voladoras siglos antes de que existieran los aviones.\nEstudió el cuerpo humano y llenó cuadernos con notas y dibujos.\nPara él el arte y la ciencia eran dos formas de mirar el mismo mundo.::¿Qué cuadro famoso pintó?|la Mona Lisa|La noche estrellada|El grito\n¿Qué dibujó antes de que existiera?|máquinas voladoras|televisores|coches eléctricos\n¿Qué estudiaba en sus cuadernos?|el cuerpo humano|los planetas|los peces\n¿Cómo unía arte y ciencia?|como dos formas de mirar el mundo|no le importaba la ciencia|solo pintaba::Leonardo,Renacimiento,cuaderno,ciencia`,
  `58::4::Teatro::Antes del examen::ALUMNO: Profe, tengo un nudo en el estómago.\nPROFE: Es normal, se llama nervios. Respira hondo conmigo.\nALUMNO: He estudiado, pero se me olvida todo.\nPROFE: Has trabajado bien. Lee despacio y empieza por lo que sabes.\nALUMNO: De acuerdo, lo voy a intentar.::¿Cómo se siente el alumno?|nervioso|enfadado|aburrido\n¿Qué le recomienda la profe?|respirar y leer despacio|correr|dejar el examen\n¿Había estudiado el alumno?|sí|no|solo un poco el recreo\n¿Por dónde le dice que empiece?|por lo que sabe|por lo más difícil|por el final::examen,nervios,respirar,estudiar`,
  `59::4::Divulgativo::El océano::El océano cubre más del setenta por ciento de la superficie del planeta.\nEn él viven seres diminutos como el plancton y animales enormes como la ballena azul.\nLas plantas marinas producen cerca de la mitad del oxígeno que respiramos.\nEl océano también reparte el calor y ayuda a regular el clima.\nPor eso los plásticos que tiramos al agua nos afectan a todos.::¿Qué porcentaje del planeta cubre el océano?|más del setenta|la mitad|el diez\n¿Cuál es el animal más grande que vive en él?|la ballena azul|el delfín|el pulpo\n¿Qué produce el océano que nosotros respiramos?|oxígeno|humo|arena\n¿Qué nos afecta a todos según el texto?|los plásticos en el agua|los barcos|la sal::océano,plancton,ballena,oxígeno`,
  `60::4::Inferencial::El regalo misterioso::La caja era grande pero pesaba muy poco.\nAl agitarla sonaba como papel arrugado.\nJuan sonrió porque sabía lo que había dentro antes de abrirla.\nHabía pedido algo para el viento y para el cielo.\nSalió corriendo al parque con su regalo nuevo.::¿Qué había en la caja?|una cometa|un libro|una pelota\n¿Por qué pesaba poco?|porque era de papel y tela|porque estaba vacía|porque era de piedra\n¿Para qué sirve el regalo?|para volar con el viento|para leer|para comer\n¿A dónde fue Juan?|al parque|al colegio|a la cocina::cometa,caja,viento,parque`,
];

export function parseRawTexts(): ReadingText[] {
  return RAW.map((row) => {
    const p = row.split('::');
    const qs = (p[5] || '')
      .split('\n')
      .map((l) => l.split('|').map((s) => s.trim()))
      .filter((a) => a.length >= 2 && a[0]);

    return {
      id: 'L' + String(p[0]).padStart(2, '0'),
      level: Number(p[1]) as ReadingLevel,
      category: p[2] as ReadingCategory,
      title: p[3],
      text: p[4].replace(/\\n/g, '\n'),
      questions: qs,
      vocab: (p[6] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: ['precargada'],
      collection: 'general',
      favorite: false,
      mode: '',
      pauses: '',
      pre: true,
      own: false,
    };
  });
}

export const PRELOADED_TEXTS: ReadingText[] = parseRawTexts();
