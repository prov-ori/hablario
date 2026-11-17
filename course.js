                                                                     
                                                         
                                                                                                
                                 
                                                         
                                                                                     
                                                       
                                                
                                                         
  
                                                                                                              
                    
                                                                                        
                                                                                   
  
export const courseVersion = 1;
export const skills                        = {
  reading: 'Чтение', listening: 'Аудирование', writing: 'Письмо', speaking: 'Говорение'
};
                                                         
                                          
function choice(id        , skill       , material        , [prompt, answer, first, second, feedback]          )           {
  const options = [first, answer, second];
  const shift = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length;
  return { id, kind: 'choice', skill, material, prompt, answer, options: [...options.slice(shift), ...options.slice(0, shift)], feedback };
}
function open(id        , skill       , [prompt, example, ...criteria]      )           {
  return { id, kind: 'open', skill, prompt, example, criteria, feedback: 'Сверьте ответ с критериями.' };
}
               
                                                                                      
                                                                        
                                                                                                 
  
function lesson({id, level, name, goal, note, context, scene, words, read, listen, write, speak, practice = []}        )       {
  const [audio, ...heard] = listen;
  return {
    id, level, name, goal, note, context, scene,
    cards: words.map(([es, ru, example, register], index) => ({ id: id + '-word-' + (index + 1), unitId: id, es, ru, example, register })),
    exercises: [
      choice(id + '-read', 'reading', scene.map(line => line[0]).join('\n'), read),
      choice(id + '-listen', 'listening', audio, heard),
      ...practice.map(exercise => ({...exercise, id: id + '-' + exercise.id})),
      open(id + '-write', 'writing', write), open(id + '-speak', 'speaking', speak)
    ]
  };
}

const lessons = [
  lesson({
    id:'hola', level:'Pre-A1', name:'¡Hola! Первое знакомство',
    goal:'Поздороваться, назвать своё имя и понять имя собеседника.',
    note:'В hola буква h не произносится. Me llamo буквально означает «я называюсь». ¿Cómo te llamas? подходит для общения на tú, например между участниками разговорного клуба.',
    context:'Ана и Луис знакомятся на занятии.',
    scene:[['¡Hola! Me llamo Ana.','Привет! Меня зовут Ана.'],['Hola, Ana. Me llamo Luis. Mucho gusto.','Привет, Ана. Меня зовут Луис. Приятно познакомиться.']],
    words:[['¡Hola!','Привет!','¡Hola, Ana!'],['Me llamo…','Меня зовут…','Me llamo Luis.'],['Mucho gusto','Приятно познакомиться','Hola, mucho gusto.'],['¿Cómo te llamas?','Как тебя зовут?','¡Hola! ¿Cómo te llamas?','Обращение на tú']],
    read:['Как зовут второго собеседника?','Луис','Ана','Матео','Во второй реплике имя стоит сразу после me llamo.'],
    listen:['¡Hola! Me llamo Sofía. Mucho gusto.','Как зовут собеседницу?','София','Ана','Лусия','После me llamo звучит Sofía.'],
    practice:[
      {id:'match',kind:'match',skill:'reading',prompt:'Сопоставьте реплики с их функциями.',pairs:[['¡Hola!','Здороваюсь'],['Me llamo Ana.','Называю имя'],['Mucho gusto.','Рад знакомству']],feedback:'Hola открывает разговор, me llamo вводит имя, mucho gusto отвечает на знакомство.'},
      {id:'order',kind:'order',skill:'writing',prompt:'Соберите реплику «Привет! Меня зовут Ана».',tokens:['Ana.','llamo','¡Hola!','Me'],answer:'¡Hola! Me llamo Ana.',feedback:'После приветствия поставьте Me llamo, затем имя.'}
    ],
    write:['Поздоровайтесь и назовите своё имя.','¡Hola! Me llamo Irina.','Я поздоровался.','Я назвал имя.'],
    speak:['Поздоровайтесь, представьтесь и спросите имя собеседника.','¡Hola! Me llamo Irina. ¿Cómo te llamas?','Я назвал имя после me llamo.','Я задал вопрос собеседнику.']
  }),
  lesson({
    id:'primer-dia',level:'Pre-A1',name:'Первый день на занятии',goal:'Узнать номер аудитории и попросить повторить инструкцию.',
    note:'Escucha — «послушай», lee — «прочитай». В número ударение падает на nú, знак над гласной показывает его место.',
    context:'Преподаватель рассказывает, где пройдёт урок.',
    scene:[['La clase es en el salón dos.','Урок во второй аудитории.'],['¿Puedes repetir, por favor? En el salón dos, ¿verdad?','Можешь повторить, пожалуйста? Во второй аудитории, верно?']],
    words:[['salón','аудитория','La clase es en el salón dos.','Часто в Мексике'],['repetir','повторять','¿Puedes repetir?'],['por favor','пожалуйста','Repite, por favor.']],
    read:['Что ученик хочет уточнить?','Номер аудитории','Время начала','Имя преподавателя','En el salón dos, ¿verdad? подтверждает номер аудитории.'],
    listen:['La clase es en el salón tres. Escucha y repite.','Какой номер вы услышали?','Три','Два','Один','Tres — три.'],
    practice:[{id:'accent',kind:'input',skill:'writing',prompt:'Допишите слово «аудитория» в реплике El ___ dos. Поставьте ударение.',answers:['salón'],feedback:'В salón ударение падает на последний слог. Поставьте знак над o.'}],
    write:['Напишите, что урок проходит в третьей аудитории.','La clase es en el salón tres.','Я использовал salón.','Я указал верный номер.'],
    speak:['Попросите повторить номер аудитории.','¿Puedes repetir el número, por favor?','Я уточнил, что нужно повторить.','Я использовал por favor.']
  }),
  lesson({
    id:'personas',level:'A1',name:'О себе и других',goal:'Спросить, откуда собеседник, и сказать, где вы живёте.',
    note:'Soy de указывает происхождение, vivo en — место проживания. Сравните ¿De dónde eres? (tú) и ¿De dónde es usted? (usted).',
    context:'Участники языкового клуба обмениваются контактами.',
    scene:[['Soy de Puebla, pero vivo en Querétaro.','Я из Пуэблы, но живу в Керетаро.'],['Yo soy de Mérida. ¿Vives cerca del centro?','Я из Мериды. Ты живёшь недалеко от центра?']],
    words:[['Soy de…','Я из…','Soy de Puebla.'],['vivo en…','я живу в…','Vivo en Querétaro.'],['cerca de','близко от','Vivo cerca del centro.']],
    read:['Где сейчас живёт первый собеседник?','В Керетаро','В Пуэбле','В Мериде','После vivo en называется текущее место жительства.'],
    listen:['Soy de Toluca, pero vivo en la Ciudad de México.','Откуда родом собеседник?','Из Толуки','Из Мехико','Из Пуэблы','Происхождение названо после soy de.'],
    practice:[{id:'accent',kind:'input',skill:'writing',prompt:'Введите вопросительное слово. ¿De ___ eres?',answers:['dónde'],feedback:'В вопросе dónde пишется со знаком ударения.'}],
    write:['В двух фразах скажите, откуда вы и где живёте.','Soy de Tartu. Vivo en Tallin.','Я назвал происхождение через soy de.','Я указал место проживания.'],
    speak:['Представьтесь и спросите собеседника, откуда он.','Soy Irina. Soy de Tartu. ¿De dónde eres?','Я представился.','Я задал вопрос на tú.']
  }),
  lesson({
    id:'hora',level:'A1',name:'Время встречи',goal:'Прочитать расписание и подтвердить встречу.',
    note:'Son las dos — сейчас два часа. A las dos — в два часа. С одним часом используйте es la una и a la una.',
    context:'Друзья выбирают сеанс в кино.',
    scene:[['La función de la tarde empieza a las seis y media.','Вечерний сеанс начинается в половине седьмого.'],['Nos vemos a las seis en la entrada.','Увидимся в шесть у входа.']],
    words:[['a las seis','в шесть','Nos vemos a las seis.'],['y media','с половиной','Son las seis y media.'],['entrada','вход','Te espero en la entrada.']],
    read:['На какое время назначили встречу?','18:00','18:30','06:30','Сеанс начинается в 18:30, а встреча — a las seis.'],
    listen:['La cita es a la una y media de la tarde, en la entrada principal.','Во сколько встреча?','13:30','13:00','14:30','A la una y media — в половине второго.'],
    write:['Подтвердите встречу в пять у входа.','Nos vemos a las cinco en la entrada.','Я указал время через a las.','Я указал место.'],
    speak:['Спросите, во сколько начинается урок.','¿A qué hora empieza la clase?','Я использовал ¿a qué hora?','Я назвал событие.']
  }),
  lesson({
    id:'mercado',level:'A1',name:'Заказ в кафе',goal:'Попросить еду и напиток, уточнить цену и попросить счёт.',
    note:'Quisiera подходит для вежливого заказа. ¿Me trae la cuenta? — обращение к одному человеку на usted. Para llevar значит «с собой».',
    context:'Посетительница делает заказ в кафе.',
    scene:[['Quisiera dos quesadillas y un agua de jamaica, por favor.','Мне две кесадильи и напиток из гибискуса, пожалуйста.'],['Claro. ¿Para aquí o para llevar?','Конечно. Здесь или с собой?']],
    words:[['quisiera','мне бы хотелось','Quisiera dos quesadillas.'],['para llevar','с собой','Un café para llevar.'],['la cuenta','счёт','¿Me trae la cuenta?'],['agua de jamaica','напиток из гибискуса','Quisiera un agua de jamaica.','Распространено в Мексике']],
    read:['Что хочет уточнить сотрудник?','Будет ли заказ с собой','Нужен ли счёт','Сколько кесадилий заказать','Para aquí — здесь, para llevar — с собой.'],
    listen:['Son ochenta pesos. Puede pagar aquí.','Какую сумму назвал сотрудник?','80 песо','18 песо','800 песо','Ochenta — восемьдесят.'],
    write:['Закажите кофе с собой.','Quisiera un café para llevar, por favor.','Я указал напиток.','Я уточнил, что беру его с собой.'],
    speak:['Вежливо попросите счёт и спросите, можно ли оплатить картой.','¿Me trae la cuenta, por favor? ¿Puedo pagar con tarjeta?','Я попросил счёт.','Я спросил об оплате картой.']
  }),
  lesson({
    id:'camino',level:'A1',name:'Как пройти?',goal:'Понять ориентиры и объяснить, где находится нужное место.',
    note:'Hay сообщает о наличии места: hay una farmacia. Está указывает, где конкретное место: la farmacia está junto al metro.',
    context:'Пешеход спрашивает, как пройти к аптеке.',
    scene:[['Disculpe, ¿hay una farmacia cerca?','Извините, здесь есть аптека?'],['Sí. Siga derecho dos cuadras. Está a la izquierda.','Да. Пройдите прямо два квартала. Она слева.']],
    words:[['siga derecho','идите прямо','Siga derecho dos cuadras.','Обращение на usted'],['cuadra','квартал','La farmacia está a dos cuadras.','Часто в Мексике и других странах Америки'],['a la izquierda','слева, налево','Está a la izquierda.']],
    read:['Что нужно сделать сначала?','Пройти прямо два квартала','Сразу повернуть налево','Перейти дорогу','Siga derecho dos cuadras задаёт первый шаг.'],
    listen:['El museo está a la derecha, junto al metro.','Где музей?','Справа, рядом с метро','Слева, рядом с аптекой','Прямо через два квартала','A la derecha — справа, junto al metro — рядом с метро.'],
    practice:[{id:'hay',kind:'input',skill:'writing',prompt:'Подставьте слово. ¿___ una farmacia cerca?',answers:['hay'],feedback:'Hay сообщает о наличии аптеки. Está пригодилось бы, если бы речь шла о конкретной аптеке.'}],
    write:['Объясните, что музей слева, рядом с метро.','El museo está a la izquierda, junto al metro.','Я использовал está.','Я назвал сторону и ориентир.'],
    speak:['Уточните у прохожего, есть ли поблизости станция метро.','Disculpe, ¿hay una estación de metro cerca?','Я вежливо обратился к прохожему.','Я спросил о метро.']
  }),
  lesson({
    id:'semana',level:'A1',name:'Моя неделя',goal:'Обменяться сообщениями о распорядке и договориться о встрече.',
    note:'Los lunes обозначает регулярное действие по понедельникам. El lunes в контексте встречи может указывать на конкретный понедельник.',
    context:'Друзья договариваются о совместном занятии.',
    scene:[['Los lunes trabajo hasta las seis.','По понедельникам я работаю до шести.'],['¿Puedes el martes a las siete?','Можешь во вторник в семь?']],
    words:[['los lunes','по понедельникам','Los lunes trabajo hasta las seis.'],['hasta','до','Trabajo hasta las seis.'],['¿Puedes…?','Можешь…?','¿Puedes el martes?']],
    read:['Какое время предлагает второй собеседник?','Вторник в семь','Понедельник в шесть','Вторник в шесть','El martes a las siete означает «во вторник в семь».'],
    listen:['El jueves no puedo. ¿Nos vemos el viernes después de clase?','На какой день предложили встречу?','На пятницу','На четверг','На субботу','В четверг собеседник занят. Новое предложение — el viernes.'],
    write:['Сообщите, что по средам учитесь до пяти. Предложите четверг.','Los miércoles estudio hasta las cinco. ¿Puedes el jueves?','Я объяснил расписание.','Я предложил другой день.'],
    speak:['Назовите регулярное занятие по понедельникам и предложите встретиться во вторник.','Los lunes trabajo. ¿Nos vemos el martes?','Я назвал обычное занятие.','Я предложил день встречи.']
  }),
  lesson({
    id:'viaje',level:'A2',name:'Поездка на выходные',goal:'Кратко описать события и обстановку в прошлом.',
    note:'Fuimos продвигает рассказ. Llovía и estaba cerrado описывают обстановку или состояние в тот момент.',
    context:'Подруга рассказывает, как изменилась её поездка.',
    scene:[['El sábado fuimos a Puebla. Llovía mucho y el museo estaba cerrado.','В субботу мы поехали в Пуэблу. Шёл сильный дождь, музей был закрыт.'],['Entonces comimos cerca del centro y regresamos temprano.','Тогда мы поели недалеко от центра и рано вернулись.']],
    words:[['entonces','тогда, поэтому','Entonces cambiamos de plan.'],['regresar','возвращаться','Regresamos temprano.'],['estaba cerrado','было закрыто','El museo estaba cerrado.']],
    read:['Почему исходный план не удался?','Музей был закрыт','Кафе не нашлось','Группа опоздала на автобус','Estaba cerrado описывает состояние музея.'],
    listen:['Íbamos al mercado cuando empezó a llover. Entonces entramos a una cafetería.','Что произошло после начала дождя?','Группа зашла в кафе','Группа дошла до рынка','Группа вернулась домой','Entramos a una cafetería обозначает следующее действие.'],
    write:['Опишите прогулку. Назовите событие и деталь обстановки.','El domingo fui al parque. Hacía frío, así que regresé temprano.','Я назвал завершённое событие.','Я описал обстановку.'],
    speak:['Объясните, почему пришлось изменить план и что вы сделали.','Quería ir al museo, pero estaba cerrado. Entonces fui al mercado.','Я объяснил исходный план.','Я назвал причину и новое действие.']
  }),
  lesson({
    id:'aviso',level:'A2',name:'Объявление и новый план',goal:'Понять, что изменилось, и предложить выход.',
    note:'Lo van a cambiar и van a cambiarlo передают один смысл. Lo отсылает к предмету, который уже назван: el refrigerador.',
    context:'Сервис прислал сообщение о доставке холодильника.',
    scene:[['La entrega del refrigerador se cambia al jueves. Confirme antes de las seis.','Доставку переносят на четверг. Подтвердите до шести.'],['El jueves no puedo recibirlo. ¿Lo pueden traer el viernes?','В четверг я не смогу его принять. Можно привезти в пятницу?']],
    words:[['la entrega','доставка','La entrega se cambia al jueves.'],['confirmar','подтверждать','Confirme antes de las seis.'],['recibirlo','получить его','El jueves no puedo recibirlo.']],
    read:['Что нужно сделать до шести?','Подтвердить доставку','Принять холодильник','Оплатить доставку','Confirme — просьба подтвердить.'],
    listen:['Por mantenimiento, la tienda cierra el martes. Abrimos el miércoles a las diez.','Когда магазин снова откроется?','В среду в десять','Во вторник в десять','В четверг в десять','El miércoles a las diez — новое время открытия.'],
    write:['Уточните, могут ли доставить заказ в пятницу утром.','¿Pueden traer el pedido el viernes por la mañana?','Я назвал день и часть дня.','Я сформулировал просьбу.'],
    speak:['Объясните, почему время не подходит, и предложите другой день.','El jueves no estoy en casa. ¿Lo pueden traer el viernes?','Я указал причину.','Я предложил конкретную замену.']
  }),
  lesson({
    id:'reunion',level:'B1',name:'Когда встречу перенесли',goal:'Объяснить последовательность событий и предложить решение.',
    note:'Ya habían cambiado относит событие к более раннему моменту в прошлом. Para que обычно вводит цель с формой subjuntivo: para que todos puedan asistir.',
    context:'Коллеги обсуждают накладку с видеовстречей.',
    scene:[['Cuando me conecté, ya habían cambiado la hora. El aviso llegó después.','Когда я подключился, время уже изменили. Уведомление пришло позже.'],['Aunque alcancé a entrar, sugiero avisar por el chat para que todos puedan asistir.','Я успел подключиться, но предлагаю сообщать в чате, чтобы все могли прийти.']],
    words:[['alcanzar a','успеть сделать','Alcancé a entrar antes de la votación.'],['aunque','хотя','Aunque estaba ocupado, leí el aviso.'],['avisar','сообщить, предупредить','Sugiero avisar por el chat.']],
    read:['Что произошло первым?','Изменили время встречи','Коллега подключился','Пришло уведомление','Ya habían cambiado указывает на действие до подключения.'],
    listen:['Cuando abrimos la sala, ya se había ido la ponente. Por eso grabamos un resumen para quienes no pudieron entrar.','Зачем записали краткий обзор?','Для тех, кто не смог подключиться','Чтобы пригласить докладчицу снова','Чтобы проверить качество звука','Para quienes no pudieron entrar объясняет, кому предназначен обзор.'],
    write:['Объясните накладку в 4–5 предложениях и предложите изменение.','Cuando abrí el enlace, la reunión ya había empezado. El aviso llegó tarde y varios nos quedamos fuera. Propongo mandar un recordatorio para que todos tengan tiempo de conectarse. Podemos probarlo el jueves.','Порядок событий понятен.','Я предложил изменение и объяснил его цель.'],
    speak:['Объясните, что произошло и почему ваш план поможет.','Ya habían cambiado la hora cuando abrí el chat. Propongo confirmar el horario el día anterior para que nadie se quede fuera.','Я последовательно изложил события.','Я связал предложение с проблемой.']
  }),
  lesson({
    id:'vecinos',level:'B1',name:'Разговор с соседями',goal:'Вежливо изложить проблему и найти компромисс.',
    note:'¿Te importaría bajar el volumen? смягчает просьбу. Siempre que вводит условие. При условии на будущее используйте subjuntivo: siempre que terminemos.',
    context:'Соседи обсуждают ремонт во дворе.',
    scene:[['Entiendo que tengan que trabajar, pero el ruido empieza antes de las siete.','Я понимаю, что вам нужно работать, но шум начинается раньше семи.'],['Podemos dejar las tareas más ruidosas para después de las nueve, siempre que terminemos al mediodía.','Мы можем отложить самые шумные работы до девяти при условии, что закончим к полудню.']],
    words:[['siempre que','при условии, что','Podemos hacerlo siempre que haya tiempo.'],['dejar para','отложить до','Dejemos eso para mañana.'],['el ruido','шум','El ruido empieza muy temprano.']],
    read:['При каком условии соседи отложат шумные работы?','Если закончат к полудню','Если начнут ещё раньше','Если перенесут работы на другой день','Siempre que terminemos al mediodía формулирует условие.'],
    listen:['Podemos limpiar el patio el sábado, pero solo si conseguimos las llaves el viernes. Si no, será el lunes.','Какое условие нужно выполнить для уборки в субботу?','Получить ключи в пятницу','Закончить уборку в пятницу','Подтвердить понедельник','Solo si conseguimos las llaves el viernes задаёт условие.'],
    write:['Напишите соседям о шуме и предложите время, которое учитывает интересы обеих сторон.','Hola. Entiendo que necesiten terminar el trabajo. El ruido de la mañana dificulta mis reuniones. ¿Podrían empezar a las diez? Puedo avisarles qué días tengo llamadas temprano.','Я объяснил, как мешает шум.','Просьба конкретна и вежлива.'],
    speak:['Попросите перенести шумные работы и ответьте на возражение о срочности ремонта.','Entiendo que sea urgente. ¿Qué te parece si dejas las tareas más ruidosas para después de las nueve y empiezas con lo demás?','Я отреагировал на возражение.','Я предложил конкретный компромисс.']
  }),
  lesson({
    id:'ciudad',level:'B2',name:'Город и общественный транспорт',goal:'Различить позиции участников и обосновать своё предложение.',
    note:'Si hubiera más rutas, se reduciría… описывает гипотезу. Ahora bien вводит оговорку. En cambio помогает сопоставить позиции.',
    context:'На открытой встрече жители обсуждают автобусные маршруты.',
    scene:[['Ampliar el servicio nocturno ayudaría a quienes salen tarde del trabajo. Ahora bien, una ruta que pasa cada hora difícilmente sustituye al coche.','Расширение ночного сообщения помогло бы тем, кто поздно уходит с работы. Однако автобус раз в час вряд ли заменит автомобиль.'],['Coincido con el objetivo, pero antes de extender la red convendría mejorar la frecuencia en los corredores con mayor demanda.','Я согласен с целью, но сначала стоило бы увеличить частоту рейсов там, где спрос выше.']],
    words:[['ahora bien','однако, при этом','Ahora bien, faltan datos de demanda.','Часто в аргументации'],['la frecuencia','частота','Hay que mejorar la frecuencia.'],['convendría','стоило бы','Convendría medir la demanda.']],
    read:['Какую оговорку делает второй участник?','На загруженных маршрутах сначала нужно увеличить частоту рейсов','Ночные автобусы надо отменить','Покрытие всегда важнее частоты','Antes de extender la red задаёт порядок мер.'],
    listen:['No niego que una tarifa más baja atraería pasajeros. Mi duda es si podríamos sostenerla sin reducir la frecuencia. Si eso ocurriera, perderíamos precisamente a quienes no pueden esperar media hora.','Какое возражение выдвигает участник?','Снижение тарифа может привести к редким рейсам и потере пассажиров','Тариф не влияет на число пассажиров','Частые автобусы гарантированно увеличивают выручку','Говорящий допускает пользу, но ставит вопрос об устойчивости тарифа.'],
    write:['Напишите для районного форума. Сравните расширение сети с ростом частоты рейсов, ответьте на возражение и предложите способ проверить результат.','Apoyo ampliar el servicio, aunque empezaría por aumentar la frecuencia. Esperar cuarenta minutos reduce el valor del servicio. Es cierto que esa medida deja fuera a quienes viven lejos de las paradas. Propongo una prueba en un corredor y un servicio de conexión en otro. Después de seis semanas compararíamos tiempos de espera, nuevos viajes y costo por pasajero.','Я сравнил меры по измеримому критерию.','Я ответил на возражение.','Я предложил способ проверить вывод.'],
    speak:['Передайте оба мнения и обоснуйте порядок действий на встрече.','Una parte pide más cobertura; la otra, mejor frecuencia. Empezaría con una prueba que mida la espera y la cantidad de viajes nuevos. Con esos resultados decidiríamos qué medida ampliar.','Я точно передал обе позиции.','Я обосновал порядок действий.']
  }),
  lesson({
    id:'trabajo',level:'B2',name:'Работа в гибридной команде',goal:'Передать смысл спорного предложения, уточнить условия и выбрать регистр.',
    note:'Cabe señalar вводит оговорку в официальном тексте. В устном обсуждении подойдёт hay que tomar en cuenta.',
    context:'Команда обсуждает сокращение обязательных офисных дней.',
    scene:[['La propuesta reduce los días presenciales, siempre y cuando cada área asegure atención de nueve a cinco.','Предложение сокращает офисные дни при условии, что каждое подразделение обеспечит обслуживание с девяти до пяти.'],['Cabe señalar que la cobertura no basta: necesitamos un plazo de respuesta común y un criterio para las excepciones.','Стоит отметить, что также нужны общий срок ответа и критерий для исключений.']],
    words:[['siempre y cuando','при условии, что','Se aprobará siempre y cuando haya cobertura.'],['cabe señalar','стоит отметить','Cabe señalar que faltan datos.','Формальный регистр'],['el plazo','срок','El plazo de respuesta es de un día.']],
    read:['Какова роль второй реплики?','Добавить критерии к исходному условию','Потребовать отменить обслуживание','Предложить сократить рабочий день','No basta уточняет, чего ещё не хватает.'],
    listen:['Se ha dicho que el cambio no afecta al público, pero esa conclusión solo vale para las consultas habituales. Queda por ver qué pasa con los casos urgentes.','Как говорящий оценивает исходный вывод?','Он применим к обычным запросам, срочные ещё надо проверить','Он неверен для всех запросов','Он доказывает, что срочные запросы стали быстрее','Solo vale restringe la conclusión a las consultas habituales.'],
    write:['Подготовьте рабочую записку. Передайте условия пилота, обозначьте риск и предложите критерий решения.','Propongo una prueba de un mes, siempre y cuando cada área garantice atención de nueve a cinco. El riesgo es confundir cobertura con respuesta efectiva. Conviene separar los casos habituales de los urgentes y comparar los plazos con los del mes anterior. Si las urgencias se retrasaran, revisaríamos las guardias antes de extender el cambio.','Я сохранил условия предложения.','Я обосновал критерий оценки.','Стиль подходит для рабочей записки.'],
    speak:['Сформулируйте оговорку на встрече и предложите, как учитывать срочные запросы.','Estoy de acuerdo con probarlo, pero no sabemos si funciona para las urgencias. Asignaría una guardia y mediría los tiempos por separado.','Я сформулировал границу вывода.','Я предложил способ проверить риск.']
  }),
  lesson({
    id:'familia',level:'A1',name:'Моя семья',goal:'Представить близких и назвать их возраст.',
    note:'Mi, tu и su согласуются по числу с предметом: mi hermano, mis hermanos. Возраст называйте через tener: tiene veinte años.',
    context:'Лусия показывает семейную фотографию.',
    scene:[['Esta es mi hermana Clara. Tiene diecinueve años.','Это моя сестра Клара. Ей девятнадцать.'],['Ellos son mis abuelos. Viven en Oaxaca.','Это мои бабушка и дедушка. Они живут в Оахаке.']],
    words:[['mi hermana','моя сестра','Mi hermana vive en Oaxaca.'],['mis abuelos','мои бабушка и дедушка','Mis abuelos trabajan en casa.'],['tener … años','быть в возрасте … лет','Tiene diecinueve años.']],
    read:['Кто живёт в Оахаке?','Бабушка и дедушка','Клара','Лусия','Viven en Oaxaca относится к mis abuelos.'],
    listen:['Ese es mi hermano Diego. Tiene veintidós años y vive en Puebla.','Сколько лет Диего?','22','12','20','Veintidós — двадцать два.'],
    write:['Коротко представьте двух близких людей. Укажите возраст или город одного из них.','Este es mi hermano Pablo. Tiene veintidós años. Ella es mi abuela Elena.','Я назвал двух людей.','Я указал возраст или город одного из них.'],
    speak:['Покажите воображаемую фотографию и представьте одного человека.','Esta es mi hermana Clara. Vive en Oaxaca.','Я назвал родство.','Я добавил факт о человеке.']
  }),
  lesson({
    id:'vivienda',level:'A1',name:'Комната в аренду',goal:'Прочитать короткое объявление и уточнить условия.',
    note:'Hay un cuarto disponible сообщает, что комната есть. Está en el segundo piso указывает, где она находится. В описании существительное и прилагательное согласуются: cuarto amplio, cocina amplia.',
    context:'Вы ищете комнату и читаете два сообщения от владельца.',
    scene:[['Hay un cuarto amueblado en el segundo piso. La cocina es compartida.','На втором этаже есть меблированная комната. Кухня общая.'],['La renta es de cuatro mil pesos al mes. El agua está incluida.','Аренда — четыре тысячи песо в месяц. Вода включена.']],
    words:[['renta','арендная плата, аренда','¿Cuánto cuesta la renta?','Часто в Мексике'],['cuarto amueblado','меблированная комната','Hay un cuarto amueblado.'],['está incluido','входит в стоимость','El internet está incluido.']],
    read:['Какая услуга явно включена в цену?','Вода','Интернет','Электричество','El agua está incluida означает «вода включена».'],
    listen:['El cuarto está en el primer piso. Puede verlo hoy a las cinco.','Когда можно посмотреть комнату?','Сегодня в пять','Завтра в пять','Сегодня в четыре','Hoy — сегодня, a las cinco — в пять.'],
    write:['Спросите, свободна ли комната и включён ли интернет.','¿Está disponible el cuarto? ¿El internet está incluido?','Я уточнил наличие комнаты.','Я задал вопрос об интернете.'],
    speak:['Уточните цену за месяц и предложите посмотреть комнату завтра.','¿Cuánto cuesta al mes? ¿Puedo ver el cuarto mañana?','Я уточнил цену за месяц.', 'Я спросил о визите завтра.']
  }),
  lesson({
    id:'compras',level:'A1',name:'Покупки на рынке',goal:'Уточнить цену за килограмм, выбрать количество и обратиться к нескольким людям.',
    note:'С двумя незнакомыми сотрудниками можно использовать ustedes: ¿Tienen…? или ¿Aceptan…? Прилагательное согласуется с предметом: mango maduro, mangos maduros.',
    context:'Покупатель обращается к сотрудникам рыночного прилавка.',
    scene:[['Buenos días. ¿Tienen mangos maduros?','Добрый день. У вас есть спелые манго?'],['Sí, el kilo cuesta cuarenta y cinco pesos.','Да, килограмм стоит сорок пять песо.']],
    words:[['el kilo','килограмм','¿Cuánto cuesta el kilo?'],['maduro','спелый','Quiero dos mangos maduros.'],['¿Aceptan tarjeta?','Принимаете карту?','Buenos días, ¿aceptan tarjeta?','Обращение на ustedes или вопрос о правилах магазина']],
    read:['Сколько стоит килограмм манго?','45 песо','54 песо','40 песо','Cuarenta y cinco — сорок пять.'],
    listen:['Son sesenta pesos por dos kilos. Sí aceptamos tarjeta.','Что сообщили об оплате?','Картой можно оплатить','Нужны наличные','Оплата только переводом','Aceptamos tarjeta означает, что магазин принимает карты.'],
    practice:[{id:'agreement',kind:'input',skill:'writing',prompt:'Дополните фразу формой «спелые». Dos mangos ___.',answers:['maduros'],feedback:'Mangos — мужской род, множественное число. Используйте maduros.'}],
    write:['Попросите два килограмма спелых манго и уточните общую сумму.','Dos kilos de mangos maduros, por favor. ¿Cuánto es en total?','Я указал продукт и количество.','Я спросил общую цену.'],
    speak:['Спросите у сотрудников, есть ли спелые манго и принимают ли они карты.','Buenos días. ¿Tienen mangos maduros? ¿Aceptan tarjeta?','Я уточнил наличие.','Я использовал формы обращения на ustedes.']
  }),
  lesson({
    id:'quedamos',level:'A2',name:'Договоримся о встрече',goal:'Сравнить два варианта, уточнить срок и подтвердить план.',
    note:'Más cerca que сравнивает расстояние. Ahorita может указывать на ближайший момент или на менее точный срок. Если время важно, назовите его прямо: ¿En diez minutos?',
    context:'Друзья в Мехико обсуждают, где встретиться.',
    scene:[['La cafetería del parque está más cerca que la de la plaza, pero cierra a las seis.','Кафе у парка ближе, чем кафе на площади, но закрывается в шесть.'],['Ahorita salgo. ¿Nos vemos en la plaza a las seis y cuarto?','Я скоро выхожу. Встретимся на площади в четверть седьмого?']],
    words:[['ahorita','сейчас, скоро, чуть позже — по контексту','Ahorita salgo. ¿Nos vemos en quince minutos?','Разговорное, часто в Мексике'],['más cerca que','ближе чем','El parque está más cerca que la plaza.'],['y cuarto','с четвертью','Son las seis y cuarto.']],
    read:['Почему вариант у парка может не подойти?','Кафе закрывается до предложенного времени','Кафе дальше площади','Чтобы туда попасть, нужен билет','Кафе у парка закрывается в шесть. Встречу предлагают на 18:15.'],
    listen:['El metro tarda menos que el camión. Te espero en la salida norte a las siete y cuarto.','Где и когда предложили встретиться?','У северного выхода в 7:15','У южного выхода в 7:15','У северного выхода в 7:45','Salida norte — северный выход, y cuarto — ещё пятнадцать минут.'],
    write:['Сравните два места. Предложите более удобное и назовите время встречи.','El parque está más cerca que la plaza. ¿Nos vemos en la entrada a las seis?','Я сравнил места.','Я назвал точное место и время.'],
    speak:['Собеседник говорит «Ahorita llego». Уточните время и подтвердите, где будете ждать.','¿Llegas en diez minutos? Te espero en la entrada del parque.','Я уточнил срок.', 'Я подтвердил место.']
  })
];

function exam(level       , passage        , reading            , audio        , listening            , writing      , speaking      )       {
  const id = 'check-' + level.toLowerCase();
  return {
    id, level, name: 'Проверка ' + level, exam: true, cards: [],
    goal: 'Выполнить задания по четырём навыкам и сравнить результаты.',
    exercises: [
      ...reading.map((q,i) => choice(id + '-r' + i, 'reading', passage, q)),
      ...listening.map((q,i) => choice(id + '-l' + i, 'listening', audio, q)),
      open(id + '-w','writing',writing), open(id + '-s','speaking',speaking)
    ]
  };
}

const exams = [
  exam('A1','Hola, soy Mateo. Trabajo cerca del metro. Los martes salgo a las seis. Nos vemos en el café a las siete.',
    [['¿Dónde trabaja Mateo?','Cerca del metro','En el café','En una farmacia','Cerca del metro indica dónde trabaja.'],['¿A qué hora es la cita?','A las siete','A las seis','A las ocho','Sale a las seis. La cita es a las siete.']],
    'La clase empieza a las cinco en el salón cuatro. El salón está a la derecha de la entrada.',
    [['Когда урок?','В пять','В четыре','В шесть','A las cinco — в пять.'],['Где аудитория?','Справа от входа','Слева от входа','Через два квартала','A la derecha de la entrada — справа от входа.']],
    ['Напишите, кто вы, где живёте и когда можете встретиться.','Hola, soy Vera. Vivo en Mérida. Puedo el viernes a las seis.','Я представился и назвал город.','Я предложил день и время.'],
    ['Закажите напиток с собой и спросите цену.','Quisiera un té para llevar, por favor. ¿Cuánto cuesta?','Я назвал напиток и уточнил, что беру его с собой.','Я спросил цену.']),
  exam('A2','Ayer el paquete llegó después de las ocho y la oficina ya estaba cerrada. Podemos entregarlo el miércoles por la mañana. Confirme antes del martes a mediodía.',
    [['Почему заказ не приняли?','Офис был закрыт','Заказ не привезли','Здание не нашли','La oficina ya estaba cerrada объясняет причину.'],['Когда подтвердить доставку?','До полудня вторника','В среду утром','Во вторник после обеда','Antes del martes a mediodía задаёт срок.']],
    'Fuimos al mercado, pero estaba cerrado por mantenimiento. Entonces compramos la fruta en otra tienda. El mercado abre el lunes.',
    [['Где купили фрукты?','В другом магазине','На рынке','В кафе','En otra tienda — в другом магазине.'],['Когда откроется рынок?','В понедельник','В воскресенье','Во вторник','El mercado abre el lunes называет день открытия.']],
    ['Объясните сервису, почему пропустили доставку, и предложите день и время.','Ayer llegué tarde porque el metro estaba cerrado. ¿Pueden traer el paquete el jueves por la mañana?','Я объяснил причину в прошлом.','Я предложил новый срок.'],
    ['Расскажите о поездке. Опишите обстановку и завершённое событие.','El sábado fuimos a Puebla. Hacía calor. Visitamos el museo después de comer.','Я назвал завершённое событие.','Я описал обстановку.']),
  exam('B1','Cuando llegamos al centro cultural, ya habían cancelado el taller. La organizadora pidió que confirmáramos el correo para mandarnos las opciones. Aunque ofreció devolver el dinero, varios preferimos cambiar de fecha.',
    [['Что случилось до прихода участников?','Занятие отменили','Всем вернули деньги','Участники выбрали дату','Ya habían cancelado indica que la cancelación fue anterior.'],['Что предпочли некоторые участники?','Перенести занятие','Забрать деньги','Подать жалобу','Preferimos cambiar de fecha expresa la preferencia.']],
    'Como el salón principal estaba ocupado, movimos el taller al patio. Si vuelve a llover, lo haremos en la biblioteca, siempre que confirmen que hay espacio.',
    [['Почему занятие перенесли во двор?','Аудитория была занята','Дождь уже начался','Библиотеку закрыли','Como introduce la causa.'],['При каком условии выберут библиотеку?','Если подтвердят наличие места','Если отменят занятие','Если освободят двор','Siempre que introduce la condición.']],
    ['Напишите организатору. Объясните последствия отмены, предложите решение и обоснуйте его.','Cuando llegamos, el taller ya se había cancelado. Habíamos viajado desde otra ciudad. Prefiero cambiar de fecha porque todavía me interesa el tema. Le agradecería que nos avisara antes la próxima vez.','Я передал порядок событий.','Я обосновал решение.','Я выбрал вежливый регистр.'],
    ['Перескажите проблему группе и предложите два шага перед следующей встречей.','El salón estaba ocupado y salimos al patio. Sugiero confirmar la reserva y avisar al grupo por el chat para que nadie vaya al lugar equivocado.','Я пересказал причину.','Я предложил два понятных шага.']),
  exam('B2','El piloto amplió el horario de la biblioteca. Aumentaron las visitas, pero la comparación coincide con el periodo de exámenes. Los responsables defienden repetir la prueba en un mes sin exámenes antes de comprometer recursos de manera permanente.',
    [['Почему возможны разные объяснения?','На посещаемость мог повлиять период экзаменов','Посещения не подсчитали','Часы работы сократили','El periodo de exámenes introduce otra explicación posible.'],['¿Qué proponen los responsables?','Repetir la prueba fuera de los exámenes','Cerrar la biblioteca en época de exámenes','Hacer permanente el cambio','Quieren evidencia adicional antes de comprometer recursos.']],
    'Es cierto que el costo por visitante bajó. Aun así, ese cálculo no incluye las horas adicionales del personal. Si se incorporaran, quizá la reducción sería menor, por lo que conviene revisar la metodología antes de comparar las sedes.',
    [['Что ограничивает расчёт?','Не учтены дополнительные часы работы сотрудников','Не измерено число посещений','Учтены только затраты на здание','No incluye las horas adicionales del personal señala la omisión.'],['Что предлагает говорящий?','Уточнить методику до сравнения площадок','Сократить число сотрудников','Отклонить данные о посещениях','Conviene revisar la metodología indica el siguiente paso.']],
    ['Подготовьте записку директору. Укажите результат, две оговорки и условия принятия решения.','Durante el piloto aumentaron las visitas y bajó el costo por usuario según el cálculo actual. Sin embargo, las visitas coincidieron con los exámenes y el costo no incorpora horas extra. Sugiero repetir el piloto fuera de ese periodo y registrar todos los costos laborales. Si la demanda se mantuviera y el costo total fuera aceptable, podríamos ampliar el horario de forma permanente.','Я отделил наблюдение от его возможной причины.','Я учёл обе оговорки.','Условие решения можно проверить.'],
    ['Передайте итог пилота и ответьте на аргумент «рост уже доказывает успех».','Aumentaron las visitas, pero aún no sabemos cuánto se debe al horario y cuánto a los exámenes. Repetiría la prueba fuera de esa temporada antes de tomar una decisión permanente.','Я передал результат.','Я ответил на аргумент с опорой на ограничение данных.','Я предложил следующий шаг.'])
];

export const levels                                                                 = [
  {id:'Pre-A1',name:'Первые слова',status:'Вводный блок'},
  {id:'A1',name:'Испанский на каждый день',status:'Базовый маршрут',future:'В плане больше заданий на числа и самостоятельное общение.'},
  {id:'A2',name:'Быт и поездки',status:'Пилотные уроки',future:'В плане повелительные формы и дополнительные бытовые ситуации.'},
  {id:'B1',name:'Разговор и события',status:'Пилотные уроки',future:'В плане пересказ новостей, выражение мнений и больше разговорной практики.'},
  {id:'B2',name:'Дискуссия и аргументы',status:'Пилотные уроки',future:'В плане разные жанры, более длинное аудирование и интерактивная дискуссия.'}
];
export const units = levels.flatMap(level => [
  ...lessons.filter(item => item.level === level.id), ...exams.filter(item => item.level === level.id)
]);
export const cards = lessons.flatMap(item => item.cards);
