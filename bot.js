const { VK, Keyboard } = require('vk-io');
const { HearManager } = require('@vk-io/hear');
const { QuestionManager } = require('vk-io-question');
const fs = require("fs");
const vk = new VK({
	token: ''
});
const questionManager = new QuestionManager();
const hearManager = new HearManager();
const { lig2 } = require('talisman/metrics/lig');

const accounts = require("./database/accounts.json");
const uid = require("./database/uid.json");
const education = require("./database/education.json");
const autoschool = require("./database/autoschool.json");
const training = require("./database/training.json");
const gangs = require("./database/gangs.json");
const conversations = require("./database/conversations.json");
const achievs = require("./database/achievements.json");
const watch = require("./database/watch.json");
const unknown = require("./database/unknown.json");
const support = require("./database/support.json");
const money = require("./database/money.json");
const enterprises = require("./database/enterprises.json");
const business = require("./database/business.json");

setInterval(() => {
	fs.writeFileSync("./database/accounts.json", JSON.stringify(accounts, null, "\t"));
	fs.writeFileSync("./database/uid.json", JSON.stringify(uid, null, "\t"));
	fs.writeFileSync("./database/gangs.json", JSON.stringify(gangs, null, "\t"));
	fs.writeFileSync("./database/conversations.json", JSON.stringify(conversations, null, "\t"));
	fs.writeFileSync("./database/achievements.json", JSON.stringify(achievs, null, "\t"));
	fs.writeFileSync("./database/watch.json", JSON.stringify(watch, null, "\t"));
	fs.writeFileSync("./database/unknown.json", JSON.stringify(unknown, null, "\t"));
	fs.writeFileSync("./database/support.json", JSON.stringify(support, null, "\t"));
	fs.writeFileSync("./database/money.json", JSON.stringify(money, null, "\t"));
	fs.writeFileSync("./database/enterprises.json", JSON.stringify(enterprises, null, "\t"));
}, 1000);

var user;

vk.updates.on(['chat_invite_user','chat_invite_user_by_link'], message => {
	message.user = message.eventMemberId ? message.eventMemberId : message.senderId;
	let conversation = conversations[message.chatId];
	if (message.user == -187145687) {
		if (!conversations) conversations[message.chatId] = {id: message.chatId};
		message.send(`
⚡ || Доброго времени суток! Спасибо, что пригласили меня в беседу.

🔗 | Полезные ссылки:
  🌐 Наш сайт — http://gorozaninconnect.ru
  🌻 Экосистема «Горожанин» - https://vk.com/gorozaninconnect
  📜 Правила бота — https://vk.com/topic-187145687_43552342

💡 Для настройки беседы выдайте боту права администратора и напишите «Чат».
		`, {keyboard: Keyboard.builder().textButton({label: 'Чат', color: Keyboard.POSITIVE_COLOR}).inline()});
		return message.send({sticker_id: 11692})
	}
	if (message.user <= 0) return;
	vk.api.call('users.get', {
		user_ids: message.user
	}).then(res => {
		return message.send(`
⚡ || Привет, ${uid[message.user] ? nick(accounts.accounts[aid(message.user)]) : res[0].first_name}! 🔥

🔗 | Полезные ссылки:
  🌐 Наш сайт — http://gorozaninconnect.ru
  🌻 Экосистема «Горожанин» - https://vk.com/gorozaninconnect
  📜 Правила бота — https://vk.com/topic-187145687_43552342

💡 Для просмотра всех команд напишите «Помощь».
		`);
	});
});

vk.updates.on('message_event', (message, next) => {
	let command = message.eventPayload.command;
	let player = accounts.accounts[aid(message.userId)];
	let id = message.peerId;
	if (command == 'buy_card') {
		if (player.bank.balance || player.bank.balance === 0) return send(`💳 || ${nick(player)}, вы уже купили карту! ❌`, id);
		if (player.balance < 300) return send(`💳 || ${nick(player)}, недостаточно наличных средств! Стоимость услуги — 300 ₽. ❌`, id);
		if (player.subscriptions && player.subscriptions.bankpass) player.bank.increased_cashback == 4 ? player.bank.cashback.balance += 30 : player.bank.cashback.balance += 3;
		player.bank.balance = 0;
		player.balance -= 300;
		return snackbar(message.eventId, message.userId, id, "Вы успешно купили карту за 300 ₽!");
	} else if (command == 'start_autoschool') {
		if (player.knowledge.drivers_license) return send(`🚦 || ${nick(player)}, вы уже получили водительские права! ❌`, id);
		if (player.autoschool) return send(`🚦 || ${nick(player)}, вы уже обучаетесь в автошколе! ❌\n\n💡 Для посещения учебного дня в автошколе напишите «Автошкола».`, id, Keyboard.builder().textButton({label: 'Автошкола'}).inline());
		if (!player.bank.balance || player.bank.balance < 25000) return send(`🚦 || ${nick(player)}, недостаточно средств на карте, либо карты нет! ❌`, id);
		player.bank.balance -= 25000;
		player.autoschool = {number: 1};
		return snackbar(message.eventId, message.userId, id, "Вы начали обучаться в автошколе. Для посещения учебного дня напишите боту «Автошкола».");
	} else if (command == 'start_training') {
		if (player.knowledge.belt == 6) return send(`🥋 || ${nick(player)}, вы уже получили чёрный пояс и закончили тренироваться! ❌`, id);
		if (player.training) return send(`🥋 || ${nick(player)}, для тренировки напишите «Тренироваться»! ❌`, id, Keyboard.builder().textButton({label: 'Тренироваться'}).inline());
		player.training = {number: 1};
		player.knowledge.belt = 0;
		return snackbar(message.eventId, message.userId, id, "Вы начали ходить на тренировки. Для посещения тренировки напишите боту «Тренироваться».");
	}
});

vk.updates.use(async (message, next) => {
	if (message.is('message') && message.isOutbox) return;
	if (message.senderId < 1 || !message.senderId) return;
	if (/\[club187145687\|(.*)\]/i.test(message.text)) message.text = message.text.replace(/\[club187145687\|(.*)\]/ig, '').replace(/,/g, '').trim();
	message.user = message.senderId;
	if (!conversations[message.chatId] && message.isChat) conversations[message.chatId] = {id: message.chatId};
	if (!money[message.user]) money[message.user] = 0;
	if (!uid[message.user]) {
		accounts.quantity++;
		let num = accounts.quantity;
		watch.accounts[num] = {};
		uid[message.user] = {id: num};
		achievs[num] = {};
		accounts.accounts[num] = {
			idvk: message.user,
			id: num,
			nickname: `Горожанин #${num}`,
			balance: 250000,
			bank: {},
			knowledge: {
				diplomas: []
			},
			property: {},
			gang: {},
			cases: {},
			settings: {
				blacklist: [],
				privacy: {},
				notifications: {}
			}
		}
	}
	user = accounts.accounts[aid(message.user)];
	allowed = /^(аккаунт|акк|профиль|проф|помощь)$/i;
	if (user.fines && user.fines.account_ban && message.isChat && !allowed.test(message.text)) return;
	if (user.fines && user.fines.account_ban && !allowed.test(message.text)) return message.send(`📛 || Нам пришлось заблокировать вас за нарушение правил! Вы можете воспользоваться командами «Поддержка [текст]», «Помощь» и «Аккаунт». ❌`);
	try {
		await next();
	} catch (err) {
		console.error(err);
	}
});

vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

hearManager.hear(/^(помощь|меню|команды)$/i, message => {
	if (user.fines && user.fines.account_ban) return message.send(`🔎 || ${nick(user)}, команды:\n  🌍 «Аккаунт» — всё о вашем аккаунте.\n  ❓ «Поддержка [текст]» — связь с технической поддержкой.`);
	return message.send(`
🔎 || ${nick(user)}, команды:
🤔 | Информация:
  🌍 «Аккаунт» — всё о вашем аккаунте.
  💰 «Баланс» — ваши счета.
  🗄 «Банк» — карта и вклад.

🤓 | Знания:${!user.education ? `\n  📚 «Специальности» — список специальностей для обучения.` : `\n  📚 «Обучение» — информация о текущем обучении.`}${!user.training && !user.knowledge.belt ? `\n  🥋 «Тренировки» — информация о тренировках.` : (user.training ? `\n  🏋🏻 «Тренироваться» — посетить занятие тренировки.` : ``)}${!user.knowledge.drivers_license && !user.autoschool ? `\n  🚦 «Автошкола» — информация о получении водительских прав.` : (user.autoschool ? `\n  🚦 «Автошкола» — посещение учебного дня в автошколе.` : ``)}

😋 | Меню:
  🗂 «Предпринимательство» — помощь по предпринимательству.${user.knowledge.belt ? `\n  ⚔ «Банда помощь» — помощь по блоку «Банды».` : ``}
  🛒 «Магазин» — список разделов доступных для покупки.
  🎈 «Развлечения» — список интересных и полезных команд.

🤖 | Другое:
  ⚒ «Обновление» — информация о последнем обновлении.
  ❓ Поддержка находится тут — https://vk.com/gorozaninsup.
	`);
});

hearManager.hear(/^(?:аккаунт|акк|профиль|проф)\s?([#0-9]+)?/i, message => {
	let time = watch.accounts[user.id];
	let houses = [0,'Дом в лесу','Дом в селе','Дача в городе','Дом в городе','Двухэтажный дом','Трёхэтажный дом','Трёхэтажный дом с бассейном','Коттедж','Особняк'];
	let flats = ['Живёте у друга','Квартира в двухэтажке','Однокомнатная квартира в новом доме','Двухкомнатная квартира в новом доме','Трёхкомнатная квартира в новом доме','Двухуровневая квартира'];
	let cars = [0,'Mercedes-Benz W124','Suzuki Kizashi','Volkswagen Passat CC','Skoda Superb','Mercedes-Benz CLA-Class','Range Rover','Audi A7','BMW 6-Series','Lexus LX570','Porsche Panamera'];
	let garages = [0,'Металлический контейнер во дворе ','Обыкновенный гараж','Гараж во дворе','Ангар'];
	let knives = ['Легендарный нож «Рапира»', 'Эпический нож «Шпага»', 'Редкий нож «Меч»', 0, 'Баллистический нож', 'Керамбит', 'Мачете', 'Нож-секач', 'Разделочный нож', 'Штык-нож'];
	let firearms = ['Легендарное огнестрельное оружие «Крупнокалиберный пулемёт Владимирова»', 'Эпическое огнестрельное оружие «Гранатомёт «РПГ-28»', 'Редкое огнестрельное оружие «Автомат «M16»', 0, '«Автомат Калашникова»', 'Автомат «M16»', 'Гранатомёт «РПГ-7»', 'Пистолет «HK USP»', 'Пулемёт «Negev NG7»', '«Снайперская винтовка Драгунова»'];
	let explosives = ['Легендарная взрывчатка «CL-20»', 'Эпическая взрывчатка «Октоген»', 'Редкая взрывчатка «Астролит»', 0, '«Гексоген»', 'Граната «Ф-1»', '«Пентрит»', '«Тетрил»', '«Тринитротолуол»'];
	let belt_colors = [0, 'белый', 'жёлтый', 'зелёный', 'синий', 'коричневый', 'чёрный'];
	let types_enterprise = [0, 'ИП', 'ООО', 'НАО', 'ПАО'];
	let programs = [0, '«Фундаментальная информатика и информационные технологии»', '«Строительство»', '«Инженер по оборудованию»', '«Инспектор по технике безопасности»', '«Бухгалтерский учёт, анализ и аудит»', '«Современная фотография»', '«Звукорежиссура аудиовизуальных искусств»'];
	if (!message.$match[1]) {
		if (user.fines && user.fines.account_ban) return message.send(`🌍 || Твой аккаунт:\n  🔎 ${nick(user)} (#${user.id})\n\n📛 Нам пришлось заблокировать вас за нарушение правил!\n  ⌛ Блокировка ${time.fines && time.fines.account_ban ? `продлится ещё ${time.fines.account_ban < 3569 ? declination('минут', 'минута', 'минуты', Math.round(time.fines.account_ban/60)) : declination('часов', 'час', 'часа', Math.round(time.fines.account_ban/3600))}` : `выдана навсегда`}.\n  📄 Причина: «${ucFirst(user.fines.reason_ban)}».`);
		return message.send(`
🌍 || Твой аккаунт:
  🔎 ${nick(user)} (#${user.id})${user.partner && accounts.accounts[user.partner].partner == user.id ? `, в браке с ${nick(accounts.accounts[user.partner])}` : ``}${user.enterprise && user.enterprise.id ? `\n  🗂 ${types_enterprise[enterprises.enterprises[user.enterprise.id].type]} «${enterprises.enterprises[user.enterprise.id].title}»${user.enterprise.fraction ? ` — доля ${spaces(user.enterprise.fraction)}%` : ``}` : ``}	${user.gang.id ? `\n  ⚔ Банда «${gangs.gangs[user.gang.id].title}»` : ``}

💰 | Счета:
  💸 Наличные: ${spaces(user.balance)} ₽${(user.bank.balance ? `\n  💳 Банковский счёт: ${spaces(user.bank.balance)} ₽` : ``)}
  🧾 Общая сумма: ${spaces(user.balance+(user.bank.balance ? user.bank.balance : 0))} ₽${user.cases.gifts || user.cases.ordinary || user.cases.rare || user.cases.legendary ? `\n\n🏆 | Награды:${user.cases.gifts ? `\n  🎁 ${declination('подарков', 'подарок', 'подарка', user.cases.gifts)}` : ``}${user.cases.ordinary ? `\n  📦 ${declination('обычных кейсов', 'обычный кейс', 'обычных кейса', user.cases.ordinary)}` : ``}${user.cases.rare ? `\n  📦 ${declination('редких кейсов', 'редкий кейс', 'редких кейса', user.cases.rare)}` : ``}${user.cases.legendary ? `\n  📦 ${declination('легендарных кейсов', 'легендарный кейс', 'легендарных кейса', user.cases.legendary)}` : ``}` : ``}${user.property.house || user.property.flat || user.property.flat === 0 || user.property.car || user.property.garage || user.property.knife || user.property.firearms || user.property.explosives ? `\n\n📜 | Имущество:${user.property.house ? `\n  🏡 ${houses[user.property.house]}` : ``}${user.property.flat || user.property.flat === 0 ? `\n  🏙 ${flats[user.property.flat]}` : ``}${user.property.car ? `\n  🚘 «${cars[user.property.car]}»` : ``}${user.property.garage ? `\n  🏚 ${garages[user.property.garage]}` : ``}${user.property.knife ? `\n  🔪 ${knives[user.property.knife+3]}` : ``}${user.property.firearms ? `\n  🔫 ${firearms[user.property.firearms+3]}` : ``}${user.property.explosives ? `\n  💣 ${explosives[user.property.explosives+3]}` : ``}` : ``}${user.knowledge.diplomas[0] || user.knowledge.drivers_license || user.knowledge.belt ? `\n\n⚖ | Знания:${user.knowledge.diplomas[0] ? `\n  📚 Получен${user.knowledge.diplomas[1] ? 'ы аттестаты' : ' аттестат'} ${user.knowledge.diplomas.map(dip => programs[dip]).join(', ')}` : ``}${user.knowledge.belt ? `\n  🥋 Получен ${belt_colors[user.knowledge.belt]} пояс` : ``}${user.knowledge.drivers_license ? `\n  📄 Получено водительское удостоверение` : ``}` : ``}${user.extensions ? `\n\n🔑 | Дополнения:${user.extensions.nickname_without_end ? `\n  🖊 «Ник без конца»` : ``}` : ``}${user.subscriptions ? `\n\n📝 | Подписки:${user.subscriptions.gangpassplus ? `\n  ⚔ «Gang Pass Plus»` : (user.subscriptions.gangpass ? `\n  ⚔ «Gang Pass»` : ``)}${user.subscriptions.don ? `\n  🍩 Подписка «Дон»` : ``}${user.subscriptions.bankpass ? `\n  💳 «Bank Pass»` : ``}` : ``}${user.fines ? `\n\n📛 | Штрафы:${user.fines.transfer_ban ? `\n  ⛔ Запрещены переводы (ещё ${declination('часов', 'час', 'часа', Math.round(time.fines.banrep/3600))})` : ``}${user.fines.changenick_ban ? `\n  ⛔ Запрещена смена ника (ещё ${declination('часов', 'час', 'часа', Math.round(time.fines.changenick_ban/3600))})` : ``}` : ``}

💡 Для настройки аккаунта напишите «Настройки».
		`, {keyboard: Keyboard.builder().textButton({label: 'Настройки'}).inline()});
	}
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`🌍 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	let privacy = player.settings.privacy;
	if (player.fines && player.fines.account_ban) return message.send(`🌍 || Аккаунт:\n  🔎 ${nick(player)} (#${player.id})\n\n📛 Нам пришлось заблокировать ${nick(player)} за нарушение правил!`);
	if (player.settings.private) return message.send(`🌍 || ${nick(player)} ${gender('закрыл', 'закрыла', player)} свой аккаунт! ❌`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`🌍 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`🌍 || Вы добавили ${nick(player)} в чёрный список! ❌\n\n💡 Для разблокировки напишите «Разблокировать ${player.id}».`, {keyboard: user.settings.blacklist.length < 50 ? Keyboard.builder().textButton({label: `Разблокировать ${player.id}`}).inline() : Keyboard.builder().inline()});
	return message.send(`🌍 || ${user.idvk != player.idvk ? `Аккаунт:` : `Ваш аккаунт от лица других игроков:`}\n  🔎 ${nick(player)} (#${player.id})${player.partner && accounts.accounts[player.partner].partner == player.id ? `, в браке с ${nick(accounts.accounts[player.partner])}` : ``}${player.enterprise && player.enterprise.id ? `\n  🗂 ${types_enterprise[enterprises.enterprises[player.enterprise.id].type]} «${enterprises.enterprises[player.enterprise.id].title}»${player.enterprise.fraction ? ` — доля ${spaces(player.enterprise.fraction)}%` : ``}` : ``}	${player.gang.id ? `\n  ⚔ Банда «${gangs.gangs[player.gang.id].title}»` : ``}${!privacy.invoices ? `\n\n💰 | Счета:\n  💸 Наличные: ${spaces(player.balance)} ₽${(player.bank.balance ? `\n  💳 Банковский счёт: ${spaces(player.bank.balance)} ₽` : ``)}\n  🧾 Общая сумма: ${spaces(player.balance+(player.bank.balance ? player.bank.balance : 0))} ₽` : ``}${!privacy.awards && (player.cases.gifts || player.cases.ordinary || player.cases.rare || player.cases.legendary) ? `\n\n🏆 | Награды:${player.cases.gifts ? `\n  🎁 ${declination('подарков', 'подарок', 'подарка', player.cases.gifts)}` : ``}${player.cases.ordinary ? `\n  📦 ${declination('обычных кейсов', 'обычный кейс', 'обычных кейса',player.cases.ordinary)}` : ``}${player.cases.rare ? `\n  📦 ${declination('редких кейсов', 'редкий кейс', 'редких кейса', player.cases.rare)}` : ``}${player.cases.legendary ? `\n  📦 ${declination('легендарных кейсов', 'легендарный кейс', 'легендарных кейса', player.cases.legendary)}` : ``}` : ``}${!privacy.property && (player.property.house || player.property.flat || player.property.flat === 0 || player.property.car || player.property.garage || player.property.knife || player.property.firearms || player.property.explosives) ? `\n\n📜 | Имущество:${player.property.house ? `\n  🏡 ${houses[player.property.house]}` : ``}${player.property.flat || player.property.flat === 0 ? `\n  🏙 ${flats[player.property.flat]}` : ``}${player.property.car ? `\n  🚘 «${cars[player.property.car]}»` : ``}${player.property.garage ? `\n  🏚 ${garages[player.property.garage]}` : ``}${player.property.knife ? `\n  🔪 ${knives[player.property.knife+3]}` : ``}${player.property.firearms ? `\n  🔫 ${firearms[player.property.firearms+3]}` : ``}${player.property.explosives ? `\n  💣 ${explosives[player.property.explosives+3]}` : ``}` : ``}${!privacy.knowledge && (player.knowledge.diplomas[0] || player.knowledge.drivers_license || player.knowledge.belt) ? `\n\n⚖ | Знания:${player.knowledge.diplomas[0] ? `\n  📚 Получен${player.knowledge.diplomas[1] ? 'ы аттестаты' : ' аттестат'} ${player.knowledge.diplomas.map(dip => programs[dip]).join(', ')}` : ``}${player.knowledge.belt ? `\n  🥋 Получен ${belt_colors[player.knowledge.belt]} пояс` : ``}${player.knowledge.drivers_license ? `\n  📄 Получено водительское удостоверение` : ``}` : ``}${!privacy.extensions && player.extensions ? `\n\n🔑 | Дополнения:${player.extensions.nickname_without_end ? `\n  🖊 «Ник без конца»` : ``}` : ``}${!privacy.subscriptions && player.subscriptions ? `\n\n📝 | Подписки:${player.subscriptions.gangpassplus ? `\n  ⚔ «Gang Pass Plus»` : (player.subscriptions.gangpass ? `\n  ⚔ «Gang Pass»` : ``)}${player.subscriptions.don ? `\n  🍩 Подписка «Дон»` : ``}${player.subscriptions.bankpass ? `\n  💳 «Bank Pass»` : ``}` : ``}${!privacy.penalties && player.fines ? `\n\n📛 | Штрафы:${player.fines.transfer_ban == 1 ? `\n  ⛔ Запрещены переводы (ещё ${declination('часов', 'час', 'часа', Math.round(watch.accounts[player.id].fines.banrep/3600))})` : ``}${player.fines.changenick_ban ? `\n  ⛔ Запрещена смена ника (ещё ${declination('часов', 'час', 'часа', Math.round(watch.accounts[player.id].fines.changenick_ban/3600))})` : ``}` : ``}\n\n${user.settings.blacklist.length < 50 && user.idvk != player.idvk ? `💡 Для добавления ${nick(player)} в чёрный список напишите «Заблокировать ${player.id}».` : ``}`, {keyboard: user.settings.blacklist.length < 50 && user.idvk != player.idvk ? Keyboard.builder().textButton({label: `Заблокировать ${player.id}`}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^настройки$/i, message => {
	let settings = user.settings;
	return message.send(`
⚙ || ${nick(user)}, настройки вашего аккаунта:
  🌍 Аккаунт ${settings.private ? `закрыт` : `открыт`}
  ${settings.notdisturb ? `🔕 Режим «Не беспокоить»` : `🔔 Уведомления включены`}
  🔐 В чёрном списке ${declination('человек', 'человек', 'человека', !user.settings.blacklist.length ? 0 : user.settings.blacklist.length)}

  🔖 Гиперссылка ника ${user.settings.hyperlink ? 'отключена' : 'включена'}

💡 Для смены ника напишите «Ник [новый ник]».
💡 Для ${user.settings.hyperlink ? 'включения' : 'отключения'} гиперссылки ника напишите «Гиперссылка ${user.settings.hyperlink ? 'включить' : 'выключить'}».
	`, {keyboard: Keyboard.builder().textButton({label: 'Настройки приватности'}).row().textButton({label: 'Настройки уведомлений'}).row().textButton({label: 'Чёрный список'}).inline()});
});

hearManager.hear(/^(?:гиперссылка\s)\s?([^]+)?/i, message => {
	let option = message.$match[1];
	if (!option || !/^включить|вкл|выключить|выкл$/i.test(option)) return message.send(`🔖 || Для включения или выключения гиперссылки ника напишите «Гиперссылка [включить/выключить]»! ❌`);
	if (/^включить|вкл$/i.test(option)) {
		if (!user.settings.hyperlink) return message.send(`🔖 || У вас уже включена гиперссылка ника! ❌`);
		delete user.settings.hyperlink;
		return message.send(`🔖 || Вы включили гиперссылку ника. ✔`);
	}
	if (user.settings.hyperlink) return message.send(`🔖 || У вас уже выключена гиперссылка ника! ❌`);
	user.settings.hyperlink = true;
	return message.send(`🔖 || Вы выключили гиперссылку ника. ✔`);
});

hearManager.hear(/^(?:ник\s)\s?([^]+)?/i, message => {
	let nickname = message.$match[1];
	if (!nickname) return message.send(`🔖 || Для смены ника напишите «Ник [имя]»! ❌`);
	if (user.fines && user.fines.changenick_ban) return message.send(`🔖 || Вам выдан временный запрет на смену ника! Штраф продлится ещё ${declination('часов', 'час', 'часа', Math.round(watch.accounts[user.id].fines.changenick_ban/3600))}. ❌`);
	if ((!user.extensions || !user.extensions.nickname_without_end) && nickname.length > 15) return message.send(`🔖 || Ник не может быть длиннее 15 символов! ❌\n\n💡 Вы можете купить товар «Ник без конца», чтобы избавиться от этого ограничения.`, {template: JSON.stringify({"type": "carousel","elements": [{"title":"«Ник без конца»","description":"Неограниченное количество символов в нике!","photo_id":"-187145687_457239277","action":{"type":"open_link","link":"https://vk.com/product-187145687_3266231"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]}]})});
	if (nickname.length > 40) return message.send(`🔖 || Ник не может быть длиннее 40 символов из-за ограничений ВКонтакте! ❌`);
	if (nickname.length < 2) return message.send(`🔖 || Ник должен содержать более одного символа! ❌`);
	if (nickname == user.nickname) return message.send(`🔖 || Ваш новый ник должен отличаться от старого! ❌`);
	for (i in support.questions) if (support.questions[i].type == 'nickname' && support.questions[i].account == user.id && !support.questions[i].status) return message.send(`🔖 || Дождитесь проверки предыдущего ника! ❌`);
	if (user.agent || user.id == 1) {
		user.nickname = nickname;
		return message.send(`🔖 || Вы сменили ник на «${nick(user)}». ✔`);
	}
	support.que_quantity++;
	support.questions[support.que_quantity] = {"type":"nickname","content":nickname,"account":user.id,"status":false};
	for (i in support.agents) send(`🔖 || Заявка на смену ника #${support.que_quantity}\n  📋 Ник: «${nickname}»\n\n💡 Для принятия ника напишите «/allow ${support.que_quantity}».\n💡 Для отклонения ника напишите «/reject ${support.que_quantity} [ID причины]».\n💡 Для блокировки смены ника напишите «/disable nick change ${support.que_quantity} [срок в часах] [причина]».\n💡 Список причин, по которым можно отклонить ник:\n  #1. Нецензурные слова или выражения\n  #2. Оскорбление личности\n  #3. Призыв к противозаконию\n  #4. Разжигание межнациональной розни\n  #5. Выражение ненависти\n  #6. Реклама\n  #7. Запрещённые символы, либо смайлики`, support.agents[i].id);
	return message.send(`🔖 || Ваш новый ник отправлен на модерацию. ✔`);
});

hearManager.hear(/^(?:\/allow)\s([0-9]+)/i, (message, next) => {
	if (message.isChat || !agent(user.idvk)) return next();
	let question = support.questions[message.$match[1]];
	if (!question || !/nickname|gangname|enterprise|trademark/.test(question.type) || question.status) return message.send(`Данные введены неверно, либо вопрос уже решён.`);
	let player = accounts.accounts[question.account];
	let gang = gangs.gangs[question.account];
	question.status = true;
	if (question.type == 'nickname') {
		player.nickname = question.content;
		send(`🔖 || Ваш ник прошёл модерацию. Ник сменён на «${nick(player)}»! ✔`, player.idvk);
		return message.send(`Смена ника разрешена.`);
	} else if (question.type == 'enterprise') {
		if (question.sort != 2 || player.enterprise.cofounders.length == 1) player.enterprise.permission = true;
		if (!watch.accounts[player.id].enterprise && question.sort != 2) watch.accounts[player.id].enterprise = 1;
		if (question.sort == 2) {
			if (!watch.accounts[player.id].enterprise && player.enterprise.cofounders.length == 1) watch.accounts[player.id].enterprise = 1;
			player.enterprise.permissionCofounders = true;
			for (i in player.enterprise.cofounders) if (player.enterprise.cofounders[i] != player.id && accounts.accounts[player.enterprise.cofounders[i]]) notification(`🗂 || Вы приглашены стать соучредителем общества с ограниченной ответственностью «${player.enterprise.title}».\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, 'enterprise', accounts.accounts[player.enterprise.cofounders[i]], Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline());
			watch.accounts[player.id].deregistration = 172800;
		}
		return message.send(`Название предприятия разрешено.`);
	} else if (question.type == 'trademark') {
		let time = watch.enterprises[question.account];
		if (!time.trademark.trademark) time.trademark.trademark = 1;
		time.trademark.permission = true;
		return message.send(`Название товарного знака разрешено.`);
	}
	gang.title = question.content;
	send(`🔖 || Название вашей банды успешно прошло модерацию. ✔`, accounts.accounts[question.id].idvk);
	return message.send(`Смена названия банды разрешено.`);
});

hearManager.hear(/^(?:\/reject)\s([0-9]+)\s([0-9]+)/i, (message, next) => {
	if (message.isChat || !agent(user.idvk)) return next();
	let question = support.questions[message.$match[1]];
	let reason = message.$match[2];
	if (!question || !/nickname|gangname|enterprise|trademark/.test(question.type) || question.status || reason < 1 || reason > 11) return message.send(`Данные введены неверно, либо вопрос уже решён.`);
	let player = accounts.accounts[question.account];
	let gang = gangs.gangs[question.account];
	let reasons = [0, 'Нецензурные слова или выражения', 'Оскорбление личности', 'Призыв к противозаконию', 'Разжигание межнациональной розни', 'Выражение ненависти', 'Реклама', 'Запрещённые символы, либо смайлики', 'Фамилии, имени или отчества не существует', 'Написано не кириллицей', 'Фамилия, имя или отчество состоит не из одного слова', 'Используются запрещённые слова'];
	question.status = true;
	if (question.type == 'nickname') send(`🔖 || Ваш ник не прошёл модерацию по причине «${reasons[reason]}»! ❌`, player.idvk);
	if (question.type == 'enterprise') {
		if (player.enterprise.fraction) player.bank.balance += player.enterprise.fraction;
		delete player.enterprise;
		delete watch.accounts[user.id].enterprise;
		send(`🗂 || Название предприятия не прошло модерацию по причине «${reasons[reason]}»! Регистрация предпринимателськой деятельности отменена. ❌`, player.idvk);
	}
	if (question.type == 'gangname') {
		gang.title = `Банда #${id.account}`;
		send(`🔖 || Название банды не прошло модерацию по причине «${reasons[reason]}»! ❌\n\n💡 Для смены названия банды напишите «Название банды [название]».`, accounts.accounts[question.id].idvk);
	}
	if (question.type == 'trademark') {
		let enterprise = enterprises.enterprises[i];
		enterprise_notification(`® || Товарный знак «${watch.enterprises[enterprise.id].trademark.title}» по причине «${reasons[reason]}».`, 'addreg', enterprise, null, false);
		delete watch.enterprises[enterprise.id].trademark;
	}
	return message.send(`Название запрещено.`);
});

hearManager.hear(/^(?:название банды)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank != 5) return message.send(`⚔ || Для смены названия банды нужно иметь ранг «Создатель банды»! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let title = message.$match[1];
	if (!title) return message.send(`⚔ || Вы не ввели новое название! Используйте «Название банды [название]»! ❌`);
	if (!(/^Банда\s#([0-9]+)$/.test(gang.title))) return message.send(`⚔ || Сменить название банды можно только, если предыдущий вариант названия был отклонён! ❌`);
	for (i in support.questions) if (support.questions[i].type == 'gangname' && support.questions[i].account == gang.id && !support.questions[i].status) return message.send(`⚔ || Дождитесь проверки предыдущего названия! ❌`);
	if (title.length > 20 || title.length < 3) return message.send(`⚔ || Название банды не может быть длиннее 20 символов или короче 3 символов! ❌`);
	if (!checkUniqTittle(title)) return message.send(`⚔ || Название банды должно быть уникально! Попробуйте другое название. ❌`);
	gang.title = title;
	support.que_quantity++;
	let quantity = support.que_quantity;
	support.questions[quantity] = {"type":"gangname","content":title,"id":user.id,"account":id,"status":false};
	for (i in support.agents) send(`⚔ || Заявка на установку название банд #${quantity}\n  📋 Название банды: «${title}»\n\n💡 Для принятия названия банды напишите «/allow ${quantity}».\n💡 Для отклонения названия банды напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название банды:\n  #1. Нецензурные слова или выражения\n  #2. Оскорбление личности\n  #3. Призыв к противозаконию\n  #4. Разжигание межнациональной розни\n  #5. Выражение ненависти\n  #6. Реклама\n  #7. Запрещённые символы, либо смайлики`, support.agents[i].id);
	return message.send(`⚔ || Установлено новое название банды «${title}». ✔`);
});

hearManager.hear(/^(?:\/disable nick change)\s([0-9]+)\s([0-9]+)\s([^]+)/i, (message, next) => {
	if (message.isChat || !agent(user.idvk)) return next();
	let question = support.questions[message.$match[1]];
	let player = accounts.accounts[support.questions[message.$match[1]].account];
	let clock = watch.accounts[player.id];
	let term = Number(message.$match[2]);
	if (!player || term < 1 || question.type != 'nickname' || question.status || question.chat) return message.send(`Данные введены неверно, либо вопрос уже решён.`);
	player.fines ? player.fines.changenick_ban = true : player.fines = {changenick_ban: true};
	clock.fines ? clock.fines.changenick_ban = term*3600 : clock.fines = {changenick_ban: term*3600};
	for (i in support.questions) {
		question = support.questions[i];
		if (question.type == 'nickname' && !question.status && !question.chat && question.account == player.id) {
			question.status = true;
			question.mark = true;
		}
	}
	send(`📛 || Вам запретили менять ник на ${declination('часов', 'час', 'часа', term)} по причине «${message.$match[3]}»! ❌`, player.idvk);
	return message.send(`Вы запретили менять ник игроку на ${declination('часов', 'час', 'часа', term)} по причине «${message.$match[3]}».`);
});

hearManager.hear(/^(?:настройки приватности|приватность)\s?([0-9])?\s?([^]+)?/i, message => {
	let privacy = user.settings.privacy;
	let id = parserId(message.$match[1]);
	let permission = message.$match[2];
	if (!id) {
		return message.send(`
👥 || ${nick(user)}, настройки приватности:
  💰 Кто видит ваши счета — ${!privacy.invoices ? `все` : `никто`} (#1)
  🏆 Кто видит ваши награды — ${!privacy.awards ? `все` : `никто`} (#2)
  📜 Кто видит ваше имущество — ${!privacy.property ? `все` : `никто`} (#3)
  ⚖ Кто видит ваши знания — ${!privacy.knowledge ? `все` : `никто`} (#4)
  🔑 Кто видит ваши дополнения — ${!privacy.extensions ? `все` : `никто`} (#5)
  📝 Кто видит ваши подписки — ${!privacy.subscriptions ? `все` : `никто`} (#6)
  📛 Кто видит ваши штрафы — ${!privacy.penalties ? `все` : `никто`} (#7)

💡 Для просмотра аккаунта игрока напишите «Аккаунт [ID аккаунта]».
💡 Для смены разрешения просмотра напишите «Приватность [ID раздела] [все/никто]».
💡 Для ${user.settings.private ? `открытия` : `закрытия`} аккаунта напишите «${user.settings.private ? `Открыть` : `Закрыть`} аккаунт».
		`);
	}
	let settings = [0, 'invoices', 'awards', 'property', 'knowledge', 'extensions', 'subscriptions', 'penalties'];
	let names = [0, 'счета', 'награды', 'имущество', 'знания', 'дополнения', 'подписки', 'штрафы'];
	if (!Number(id) || id < 1 || id > 7) return message.send(`👥 || Раздела приватности с таким ID не существует! ❌`);
	if (!permission || !/^все|никто$/i.test(permission)) return message.send(`👥 || Разрешение просмотра раздела не указано! Используйте «Приватность [ID раздела] [все/никто]». ❌`);
	permission = /^все$/i.test(permission) ? false : true;
	if (!privacy[settings[id]] && !permission) return message.send(`👥 || Раздел ${names[id]} уже на разрешении «Все»! ❌`);
	if (privacy[settings[id]] && permission) return message.send(`👥 || Раздел ${names[id]} уже на разрешении «Никто»! ❌`);
	permission ? privacy[settings[id]] = true : delete privacy[settings[id]];
	return message.send(`👥 || Для раздела ${names[id]} установлено разрешение «${permission ? 'Никто' : 'Все'}». ✔\n\n💡 Для просмотра своего аккаунта от лица других напишите «Аккаунт ${user.id}».`, {keyboard: Keyboard.builder().textButton({label: `Аккаунт ${user.id}`}).inline()});
});

hearManager.hear(/^(закрыть|открыть)\s(?:аккаунт)$/i, message => {
	let private = /^закрыть$/i.test(message.$match[1]) ? true : false;
	if (user.settings.private && private) return message.send(`🌍 || Ваш аккаунт уже закрыт! ❌`);
	if (!user.settings.private && !private) return message.send(`🌍 || Ваш аккаунт уже открыт! ❌`);
	private ? user.settings.private = true : delete user.settings.private;
	return message.send(`🌍 || Вы ${private ? 'закрыли' : 'открыли'} свой аккаунт. ✔\n\n💡 Для просмотра своего аккаунта от лица других напишите «Аккаунт ${user.id}».`, {keyboard: Keyboard.builder().textButton({label: `Аккаунт ${user.id}`}).inline()});
});

hearManager.hear(/^(?:уведомления банды)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`🔔 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	if (user.gang.privilege < 3) return message.send(`🔔 || Настраивать уведомления банды можно с ранга «Авторитет»! ❌`);
	if (!gang.conversation) return message.send(`🔔 || К вашей банде не привязана беседа! ❌\n\n 💡 Для привязки беседы к банде напишите «Привязать беседу [ID беседы]».`);
	let gangtalk = conversations[gang.conversation].gang;
	if (!/^в беседу$/i.test(message.$match[1]) && !/^(в личные сообщения|в лс)$/i.test(message.$match[1])) return message.send(`🔔 || Введите команду «Уведомления банды [в беседу/в личные сообщения]»! ❌`);
	if (/^в беседу$/i.test(message.$match[1])) {
		if (!gangtalk.notifications) return message.send(`🔔 || Уведомления уже направлены в беседу! ❌`);
		delete gangtalk.notifications;
		return message.send(`🔔 || Уведомления банды направлены в беседу. ✔`);
	} else {
		if (gangtalk.notifications) return message.send(`🔔 || Уведомления уже направлены в личные сообщения! ❌`);
		gangtalk.notifications = true;
		return message.send(`🔔 || Уведомления банды направлены в личные сообщения. ✔`);
	}
});

hearManager.hear(/^(?:настройки уведомлений|уведомления)\s?([0-9]+)?\s?([^]+)?/i, message => {
	let notifications = user.settings.notifications;
	let id = parserId(message.$match[1]);
	let permission = message.$match[2];
	if (!message.$match[1]) {
		return message.send(`
📣 || Настройки уведомлений:
⚔ | Банды:
  ✉ Приглашение в банду — ${!notifications.invitation_gang ? `включено` : `выключено`} (#1)
  🔺 Изменение ранга — ${!notifications.rank ? `включено` : `выключено`} (#2)
  💰 Выигрыш в бою — ${!notifications.winning ? `включено` : `выключено`} (#3)
  ⚔ Уведомления банды — ${!notifications.gang_notification ? `включено` : `выключено`} (#4)

🗄 | Банк:
  💸 Перевод валюты — ${!notifications.transfer ? `включено` : `выключено`} (#5)
  🗃 Вклад — ${!notifications.contribution ? `включено` : `выключено`} (#6)
  📥 Кэшбэк — ${!notifications.cashback ? `включено` : `выключено`} (#7)

📊 | Предпринимательство:
  🗂 Предприятие — ${!notifications.enterprise ? `включено` : `выключено`} (#8)
  🗂 Дополнительные регистрации предприятия — ${!notifications.addreg ? `включено` : `выключено`} (#9)

🖇 | Другое:
  💒 Брак — ${!notifications.proposal ? `включено` : `выключено`} (#10)
  ✅ Выполнение достижения — ${!notifications.achievements ? `включено` : `выключено`} (#11)
  🎁 Получение подарка — ${!notifications.gifts ? `включено` : `выключено`} (#12)
  📢 Рассылка — ${!notifications.mailing ? `включено` : `выключено`} (#13)
  🤝 Передача имущества — ${!notifications.property_transfer ? `включено` : `выключено`} (#14)
  📝 Подписки — ${!notifications.subscriptions ? `включено` : `выключено`} (#15)

💡 Для смена настройки уведомлений напишите «Уведомления [ID раздела] [включить/выключить]».
💡 Для ${user.settings.notdisturb ? `включения` : `выключения`} уведомлений напишите «${user.settings.notdisturb ? `Включить уведомления` : `Не беспокоить`}».
		`);
	}
	let sections = [0, 'invitation_gang', 'rank', 'winning', 'gang_notification', 'transfer', 'contribution', 'cashback', 'enterprise', 'addreg', 'proposal', 'achievements', 'gifts', 'mailing', 'property_transfer', 'subscriptions'];
	let names = [0, 'Приглашение в банду', 'Изменение ранга', 'Выигрыш в бою', 'Уведомления банды', 'Перевод валюты', 'Вклад', 'Кэшбэк', 'Предприятие', 'Дополнительные регистрации предприятия', 'Брак', 'Выполнение достижения', 'Получение подарка', 'Рассылка', 'Передача имущества', 'Подписки'];
	if (!Number(id) || id < 1 || id > 15) return message.send(`🔔 || Раздела уведомлений с таким ID не существует! ❌`);
	if (!permission || !/^(вкл|выкл|включить|выключить)$/i.test(permission)) return message.send(`🔔 || Параметр не указан! Используйте «Уведомления [ID раздела] [включить/выключить]». ❌`);
	permission = /^(включить|вкл)$/i.test(permission) ? false : true;
	if (!notifications[sections[id]] && !permission) return message.send(`🔔 || Уведомления раздела «${names[id]}» уже включены! ❌`);
	if (notifications[sections[id]] && permission) return message.send(`🔔 || Уведомления раздела «${names[id]}» уже выключены! ❌`);
	permission ? notifications[sections[id]] = true : delete notifications[sections[id]];
	return message.send(`🔔 || Уведомления раздела «${names[id]}» ${permission ? 'выключены' : 'включены'}. ✔`);
});

hearManager.hear(/^включить уведомления$/i, message => {
	if (!user.settings.notdisturb) return message.send(`🔔 || У вас уже включены уведомления! ❌`);
	delete user.settings.notdisturb;
	return message.send(`🔔 || Уведомления включены. ✔`);
});

hearManager.hear(/^не беспокоить$/i, message => {
	if (user.settings.notdisturb) return message.send(`🔕 || У вас уже включён режим «Не беспокоить»! ❌`);
	user.settings.notdisturb = true;
	return message.send(`🔕 || Режим «Не беспокоить» включён. ✔`);
});

hearManager.hear(/^(?:ч(?:е|ё)рный список|чс)\s?([0-9]+)?/i, message => {
	let page = Number(message.$match[1]) ? Number(message.$match[1]) : 1;
	let max_page = user.settings.blacklist.length ? Math.ceil(user.settings.blacklist.length/10) : 1;
	let text = '';
	let key = Keyboard.builder();
	let blacklist = user.settings.blacklist;
	if (page < 1 || page > max_page) return message.send(`🔒 || Такой страницы нет! В вашем чёрном списке всего ${declination('страниц', 'страница', 'страницы', max_page)}. ❌`);
	for (let i = 0; i < 10; i++) if (accounts.accounts[blacklist[(page-1)*10+i]]) text += `\n  🔐 ${nick(accounts.accounts[blacklist[(page-1)*10+i]])} (#${blacklist[(page-1)*10+i]})`;
	if (text) key.textButton({label: 'Очистить чёрный список'});
	return message.send(`🔒 || Заблокированные игроки (${page}/${max_page}):${text ? text : `\n  🔐 Ваш чёрный список пуст.`}\n\n${max_page != 1 ? `💡 Для перехода на другую страницу напишите «Чёрный список [страница]».\n` : ``}${!blacklist.length || blacklist.length < 50 ? `💡 Для добавления игрока в чёрный список напишите «Заблокировать [ID аккаунта]».\n` : ``}${text ? `💡 Для удаления игрока из чёрного списка напишите «Разблокировать [ID аккаунта]».\n💡 Для очистки чёрного списка напишите «Чёрный список очистить».` : ``}`, {keyboard: key.inline(	)});
});

hearManager.hear(/^(?:заблокировать)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`🔒 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.id == user.id) return message.send(`🔒 || Нельзя заблокировать себя! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`🔒 || ${nick(player)} уже ${gender('добавлен', 'добавлена', player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`🔒 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (user.settings.blacklist.length >= 50) return message.send(`🔒 || Чёрный список переполнен! Максимальное количество человек в чёрном списке — 50. ❌\n\n💡 Для отчистки чёрного списка напишите «Очистить чёрный список».`, {keyboard: Keyboard.builder().textButton({label: 'Очистить чёрный список', color: Keyboard.NEGATIVE_COLOR}).inline()});
	user.settings.blacklist.push(player.id);
	return message.send(`🔒 || ${nick(player)} ${gender('добавлен', 'добавлена', player)} в чёрный список.`);
});

hearManager.hear(/^(?:разблокировать)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`🔓 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	let id;
	let blacklist = [];
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) id = i;
	if (!id) return message.send(`🔓 || ${nick(player)} не добавлен в ваш чёрный список! ❌`);
	delete user.settings.blacklist[id];
	for (i in user.settings.blacklist) if (i != 'random' && user.settings.blacklist[i]) blacklist.push(user.settings.blacklist[i]);
	user.settings.blacklist = blacklist;
	return message.send(`🔓 || ${nick(player)} удалён из чёрного списка. ✔`);
});

hearManager.hear(/^(очистить ч(е|ё)рный список|очистить чс)$/i, message => {
	if (!user.settings.blacklist[0]) return message.send(`🔓 || Ваш чёрный список уже пуст! ❌`);
	user.settings.blacklist = [];
	return message.send(`🔓 || Чёрный список очищен. ✔`);
});

hearManager.hear(/^баланс$/i, message => {
	let key = Keyboard.builder();
	if (user.bank.balance == undefined) key.callbackButton({label: 'Купить карту', payload: {command: "buy_card"}, color: Keyboard.POSITIVE_COLOR});
	return message.send(`
💰 || ${nick(user)}, твои счета:
  💸 Наличные: ${spaces(user.balance)} ₽${(user.bank.balance ? `\n  💳 Банковский счёт: ${spaces(user.bank.balance)} ₽` : ``)}
  🧾 Общая сумма: ${spaces(user.balance+(user.bank.balance ? user.bank.balance : 0))} ₽${money[user.idvk] ? `\n\n  🤑 Российские рубли: ${money[user.idvk]} RUB\n  💡 Вывести деньги можно будет после Beta-тестирования.` : ''}

${user.bank.balance === undefined ? `💡 Для покупки карты напишите «Купить карту». (Стоимость услуги 300 ₽)` : ``}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^банк$/i, message => {
	let endcontribution = user.bank.contribution ? watch.accounts[user.id].contribution.endcontribution : 0;
	let key = Keyboard.builder().textButton({label: 'Карта'}).textButton({label: 'Вклад'}).row();
	let enterprise;
	if (user.enterprise && user.enterprise.id) enterprise = enterprises.enterprises[user.enterprise.id];
	if (user.enterprise && user.enterprise.id) !enterprise.accpayment ? key.textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).row() : key.textButton({label: 'Расчётный счёт'});
	if (user.subscriptions && user.subscriptions.bankpass) key.textButton({label: 'Кэшбэк', color: Keyboard.POSITIVE_COLOR});
	return message.send(`
🗄 || ${nick(user)}, банк:${user.bank.balance !== undefined ? `\n  💳 Банковский счёт: ${spaces(user.bank.balance)} ₽` : `\n💡 Для покупки карты напишите «Купить карту». (Стоимость услуги 300 ₽)`}${user.bank.contribution || user.bank.contribution === 0 ? `\n\n🗃 | Вклад:\n  🗃 Баланс вклада: ${spaces(user.bank.contribution)} ₽\n  ⌛ Вклад закроется через ${endcontribution > 86400 ? `${declination('дней', 'день', 'дня', Math.round(endcontribution/86400))}${endcontribution%86400 > 1800 && endcontribution%86400 < 8600 ? ' ' + declination('часов', 'час', 'часа', Math.round(endcontribution%86400/3600)) : ``}` : (endcontribution > 3600 ? declination('часов', 'час', 'часа', Math.round(endcontribution/3600)) : declination('минут', 'минута', 'минуты', Math.round(endcontribution/60)))}` : ``}

💡 Для просмотра меню по банковской карте напишите «Карта».
💡 Для просмотра меню по вкладу напишите «Вклад».${user.enterprise && user.enterprise.id ? (!enterprise.accpayment ? `\n💡 Для открытия расчётного счёта предприятия напишите «Открыть расчётный счёт».` : `\n💡 Для просмотра информации по расчётному счёту предприятия напишите «Расчётный счёт».`) : ``}${user.subscriptions && user.subscriptions.bankpass ? `\n💡 Для просмотра меню по кэшбэку напишите «Кэшбэк».` : ``}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^(карты|карта)$/i, message => {
	let key = Keyboard.builder();
	let test = 0;
	function not_text() {
		test++;
		return '';
	}
	if (user.bank.balance === undefined) key.callbackButton({label: 'Купить карту', payload: {command: "buy_card"}, color: Keyboard.POSITIVE_COLOR});
	return message.send(`💳 || ${nick(user)}, меню по банковской карте:${user.bank.balance === undefined ? `\n  💡 Для покупки карты напишите «Купить карту». (Стоимость услуги 300 ₽)` : not_text()}${user.balance && user.bank.balance !== undefined ? `\n  💡 Для пополнения карты напишите «Карта пополнить [сумма]».` : not_text()}${user.bank.balance && user.bank.balance !== undefined ? `\n  💡 Для снятия денег с карты напишите «Карта снять [сумма]».` : not_text()}${user.bank.balance !== undefined && (!user.fines || !user.fines.transfer_ban) ? `\n  💡 Для перевода валюты напишите «Перевести [ID аккаунта] [сумма] [комментарий (не обязательно)]».` : not_text()}${test == 4 ? `\n💡 Нет доступных команд.` : ``}`, {keyboard: key.inline()});
});

hearManager.hear(/^(купить карту|карта купить)$/i, message => {
	if (user.bank.balance || user.bank.balance === 0) return message.send(`💳 || Вы уже купили карту! ❌`);
	if (user.balance < 300) return message.send(`💳 || Недостаточно наличных средств! Стоимость услуги — 300 ₽. ❌`);
	if (user.subscriptions && user.subscriptions.bankpass) user.bank.increased_cashback == 4 ? user.bank.cashback.balance += 30 : user.bank.cashback.balance += 3;
	user.bank.balance = 0;
	user.balance -= 300;
	return message.send(`💳 || Вы купили карту за 300 ₽. ✔\n\n💡 Для пополнения карты напишите «Карта пополнить [сумма]».\n💡 Для снятия денег с карты напишите «Карта снять [сумма]».`);
});

hearManager.hear(/^(?:карта пополнить|банк пополнить)\s?([^]+)?/i, message => {
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = user.balance;
	if (user.bank.balance === undefined) return message.send(`💳 || У вас нет карты! ❌\n\n💡 Для покупки карты напишите «Купить карту».`, {keyboard: Keyboard.builder().callbackButton({label: 'Купить карту', payload: {command: "buy_card"}, color: Keyboard.POSITIVE_COLOR}).inline()});
	if (!Number(amount) || amount < 1) return message.send(`💳 || Сумма пополнения должна быть в числовом виде и неравна нулю. Напишите «всё» для пополнения на весь баланс! ❌`);
	if (user.balance < amount) return message.send(`💳 || Недостаточно средств! ❌`);
	user.balance -= amount;
	user.bank.balance += amount;
	return message.send(`💳 || Вы пополнили баланс карты на ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).inline()});
});

hearManager.hear(/^(?:карта снять|банк снять)\s?([^]+)?/i, message => {
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = user.bank.balance;
	if (user.bank.balance === undefined) return message.send(`💳 || У вас нет карты! ❌\n\n💡 Для покупки карты напишите «Купить карту».`, {keyboard: Keyboard.builder().callbackButton({label: 'Купить карту', payload: {command: "buy_card"}, color: Keyboard.POSITIVE_COLOR}).inline()});
	if (!Number(amount) || amount < 1) return message.send(`💳 || Сумма снятия должна быть в числовом виде и неравна нулю. Напишите «всё» для снятия на весь баланс карты! ❌`);
	if (user.bank.balance < amount) return message.send(`💳 || Недостаточно средств на карте! ❌`);
	user.bank.balance -= amount;
	user.balance += amount;
	return message.send(`💳 || Вы сняли с баланса карты ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).inline()});
});

hearManager.hear(/^(?:перевести)\s?([0-9]+)?\s?([0-9к]+)?\s?([^]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	let amount = Math.round(parserInteger(message.$match[2])*0.95);
	let comment = message.$match[3];
	if (user.fines && user.fines.transfer_ban) return message.send(`💸 || Вам выдан запрет на переводы! ❌`);
	if (!player) return message.send(`💸 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (!amount || amount < 1) return message.send(`💸 || Вы не ввели сумму! Используйте «Перевести [ID аккаунта] [сумма] [комментарий (не обязателно)]»! ❌`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💸 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💸 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💸 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.fines && player.fines.transfer_ban) return message.send(`💸 || У ${nick(player)} заблокирована передача валюты за нарушение правил! ❌`);
	if (user.bank.balance === undefined) return message.send(`💸 || У вас нет карты! ❌\n\n💡 Для покупки карты напишите «Купить карту».`, {keyboard: Keyboard.builder().callbackButton({label: 'Купить карту', payload: {command: "buy_card"}, color: Keyboard.POSITIVE_COLOR}).inline()});
	if (player.bank.balance === undefined) return message.send(`💸 || У ${nick(player)} нет карты! ❌`);
	if (amount > user.bank.balance) return message.send(`💸 || Недостаточно средств на карте! ❌`);
	if (player.id == user.id) return message.send(`💸 || Нельзя перевести самому себе! ❌`);
	user.bank.balance -= parserInteger(message.$match[2]);
	player.bank.balance += amount;
	notification(`💸 || ${nick(user)} перевёл вам ${spaces(amount)} ₽. (Комиссия — 5%) ✔${comment ? `\n  ✉ ${ucFirst(comment)}` : ``}\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, 'transfer', player, Keyboard.builder().textButton({label: 'Баланс'}).inline());
	return message.send(`💸 || ${nick(player)} получил ${spaces(amount)} ₽ от вас. (Комиссия — 5%) ✔\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).inline()});
});

hearManager.hear(/^вклад$/i, message => {
	return message.send(`
🗃 || ${nick(user)}, меню по вкладу:
  🗃 Вклад — счёт, пополняемый для приумножения денег. Вклад можно открыть на срок от 30 часов до 30 дней, но количество часов должно быть кратно 30. Процентная ставка составляет 3% каждые 30 часов, а с подпиской «Bank Pass» — 5%.

${!user.bank.contribution && user.bank.contribution !== 0 ? `💡 Для открытия вклада напишите «Открыть вклад [срок]», где [срок] обозначается числом и буквой («ч» — часы, «д» — дни).` : (user.bank.balance || user.balance ? `💡 Для пополнения вклада напишите «Пополнить вклад [сумма]».\n` : ``) + `💡 Для просмотра информации по вкладу напишите «Банк».`}
	`, {keyboard: user.bank.contribution ? Keyboard.builder().textButton({label: 'Банк'}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^(?:открыть вклад|вклад открыть)\s?([^]+)?/i, message => {
	let key = Keyboard.builder().textButton({label: 'Банк'});
	let term = message.$match[1];
	let letters = /(ч|д)/i;
	let letter1 = /(д)/i;
	let letter2 = /(ч)/i;
	let numberHours = 1;
	if (!letters.test(term) || (letter1.test(term) && letter2.test(term))) return message.send(`🗃 || Используйте «Открыть вклад [срок]», где [срок] обозначается числом и одной буквой («ч» — часы, «д» — дни)! ❌`);
	if (letter1.test(term)) numberHours = 24;
	term = term.replace(/д|ч|\s/ig, '')*numberHours;
	if (user.bank.contribution || user.bank.contribution === 0) return message.send(`🗃 || У вас уже открыт вклад! ❌\n\n💡 Для просмотра информации по вкладу напишите «Банк».`, {keyboard: key.inline()});
	if (term < 30 || term > 720 || term%30) return message.send(`🗃 || Вклад можно открыть на срок от 30 часов до 30 дней, но количество часов должно быть кратно 30! ❌`);
	user.bank.contribution = 0;
	watch.accounts[user.id].contribution = {
		endcontribution: term*3600,
		payout: 108000
	}
	return message.send(`🗃 || Вы открыли вклад на срок ${declination('часов', 'час', 'часа', term)}. ✔\n\n💡 Для просмотра информации по вкладу напишите «Банк».\n💡 Для просмотра меню по вкладу напишите «Вклад».`, {keyboard: key.textButton({label: 'Вклад'}).inline()});
});

hearManager.hear(/^(?:пополнить вклад|вклад пополнить)\s?([^]+)?/i, message => {
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = user.bank.balance;
	if (!user.bank.contribution && user.bank.contribution !== 0) return message.send(`🗃 || У вас не открыт вклад! ❌\n\n💡 Для открытия вклада напишите «Открыть вклад [срок]», где [срок] обозначается числом и буквой («ч» — часы, «д» — дни).`);
	if (!Number(amount) || amount < 1) return message.send(`🗃 || Сумма пополнения должна быть в числовом виде и неравна нулю. Напишите «всё» для пополнения на весь баланс карты! ❌`);
	if (!user.bank.balance || user.bank.balance < amount) return message.send(`🗃 || Недостаточно средств на карте, либо карты нет! ❌`);
	if (amount < 1000) return message.send(`🗃 || Полнение вклада доступно от 1.000 ₽! ❌`);
	user.bank.balance -= amount;
	user.bank.contribution += amount;
	return message.send(`🗃 || Вы пополнили баланс вклада на ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра информации по вкладу напишите «Банк».\n💡 Для просмотра меню по вкладу напишите «Вклад».`, {keyboard: Keyboard.builder().textButton({label: 'Банк'}).textButton({label: 'Вклад'}).inline()});
});

hearManager.hear(/^(вклад снять|снять вклад)$/i, message => {
	return message.send(`🗃 || Из вклада нельзя снять деньги! Они прийдут к вам на баланс после окончания срока вклада. ❌\n\n💡 Для просмотра информации по вкладу напишите «Банк».\n💡 Для просмотра меню по вкладу напишите «Вклад».`, {keyboard: Keyboard.builder().textButton({label: 'Банк'}).textButton({label: 'Вклад'}).inline()});
});

hearManager.hear(/^(открыть расчётный счёт|расчётный счёт открыть)$/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`💰 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	let types_enterprise = [0, 'ИП', 'ООО', 'НАО', 'ПАО'];
	if (enterprise.accpayment) return message.send(`💰 || В вашем предприятии уже открыт расчётный счёт! ❌\n\n💡 Для просмотра информации о расчётном счёте напишите «Расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Расчётный счёт'}).inline()});
	enterprise.accpayment = {balance: enterprise.capital, history: `💰 Расчётный счёт создан (${timeAndDay()})`};
	delete enterprise.capital;
	return message.send(`💰 || Вы открыли расчётный счёт для предприятия ${types_enterprise[enterprise.type]} «${enterprise.title}». ✔\n\n💡 Для просмотра информации по расчётному счёту напишите «Расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Расчётный счёт'}).inline()});
});

hearManager.hear(/^расчётный счёт$/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`💰 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.accpayment) return message.send(`💰 || В вашем предприятии не открыт расчётный счёт! ❌\n\n💡 Для открытия расчётного счёта предприятия напишите «Открыть расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).inline()});
	let types_enterprise = [0, 'ИП', 'ООО', 'НАО', 'ПАО'];
	return message.send(`
💰 || Расчётный счёт:
  🔎 ${types_enterprise[enterprise.type]} «${enterprise.title}»

  💰 Баланс: ${spaces(enterprise.accpayment.balance)} ₽
  💸 Свободно: ${spaces(enterprise.accpayment.balance)} ₽
  💵 В ходу: 0 ₽

💡 Для просмотра истории операций напишите «История расчётного счёта».${user.bank.balance || user.balance ? `\n💡 Для пополнения расчётного счёта напишите «Пополнить расчётный счёт [сумма]».` : ``}${enterprise.accpayment.balance ? `\n💡 Для снятия денег с расчётного счёта напишите «Снять с расчётного счёта [сумма]».` : ``}
	`, {keyboard: Keyboard.builder().textButton({label: 'История расчётного счёта'}).inline()});
});

hearManager.hear(/^(?:история расчётного счёта)\s?([0-9]+)?/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`💰 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.accpayment) return message.send(`💰 || В вашем предприятии не открыт расчётный счёт! ❌\n\n💡 Для открытия расчётного счёта предприятия напишите «Открыть расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).inline()});
	let history = enterprise.accpayment.history.split('\n');
	let page = Number(message.$match[1]) ? Number(message.$match[1]) : 1;
	let max_page = Math.ceil(history.length/10);
	let text = [];
	if (page < 1 || page > max_page) return message.send(`💰 || Такой страницы нет! Операция по расчётному счёту занимают всего ${declination('страниц', 'страница', 'страницы', max_page)}. ❌`);
	for (let i = 0; i < 10; i++) {
		let tex = history[(page-1)*10+i];
		if (tex) text.push(tex);
	}
	return message.send(`
💰 || История расчётного счёта:${max_page != 1 ? ` (${page}/${max_page})` : ``}
  ${text.join('\n  ')}

${max_page != 1 ? `💡 Для перехода на другую страницу напишите «История расчётного счёта [страница]».\n` : ``}💡 Для просмотра информации по расчётному счёту напишите «Расчётный счёт».
	`, {keyboard: Keyboard.builder().textButton({label: 'Расчётный счёт'}).inline()});
});

hearManager.hear(/^(?:пополнить расчётный счёт|расчётный счёт пополнить)\s?([^]+)?/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`💰 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.accpayment) return message.send(`💰 || В вашем предприятии не открыт расчётный счёт! ❌\n\n💡 Для открытия расчётного счёта предприятия напишите «Открыть расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).inline()});
	if (watch.enterprises[enterprise.id].liquidation) return message.send(`💰 || Нельзя пополнить расчётный счёт во время ликвидации! ❌\n\n💡 Для отмены ликвидации напишите «Отменить ликвидацию».`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию', color: Keyboard.POSITIVE_COLOR}).inline()});
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = user.bank.balance;
	if (!Number(amount) || amount < 1) return message.send(`💰 || Сумма пополнения должна быть в числовом виде и неравна нулю. Напишите «всё» для пополнения на весь баланс карты! ❌`);
	if (!user.bank.balance || user.bank.balance < amount) return message.send(`💰 || Недостаточно средств на карте, либо карты нет! ❌`);
	user.bank.balance -= amount;
	enterprise.accpayment.balance += amount;
	enterprise.accpayment.history = `📥 ${enterprise.type == 2 ? nick(user) + ` ${gender('пополнил', 'пополнила', user)} счёт` : `Пополнение счёта`} на ${spaces(amount)} ₽ (${timeAndDay()})\n` + enterprise.accpayment.history;
	return message.send(`💰 || Вы пополнили расчётный счёт на ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра информации по расчётному счёту напишите «Расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Расчётный счёт'}).inline()});
});

hearManager.hear(/^(?:снять с расчётного счёта|расчётный счёт снять)\s?([^]+)?/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`💰 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.accpayment) return message.send(`💰 || В вашем предприятии не открыт расчётный счёт! ❌\n\n💡 Для открытия расчётного счёта предприятия напишите «Открыть расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).inline()});
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = enterprise.accpayment.balance;
	if (!Number(amount) || amount < 1) return message.send(`💰 || Сумма снятия должна быть в числовом виде и неравна нулю. Напишите «всё» для снятия на весь баланс расчётного счёта! ❌`);
	if (enterprise.accpayment.balance < amount) return message.send(`💰 || Недостаточно средств на расчётном счёте! ❌`);
	enterprise.accpayment.balance -= amount;
	user.bank.balance += amount;
	enterprise.accpayment.history = `📤 ${enterprise.type == 2 ? nick(user) + ` ${gender('снял', 'сняла', user)}` : `Снятие`} со счёта ${spaces(amount)} ₽ (${timeAndDay()})\n` + enterprise.accpayment.history;
	return message.send(`💰 || Вы сняли с баланса расчётного счёта ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».\n💡 Для просмотра информации по расчётному счёту напишите «Расчётный счёт».`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).row().textButton({label: 'Расчётный счёт'}).inline()});
});

hearManager.hear(/^(кэшбэк|кешбэк|кешбек|кэшбек)$/i, message => {
	if (!user.subscriptions || !user.subscriptions.bankpass) return message.send(`📥 || Система кэшбэка доступна только с подпиской «Bank Pass»! ❌\n\n💡 Вы можете купить товар «Подписка «Bank Pass» и получить доступ к кэшбэку.`, {template: JSON.stringify({"type": "carousel","elements": [{"title":"Подписка «Bank Pass» на 1 месяц","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239269","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956610"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 2 месяца","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239270","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956617"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 6 месяцев","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239271","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956885"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 12 месяцев","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239272","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956892"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]}]})});
	let categories1 = ['машины', 'дома', 'квартиры', 'гаражи', 'покупку карты'];
	let categories2 = ['Машины (#1)', 'Дома (#2)', 'Квартиры (#3)', 'Гаражи (#4)', 'Покупка карты (#5)'];
	return message.send(`
📥 || ${nick(user)}, меню по кэшбэку:
  💰 Вы заработали ${spaces(user.bank.cashback.balance)} ₽ кэшбэка.${user.bank.cashback.increased ? `\n  📈 Повышенный кэшбэк на ${categories1[user.bank.cashback.increased]} (10%)` : ``}${!user.bank.cashback.increased ? `\n\n📈 | Выберите повышенный кэшбэк:\n  1⃣ ${categories2[user.bank.cashback.option_increased[0]]}${user.bank.cashback.option_increased[0] != user.bank.cashback.option_increased[1] ? `\n  2⃣ ${categories2[user.bank.cashback.option_increased[1]]}` : ``}${user.bank.cashback.option_increased[0] != user.bank.cashback.option_increased[2] && user.bank.cashback.option_increased[1] != user.bank.cashback.option_increased[2] ? `\n  3⃣ ${categories2[user.bank.cashback.option_increased[2]]}` : ``}` : ``}

💡 Кэшбэк — это возвращение небольшого процента потраченных денег обратно. Каждые 30 часов начинается новый расчётный период, можно выбрать повышенный кэшбэк для этого периода из предложенных в команде «Кэшбэк». В конце каждого расчётного периода кэшбэк зачисляется к вам на карту. кэшбэк на все товары составляет 1%, а на категорию повышенного кэшбэка — 10%.
💡 Для выбора повышенного кэшбэка напишите «Повышенный кэшбэк [ID категории]».
	`);
});

hearManager.hear(/^(?:повышенный кэшбэк)\s?([0-9]+)?/i, message => {
	if (!user.subscriptions || !user.subscriptions.bankpass) return message.send(`📥 || Система кэшбэка доступна только с подпиской «Bank Pass»! ❌\n\n💡 Вы можете купить товар «Подписка «Bank Pass» и получить доступ к кэшбэку.`, {template: JSON.stringify({"type": "carousel","elements": [{"title":"Подписка «Bank Pass» на 1 месяц","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239269","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956610"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 2 месяца","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239270","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956617"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 6 месяцев","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239271","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956885"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]},{"title":"Подписка «Bank Pass» на 12 месяцев","description":"Доступ к системе «Кэшбэк» и повышенная ставка по вкладу","photo_id":"-187145687_457239272","action":{"type":"open_link","link":"https://vk.com/product-187145687_5956892"},"buttons":[{"action":{"type":"open_link","label":"Открыть сайт","link":"http://gorozaninconnect.ru"}}]}]})});
	let categories = ['Машины', 'Дома', 'Квартиры', 'Гаражи', 'Покупка карты'];
	if (user.bank.cashback.increased) return message.send(`📥 || Вы уже активировали повышенный кэшбэк! ❌`);
	for (i in user.bank.cashback.option_increased) {
		if (user.bank.cashback.option_increased[i] == message.$match[1]-1) {
			user.bank.cashback.increased = message.$match[1]-1;
			delete user.bank.cashback.option_increased;
			return message.send(`📥 || Вы активировали повышенный кэшбэк на категорию «${categories[user.bank.cashback.increased]}»! Кэшбэк за данную категорию составляет 10%. ✔`);
		}
	}
	return message.send(`📥 || Вы не можете выбрать эту категорию! ❌`);
});

hearManager.hear(/^(?:специальности|специальность)\s?([0-9]+)?/i, message => {
	let key = Keyboard.builder().textButton({label: 'Обучение'});
	if (!user.education || !user.education.stop) key.row().textButton({label: 'Учиться', color: Keyboard.POSITIVE_COLOR});
	if (user.education) return message.send(`📚 || Вы уже обучаетесь! ❌\n\n💡 Для просмотра информации об обучении напишите «Обучение».\n${!user.education.stop ? `💡 Для проведения учебного дня напишите «Учиться».` : ``}`, {keyboard: key.inline()});
	let id = parserId(message.$match[1]);
	if (!id || !Number(id) || id < 1 || id > 7)
		return message.send(`
📚 || ${nick(user)}, специальности:
  🖥 «Компьютерные и информационные науки» (#1)
  ⚒ «Техника и технологии строительства» (#2)
  🚚 «Машиностроение» (#3)
  🛡 «Техносферная безопасность и природообустройство» (#4)
  🧾 «Экономика и управление» (#5)
  🖼 «Искусствознание» (#6)
  📺 «Экранные искусства» (#7)

💡 Для выбора специальности напишите «Специальность [ID специальности]».
		`);
	let smiles = [0, '🖥', '⚒', '🚚', '🛡', '🧾', '🖼', '📺'];
	let profiles = [0, '🖥 «Фундаментальная информатика и информационные технологии» (#1)', '⚒ «Строительство» (#2)', '🚚 «Инженер по оборудованию» (#3)', '🛡 «Инспектор по технике безопасности» (#4)', '🧾 «Бухгалтерский учёт, анализ и аудит» (#5)', '🖼 «Современная фотография» (#6)', '📺 «Звукорежиссура аудиовизуальных искусств» (#7)'];
	return message.send(`
${smiles[id]} || Профили обучения:
  ${profiles[id]}

💡 Для просмотра информации о программе обучения напишите её название, либо «Программа [ID программы]».
	`);
});

vk.updates.on('message_new', async (message, next) => {
	let program = message.text ? message.text.toLowerCase() : null;
	let programs = [0, ['фундаментальная информатика и информационные технологии', 'программа 1'], ['строительство', 'программа 2'], ['инженер по оборудованию', 'программа 3'], ['инспектор по технике безопасности', 'программа 4'], ['бухгалтерский учёт, анализ и аудит', 'программа 5'], ['современная фотография', 'программа 6'], ['звукорежиссура аудиовизуальных искусств', 'программа 7']];
	let id = programs.findIndex(text => text[1] === program || text[2] === program);
	if (id == -1) return next();
	let key = Keyboard.builder().textButton({label: 'Обучение'});
	if (user.education && !user.education.stop) key.row().textButton({label: 'Учиться', color: Keyboard.POSITIVE_COLOR});
	if (user.education) return message.send(`📚 || Вы уже обучаетесь! ❌\n\n💡 Для просмотра информации об обучении напишите «Обучение».\n${!user.education.stop ? `💡 Для проведения учебного дня напишите «Учиться».` : ``}`, {keyboard: key.inline()});
	let smiles = [0, '🖥', '⚒', '🚚', '🛡', '🧾', '🖼', '📺'];
	let profiles = [0, '🖥 «Фундаментальная информатика и информационные технологии»', '⚒ «Строительство»', '🚚 «Инженер по оборудованию»', '🛡 «Инспектор по технике безопасности»', '🧾 «Бухгалтерский учёт, анализ и аудит»', '🖼 «Современная фотография»', '📺 «Звукорежиссура аудиовизуальных искусств»'];
	let prices = [0, 204, 175, 120, 227, 198, 300, 258];
	let terms = [0, 4, 2, 4, 4, 4, 3, 5];
	for (i in user.knowledge.diplomas) if (user.knowledge.diplomas[i] == id) return message.send(`📚 || Вы уже получили аттестат по данной программе!`);
	let answer = await message.question(`${smiles[id]} || Информация о программе:\n  ${profiles[id]}\n\n📓 Очное обучение (${prices[id]}.000 ₽/год, ${declination('лет', 'год', 'года', terms[id])})\n📓 Заочное обучение (${Math.round(prices[id]-prices[id]/100*10)}.000 ₽/год, ${declination('лет', 'год', 'года', terms[id]-1)})\n\n💡 Для выбора типа обучения напишите его название.\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Очно', color: Keyboard.PRIMARY_COLOR}).textButton({label: 'Заочно', color: Keyboard.PRIMARY_COLOR}).row().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!answer.text || !/^(очно|заочно|очное обучения|заочное обучение)$/i.test(answer.text)) return message.send(`📚 || Вы вышли из помощника по началу обучения! ❌`);
	let type = /^(очно|очное обучение)$/i.test(answer.text) ? 1 : 0;
	let cost = !user.free_education && random(1, 100) < 31 ? 0 : (type ? prices[id]*1000 : Math.round(prices[id]-prices[id]/100*10)*1000);
	let term = type ? terms[id] : terms[id]-1;
	user.free_education = true
	if (!user.bank.balance || user.bank.balance < cost) return message.send(`📚 || Недостаточно средств на карте, либо карты нет! ❌`);
	delete user.free_education;
	user.bank.balance -= cost;
	user.education = {"program":id,"number":1,"type":type,"cost":cost}
	return message.send(`📚 || Вы поступили на ${!cost ? 'бюджетное' : 'платное'} ${type ? 'очное' : 'заочное'} обучение. ✔\n\n💡 Для просмотра информации об обучении напишите «Обучение».\n💡 Для проведения учебного дня напишите «Учиться».`, {keyboard: key.row().textButton({label: 'Учиться', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(очно|заочно|очное обучение|заочное обучение)$/i, message => {
	let key = Keyboard.builder().textButton({label: 'Обучение'});
	if (user.education && !user.education.stop) key.row().textButton({label: 'Учиться', color: Keyboard.POSITIVE_COLOR});
	if (user.education) return message.send(`📚 || Вы уже обучаетесь! ❌\n\n💡 Для просмотра информации об обучении напишите «Обучение».\n${!user.education.stop ? `💡 Для проведения учебного дня напишите «Учиться».` : ``}`, {keyboard: key.inline()});
	return message.send(`📚 || Для выбора типа обучения выберите специальность, затем программу! ❌\n\n💡 Для просмотра списка специальностей напишите «Специальности».`, {keyboard: Keyboard.builder().textButton({label: 'Специальности'}).inline()});
});

hearManager.hear(/^обучение$/i, message => {
	if (!user.education) return message.send(`📚 || Вы не обучаетесь! ❌\n\n💡 Для просмотра списка специальностей напишите «Специальности».`, {keyboard: Keyboard.builder().textButton({label: 'Специальности'}).inline()});
	let key = Keyboard.builder();
	if (!user.education.stop) key.textButton({label: 'Учиться', color: Keyboard.POSITIVE_COLOR}).row();
	let programs = [0, '🖥 «Фундаментальная информатика и информационные технологии»', '⚒ «Строительство»', '🚚 «Инженер по оборудованию»', '🛡 «Инспектор по технике безопасности»', '🧾 «Бухгалтерский учёт, анализ и аудит»', '🖼 «Современная фотография»', '📺 «Звукорежиссура аудиовизуальных искусств»'];
	let terms = [0, 4, 2, 4, 4, 4, 3, 5];
	return message.send(`
📚 || Ваше обучение:
  ${programs[user.education.program]} (${user.education.type ? 'очно' : 'заочно'})

💰 ${!user.education.cost ? 'Бюджет (бесплатное обучение)' : `${spaces(user.education.cost)} ₽/год`}
⏰ Осталось ~${declination('лет', 'год', 'года', terms[user.education.program]-Math.round((user.education.number-1)/(user.education.type ? 5 : 2)))}

${!user.education.stop ? '💡 Для проведения учебного дня напишите «Учиться».\n' : ''}💡 Для отчисления напишите «Отчислиться».
	`, {keyboard: key.inline()});
});

hearManager.hear(/^учиться$/i, message => {
	let time_end = watch.accounts[user.id];
	if (!user.education) return message.send(`📚 || Вы не обучаетесь! ❌\n\n💡 Для просмотра списка специальностей напишите «Специальности».`, {keyboard: Keyboard.builder().textButton({label: 'Специальности'}).inline()});
	if (user.education.stop) return message.send(`📚 || Вы сможете снова учиться через ${time_end.education < 60 ? declination('секунд', 'секунду', 'секунды', time_end.education) : declination('минут', 'минуту', 'минуты', Math.floor(time_end.education/60))}! ❌`);
	if ((user.education.number%5 == 1 && user.education.type || user.education.number%2 == 1 && !user.education.type) && user.education.number != 1) {
		if (user.bank.balance < user.education.cost) return message.send(`📚 || Недостаточно средств на карте для продолжения обучения, либо карты нет! Вам нужно ${spaces(user.education.cost)} ₽. ❌`);
		user.bank.balance -= user.education.cost;
	}
	let educationDB = education[user.education.program][user.education.type][user.education.number];
	user.education.type ? time_end.education = 1800 : time_end.education = 3600;
	user.education.stop = true;
	if (!educationDB.answer) {
		user.education.number++;
		return message.send(`📚 || Внимательно прочитайте:\n  📚 ${education[user.education.program][user.education.type][user.education.number-1].text}\n\n💡 Вы сможете снова учиться через ${user.education.type ? '30 минут' : 'час'}.`);
	}
	let opt1 = random(1, 3);
	let opt2 = opt1 == 1 ? random(2, 3) : (opt1 == 2 ? [1, 3].random() : random(1, 2));
	user.education.question = opt1 == educationDB.answer ? 1 : (opt2 == educationDB.answer ? 2 : 3);
	time_end.deduction = 3600;
	return message.send(`📚 || Вопрос:\n  ❓ ${educationDB.text}\n\n📌 Варианты ответов\n1. ${educationDB[`opt${opt1}`]}\n2. ${educationDB[`opt${opt2}`]}\n3. ${educationDB[`opt${[1,2,3].find(num => num != opt1 && num != opt2)}`]}\n\n💡 Для овета напишите «Ответ [вариант ответа]».\n💡 Если вы не ответите на вопрос в течение часа, то вас отчислят.`);
});

hearManager.hear(/^(?:ответ)\s?([0-9]+)?$/i, message => {
	let time_end = watch.accounts[user.id];
	let option = message.$match[1];
	let text = '';
	if (!user.education) return message.send(`📚 || Вы не обучаетесь! ❌\n\n💡 Для просмотра списка специальностей напишите «Специальности».`, {keyboard: Keyboard.builder().textButton({label: 'Специальности'}).inline()});
	if (!user.education.question) return message.send(`📚 || Вам не задавали вопросов! ❌`);
	if (option < 1 || option > 3 || !Number(option)) return message.send(`📚 || Выберите один вариант из трёх предложенных в вопросе из команды «Учиться»! ❌`);
	if (option != user.education.question) {delete user.education.question; delete time_end.deduction; return message.send(`📚 || Неправильный ответ! ${time_end.education ? `Вы сможете снова учиться через ${time_end.education < 60 ? declination('секунд', 'секунду', 'секунды', time_end.education) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.education+29)/60))}` : `Вы можете снова учиться`}. ❌`)}
	let educationDB = education[user.education.program][user.education.type][user.education.number];
	user.education.number++;
	delete user.education.question;
	delete time_end.deduction;
	if (education[user.education.program][user.education.type][user.education.number]) return message.send(`📚 || Правильный ответ! ${time_end.education ? `Вы сможете снова учиться через ${time_end.education < 60 ? declination('секунд', 'секунду', 'секунды', time_end.education) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.education+29)/60))}` : `Вы можете снова учиться`}. ✔\n\n ${user.education.number%5 == 1 && user.education.type || user.education.number%2 == 1 && !user.education.type ? `💡 Завершился учебный год! ${!user.education.cost ? `` : `Когда вы продолжите учиться, с вас снимут ${spaces(user.education.cost)} ₽.`}` : ``}`);
	user.knowledge.diplomas.push(user.education.program);
	delete user.education;
	delete time_end.education;
	return message.send(`📚 || Правильный ответ! ✔\n🔥 Вы закончили обучение и получаете аттестат.\n\n💡 Что я могу имея аттестат? –Ничего.`);
});

hearManager.hear(/^отчислиться$/i, message => {
	let time = watch.accounts[user.id];
	if (!user.education) return message.send(`📚 || Вы не обучаетесь! ❌\n\n💡 Для просмотра списка специальностей напишите «Специальности».`, {keyboard: Keyboard.builder().textButton({label: 'Специальности'}).inline()});
	delete user.education;
	delete time.education;
	return message.send(`📚 || Вы успешно отчислились. ✔`);
});

hearManager.hear(/^(?:тренировки|тренировка|пояс|пояса)\s?(начать)?$/i, message => {
	let text = message.$match[1];
	if (user.knowledge.belt == 6) return message.send(`🥋 || Вы уже получили чёрный пояс и закончили тренироваться! ❌`);
	if (user.training) return message.send(`🥋 || Для тренировки напишите «Тренироваться»! ❌`, {keyboard: Keyboard.builder().textButton({label: 'Тренироваться'}).inline()});
	if (!text || !/начать/i.test(text)) return message.send(`🥋 || Тренировки проходят по принципу «Теория-вопрос». Тренируясь вы получаете пояса, с каждым поясом открывается больше возможностей в блоке банд. Стоимость тренировок — бесплатно.\n\n💡 Для начала тренировок напишите «Тренировки начать».`, {keyboard: Keyboard.builder().callbackButton({label: 'Тренировки начать', payload: {command: 'start_training'}, color: Keyboard.POSITIVE_COLOR}).inline()});
	user.training = {number: 1};
	user.knowledge.belt = 0;
	return message.send(`🥋 || Теперь вы ходите на тренировки. ✔\n\n💡 Для посещения тренировки напишите «Тренироваться».`, {keyboard: Keyboard.builder().textButton({label: 'Тренироваться'}).inline()});
});

hearManager.hear(/^тренироваться$/i, message => {
	let time_end = watch.accounts[user.id];
	if (user.knowledge.belt == 6) return message.send(`🥋 || Вы уже получили чёрный пояс и закончили тренироваться! ❌`);
	if (!user.training) return message.send(`🥋 || Вы не тренируетесь! ❌\n\n💡 Для начала тренировок напишите «Тренировки».`, {keyboard: Keyboard.builder().textButton({label: 'Тренировки'}).inline()});
	if (user.training.stop) return message.send(`🥋 || Вы сможете снова тренироваться через ${time_end.training < 60 ? declination('секунд', 'секунду', 'секунды', time_end.training) : declination('минут', 'минуту', 'минуты', Math.floor(time_end.training/60))}! ❌`);
	time_end.training = 1800;
	user.training.stop = true;
	if (training[user.training.number].type == 'theory') {
		user.training.number++;
		return message.send(`🥋 || Внимательно прочитайте:\n  📚 ${training[user.training.number-1].text}\n\n💡 Через 30 минут будет вопрос по данному тексту.`);
	} else if (training[user.training.number].type == 'question') {
		user.training.question = true;
		return message.send(`🥋 || Вопрос:\n  ❓ ${training[user.training.number].text}\n\n💡 Для овета напишите «Тренировка ответ [вариант ответа]».`);
	}
});

hearManager.hear(/^(?:тренировка ответ)\s?([0-9]+)?$/i, message => {
	let time_end = watch.accounts[user.id];
	let option = message.$match[1];
	let text = '';
	if (user.knowledge.belt == 6) return message.send(`🥋 || Вы уже получили чёрный пояс и закончили тренироваться! ❌`);
	if (!user.training) return message.send(`🥋 || Вы не тренируетесь! ❌\n\n💡 Для начала тренировок напишите «Тренировки».`, {keyboard: Keyboard.builder().textButton({label: 'Тренировки'}).inline()});
	if (!user.training.question) return message.send(`🥋 || Вам не задавали вопросов! ❌`);
	if (option < 1 || option > 3 || !Number(option)) return message.send(`🥋 || Выберите один вариант из трёх предложенных в вопросе из команды «Тренироваться»! ❌`);
	if (option != training[user.training.number]["otv"]) {delete user.training.question; return message.send(`🥋 || Неправильный ответ! ${time_end.training ? `Вы сможете снова пойти на тренировку через ${time_end.training < 60 ? declination('секунд', 'секунду', 'секунды', time_end.training) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.training+29)/60))}` : `Вы можете снова пойти на тренировку`}. ❌`)}
	user.training.number++;
	delete user.training.question;
	if (user.training.number%10 == 1 && user.training.number != 1) {
		let colour = [0, 'белый', 'жёлтый', 'зелёный', 'синий', 'коричневый'];
		let possibilitys = [0, '–Вы можете вступить в банду. Для вступления в банду напишите «Вступить в банду [ID банды]»\n  –Вы можете купить огнестрельное оружие и нож. Для просмотра достпуных разделов для покупки напишите «Магазин»', '–Всё, что можно с белым поясом\n  –Вас могут повысить в банде\n  –Вы можете купить взрывчатку и боевую машину. Для просмотра достпуных разделов для покупки напишите «Магазин»\n  –5 дополнительных единиц урона', '–Всё, что можно с жёлтым поясом\n  –Вы можете купить препарат. Для просмотра достпуных разделов для покупки напишите «Магазин»\n  –10 дополнительных единиц урона', '–Всё, что можно с зелёным поясом\n  –Вы можете создать свою банду. Для создания банды напишите «Создать банду [открытая/закрытая] [название]»\n  –15 дополнительных единиц урона', '–Всё, что можно с синим поясом\n  –Вы можете купить препарат «Трёхударный препарат». Для просмотра списка препаратов напишите «Препараты»\n  –20 дополнительных единиц урона'];
		user.knowledge.belt++;
		text = `🔥 Вы получили ${colour[user.knowledge.belt]} пояс.\n\n💡 Что я могу, имея ${colour[user.knowledge.belt]} пояс?\n  ${possibilitys[user.knowledge.belt]}`;
		if (user.knowledge.belt == 6) {
			delete user.training;
			delete time_end.training;
			return message.send(`🥋 || Правильный ответ! ✔\n🔥 Вы получили чёрный пояс и закончили тренироваться.\n\n💡 Что я могу, имея чёрный пояс?\n  –Всё, что можно с коричневый поясом\n  –Вы можете купить препарат «Четырёхударный препарат». Для просмотра списка препаратов напишите «Препараты»\n  –23 дополнительных единиц урона`);
		}
	}
	return message.send(`🥋 || Правильный ответ! ${time_end.training ? `Вы сможете снова пойти на тренировку через ${time_end.training < 60 ? declination('секунд', 'секунду', 'секунды', time_end.training) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.training+29)/60))}` : `Вы можете снова пойти на тренировку`}. ✔\n${text}`);
});

hearManager.hear(/^(?:автошкола)\s?(начать)?$/i, (message, next) => {
	let text = message.$match[1];
	if (user.knowledge.drivers_license) return message.send(`🚦 || Вы уже получили водительские права! ❌`);
	if (user.autoschool) return next();
	if (!text || !/начать/i.test(text)) return message.send(`🚦 || Обучение проходит по принципу «Теория-вопрос». Пройдя автошколу, вы получаете водительские права. Стоимость обучения — 25.000 ₽.\n\n💡 Для начала обучения в автошколе напишите «Автошкола начать».`, {keyboard: Keyboard.builder().callbackButton({label: 'Автошкола начать', payload: {command: "start_autoschool"}, color: Keyboard.POSITIVE_COLOR}).inline()});
	if (!user.bank.balance || user.bank.balance < 25000) return message.send(`🚦 || Недостаточно средств на карте, либо карты нет! ❌`);
	user.bank.balance -= 25000;
	user.autoschool = {number: 1};
	return message.send(`🚦 || Теперь вы учитесь в автошколе. ✔\n\n💡 Для посещения учебного дня в автошколе напишите «Автошкола».`, {keyboard: Keyboard.builder().textButton({label: 'Автошкола'}).inline()});
});

hearManager.hear(/^автошкола$/i, message => {
	let time_end = watch.accounts[user.id];
	if (user.autoschool.stop) return message.send(`🚦 || Вы сможете снова обучаться в автошколе через ${time_end.autoschool < 60 ? declination('секунд', 'секунду', 'секунды', time_end.autoschool) : declination('минут', 'минуту', 'минуты', Math.floor(time_end.autoschool/60))}! ❌`);
	time_end.autoschool = 1800;
	user.autoschool.stop = true;
	if (autoschool[user.autoschool.number].type == 'theory') {
		message.send(`🚦 || Внимательно прочитайте:\n  📚 ${autoschool[user.autoschool.number]['text']}\n\n💡 Через 30 минут будет вопрос по данному тексту.`);
		user.autoschool.number++;
		return;
	} else if (autoschool[user.autoschool.number].type == 'question') {
		user.autoschool.question = true;
		return message.send(`🚦 || Вопрос:\n  ❓ ${autoschool[user.autoschool.number]['text']}\n\n💡 Для овета напишите «Автошкола ответ [вариант ответа]».`);
	}
});

hearManager.hear(/^(?:автошкола ответ)\s?([0-9]+)?$/i, message => {
	let time_end = watch.accounts[user.id];
	let option = message.$match[1];
	if (user.knowledge.drivers_license) return message.send(`🚦 || Вы уже получили водительские права! ❌`);
	if (!user.autoschool) return message.send(`🚦 || Вы не обучаетесь в автошколе! ❌\n\n💡 Для начала обучения в автошколе напишите «Автошкола».`, {keyboard: Keyboard.builder().textButton({label: 'Автошкола'}).inline()});
	if (!user.autoschool.question) return message.send(`🚦 || Вам не задавали вопросов! ❌`);
	if (option < 1 || option > 3 || !Number(option)) return message.send(`🚦 || Выберите один вариант из трёх предложенных в вопросе из команды «Автошкола»! ❌`);
	if (option != autoschool[user.autoschool.number]["otv"]) {delete user.autoschool.question; return message.send(`🚦 || Неправильный ответ! ${time_end.autoschool ? `Вы сможете снова пойти на занятие в автошколу через ${time_end.autoschool < 60 ? declination('секунд', 'секунду', 'секунды', time_end.autoschool) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.autoschool+29)/60))}` : `Вы можете снова пойти на занятие в автошколу`}. ❌`)}
	user.autoschool.number++;
	delete user.autoschool.question;
	if (user.autoschool.number != 11) return message.send(`🚦 || Правильный ответ! ${time_end.autoschool ? `Вы сможете снова пойти на занятие в автошколу через ${time_end.autoschool < 60 ? declination('секунд', 'секунду', 'секунды', time_end.autoschool) : declination('минут', 'минуту', 'минуты', Math.floor((time_end.autoschool+29)/60))}` : `Вы можете снова пойти на занятие в автошколу`}. ✔`);
	delete user.autoschool;
	delete time_end.autoschool;
	user.knowledge.drivers_license = true;
	return message.send(`🚦 || Правильный ответ! ✔\n🔥 Вы закончили обучение в автошколе и получаете водительское удостоверение.\n\n💡 Что я могу, имея водительское удостоверение? –Ничего, но в скором времени – много чего.`);
});

hearManager.hear(/^(предпринимательство|бизнес помощь)$/i, message => {
	if (!user.enterprise) return message.send(`🗂 || ${nick(user)}, команды для регистрации предприятия:\n  🗂 «Зарегистрировать ИП» — стать индивидуальным предпринимателем.\n  🗂 «Зарегистрировать ООО» — зарегистрировать общество с ограниченной ответственностью. (Можно более 1 соучредителя)\n  🗂 «Зарегистрировать НАО» — зарегистрировать непубличное акционерное общество. (Выпуск акций для определённого круга лиц)\n  🗂 «Зарегистрировать ПАО» — зарегистрировать публичное акционерное общество. (Выпуск акций)`);
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || Для работы данной команды дождитесь конца регистрации предприятия! ❌`);
	let enterprise = enterprises.enterprises[user.enterprise.id];
	return message.send(`
🗂 || ${nick(user)}, команды предпринимательства:
🤓 | Информация:
  🗂 «Предприятие» — информация о вашем предприятии.${enterprise.business ? `\n  📊 «Бизнес» — информация о бизнесе предприятия.` : ``}${!enterprise.business || enterprise.business && enterprise.business.realty != business.realty[enterprise.business.number].maxlvl ? `\n\n🤑 | Бизнес:${!enterprise.business ? `\n  📊 «Бизнесы» — список доступных для открытия бизнесов.` : ``}${enterprise.business && enterprise.business.realty != business.realty[enterprise.business.number].maxlvl ? `\n  🏠 «Улучшить недвижимость» — улучшение недвижимости бизнеса.` : ``}` : ``}
	`);
});

hearManager.hear(/^(зарегистрировать ип|регистрация ип)$/i, async message => {
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || У вас уже регистрируется предпринимателськая деятельность! ❌`);
	if (user.enterprise) return message.send(`🗂 || Вы уже зарегистрировали предпринимательскую деятельность! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (user.bank.balance < 800) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет! Стоимость регистрации ИП — 800 ₽. ❌`);
	let surname = await message.question(`🗂 || Вы находитесь в помощнике по регистрации индивидуального предпринимателя. Пожалуйста, придумайте фамилию, которая будет указана в ИП. Фамилия должна быть написана кириллицей, не содержать смайлики и состоять из одного слова.\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	surname.text = ucFirst(surname.text.toLowerCase());
	if (!surname.text || surname.text == 'Отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации индивидуального предпринимателя! ❌`);
	let name = await message.question(`🗂 || Отлично! Теперь придумайте полное имя, которое будет указано в ИП. Имя должно существовать, написано кириллицей, не содержать смайлики и состоять из одного слова.\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	name.text = ucFirst(name.text.toLowerCase());
	if (!name.text || name.text == 'Отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации индивидуального предпринимателя! ❌`);
	let patronymic = await message.question(`🗂 || Осталось придумать отчество, которое будет указано в ИП. Отчество должно существовать, написано кириллицей, не содержать смайлики и состоять из одного слова.\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	patronymic.text = ucFirst(patronymic.text.toLowerCase());
	if (!patronymic.text || patronymic.text == 'Отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации индивидуального предпринимателя! ❌`);
	for (i in accounts.accounts) {
		let player = accounts.accounts[i];
		if (player.enterprise && !player.enterprise.id && player.enterprise.cofounders && player.enterprise.cofounders.findIndex(fou => fou == user.id) != -1) delete player.enterprise.cofounders[player.enterprise.cofounders.findIndex(cof => cof == user.id)];
	}
	user.bank.balance -= 800;
	watch.accounts[user.id].enterprise = random(10800, 25200);
	support.que_quantity++;
	let quantity = support.que_quantity;
	let title = `${surname.text} ${name.text[0]}. ${patronymic.text[0]}.`;
	for (i in enterprises.enterprises) if (enterprises.enterprises[i].trademark && enterprises.enterprises[i].trademark.toLowerCase() == title.toLowerCase() || watch.enterprises[i].trademark && watch.enterprises[i].trademark.title.toLowerCase() == title.toLowerCase() || enterprises.enterprises[i].title.toLowerCase() == title.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации ИП. ❌`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.title.toLowerCase() == title.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации ИП. ❌`);
	support.questions[quantity] = {"type":"enterprise","sort":1,"content":title,"account":user.id,"status":false};
	for (i in support.agents) send(`🗂 || Заявка на название предприятия #${quantity}\n  📋 Название: «${surname.text} ${name.text} ${patronymic.text}»\n\n💡 Для принятия названия предприятия напишите «/allow ${quantity}».\n💡 Для отклонения названия предприятия напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название предприятия:\n  #1. Нецензурные слова или выражения\n  #7. Запрещённые символы, либо смайлики\n  #8. Фамилии, имени или отчества не существует\n  #9. Написано не кириллицей\n  #10. Фамилия, имя или отчество состоит не из одного слова`, support.agents[i].id);
	user.enterprise = {title: title, type: 1}
	return message.send(`🗂 || Регистрация ИП займёт некоторое время. ${!user.course || user.course.type != 1 ? `Пока идёт регистрация, вы можете записаться на курс по предпринимательсву, чтобы научиться управлению бизнеса в «Горожанин боте».\n\n💡 Для записи на курс напишите «Курс по предпринимательству».` : ``}`, {keyboard: !user.course || user.course.type != 1 ? Keyboard.builder().textButton({label: 'Курс по предпринимателству'}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^ликвидировать предприятие$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`🗂 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	if (user.bank.balance < 800) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет! Стоимость ликвидации предприятия — 800 ₽. ❌`);
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (enterprise.business) return message.send(`🗂 || Для ликвидации предприятия продайте бизнес! ❌\n\n💡 Для закрытия бизнеса напишите «Закрыть бизнес».`, {keyboard: Keyboard.builder().textButton({label: 'Закрыть бизнес', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (watch.enterprises[enterprise.id].liquidation) return message.send(`🗂 || Ликвидация предприятия уже идёт! ❌\n\n💡 Вы можете отменить ликвидацию в любой момент с помощью команды «Отменить ликвидацию».`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию'}).inline()});
	let answer = await message.question(`🗂 || Вы уверены, что вы хотите ликвидировать предприятие?\n\n💡 Отменить данное действие будет невозможно.`, {keyboard: Keyboard.builder().textButton({label: 'Да', color: Keyboard.NEGATIVE_COLOR}).textButton({label: 'Отмена', color: Keyboard.POSITIVE_COLOR}).inline()});
	answer.text = answer.text.toLowerCase();
	if (!answer.text || answer.text != 'да') return message.send(`🗂 || Ликвидация предприятия отменена. ✔`);
	user.enterprise.liquidation = true;
	if (enterprise.type == 2) for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]] && !accounts.accounts[enterprise.founders[i]].enterprise.liquidation) return message.send(`🗂 || Вы проголосовали за ликвидацию предприятия. Для полной ликвидации остальные соучредители должны написать «Ликвидировать предприятие».\n\n💡 Для отмены голоса за ликвидацию предприятия напишите «Отменить ликвидацию».`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию', color: Keyboard.POSITIVE_COLOR}).inline()});
	user.bank.balance -= 800;
	watch.enterprises[enterprise.id].liquidation = random(10800, 25200);
	enterprise_notification(`🗂 || Начинается ликвидация предприятия «${enterprise.title}». Ликвидация займёт некоторое время.\n\n💡 Вы можете отменить ликвидацию в любой момент с помощью команды «Отменить ликвидацию».`, 'enterprise', enterprise, user, true, Keyboard.builder().textButton({label: 'Отменить ликвидацию'}).inline());
	return message.send(`🗂 || Начинается ликвидация предприятия «${enterprise.title}». Ликвидация займёт некоторое время.\n\n💡 Вы можете отменить ликвидацию в любой момент с помощью команды «Отменить ликвидацию».`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию'}).inline()});
});

hearManager.hear(/^отменить ликвидацию$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`🗂 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	enterprise = enterprises.enterprises[user.enterprise.id];
	if (!watch.enterprises[enterprise.id].liquidation && !user.enterprise.liquidation) return message.send(`🗂 || Процесс ликвидации предприятия не идёт! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	let answer = await message.question(`🗂 || Вы уверены, что вы хотите отменить ликвидацию предприятия?`, {keyboard: Keyboard.builder().textButton({label: 'Да', color: Keyboard.POSITIVE_COLOR}).textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	answer.text = answer.text.toLowerCase();	
	if (!answer.text || answer.text != 'да') return message.send(`🗂 || Отмена ликвидации предприятия отменена. ✔`);
	if (!watch.enterprises[enterprise.id].liquidation && user.enterprise.liquidation) {delete user.enterprise.liquidation; return message.send(`🗂 || Вы отменили свой голос за ликвидацию предприятия. ✔`)};
	if (enterprise.type == 2 && watch.enterprises[enterprise.id].liquidation) for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]] && !accounts.accounts[enterprise.founders[i]].enterprise.cancelliquidation) {user.enterprise.cancelliquidation = true; return message.send(`🗂 || Вы проголосовали за отмену ликвидации предприятия. Для полной отмены ликвидации остальные соучредители должны написать «Отмена ликвидации».`)}
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.id == enterprise.id) delete accounts.accounts[i].enterprise.liquidation;
	delete watch.enterprises[enterprise.id].liquidation;
	enterprise_notification(`🗂 || Ликвидация предприятия «${enterprise.title}» отменена.`, 'enterprise', enterprise, user, true);
	return message.send(`🗂 || Ликвидация предприятия «${enterprise.title}» отменена.`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию'}).inline()});
});

hearManager.hear(/^(зарегистрировать ооо|регистрация ооо)$/i, async message => {
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || У вас уже регистрируется предпринимателськая деятельность! ❌`);
	if (user.enterprise) return message.send(`🗂 || Вы уже зарегистрировали предпринимательскую деятельность! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (user.bank.balance < 6000) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет! Стоимость регистрации юридического лица — 6.000 ₽. ❌`);
	let title = await message.question(`🗂 || Вы находитесь в помощнике по регистрации общества с ограниченной ответственностью (ООО). Пожалуйста, придумайте название для вашего предприятия. Название не должно содержать смайлики и специальные слова (название государств и другое).\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	for (i in enterprises.enterprises) if (enterprises.enterprises[i].trademark && enterprises.enterprises[i].trademark.toLowerCase() == title.text.toLowerCase() || watch.enterprises[i].trademark && watch.enterprises[i].trademark.title.toLowerCase() == title.text.toLowerCase() || enterprises.enterprises[i].title.toLowerCase() == title.text.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации ООО. ❌`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.title.toLowerCase() == title.text.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации ООО. ❌`);
	if (!title.text || title.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации общества с ограниченной ответственностью (ООО)! ❌`);
	let co_foundersInput = await message.question(`🗂 || Отлично! Теперь вам надо пригласить игроков, которые будут соучредителями ООО. Для этого перечислете через «,» (запятую) ID аккаунтов. Их количество может быть от 1 до 9. (Например: «24, 54, 45»)\n\n💡 Для регистрации ООО без соучредителей напишите «Без соучредителей».\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Без соучредителей'}).row().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!co_foundersInput.text || co_foundersInput.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации общества с ограниченной ответственностью (ООО)! ❌`);
	let cofounders = [];
	if (!/^без соучредителей$/i.test(co_foundersInput.text)) {
		let co_founders = [];
		let end;
		co_founders = co_foundersInput.text.split(',');
		co_founders.map(id => {
			let rec = id;
			id = Number(id.trim());
			let player = accounts.accounts[id];
			if (!player) {end = 1; return message.send(`🗂 || Игрока с ID #${rec} не существует! Вы вышли из помощника по регистрации ООО. ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`)}
			for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) {end = 1; return message.send(`🗂 || ${nick(player)} (#${rec}) ${gender('добавил', 'добавила', player)} вас в чёрный список! Вы вышли из помощника по регистрации ООО. ❌`)}
			for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) {end = 1; return message.send(`🗂 || Вы добавили ${nick(player)} (#${rec}) в чёрный список! Вы вышли из помощника по регистрации ООО. ❌`)}
			if (player.fines && player.fines.account_ban) {end = 1; return message.send(`🗂 || ${nick(player)} (#${rec}) ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! Вы вышли из помощника по регистрации ООО. ❌`)}
			if (player.enterprise) {end = 1; return message.send(`🗂 || ${nick(player)} (#${rec}) уже имеет предприятие или регистрирует его! Вы вышли из помощника по регистрации ООО. ❌`)}
			if (player.id == user.id) {end = 1; return message.send(`🗂 || Нельзя пригласить самого себя! Вы вышли из помощника по регистрации ООО. ❌`)}
			cofounders.push(player.id);
		});
		if (end) return;
	}
	cofounders.push(user.id);
	if (cofounders.length > 10) return message.send(`🗂 || Максимальное количество соучредителей в предприятии — 10! (Вы тоже считаетесь) ❌`);
	let contribution = await message.question(`🗂 || Теперь вам надо внести взнос, от которого будет зависеть ваша доля прибыли предприятия. Введите сумму от 2.500 ₽ (точки и знак «₽» не ставить).\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!contribution.text || contribution.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации общества с ограниченной ответственностью (ООО)! ❌`);
	let amount = parserInteger(contribution.text);
	if (!Number(amount) || amount < 1) return message.send(`🗂 || Сумма взноса должна быть в числовом виде и неравна нулю! Вы вышли из помощника по регистрации ООО. ❌`);
	if (!user.bank.balance || user.bank.balance < amount+6000) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет (считается уставной капитал и госпошлина 6.000 ₽)! Вы вышли из помощника по регистрации ООО. ❌`);
	if (amount < 2500) return message.send(`🗂 || Взнос доступен от 2.500 ₽! Вы вышли из помощника по регистрации ООО. ❌`);
	user.bank.balance -= amount+6000;
	for (i in accounts.accounts) {
		let player = accounts.accounts[i];
		if (player.enterprise && !player.enterprise.id && player.enterprise.cofounders && player.enterprise.cofounders.findIndex(fou => fou == user.id) != -1) delete player.enterprise.cofounders[player.enterprise.cofounders.findIndex(cof => cof == user.id)];
	}
	watch.accounts[user.id].enterprise = random(10800, 36000);
	support.que_quantity++;
	let quantity = support.que_quantity;
	title = title.text;
	support.questions[quantity] = {"type":"enterprise","sort":2,"content":title,"account":user.id,"status":false};
	for (i in support.agents) send(`🗂 || Заявка на название предприятия #${quantity}\n  📋 Название: «${title}»\n\n💡 Для принятия названия предприятия напишите «/allow ${quantity}».\n💡 Для отклонения названия предприятия напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название предприятия:\n  #1. Нецензурные слова или выражения\n  #7. Запрещённые символы, либо смайлики\n  #11. Используются запрещённые слова`, support.agents[i].id);
	user.enterprise = {title: title, type: 2, cofounders: cofounders, fraction: Number(amount)}
	return message.send(`🗂 || Регистрация ООО займёт некоторое время. Когда название предприятия пройдёт проверку, игрокам, которых вы пригласили, прийдёт уведомление о приглашение стать соучредителями. ${!user.course || user.course.type != 1 ? `Пока идёт регистрация, вы можете записаться на курс по предпринимательсву, чтобы научиться управлению бизнеса в «Горожанин боте».\n\n💡 Для записи на курс напишите «Курс по предпринимательству».` : ``}`, {keyboard: !user.course || user.course.type != 1 ? Keyboard.builder().textButton({label: 'Курс по предпринимателству'}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^(?:принять приглашение)\s?([0-9]+)?/i, async message => {
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || У вас уже регистрируется предпринимателськая деятельность, либо вы уже приняли предложение! ❌`);
	if (user.enterprise) return message.send(`🗂 || Вы уже зарегистрировали предпринимательскую деятельность! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	let player = accounts.accounts[message.$match[1]];
	if (!player) return message.send(`🗂 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.id == user.id) return message.send(`🗂 || Нельзя принять приглашение от самого себя! ❌`);
	if (!player.enterprise || player.enterprise.id || player.enterprise.cofounders.findIndex(fou => fou == user.id) == -1 || !player.enterprise.permissionCofounders) return message.send(`🗂 || ${nick(player)} не ${gender('приглашал', 'приглашала', player)} вас стать соучредителем! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`🗂 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	let contribution = await message.question(`🗂 || ${nick(user)}, вам надо внести взнос, от которого будет зависеть ваша доля прибыли предприятия. Введите сумму от 2.500 ₽ (точки и знак «₽» не ставить).\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!contribution.text || contribution.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по принятию приглашения стать соучредителем! ❌\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, {keyboard: Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline()});
	let amount = parserInteger(contribution.text);
	if (!Number(amount) || amount < 1) return message.send(`🗂 || Сумма взноса должна быть в числовом виде и неравна нулю! Вы вышли из помощника по принятию приглашения стать соучредителем. ❌\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, {keyboard: Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!user.bank.balance || user.bank.balance < amount) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет! Вы вышли из помощника по принятию приглашения стать соучредителем. ❌\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, {keyboard: Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (amount < 2500) return message.send(`🗂 || Взнос доступен от 2.500 ₽! Вы вышли из помощника по принятию приглашения стать соучредителем. ❌\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, {keyboard: Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline()});
	user.enterprise = {fraction: Number(amount)}
	user.bank.balance -= amount;
	let count = 0;
	let ecount = 0;
	for (i in accounts.accounts) if (player.enterprise.cofounders.findIndex(fou => fou == i) != -1 && accounts.accounts[i].enterprise) count++;
	for (i in player.enterprise.cofounders) if (accounts.accounts[player.enterprise.cofounders[i]]) ecount++;
	if (count == ecount) {
		if (!watch.accounts[player.id].enterprise) watch.accounts[player.id].enterprise = 1;
		player.enterprise.permission = true;
	}
	notification(`🗂 || ${nick(user)} принял предложение стать соучредителем.`, 'enterprise', player);
	return message.send(`🗂 || Вы приняли приглашение стать соучредителем. Дождитесь конца регистрации предприятия.`);
});

hearManager.hear(/^(?:отклонить приглашение)\s?([0-9]+)?/i, async message => {
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || У вас уже регистрируется предпринимателськая деятельность, либо вы уже приняли предложение! ❌`);
	if (user.enterprise) return message.send(`🗂 || Вы уже зарегистрировали предпринимательскую деятельность! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	let player = accounts.accounts[message.$match[1]];
	if (!player) return message.send(`🗂 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.id == user.id) return message.send(`🗂 || Нельзя отклонить приглашение от самого себя! ❌`);
	if (!player.enterprise || player.enterprise.id || player.enterprise.cofounders.findIndex(fou => fou == user.id) == -1 || !player.enterprise.permissionCofounders) return message.send(`🗂 || ${nick(player)} не ${gender('приглашал', 'приглашала', player)} вас стать соучредителем! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`🗂 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	let answer = await message.question(`🗂 || ${nick(user)}, вы уверены, что не хотите стать соучредителем данного предприятия?\n\n💡 Отменить данное действие будет невозможно.`, {keyboard: Keyboard.builder().textButton({label: 'Да', color: Keyboard.NEGATIVE_COLOR}).textButton({label: 'Отмена', color: Keyboard.POSITIVE_COLOR}).inline()});
	if (!answer.text || answer.text.toLowerCase() != 'да') return message.send(`🗂 || Отклонение приглашения отменено.\n\n💡 Для принятия предложения напишите «Принять приглашение ${player.id}».\n💡 Для отклонения предложения напишите «Отклонить приглашение ${player.id}».`, {keyboard: Keyboard.builder().textButton({label: `Принять приглашение ${player.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отклонить приглашение ${player.id}`, color: Keyboard.NEGATIVE_COLOR}).inline()});
	delete player.enterprise.cofounders[player.enterprise.cofounders.findIndex(cof => cof == user.id)];
	let count = 0;
	let ecount = 0;
	for (i in accounts.accounts) if (player.enterprise.cofounders.findIndex(fou => fou == i) != -1 && accounts.accounts[i].enterprise) count++;
	for (i in player.enterprise.cofounders) if (accounts.accounts[player.enterprise.cofounders[i]]) ecount++;
	if (count == ecount) {
		if (!watch.accounts[player.id].enterprise) watch.accounts[player.id].enterprise = 1;
		player.enterprise.permission = true;
	}
	notification(`🗂 || ${nick(user)} отклонил предложение стать соучредителем.`, 'enterprise', player);
	return message.send(`🗂 || Вы отклонили приглашение стать соучредителем.`);
});

hearManager.hear(/^покинуть ооо$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`🗂 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (enterprise.type != 2) return message.send(`🗂 || Тип вашего предприятия не ООО! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (enterprise.founders.length == 1) return message.send(`🗂 || Покинуть ООО можно, если в предприятии больше 1 соучредителя! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	let answer = await message.question(`🗂 || Вы уверены, что вы хотите выйти из ООО? Если вы выйдите, то вы перестаните быть соучредителем и ваша доля прибыли исчезнет.\n\n💡 Отменить данное действие будет невозможно.`, {keyboard: Keyboard.builder().textButton({label: 'Да', color: Keyboard.NEGATIVE_COLOR}).textButton({label: 'Отмена', color: Keyboard.POSITIVE_COLOR}).inline()});
	answer.text = answer.text.toLowerCase();
	if (!answer.text || answer.text != 'да') return message.send(`🗂 || Выход из ООО отменён. ✔`);
	let cofounders = [];
	delete enterprise.founders[enterprise.founders.findIndex(fou => fou == user.id)];
	for (i in enterprise.founders) if (i != 'random' && enterprise.founders[i]) cofounders.push(enterprise.founders[i]);
	enterprise.founders = cofounders;
	for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]]) accounts.accounts[enterprise.founders[i]].enterprise.fraction += user.enterprise.fraction/enterprise.founders.length;
	delete user.enterprise;
	enterprise_notification(`🗂 || ${nick(user)} покинул предприятие ООО «${enterprise.title}».`, 'enterprise', enterprise, user, true, Keyboard.builder().inline(), true);
	return message.send(`🗂 || Вы покинули предприятие ООО «${enterprise.title}». ✔`);
});

hearManager.hear(/^(зарегистрировать|регистрация)\s(нао|пао)$/i, async message => {
	if (user.enterprise && !user.enterprise.id) return message.send(`🗂 || У вас уже регистрируется предпринимателськая деятельность! ❌`);
	if (user.enterprise) return message.send(`🗂 || Вы уже зарегистрировали предпринимательскую деятельность! ❌\n\n💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».`, {keyboard: Keyboard.builder().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (user.bank.balance < 6000) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет! Стоимость регистрации юридического лица — 6.000 ₽. ❌`);
	let type = message.$match[1].toLowerCase() == 'нао' ? 3 : 4;
	let title = await message.question(`🗂 || Вы находитесь в помощнике по регистрации акционерного общества (АО). Пожалуйста, придумайте название для вашего предприятия. Название не должно содержать смайлики и специальные слова (название государств и другое).\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!title.text || title.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации акционерного общества (АО)! ❌`);
	for (i in enterprises.enterprises) if (enterprises.enterprises[i].trademark && enterprises.enterprises[i].trademark.toLowerCase() == title.text.toLowerCase() || watch.enterprises[i].trademark && watch.enterprises[i].trademark.title.toLowerCase() == title.text.toLowerCase() || enterprises.enterprises[i].title.toLowerCase() == title.text.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации АО. ❌`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.title.toLowerCase() == title.text.toLowerCase()) return message.send(`🗂 || Предприятие или товарный знак с таким названием уже существует! Вы вышли из помощника по регистрации АО. ❌`);
	let capital = await message.question(`🗂 || Теперь вам надо установить уставной капитал, от которого будут зависять акции, а так же это будет первые деньги для траты. Уставной капитал можно будет в любой момент изменить. Введите сумму от 10.000 ₽ (точки и знак «₽» не ставить).\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!capital.text || capital.text.toLowerCase() == 'отмена') return message.send(`🗂 || Вы вышли из помощника по регистрации акционерного общества (АО)! ❌`);
	let amount = parserInteger(capital.text);
	if (!Number(amount) || amount < 1) return message.send(`🗂 || Сумма взноса должна быть в числовом виде и неравна нулю! Вы вышли из помощника по регистрации АО. ❌`);
	if (!user.bank.balance || user.bank.balance < amount+6000) return message.send(`🗂 || Недостаточно средств на карте, либо карты нет (считается уставной капитал и госпошлина 6.000 ₽)! Вы вышли из помощника по регистрации АО. ❌`);
	if (amount < 10000) return message.send(`🗂 || Взнос доступен от 10.000 ₽! Вы вышли из помощника по регистрации АО. ❌`);
	for (i in accounts.accounts) {
		let player = accounts.accounts[i];
		if (player.enterprise && !player.enterprise.id && player.enterprise.cofounders && player.enterprise.cofounders.findIndex(fou => fou == user.id) != -1) delete player.enterprise.cofounders[player.enterprise.cofounders.findIndex(cof => cof == user.id)];
	}
	user.bank.balance -= amount+6000;
	watch.accounts[user.id].enterprise = random(10800, 43200);
	support.que_quantity++;
	let quantity = support.que_quantity;
	title = title.text;
	support.questions[quantity] = {"type":"enterprise","sort":type,"content":title,"account":user.id,"status":false};
	for (i in support.agents) send(`🗂 || Заявка на название предприятия #${quantity}\n  📋 Название: «${title}»\n\n💡 Для принятия названия предприятия напишите «/allow ${quantity}».\n💡 Для отклонения названия предприятия напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название предприятия:\n  #1. Нецензурные слова или выражения\n  #7. Запрещённые символы, либо смайлики\n  #11. Используются запрещённые слова`, support.agents[i].id);
	user.enterprise = {title: title, type: type, fraction: Number(amount)}
	return message.send(`🗂 || Регистрация АО займёт некоторое время. ${!user.course || user.course.type != 1 ? `Пока идёт регистрация, вы можете записаться на курс по предпринимательсву, чтобы научиться управлению бизнеса в «Горожанин боте».\n\n💡 Для записи на курс напишите «Курс по предпринимательству».` : ``}`, {keyboard: !user.course || user.course.type != 1 ? Keyboard.builder().textButton({label: 'Курс по предпринимателству'}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^предприятие$/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`🗂 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	let types_enterprise = [0, 'ИП', 'ООО', 'НАО', 'ПАО'];
	let key = Keyboard.builder();
	if (enterprise.business) key.textButton({label: 'Бизнес'});
	if (enterprise.type == 2) key.textButton({label: 'Соучредители'});
	if (!watch.enterprises[enterprise.id].liquidation && !user.enterprise.liquidation) key.row().textButton({label: 'Ликвидировать предприятие', color: Keyboard.NEGATIVE_COLOR});
	let names = [0, 'Аквапарк', 'Парк аттракционов', 'Студия звукозаписи', 'Фотостудия', 'Кофейня'];
	return message.send(`
🗂 || Ваше предприятие:
  🔎 ${types_enterprise[enterprise.type]} «${enterprise.title}»${enterprise.type == 2 ? ` — ${declination('соучредителей', 'соучредитель', 'соучредлителя', enterprise.founders.length)}` : ``}${enterprise.type != 1 ? `\n  👤 ${nick(user)} — доля ${user.enterprise.fraction ? user.enterprise.fraction : (enterprise.stocks ? 100-enterprise.stocks.fraction : 100)}%` : ``}

${enterprise.business ? `📊 ${names[enterprise.business.number]}${enterprise.trademark ? ` «${enterprise.trademark}»` : (enterprise.type != 1 ? ` «${enterprise.title}»` : ``)}\n` : ``}📍 ОГРН: ${enterprise.psrn}${enterprise.accpayment ? `\n💰 Баланс расчётного счёта: ${spaces(enterprise.accpayment.balance)} ₽`: ``}
💎 Активы: ${enterprise.capital ? spaces(enterprise.capital) : spaces(enterprise.accpayment.balance+business.realty[enterprise.business.number][enterprise.business.realty].cost)} ₽

${enterprise.business ? `💡 Для просмотра информации о бизнесе напишите «Бизнес».\n` : ``}${enterprise.type == 2 ? `💡 Для просмотра списка соучредителей напишите «Соучредители».\n` : ``}${!watch.enterprises[enterprise.id].liquidation && !user.enterprise.liquidation ? `💡 Для ликвидации предприятия напишите «Ликвидировать предприятие».` : ``}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^соучредители$/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`👥 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (enterprise.type != 2) return message.send(`👥 || Тип вашего предприятия не ООО! ❌`);
	let cofounders = [];
	let text = ``;
	for (i in enterprise.founders) {let player = accounts.accounts[enterprise.founders[i]]; if (player) cofounders.push({text: `\n  👤 ${nick(player)} — доля ${spaces(player.enterprise.fraction)}% (#${player.id})`, fraction: player.enterprise.fraction})}
	cofounders.sort((a, b) => {return b.fraction - a.fraction});
	for (i in cofounders) if (i != 'random') text += cofounders[i].text;
	return message.send(`👥 || Соучредители ООО «${enterprise.title}»:${text}\n\n${cofounders.length > 1 ? `💡 Для выхода из ООО напишите «Покинуть ООО».` : ``}`, {keyboard: cofounders.length > 1 ? Keyboard.builder().textButton({label: 'Покинуть ООО', color: Keyboard.NEGATIVE_COLOR}).inline() : Keyboard.builder().inline()});
});

hearManager.hear(/^бизнес$/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`📊 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.business) return message.send(`📊 || У вас не окрыт бизнес! ❌\n\n💡 Для просмотра списка бизнесов напишите «Бизнесы».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнесы'}).inline()});
	let types_enterprise = [0, 'ИП', 'ООО', 'НАО', 'ПАО'];
	let names = [0, 'Аквапарк', 'Парк аттракционов', 'Студия звукозаписи', 'Фотостудия', 'Кофейня'];
	return message.send(`
📊 || О бизнесе:
  🔎 ${names[enterprise.business.number]}${enterprise.trademark ? ` «${enterprise.trademark}»` : (enterprise.type != 1 ? ` «${enterprise.title}»` : ``)}
  🗂 ${types_enterprise[enterprise.type]} «${enterprise.title}»

📏 Площадь: ${business.realty[enterprise.business.number][enterprise.business.realty].square}
🏡 Уровень недвижимости ${enterprise.business.realty} из ${business.realty[enterprise.business.number].maxlvl}

💡 Для закрытия бизнеса напишите «Закрыть бизнес».
	`, {keyboard: Keyboard.builder().textButton({label: 'Закрыть бизнес', color: Keyboard.NEGATIVE_COLOR}).inline()});
});

hearManager.hear(/^закрыть бизнес$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`📊 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.business) return message.send(`📊 || У вас не окрыт бизнес! ❌\n\n💡 Для просмотра списка бизнесов напишите «Бизнесы».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнесы'}).inline()});
	let names = [0, 'Аквапарк', 'Парк аттракционов', 'Студия звукозаписи', 'Фотостудия', 'Кофейня'];
	user.enterprise.salebusiness = true;
	if (enterprise.type == 2) for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]] && !accounts.accounts[enterprise.founders[i]].enterprise.salebusiness) return message.send(`📊 || Вы проголосовали за закрытие бизнеса «${names[enterprise.business.number]}». Для полного закрытия остальные соучредители должны написать «Закрыть бизнес».`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.id == enterprise.id) delete accounts.accounts[i].enterprise.salebusiness;
	message.send(`📊 || Вы закрыли бизнес «${names[enterprise.business.number]}». ✔`);
	delete enterprise.business;
	return;
});

hearManager.hear(/^(?:бизнесы|бизнес)\s?([0-9]+)?/i, message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`📊 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	let number = Number(message.$match[1]);
	if (!number) {
		return message.send(`
📊 || Бизнесы:
  💧 Аквапарк (#1)
  🎡 Парк аттракционов (#2)
  🎧 Студия звукозаписи (#3)
  📷 Фотостудия (#4)
  ☕ Кофейня (#5)${!enterprise.business ? `\n\n💡 Для выбора бизнеса напишите «Бизнес [ID бизнеса]».` : ``}
		`);
	}
	let names = [0, 'Аквапарк', 'Парк аттракционов', 'Студия звукозаписи', 'Фотостудия', 'Кофейня'];
	if (watch.enterprises[enterprise.id].liquidation) return message.send(`📊 || Нельзя открыть бизнес во время ликвидации! ❌\n\n💡 Для отмены ликвидации напишите «Отменить ликвидацию».`, {keyboard: Keyboard.builder().textButton({label: 'Отменить ликвидацию', color: Keyboard.POSITIVE_COLOR}).inline()});
	if (enterprise.business) return message.send(`📊 || Ваше предприятие уже имеет бизнес! ❌\n\n💡 Для закрытия бизнеса напишите «Закрыть бизнес».`, {keyboard: Keyboard.builder().textButton({label: 'Закрыть бизнес', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (number < 1 || number > 5) return message.send(`📊 || Бизнеса с таким номером не существует! ❌`);
	user.enterprise.business = number;
	if (enterprise.type == 2) for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]] && !accounts.accounts[enterprise.founders[i]].enterprise.business) return message.send(`📊 || Вы проголосовали за покупку бизнеса «${names[number]}». Для полной покупки остальные соучредители должны написать «Бизнес ${number}».`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.id == enterprise.id) delete accounts.accounts[i].enterprise.business;
	enterprise.business = {number: number, realty: 0};
	return message.send(`📊 || Вы открыли бизнес «${names[number]}». ✔\n\n💡 Для просмотра информации о вашем бизнесе напишите «Бизнес».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнес', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(зарегистрировать товарный знак|регистрация товарного знака)$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`® || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.trademark && watch.enterprises[enterprise.id].trademark) {
		let answer = await message.question(`® || Товарный знак уже регистрируется! ❌\n\n💡 Вы хотите сменить товарный знак?`, {keyboard: Keyboard.builder().textButton({label: 'Да', color: Keyboard.POSITIVE_COLOR}).textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
		if (!answer.text || answer.text.toLowerCase() != 'да') return message.send(`® || Смена товарного знака отменена. ✔`);
		let title = await message.question(`® || Вы находитесь в помощнике по смене товарного знака. Товарный знак — это название вашего бизнеса.\nПожалуйста, придумайте название для вашего товарного знака. Название не должно содержать смайлики и специальные слова (название государств и другое), быть одинаковым с названием предприятия.\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
		title = title.text;
		if (!title || title.toLowerCase() == 'отмена') return message.send(`® || Вы вышли из помощника по регистрации товарного знака! ❌`);
		if (title == enterprise.title || enterprise.trademark == title) return message.send(`® || Товарный знак должен отличаться от названия предприятия и предыдущего товарного знака! ❌`);
		for (i in enterprises.enterprises) if (enterprises.enterprises[i].trademark && enterprises.enterprises[i].trademark.toLowerCase() == title.toLowerCase() || watch.enterprises[i].trademark && watch.enterprises[i].trademark.title.toLowerCase() == title.toLowerCase() || enterprises.enterprises[i].title.toLowerCase() == title.toLowerCase()) return message.send(`® || Товарный знак или бизнес с таким названием уже существует! Вы вышли из помощника по регистрации товарного знака. ❌`);
		watch.enterprises[enterprise.id].trademark.title = title.text;
		delete watch.enterprises[enterprise.id].trademark.permission;
		support.que_quantity++;
		let quantity = support.que_quantity;
		support.questions[quantity] = {"type":"trademark","content":title,"account":enterprise.id,"status":false};
		for (i in support.agents) send(`® || Заявка на товарный знак #${quantity}\n  📋 Наименование: «${title}»\n\n💡 Для принятия названия товарного знака напишите «/allow ${quantity}».\n💡 Для отклонения названия товарного знака напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название товарного знака:\n  #1. Нецензурные слова или выражения\n  #7. Запрещённые символы, либо смайлики\n  #11. Используются запрещённые слова`, support.agents[i].id);
		return message.send(`® || Вы сменили товарный знак! Регистрация продолжается.`);
	}
	if (!enterprise.accpayment || enterprise.accpayment.balance < 16000) return message.send(`® || Недостаточно средств на расчётном счёте, либо расчётный счёт не открыт! Стоимость регистрации товарного знака — 16.000 ₽. ❌\n\n${!enterprise.accsettlement ? `💡 Для открытия расчётного счёта напишите «Открыть расчётный счёт».` : ``}`, {keyboard: !enterprise.accsettlement ? Keyboard.builder().textButton({label: 'Открыть расчётный счёт', color: Keyboard.POSITIVE_COLOR}).inline() : Keyboard.builder().inline()});
	let title = await message.question(`® || Вы находитесь в помощнике по регистрации товарного знака. Товарный знак — это название вашего бизнеса.\nПожалуйста, придумайте название для вашего товарного знака. Название не должно содержать смайлики и специальные слова (название государств и другое), быть одинаковым с названием предприятия.\n\n💡 Для выхода напишите «Отмена».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).inline()});
	title = title.text;
	if (!title || title.toLowerCase() == 'отмена') return message.send(`® || Вы вышли из помощника по регистрации товарного знака! ❌`);
	if (title == enterprise.title) return message.send(`® || Товарный знак должна отличаться от названия предприятия! ❌\n\n💡 Для патентования названия предприятия напишите «Запатентовать название предприятия».`, {keyboard: Keyboard.builder().textButton({label: 'Запатентовать название предприятия'}).inline()});
	for (i in enterprises.enterprises) if (enterprises.enterprises[i].trademark && enterprises.enterprises[i].trademark.toLowerCase() == title.toLowerCase() || watch.enterprises[i].trademark && watch.enterprises[i].trademark.title.toLowerCase() == title.toLowerCase() || enterprises.enterprises[i].title.toLowerCase() == title.toLowerCase()) return message.send(`® || Товарный знак или бизнес с таким названием уже существует! Вы вышли из помощника по регистрации товарного знака. ❌`);
	for (i in accounts.accounts) if (accounts.accounts[i].enterprise && accounts.accounts[i].enterprise.title.toLowerCase() == title.toLowerCase()) return message.send(`® || Товарный знак или бизнес с таким названием уже существует! Вы вышли из помощника по регистрации товарного знака. ❌`);
	watch.enterprises[enterprise.id].trademark = {trademark: random(540000, 1080000), title: title};
	support.que_quantity++;
	let quantity = support.que_quantity;
	support.questions[quantity] = {"type":"trademark","content":title,"account":enterprise.id,"status":false};
	for (i in support.agents) send(`® || Заявка на товарный знак #${quantity}\n  📋 Наименование: «${title}»\n\n💡 Для принятия названия товарного знака напишите «/allow ${quantity}».\n💡 Для отклонения названия товарного знака напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название товарного знака:\n  #1. Нецензурные слова или выражения\n  #7. Запрещённые символы, либо смайлики\n  #11. Используются запрещённые слова`, support.agents[i].id);
	return message.send(`® || Регистрация товарного знака занимает от 6 до 12 дней.`);
});

hearManager.hear(/^улучшить недвижимость$/i, async message => {
	if (!user.enterprise || !user.enterprise.id) return message.send(`🏠 || У вас не зарегистрирована предпринимательская деятельность! ❌\n\n${user.enterprise && !user.enterprise.id ? `💡 Для регистрации предприятия напишите «Зарегистрировать [ИП/ООО/НАО/ПАО]».` : ``}`, {keyboard: user.enterprise && !user.enterprise.id ? Keyboard.builder().textButton({label: 'Зарегистрировать ИП'}).row().textButton({label: 'Зарегистрировать ООО'}).row().textButton({label: 'Зарегистрировать НАО'}).row().textButton({label: 'Зарегистрировать ПАО'}).inline() : Keyboard.builder().inline()});
	let enterprise = enterprises.enterprises[user.enterprise.id];
	if (!enterprise.business) return message.send(`🏠 || У вас не окрыт бизнес! ❌\n\n💡 Для просмотра списка бизнесов напишите «Бизнесы».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнесы'}).inline()});
	if (!business.realty[enterprise.business.number][enterprise.business.realty+1]) return message.send(`🏠 || Вы уже имеете максимальный уровень недвижимости! ❌\n\n💡 Для просмотра информации о вашем бизнесе напишите «Бизнес».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнес'}).inline()});
	let names = [0, 'Аквапарк', 'Парк аттракционов', 'Студия звукозаписи', 'Фотостудия', 'Кофейня'];
	let text = `🏠 || Улучшение недвижимости:\n  🔎 ${names[enterprise.business.number]}${enterprise.trademark ? ` «${enterprise.trademark}»` : (enterprise.type != 1 ? ` «${enterprise.title}»` : ``)}\n\n🏢 Уровень ${enterprise.business.realty} (сейчас): ${business.realty[enterprise.business.number][enterprise.business.realty].description}\n\n🏗 | Уровень ${enterprise.business.realty+1} (следующий)\n  📝 Описание: ${business.realty[enterprise.business.number][enterprise.business.realty+1].description}\n  💰 Стоимость улучшения: ${spaces(business.realty[enterprise.business.number][enterprise.business.realty+1].cost)} ₽`;
	if (!enterprise.accpayment || enterprise.accpayment.balance < business.realty[enterprise.business.number][enterprise.business.realty+1].cost) return message.send(`${text}`);
	let confirm = await message.question(`${text}\n\n💡 Для продолжения напишите «Улучшить».`, {keyboard: Keyboard.builder().textButton({label: 'Отмена', color: Keyboard.NEGATIVE_COLOR}).textButton({label: 'Улучшить', color: Keyboard.POSITIVE_COLOR}).inline()});
	confirm = confirm.text;
	if (!confirm || confirm.toLowerCase() != 'улучшить') return message.send(`🏠 || Улучшение недвижимости отменено! ❌`);
	enterprise.business.realty++;
	enterprise.accpayment.balance -= business.realty[enterprise.business.number][enterprise.business.realty].cost;
	enterprise.accpayment.history = `🏠 ${enterprise.type == 2 ? nick(user) + ` ${gender('улучшил', 'улучшила', user)} недвижимость` : `Улучшение недвижимости`} за ${spaces(business.realty[enterprise.business.number][enterprise.business.realty].cost)} ₽ (${timeAndDay()})\n` + enterprise.accpayment.history;
	return message.send(`🏠 || Уровень недвижимости улучшен. ✔\n\n💡 Для просмотра информации о вашем бизнесе напишите «Бизнес».`, {keyboard: Keyboard.builder().textButton({label: 'Бизнес'}).inline()});
});

hearManager.hear(/^(банда помощь|банды)$/i, message => {
	if (!user.knowledge.belt) return message.send(`⚔ || Блок банды не доступен! ❌\n\n💡 Для получения доступа к блоку банды ${user.training ? `продолжайте тренироваться с помощью команды «Тренироваться»` : `начните тренироваться с помощью команды «Тренировки»`}.`, {keyboard: user.training ? key.textButton({label: 'Тренироваться'}).inline() : key.textButton({label: 'Тренировки'}).inline()});
	if (!user.gang.id) return message.send(`⚔ || ${nick(user)}, команды банд:\n  🚪 «Вступить в банду [ID банды/название банды]» — стать участником банды.${user.knowledge.belt > 3 ? `\n  ✏ «Создать [открытую/закрытую] банду [название]» — создать свою банду.` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	let rank = user.gang.rank;
	return message.send(`
⚔ || ${nick(user)}, команды банд:
🤓 | Информация:
  ⚔ «Банда» — информация о вашей банде.${gang.battle.opponent ? `\n  🗡 «Бой» — информация о текущем бое.` : ``}
  💬 «Чат» — информация о беседе.

🤗 | Действия:
  💵 «Банда внести [сумма]» — внести деньги в казну банды.${rank > 3 && gang.balance ? `\n  💵 «Банда снять [сумма]» — снять деньги с казны банды.` : ``}${rank > 2 && !gang.battle.opponent && !gang.battle.search ? `\n  🗡 «Бой поиск» — начать поиск банды для боя.` : ``}${rank != 5 ? `\n  ❌ «Покинуть банду» — покинуть банду.` : ``}${rank > 2 && !gang.open && gang.members < 50 ? `\n\n😎 | Управление:` : ``}${rank > 2 && !gang.open && gang.members < 50 ? `\n  📀 «Пригласить в банду [ID аккаунта]» — пригласить игрока в банду.` : ``}${rank > 3 && gang.members > 1 ? `\n  📣 «Уведомить [текст]» — уведомить участников банды.` : ``}
	`);
});

hearManager.hear(/^(?:создать)\s(открытую|закрытую)\s(банду)\s?([^]+)?/i, message => {
	if (user.gang.id) return message.send(`⚔ || Вы уже состоите в банде! ❌\n\n💡 Для выхода из банды напишите «Покинуть банду».`, {keyboard: Keyboard.builder().textButton({label: 'Покинуть банду', color: Keyboard.NEGATIVE_COLOR}).inline()});
	let key = Keyboard.builder();
	if (!user.knowledge.belt || user.knowledge.belt < 4) return message.send(`⚔ || Создание банды доступно после получения синего пояса! ❌\n\n💡 Для получения синего пояса ${user.training ? `продолжайте тренироваться с помощью команды «Тренироваться»` : `начните тренироваться с помощью команды «Тренировки»`}.`, {keyboard: user.training ? key.textButton({label: 'Тренироваться'}).inline() : key.textButton({label: 'Тренировки'}).inline()});
	let open = /открытую/i.test(message.$match[1]) ? true : false;
	let title = message.$match[3];
	if (!title) return message.send(`⚔ || Вы не ввели название банде! Используйте «Создать [открытую/закрытую] банду [название]». ❌`);
	if (title.length > 20 || title.length < 3) return message.send(`⚔ || Название банды не может быть длиннее 20 символов или короче 3 символов! ❌`);
	if (!checkUniqTittle(title)) return message.send(`⚔ || Название банды должно быть уникально! Попробуйте другое название. ❌`);
	gangs.quantity++;
	support.que_quantity++;
	let quantity = support.que_quantity;
	let id = gangs.quantity;
	user.gang.id = id;
	user.gang.rank = 5;
	support.questions[quantity] = {"type":"gangname","content":title,"id":user.id,"account":id,"status":false};
	for (i in support.agents) send(`⚔ || Заявка на установку название банд #${quantity}\n  📋 Название банды: «${title}»\n\n💡 Для принятия названия банды напишите «/allow ${quantity}».\n💡 Для отклонения названия банды напишите «/reject ${quantity} [ID причины]».\n💡 Список причин, по которым можно отклонить название банды:\n  #1. Нецензурные слова или выражения\n  #2. Оскорбление личности\n  #3. Призыв к противозаконию\n  #4. Разжигание межнациональной розни\n  #5. Выражение ненависти\n  #6. Реклама\n  #7. Запрещённые символы, либо смайлики`, support.agents[i].id);
	watch.gangs[id] = {};
	gangs.gangs[id] = {"id":id,"open":open,"title":title,"members":1,"creator":user.id,"rating":0,"balance":0,"battle":{}};
	message.send(`⚔ || Банда «${title}» создана. ✔\n\n${!open ? `💡 Для приглашения игрока в банду напишите «Пригласить в банду [ID аккаунта]».\n` : ``}💡 Для просмотра информация о вашей банде напишите «Банда».\n💡 Для просмотра списка всех команд банд напишите «Банда помощь».`, {keyboard: Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Банда помощь'}).inline()});
	return message.send(`⚔ || Название банды отправлено на модерацию.`);
});

hearManager.hear(/^(?:вступить в банду)\s?([^]+)?/i, message => {
	if (user.gang.id) return message.send(`⚔ || Вы уже состоите в банде! ❌\n\n💡 Для выхода из банды напишите «Покинуть банду».`, {keyboard: Keyboard.builder().textButton({label: 'Покинуть банду', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!user.knowledge.belt) return message.send(`⚔ || Вступать в банду можно после получения белого пояса! ❌\n\n💡 Для получения белого пояса ${user.training ? `продолжайте тренироваться с помощью команды «Тренироваться»` : `начните тренироваться с помощью команды «Тренировки»`}.`, {keyboard: Keyboard.builder().training ? key.textButton({label: 'Тренироваться'}).inline() : Keyboard.builder().textButton({label: 'Тренировки'}).inline()});
	let gang = gangs.gangs[checkNameGang(message.$match[1])];
	if (!gang) return message.send(`⚔ || Вы не ввели ID банды или название, либо такой банды не существует! Используйте «Вступить в банду [ID банды/название банды]». ❌`);
	if (gang.members > 49) return message.send(`⚔ || Банда «${gang.title}» переполнена! Максимальное количество человек в банде — 50. ❌`);
	if (!gang.open && (!gang.invited || !gang.invited.find(entrant => entrant == user.id))) return message.send(`⚔ || Банда «${gang.title}» закрытая! Для вступления в неё вас должны пригласить. ❌`);
	if (!gang.open) delete gang.invited[gang.invited.findIndex(entrant => entrant == user.id)];
	user.gang.id = gang.id;
	user.gang.rank = 1;
	gang.members++;
	gang_notification(`⚔ || ${nick(user)} вступил в банду.`, gang, user, true);
	return message.send(`⚔ || Вы вступили в банду «${gang.title}». ✔\n\n💡 Для просмотра информации о банде напишите «Банда».\n💡 Для просмотра списка всех команд банд напишите «Банда помощь».`, {keyboard: Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Банда помощь'}).inline()});
});

hearManager.hear(/^банда$/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	let damage_knives = [7, 6, 5, 0, 4, 3, 3, 2, 1, 3];
	let damage_firearms = [266, 305, 47, 0, 20, 17, 125, 5, 16, 41];
	let damage_explosives = [96, 91, 86, 0, 84, 7, 85, 76, 67];
	let property = user.property;
	let damage = (property.knife ? damage_knives[property.knife+3] : 0) + (property.firearms ? damage_firearms[property.firearms+3] : 0) + (property.explosives ? damage_explosives[property.explosives+3] : 0) + user.knowledge.belt;
	let ranks = [0, 'новичок', 'гангстер', 'авторитет', 'босс банды', 'создатель банды'];
	return message.send(`
⚔ || Ваша банда:
  🔎 «${gang.title}» — ${declination('участников', 'участник', 'участника', gang.members)} (#${gang.id})
  👤 ${nick(user)} — ${ranks[user.gang.rank]} (${declination('урона', 'урон', 'урона', damage)})

💰 Баланс: ${spaces(gang.balance)} ₽${gang.rating ? `\n⭐ Рейтинг: ${spaces(gang.rating)}` : ``}

💡 Для просмотра списка участников напишите «Участники».
💡 Для просмотра правил банды напишите «Правила».
	`, {keyboard: Keyboard.builder().textButton({label: 'Участники'}).textButton({label: 'Правила'}).inline()});
});

hearManager.hear(/^(?:участники)\s?([0-9]+)?/i, message => {
	if (!user.gang.id) return message.send(`👥 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	let page = Number(message.$match[1]) ? Number(message.$match[1]) : 1;
	let max_page = Math.ceil(gang.members/10);
	let text = '';
	let members = [];
	let damage_knives = [7, 6, 5, 0, 4, 3, 3, 2, 1, 3];
	let damage_firearms = [266, 305, 47, 0, 20, 17, 125, 5, 16, 41];
	let damage_explosives = [96, 91, 86, 0, 84, 7, 85, 76, 67];
	let ranks = [0, 'новичок', 'гангстер', 'авторитет', 'босс банды', 'создатель банды'];
	if (page < 1 || page > max_page) return message.send(`👥 || Такой страницы нет! Список участников занимает всего ${declination('страниц', 'страница', 'страницы', max_page)}. ❌`);
	for (i in accounts.accounts) if (accounts.accounts[i].gang.id == gang.id) members.push(i);
	for (let i = 0; i < 10; i++) {
		let player = accounts.accounts[members[(page-1)*10+i]];
		if (player) {
			let property = player.property;
			text += `\n  👤 ${nick(player)} — ${ranks[player.gang.rank]} (${declination('урона', 'урон', 'урона', (property.knife ? damage_knives[property.knife+3] : 0) + (property.firearms ? damage_firearms[property.firearms+3] : 0) + (property.explosives ? damage_explosives[property.explosives+3] : 0) + player.knowledge.belt)}, #${player.id})`;
		}
	}
	return message.send(`👥 || Участники банды (${page}/${max_page}):${text}\n\n${max_page != 1 ? `💡 Для перехода на другую страницу напишите «Участники [страница]».\n` : ``}${user.gang.rank > 2 && !gang.open && gang.members < 50 ? `\n  💡 Для приглашения игрока в банду напишите «Пригласить в банду [ID аккаунта]».` : ``}${user.gang.rank > 2 && gang.members > 1 ? `\n  💡 Для исключения игрока напишите «Исключить из банды [ID аккаунта]».\n  💡 Для смены ранга игроку напишите «Повысить/Понизить [ID аккаунта]».` : ``}`);
});

hearManager.hear(/^(?:исключить из банды|выгнать из банды|исключить|выгнать)\s?([0-9]+)?/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 3) return message.send(`⚔ || Для исключения игрока из банды нужно иметь ранг «Авторитет» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`⚔ || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.gang.id != user.gang.id) return message.send(`⚔ || ${nick(player)} не состоит в банде «${gang.title}»! ❌`);
	if (player.gang.rank >= user.gang.rank) return message.send(`⚔ || Выгнать из банды можно только нижестоящих по рангу игроков! ❌`);
	player.gang = {};
	gang.members--;
	send(`⚔ || ${nick(player)}, вы были исключены из банды «${gang.title}»!`, player.idvk);
	gang_notification(`⚔ || ${nick(user)} исключил ${nick(player)} из банды.`, gang, user, true);
	return message.send(`⚔ || ${nick(player)} исключён из банды «${gang.title}». ✔`);
});

hearManager.hear(/^(?:повысить)\s?([0-9]+)?/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 3) return message.send(`⚔ || Для повышения ранга игроков нужно иметь ранг «Авторитет» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let player = accounts.accounts[parserId(message.$match[1])];
	let ranks = [0, 0, 'Гангстер', 'Авторитет', 'Босс банды'];
	if (!player) return message.send(`⚔ || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.fines && player.fines.account_ban) return message.send(`⚔ || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.gang.id != gang.id) return message.send(`⚔ || ${nick(player)} не состоит в банде «${gang.title}»! ❌`);
	if (!player.knowledge.belt || player.knowledge.belt < 2) return message.send(`⚔ || Для повышения ранга игрока нужно, чтобы этот игрок имел жёлтый пояс! ❌`);
	if (player.gang.rank >= user.gang.rank) return message.send(`⚔ || Повысить можно только нижестоящих по рангу игроков! ❌`);
	if (player.gang.rank == 4) return message.send(`⚔ || ${nick(player)} достиг максимального ранга! ❌`);
	player.gang.rank++;
	notification(`⚔ || ${nick(player)}, вас повысили до ранга «${ranks[player.gang.rank]}». ✔\n\n💡 Для просмотра списка команд банд напишите «Банда помощь».`, 'rank', player, Keyboard.builder().textButton({label: 'Банда помощь', color: Keyboard.POSITIVE_COLOR}).inline());
	return message.send(`⚔ || ${nick(player)} ${gender('повышен', 'повышена', player)} до ранга «${ranks[player.gang.rank]}». ✔`);
});

hearManager.hear(/^(?:понизить)\s?([0-9]+)?/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 3) return message.send(`⚔ || Для понижения ранга игроков нужно иметь ранг «Авторитет» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let player = accounts.accounts[parserId(message.$match[1])];
	let ranks = [0, 'Новичок', 'Гангстер', 'Авторитет', 0];
	if (!player) return message.send(`⚔ || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.fines && player.fines.account_ban) return message.send(`⚔ || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.gang.id != gang.id) return message.send(`⚔ || ${nick(player)} не состоит в банде «${gang.title}»! ❌`);
	if (player.gang.rank >= user.gang.rank) return message.send(`⚔ || Понизить можно только нижестоящих по рангу игроков! ❌`);
	if (player.gang.rank == 1) return message.send(`⚔ || ${nick(player)} достиг минимального ранга! ❌`)
	player.gang.rank--;
	notification(`⚔ || ${nick(player)}, вас понизили до ранга «${ranks[player.gang.rank]}». ❌\n\n💡 Для просмотра списка команд банд напишите «Банда помощь».`, 'rank', player, Keyboard.builder().textButton({label: 'Банда помощь', color: Keyboard.POSITIVE_COLOR}).inline());
	return message.send(`⚔ || ${nick(player)} ${gender('понижен', 'понижена', player)} до ранга «${ranks[player.gang.rank]}». ✔`);
});

hearManager.hear(/^правила$/i, message => {
	if (!user.gang.id) return message.send(`📜 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	return message.send(`📜 || ${nick(user)}, правила банды:\n${gang.rules ? gang.rules : `  ❗ В вашей банде не установлены правила.`}\n\n${user.gang.rank > 3 && !gang.rules ? `💡 Для установки правил в банду напишите «Установить правила [правила]».` : ``}`);
});

hearManager.hear(/^(?:установить правила)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`📜 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 3) return message.send(`📜 || Для смены правил в банде нужно иметь ранг «Авторитет» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let text = message.$match[1];
	if (!text) return message.send(`📜 || Вы не ввели новые правила! Используйте «Установить правила [правила]». ❌`);
	if (text.length > 1000) return message.send(`📜 || Максимальное количество символов в правилах – 1.000! ❌`);
	gang.rules = message.$match[1];
	return message.send(`📜 || Правила банды изменены. ✔`);
});

hearManager.hear(/^бой$/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	let time = watch.gangs[gang.id];
	let key = Keyboard.builder();
	if (user.gang.rank > 2 && !gang.battle.search && !gang.battle.opponent) key.textButton({label: 'Бой поиск'});
	if (!gang.battle.search && !gang.battle.opponent) return message.send(`⚔ || В банде «${gang.title}» не идёт бой! ❌\n\n${user.gang.rank > 2 ? `💡 Для поиска боя напишите «Бой поиск».` : ``}`, {keyboard: key.inline()});
	if (gang.battle.search) return message.send(`⚔ || Бой для банды «${gang.title}» ещё ищется! Подождите некоторое время. ❌`);
	let opponent = gangs.gangs[gang.battle.opponent];
	if (user.gang.blows) key = Keyboard.builder().textButton({label: 'Атаковать', color: Keyboard.POSITIVE_COLOR});
	return message.send(`
⚔ || Информация о бое:
  🔎 Противник: «${opponent.title}» (#${opponent.id})
  ⭐ Рейтинг противника: ${opponent.rating}

  💰 Ставка: ${spaces(gang.battle.bet)} ₽
  🔫 ${gang.battle.damage%10 == 1 ? 'Нанесён' : 'Нанесено'} ${declination('урона', 'урон', 'урона', gang.battle.damage)}
  ⌛ Конец боя через ${time.battle < 60 ? declination('секунд', 'секунду', 'секунды', time.battle) : declination('минут', 'минуту', 'минуты', Math.round(time.battle/60))}${user.gang.blows ? `\n\n💡 Для атаки напишите «Атаковать».` : ``}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^(бой атака|атаковать)$/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	if (!gang.battle.search && !gang.battle.opponent) return message.send(`⚔ || В банде «${gang.title}» не идёт бой! ❌\n\n${user.gang.rank > 2 ? `💡 Для поиска боя напишите «Бой поиск».` : ``}`);
	if (gang.battle.search) return message.send(`⚔ || Бой для банды «${gang.title}» ещё ищется! Подождите некоторое время. ❌`);
	if (!user.gang.blows) return message.send(`⚔ || У вас закончились атаки для этого боя! ❌`);
	let key = Keyboard.builder().textButton({label: 'Бой'});
	let damage_knives = [7, 6, 5, 0, 4, 3, 3, 2, 1, 3];
	let damage_firearms = [266, 305, 47, 0, 20, 17, 125, 5, 16, 41];
	let damage_explosives = [96, 91, 86, 0, 84, 7, 85, 76, 67];
	let property = user.property;
	let damage = (property.knife ? damage_knives[property.knife+3] : 0) + (property.firearms ? damage_firearms[property.firearms+3] : 0) + (property.explosives ? damage_explosives[property.explosives+3] : 0) + user.knowledge.belt;
	user.gang.blows--;
	gang.battle.damage += damage;
	user.gang.damage += damage;
	if (user.gang.blows) key.row().textButton({label: 'Атаковать', color: Keyboard.POSITIVE_COLOR});
	return message.send(`⚔ || Вы нанесли ${declination('урона', 'урон', 'урона', damage)} противнику. ✔\n\n💡 Для просмотра информации о бое напишите «Бой».\n${user.gang.blows ? '💡 Для атаки напишите «Атаковать».' : ``}`, {keyboard: key.inline()});
});

hearManager.hear(/^(чат|беседа)$/i, message => {
	if (!message.isChat) return message.send(`💬 || Данная команда работает только в беседах! ❌`);
	let chat = conversations[message.chatId];
	let key = Keyboard.builder();
	if (user.gang.id) {
		!chat.gang ? key.textButton({label: `Привязать беседу ${message.chatId}`, color: Keyboard.POSITIVE_COLOR}).row() : key.textButton({label: 'Отвязать беседу', color: Keyboard.NEGATIVE_COLOR}).row();
		if (chat.gang) !chat.gang.notifications ? key.textButton({label: 'Уведомления банды в личные сообщения', color: Keyboard.PRIMARY_COLOR}).row() : key.textButton({label: 'Уведомления банды в беседу', color: Keyboard.PRIMARY_COLOR}).row();
	}
	chat.buttons ? key.textButton({label: 'Выключить кнопки'}) : key.textButton({label: 'Включить кнопки'});
	vk.api.call('messages.getConversationsById', {
		peer_ids: message.peerId
	}).then(res => {
		return message.send(`
💬 || Информация о беседе:
  ✏ «${res.items[0].chat_settings.title}» (#${message.chatId})${chat.gang ? `\n  ⚔ «${gangs.gangs[chat.gang.id].title}» (#${chat.gang.id})\n\n⚔ | Параметры беседы банды:\n  🔔 Уведомления банды направлены ${!chat.gang.notifications ? `в беседу` : `в личные сообщения`}.` : ``}

${user.gang.id ? (!chat.gang ? `💡 Для привязки беседы к банде напишите «Привязать беседу ${message.chatId}».\n` : (user.gang.id == chat.gang.id ? `💡 Для отвязки беседы от банды напишите «Отвязать беседу».\n` : ``)) : ``}${chat.gang && user.gang.id && user.gang.id == chat.gang.id ? `💡 Для направления уведомлений банды ${!chat.gang.notifications ? `в личные сообщения напишите «Уведомления банды в личные сообщения»` : `в беседу напишите «Уведомления банды в беседу»`}.\n` : ``}💡 ${!chat.buttons ? `Для включения кнопок напишите «Включить кнопки»` : `Для выключения кнопок напишите «Выключить кнопки»`}.
		`, {keyboard: key.inline()});
	});
});

hearManager.hear(/^(?:привязать беседу)\s?([0-9]+)?$/i, message => {
	if (!user.gang.id) return message.send(`💬 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 4) return message.send(`💬 || Для привязки беседы к банде нужно иметь ранг «Босс банды» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let chat = conversations[parserId(message.$match[1])];
	let chat_id = 2000000000+chat.id;
	if (gang.conversation) return message.send(`💬 || К вашей банде уже привязана беседа! ❌\n\n💡 Для отвязки беседы от банды напишите «Отвязать беседу».`, {keyboard: Keyboard.builder().textButton({label: 'Отвязать беседу', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!chat) return message.send(`💬 || Вы не указали ID беседы, либо беседы с таким ID не существует! Используйте «Привязать беседу [ID беседы]». ❌\n\n💡 ID беседы можно узнать, написав команду «Чат» в беседу, которую хотите привязать.`);
	vk.api.call('messages.getConversationMembers', {
		peer_id: chat_id
	}).then(res => {
		let key = Keyboard.builder().textButton({label: 'Чат'}).inline();
		if (!res.items.find(item => item.member_id == user.idvk).is_owner) return message.send(`💬 || Привязать беседу к банде может только создатель беседы, к которой вы хотите привязать банду! ❌`);
		if (chat.gang) return message.send(`💬 || К данной беседе уже привязана банда! ❌`);
		gang.conversation = chat.id;
		chat.gang = {id: gang.id};
		if (message.peerId != chat_id) send(`⚔ || Данная беседа была привязана к банде «${gang.title}».\n\n💡 Для просмотра полной информации о беседе напишите «Чат».`, chat_id, key);
		return message.send(`💬 || Беседа #${chat.id} привязана к банде «${gang.title}». ✔${message.peerId == chat_id ? '\n\n💡 Для просмотра полной информации о беседе напишите «Чат».' : ``}`, {keyboard: message.peerId == chat_id ? key : Keyboard.builder().inline()});
	}).catch(error => {
		return message.send(`⚔ || В данной беседе бот не администратор! ❌`);
	});
});

hearManager.hear(/^отвязать беседу$/i, message => {
	if (!user.gang.id) return message.send(`💬 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 4) return message.send(`💬 || Для отвязки беседы от банды нужно иметь ранг «Босс банды» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	if (!gang.conversation) return message.send(`💬 || К вашей банде не привязана беседа! ❌\n\n💡 Для привязки беседы к банде напишите «Привязать беседу [ID беседы]». ID беседы можно узнать в команде «Чат».`);
	delete conversations[gang.conversation].gang;
	message.send(`🔧 || Беседа #${gang.conversation} отвязана от вашей банды! ✔`);
	delete gang.conversation;
	return;
});

hearManager.hear(/^(выключить|включить)\s(кнопки)$/i, message => {
	if (!message.isChat) return message.send(`🔘 | Команда работает только в беседах! ❌`);
	let chat = conversations[message.chatId];
	if (!/^включить$/i.test(message.$match[1]) && !/^выключить$/i.test(message.$match[1])) return message.send(`🔘 || Введите команду «[Включить/Выключить] кнопки»! ❌`);
	vk.api.call('messages.getConversationMembers', {
		peer_id: message.peerId
	}).then(res => {
		if (!res.items.find(item => item.member_id == user.idvk).is_admin) return message.send(`🔘 || Настраивать кнопки могут только администраторы беседы! ❌`);
		if (/^включить$/i.test(message.$match[1])) {
			if (chat.buttons) return message.send(`🔘 || Кнопки уже включены! ❌`);
			chat.buttons = true;
			return message.send(`🔘 || Кнопки в беседе включены. ✔`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).textButton({label: 'Аккаунт'}).row().textButton({label: 'Магазин', color: Keyboard.PRIMARY_COLOR}).textButton({label: 'Помощь', color: Keyboard.PRIMARY_COLOR})});
		} else {
			if (!chat.buttons) return message.send(`🔘 || Кнопки уже выключены! ❌`);
			delete chat.buttons;
			return message.send(`🔘 || Кнопки в беседе выключены. ✔`, {keyboard: Keyboard.builder()});
		}
	});
});

hearManager.hear(/^(?:банда внести|банда пополнить)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`💰 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = user.balance;
	if (!Number(amount) || amount < 1) return message.send(`💰 || Сумма пополнения должна быть в числовом виде и неравна нулю. Напишите «всё» для пополнения на весь баланс! ❌`);
	if (user.balance < amount) return message.send(`💳 || Недостаточно наличных средств! ❌`);
	user.balance -= amount;
	gangs.gangs[user.gang.id].balance += amount;
	return message.send(`💰 || Вы пополнили баланс банды на ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра баланса банды напишите «Банда».`, {keyboard: Keyboard.builder().textButton({label: 'Банда'}).inline()});
});

hearManager.hear(/^(?:банда снять)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`💰 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 4) return message.send(`💰 || Для понижения ранга игроков нужно иметь ранг «Босс банды» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let amount = parserInteger(message.$match[1]);
	if (/всё|все/i.test(amount)) amount = gang.balance;
	if (!Number(amount) || amount < 1) return message.send(`💰 || Сумма снятия должна быть в числовом виде и неравна нулю. Напишите «всё» для снятия на весь баланс банды! ❌`);
	if (gang.balance < amount) return message.send(`💰 || Недостаточно средств на балансе банды! ❌`);
	gang.balance -= amount;
	user.balance += amount;
	return message.send(`💰 || Вы сняли с баланса банды ${spaces(amount)} ₽. ✔\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, {keyboard: Keyboard.builder().textButton({label: 'Баланс'}).inline()});
});

hearManager.hear(/^бой поиск$/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 3) return message.send(`⚔ || Для поиска боя банд нужно иметь ранг «Авторитет» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let time = watch.gangs[gang.id];
	if (time.jamming) return message.send(`⚔ || Ваша банда ещё восстанавливается с прошлого боя! Осталось ещё ${time.jamming < 60 ? declination('секунд', 'секунда', 'секунды', time.jamming) : (time.jamming < 3600 ? declination('минут', 'минута', 'минуты', Math.round(time.jamming/60)) : declination('часов', 'час', 'часа', Math.round(time.jamming/3600)))}. ❌`);
	if (gang.battle.opponent) return message.send(`⚔ || В банде «${gang.title}» уже идёт бой! ❌\n\n💡 Для просмотра информации о бое напишите «Бой».`, {keyboard: Keyboard.builder().textButton({label: 'Бой'}).inline()});
	if (gang.battle.search) return message.send(`⚔ || Бой для банды «${gang.title}» уже ищется! Подождите некоторое время. ❌`);
	if (gang.balance < payoff(gang)) return message.send(`⚔ || Недостаточно средств на балансе банды! Для поиска боя вам нужно ${spaces(payoff(gang))} ₽. ❌`);
	gang.balance -= payoff(gang);
	gang.battle.bet = payoff(gang);
	gang.battle.search = true;
	return message.send(`⚔ || Начинается поиск противника! Подождите некоторое время. ✔`);
});

hearManager.hear(/^покинуть банду$/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank == 5) return message.send(`⚔ || Создатель не может выйти из своей банды! ❌\n\n💡 Мы уже в процессе разработки передачи прав создателя. Следите за обновлениями.`);
	let gang = gangs.gangs[user.gang.id];
	user.gang = {};
	gang.members--;
	gang_notification(`⚔ || ${nick(user)} покинул банду.`, gang, user, true);
	return message.send(`⚔ || Вы вышли из банды «${gang.title}». ✔`);
});

hearManager.hear(/^(?:пригласить в банду|пригласить)\s?([0-9]+)?/i, message => {
	if (!user.gang.id) return message.send(`⚔ || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	let gang = gangs.gangs[user.gang.id];
	if (gang.open) return message.send(`⚔ || Приглашать игроков можно только в закрытую банду! ❌`);
	if (user.gang.rank < 3) return message.send(`⚔ || Для приглашения игрока в банду нужно иметь ранг «Авторитет» и выше! ❌`);
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`⚔ || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	if (player.id == user.id) return message.send(`⚔ || Нельзя пригласить самого себя! ❌`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`⚔ || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`⚔ || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`⚔ || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (gang.members > 49) return message.send(`⚔ || Банда «${gang.title}» переполнена! Максимальное количество человек в банде — 50. ❌`);
	if (!player.knowledge.belt) return message.send(`⚔ || Для приглашения игрока в банду нужно, чтобы этот игрок имел белый пояс! ❌`);
	if (player.gang.id) return message.send(`⚔ || ${nick(player)} уже состоит в банде! ❌`);
	if (gang.invited && gang.invited.find(entrant => entrant == user.id)) return message.send(`⚔ || ${nick(player)} уже ${gender('приглашён', 'приглашена', player)} в банду «${gang.title}»! ❌`);
	gang.invited ? gang.invited.push(player.id) : gang.invited = [player.id];
	notification(`⚔ || ${nick(player)}, вас пригласили в банду «${gang.title}».\n\n💡 Для принятия приглашения и вступления в банду напишите «Вступить в банду ${gang.title}», либо «Вступить в банду ${gang.id}».`, 'invitation_gang', player, Keyboard.builder().textButton({label: `Вступить в банду ${gang.title}`, color: Keyboard.POSITIVE_COLOR}).inline())
	return message.send(`⚔ || ${nick(player)} ${gender('приглашён', 'приглашена', player)} в банду «${gang.title}». ✔`);
});

hearManager.hear(/^(?:уведомить)\s?([^]+)?/i, message => {
	if (!user.gang.id) return message.send(`📢 || Вы не состоите в банде! ❌\n\n${user.knowledge.belt ? `💡 Для вступления в банду напишите «Вступить в банду [ID банды/название банды]».${user.knowledge.belt > 3 ? `\n💡 Для создания банды напишите «Создать [открытую/закрытую] банду [название]».` : ``}` : ``}`);
	if (user.gang.rank < 4) return message.send(`📢 || Для уведомления участников банды нужно иметь ранг «Босс банды» и выше! ❌`);
	let gang = gangs.gangs[user.gang.id];
	let text = message.$match[1];
	if (!text) return message.send(`📢 || Вы не ввели текст уведомления! Используйте «Уведомить [текст]». ❌`);
	gang_notification(`📢 || Уведомление участникам банды «${gang.title}»:\n✉ ${text}`, gang, user, false);
	if (!gang.conversation || conversations[gang.conversation].gang.notifications || message.chatId != gang.conversation) message.send(`📢 || Участники банды «${gang.title}» были уведомлены. ✔`);
	return;
});

hearManager.hear(/^магазин$/i, message => {
	let key = Keyboard.builder().textButton({label: 'Дома'}).textButton({label: 'Квартиры'}).row().textButton({label: 'Машины'}).textButton({label: 'Гаражи'});
	if (user.knowledge.belt) {
		key.row().textButton({label: 'Ножи'});
		if (user.knowledge.belt > 1) key.textButton({label: 'Огнестрельные оружия'});
		if (user.knowledge.belt > 2) key.row().textButton({label: 'Взрывчатки'});
	}
 	return message.send(`
🛒 || Основной магазин:
  🏡 Дома
  🏙 Квартиры
  🚘 Машины
  🏚 Гаражи${user.knowledge.belt ? `\n\n🛒 || Магазин банд:\n  🔪 Ножи${user.knowledge.belt > 1 ? `\n  🔫 Огнестрельные оружия` : ``}${user.knowledge.belt > 2 ? `\n  💣 Взрывчатки` : ``}` : ``}

💡 Для просмотра списка товаров напишите название раздела.
	`, {keyboard: key.inline()});
});

hearManager.hear(/^(?:дома|дом)\s?([0-9]+)?/i, message => {
	let title = [0, 'Дом в лесу', 'Дом в селе', 'Дом в городе', 'Двухэтажный дом', 'Трёхэтажный дом', 'Трёхэтажный дом с бассейном', 'Коттедж', 'Особняк'];
	if (user.property.house) return message.send(`🏡 || Ваш дом:\n  🏡 ${title[user.property.house]}\n\n💡 Для продажи дома напишите «Продать дом».`, {keyboard: Keyboard.builder().textButton({label: 'Продать дом', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🏡 || Дома:
 🏡 Дом в лесу
  🔎 500.000 ₽ | #1
 🏡 Дом в селе
  🔎 1.200.000 ₽ | #2
 🏡 Дом в городе
  🔎 2.500.000 ₽ | #3
 🏡 Двухэтажный дом
  🔎 4.500.000 ₽ | #4
 🏡 Трёхэтажный дом
  🔎 10.000.000 ₽ | #5
 🏡 Трёхэтажный дом с бассейном
  🔎 15.000.000 ₽ | #6
 🏡 Коттедж
  🔎 20.000.000 ₽ | #7
 🏡 Особняк
  🔎 50.000.000 ₽ | #8

💡 Для покупки напишите «Дом [номер]».
		`);
	}
	let number = Number(parserId(message.$match[1]));
	let cost = [0, 500000, 1200000, 2500000, 4500000, 10000000, 15000000, 20000000, 50000000];
	if (number < 1 || number > 8 || !number) return message.send(`🏡 || Дома с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🏡 || Недостаточно средств на карте, либо карты нет! ❌`);
	if (user.subscriptions && user.subscriptions.bankpass) user.bank.cashback.increased === 1 ? user.bank.cashback.balance += Math.round(cost[number]*0.1) : user.bank.cashback.balance += Math.round(cost[number]*0.01);
	user.bank.balance -= cost[number];
	user.property.house = number;
	return message.send(`🏡 || Вы купили ${title[number].toLowerCase()} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашем доме напишите «Дом».`, {keyboard: Keyboard.builder().textButton({label: 'Дом', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(дом продать|продать дом)$/i, message => {
	if (!user.property.house) return message.send(`🏡 || У вас нет дома! ❌\n\n💡 Для просмотра списка домов напишите «Дома».`, {keyboard: Keyboard.builder().textButton({label: 'Дома'}).inline()});
	let cost = [0, 350000, 840000, 1750000, 3150000, 7000000, 10500000, 14000000, 35000000];
	let title = [0, 'дом в лесу', 'дом в селе', 'дом в городе', 'двухэтажный дом', 'трёхэтажный дом', 'трёхэтажный дом с бассейном', 'коттедж', 'особняк'];
	message.send(`🏡 || Вы продали свой ${title[user.property.house]} за ${spaces(cost[user.property.house])} ₽. ✔`);
	user.bank.balance += cost[user.property.house];
	delete user.property.house;
	return;
});

hearManager.hear(/^(?:квартиры|квартира)\s?([0-9]+)?/i, message => {
	let title = [0, 'Квартира в двухэтажке', 'Однокомнатная квартира в новом доме', 'Двухкомнатная квартира в новом доме', 'Трёхкомнатная квартира в новом доме', 'Двухуровневая квартира'];
	if (user.property.flat) return message.send(`🏙 || Ваша квартира:\n  🏙 ${title[user.property.flat]}\n\n💡 Для продажи квартиры напишите «Продать квартиру».`, {keyboard: Keyboard.builder().textButton({label: 'Продать квартиру', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🏙 || Квартиры: 
 🏙 Квартира в двухэтажке
  🔎 1.000.000 ₽ | #1
 🏙 Однокомнатная квартира в новом доме
  🔎 2.000.000 ₽ | #2
 🏙 Двухкомнатная квартира в новом доме
  🔎 3.500.000 ₽ | #3
 🏙 Трёхкомнатная квартира в новом доме
  🔎 5.000.000 ₽ | #4
 🏙 Двухуровневая квартира
  🔎 6.500.000 ₽ | #5

💡 Для покупки напишите «Квартира [номер]».
		`);
	}
	let number = Number(parserId(message.$match[1]));
	let cost = [0, 1000000, 2000000, 3500000, 5000000, 6500000];
	title = [0, 'квартиру в двухэтажке', 'однокомнатную квартиру в новом доме', 'двухкомнатнуя квартиру в новом доме', 'трёхкомнатную квартиру в новом доме', 'двухуровневую квартиру'];
	if (number < 1 || number > 5 || !number) return message.send(`🏙 || Квартиры с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🏙 || Недостаточно средств на карте, либо карты нет! ❌`);
	if (user.subscriptions && user.subscriptions.bankpass) user.bank.cashback.increased == 2 ? user.bank.cashback.balance += Math.round(cost[number]*0.1) : user.bank.cashback.balance += Math.round(cost[number]*0.01);
	user.bank.balance -= cost[number];
	user.property.flat = number;
	return message.send(`🏙 || Вы купили ${title[number]} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашей квартире напишите «Квартира».`, {keyboard: Keyboard.builder().textButton({label: 'Квартира', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(квартира продать|продать квартиру)$/i, message => {
	if (!user.property.flat) return message.send(`🏙 || У вас нет квартиры! ❌\n\n💡 Для просмотра списка квартир напишите «Квартиры».`, {keyboard: Keyboard.builder().textButton({label: 'Квартиры'}).inline()});
	let cost = [0, 700000, 1400000, 2450000, 3500000, 4550000];
	let title = [0, 'квартиру в двухэтажке', 'однокомнатную квартиру в новом доме', 'двухкомнатнуя квартиру в новом доме', 'трёхкомнатную квартиру в новом доме', 'двухуровневую квартиру'];
	message.send(`🏙 || Вы продали свою ${title[user.property.flat]} за ${spaces(cost[user.property.flat])} ₽. ✔`);
	user.bank.balance += cost[user.property.flat];
	delete user.property.flat;
	return;
});

hearManager.hear(/^(?:машины|машина)\s?([0-9]+)?/i, message => {
	let title = [0, 'Mercedes-Benz W124', 'Suzuki Kizashi', 'Volkswagen Passat CC', 'Skoda Superb', 'Mercedes-Benz CLA-Class', 'Range Rover', 'Audi A7', 'BMW 6-Series', 'Lexus LX570', 'Porsche Panamera'];
	if (user.property.car) return message.send(`🚗 || Ваша машина:\n  🚗 «${title[user.property.car]}»\n\n💡 Для продажи машины напишите «Продать машину».`, {keyboard: Keyboard.builder().textButton({label: 'Продать машину', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🚗 || Машины:
 🚗 «Mercedes-Benz W124»
  🔎 149.999 ₽ | #1
 🚗 «Suzuki Kizashi»
  🔎 699.999 ₽ | #2
 🚗 «Volkswagen Passat CC»
  🔎 950.000 ₽ | #3
 🚗 «Skoda Superb»
  🔎 2.587.485 ₽ | #4
 🚗 «Mercedes-Benz CLA-Class»
  🔎 2.663.200 ₽ | #5
 🚗 «Range Rover»
  🔎 4.675.000 ₽ | #6
 🚗 «Audi A7»
  🔎 5.500.000 ₽ | #7
 🚗 «BMW 6-Series»
  🔎 5.651.300 ₽ | #8
 🚗 «Lexus LX570»
  🔎 7.572.000 ₽ | #9
 🚗 «Porsche Panamera»
  🔎 11.098.737 ₽ | #10

💡 Для покупки напишите «Машина [номер]».
		`);
	}
	let number = Number(parserId(message.$match[1]));
	let cost = [0, 149999, 699999, 950000, 2587485, 2663200, 4675000, 5500000, 5651300, 7572000, 11098737];
	if (number < 1 || number > 10 || !number) return message.send(`🚘 || Машины с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🚘 || Недостаточно средств на карте, либо карты нет! ❌`);
	if (user.subscriptions && user.subscriptions.bankpass) user.bank.cashback.increased === 0 ? user.bank.cashback.balance += Math.round(cost[number]*0.1) : user.bank.cashback.balance += Math.round(cost[number]*0.01);
	user.bank.balance -= cost[number];
	user.property.car = number;
	return message.send(`🚘 || Вы купили «${title[number]}» за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашей машине напишите «Машина».`, {keyboard: Keyboard.builder().textButton({label: 'Машина', color: Keyboard.POSITIVE_COLOR}).inline()});
}); 

hearManager.hear(/^(машина продать|продать машину)$/i, message => {
	if (!user.property.car) return message.send(`🚘 || У вас нет машины! ❌\n\n💡 Для просмотра списка машин напишите «Машины».`, {keyboard: Keyboard.builder().textButton({label: 'Машины'}).inline()});
	let cost = [0, 105000, 490000, 665000, 1811240, 1864240, 3272500, 3850000, 3955910, 5300400, 7769116];
	let title = [0, 'Mercedes-Benz W124', 'Suzuki Kizashi', 'Volkswagen Passat CC', 'Skoda Superb', 'Mercedes-Benz CLA-Class', 'Range Rover', 'Audi A7', 'BMW 6-Series', 'Lexus LX570', 'Porsche Panamera'];
	message.send(`🚘 || Вы продали свой «${title[user.property.car]}» за ${spaces(cost[user.property.car])} ₽. ✔`);
	user.bank.balance += cost[user.property.car];
	delete user.property.car;
	return;
});

hearManager.hear(/^(?:гаражи|гараж)\s?([0-9]+)?/i, message => {
	let title = [0, 'Металлический контейнер во дворе', 'Обыкновенный гараж', 'Гараж во дворе', 'Ангар'];
	if (user.property.garage) return message.send(`🏚 || Ваш гараж:\n  🏚 ${title[user.property.garage]}\n\n💡 Для продажи гаража напишите «Продать гараж».`, {keyboard: Keyboard.builder().textButton({label: 'Продать гараж', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🏚 || Гаражи:
 🏚 Металлический контейнер во дворе
  🔎 150.000 ₽ | #1
 🏚 Обыкновенный гараж
  🔎 200.000 ₽ | #2
 🏚 Гараж во дворе
  🔎 300.000 ₽ | #3
 🏚 Ангар
  🔎 500.000 ₽ | #4

💡 Для покупки напишите «Гараж [номер]».
		`);
	}
	let number = Number(parserId(message.$match[1]));
	let cost = [0, 150000, 200000, 300000, 500000];
	if (number < 1 || number > 4 || !number) return message.send(`🏚 || Гаража с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🏚 || Недостаточно средств на карте, либо карты нет! ❌`);
	if (user.subscriptions && user.subscriptions.bankpass) user.bank.cashback.increased == 3 ? user.bank.cashback.balance += Math.round(cost[number]*0.1) : user.bank.cashback.balance += Math.round(cost[number]*0.01);
	user.bank.balance -= cost[number];
	user.property.garage = number;
	return message.send(`🏚 || Вы купили ${title[number].toLowerCase()} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашем гараже напишите «Гараж».`, {keyboard: Keyboard.builder().textButton({label: 'Гараж', color: Keyboard.POSITIVE_COLOR}).inline()});
}); 

hearManager.hear(/^(продать гараж|гараж продать)$/i, message => {
	if (!user.property.garage) return message.send(`🏚 || У вас нет гаража! ❌\n\n💡 Для просмотра списка гаражей напишите «Гаражи».`, {keyboard: Keyboard.builder().textButton({label: 'Гаражи'}).inline()});
	let cost = [0, 105000, 140000, 210000, 350000];
	let title = [0, 'металлический контейнер во дворе', 'гараж', 'гараж во дворе', 'ангар'];
	message.send(`🏚 || Вы продали свой ${title[user.property.garage]} за ${spaces(cost[user.property.garage])} ₽. ✔`);
	user.bank.balance += cost[user.property.garage];
	delete user.property.garage;
	return;
});

hearManager.hear(/^(?:ножи|нож)\s?([0-9]+)?/i, message => {
	if (!user.knowledge.belt) return message.send(`🔪 || Для покупки ножа вы должны иметь белый пояс! ❌`);
	let knife = user.property.knife;
	let number = Number(parserId(message.$match[1]));
	let damage = [7, 6, 5, 0, 4, 3, 3, 2, 1, 3];
	let cost = [0, 15000, 6000, 3000, 2000, 500, 4000];
	let title = ['Легендарный нож «Рапира»', 'Эпический нож «Шпага»', 'Редкий нож «Меч»', 0, 'Баллистический нож', 'Керамбит', 'Мачете', 'Нож-секач', 'Разделочный нож', 'Штык-нож'];
	if (knife) return message.send(`🔪 || Ваш нож:\n  🔪 ${title[knife+3]} (${declination('урона', 'урон', 'урона', damage[knife+3])})\n\n💡 Для продажи ножа напишите «Продать нож».\n💡 Для передачи ножа другому игроку напишите «Передать нож [ID аккаунта]».`, {keyboard: Keyboard.builder().textButton({label: 'Продать нож', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🔪 || Ножи:
 🔪 Баллистический нож
  🔎 15.000 ₽ | 4 еденицы урона | #1
 🔪 Керамбит
  🔎 6.000 ₽ | 3 еденицы урона | #2
 🔪 Мачете
  🔎 3.000 ₽ | 3 еденицы урона | #3
 🔪 Нож-секач
  🔎 2.000 ₽ | 2 еденицы урона | #4
 🔪 Разделочный нож
  🔎 500 ₽ | 1 еденица урона | #5
 🔪 Штык-нож
  🔎 4.000 ₽ | 3 еденицы урона | #6

💡 Для покупки напишите «Нож [номер]».
		`);
	}
	if (!number || number < 1 || number > 6) return message.send(`🔪 || Ножа с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🔪 || Недостаточно средств на карте, либо карты нет! ❌`);
	user.bank.balance -= cost[number];
	user.property.knife = number;
	return message.send(`🔪 || Вы купили ${title[number+3].toLowerCase()} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашем ноже напишите «Нож».`, {keyboard: Keyboard.builder().textButton({label: 'Нож', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(нож продать|продать нож)$/i, message => {
	if (!user.property.knife) return message.send(`🔪 || У вас нет ножа! ❌\n\n💡 Для просмотра списка ножей напишите «Ножи».`, {keyboard: Keyboard.builder().textButton({label: 'Ножи'}).inline()});
	let cost = [4200, 9800, 14000, 0, 10500, 4200, 2100, 1400, 350, 2800];
	let title = ['легендарный нож «Рапира»', 'эпический нож «Шпага»', 'редкий нож «Меч»', 0, 'баллистический нож', 'керамбит', 'мачете', 'нож-секач', 'разделочный нож', 'штык-нож'];
	message.send(`🔪 || Вы продали ${title[user.property.knife+3]} за ${spaces(cost[user.property.knife+3])} ₽. ✔`);
	user.bank.balance += cost[user.property.knife+3];
	delete user.property.knife;
	return;
});

hearManager.hear(/^(?:передать нож)\s?([0-9]+)?/i, message => {
	if (!user.property.knife) return message.send(`🔪 || У вас нет ножа! ❌\n\n💡 Для просмотра списка ножей напишите «Ножи».`, {keyboard: Keyboard.builder().textButton({label: 'Ножи'}).inline()});
	let player = accounts.accounts[parserId(message.$match[1])];
	let title = ['легендарный нож «Рапира»', 'эпический нож «Шпага»', 'редкий нож «Меч»', 0, 'баллистический нож', 'керамбит', 'мачете', 'нож-секач', 'разделочный нож', 'штык-нож'];
	if (!player) return message.send(`🔪 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`🔪 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`🔪 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`🔪 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.id == user.id) return message.send(`🔪 || Нельзя передать нож самому себе! ❌`);
	if (!player.knowledge.belt) return message.send(`🔪 || Для передачи ножа нужно, чтобы ${nick(player)} имел белый пояс! ❌`);
	if (player.property.knife) return message.send(`🔪 || ${nick(player)} уже имеет нож! ❌`);
	player.property.knife = user.property.knife;
	delete user.property.knife;
	notification(`🔪 || ${nick(user)} ${gender('передал', 'передала', user)} вам ${title[player.property.knife+3]}. ✔\n\n💡 Для просмотра информации о вашем ноже напишите «Нож».`, 'property_transfer', player, Keyboard.builder().textButton({label: 'Нож', color: Keyboard.POSITIVE_COLOR}).inline());
	return message.send(`🔪 || ${nick(player)} ${gender('получил', 'получила', player)} ${title[player.property.knife+3]}. ✔`);
});

hearManager.hear(/^(?:огнестрельные оружия|огнестрельное оружие)\s?([0-9]+)?/i, message => {
	if (!user.knowledge.belt || user.knowledge.belt < 2) return message.send(`🔫 || Для покупки огнестрельного оружия вы должны иметь жёлтый пояс! ❌`);
	let firearms = user.property.firearms;
	let number = Number(parserId(message.$match[1]));
	let damage = [266, 305, 47, 0, 20, 17, 125, 5, 16, 41];
	let cost = [0, 60000, 30000, 210000, 75000, 500000, 40000];
	let title = ['легендарное огнестрельное оружие «Крупнокалиберный пулемёт Владимирова»', 'эпическое огнестрельное оружие «Гранатомёт «РПГ-28»', 'редкое огнестрельное оружие «Автомат «M16»', 0, '«Автомат Калашникова»', 'автомат «M16»', 'гранатомёт «РПГ-7»', 'пистолет «HK USP»', 'пулемёт «Negev NG7»', '«Снайперская винтовка Драгунова»'];
	if (firearms) return message.send(`🔫 || Ваше огнестрельное оружие:\n  🔫 ${ucFirst(title[firearms+3])} (${declination('урона', 'урон', 'урона', damage[firearms+3])})\n\n💡 Для продажи огнестрельного оружия напишите «Продать огнестрельное оружие».\n💡 Для передачи огнестрельного оружия другому игроку напишите «Передать огнестрельное оружие [ID аккаунта]».`, {keyboard: Keyboard.builder().textButton({label: 'Продать огнестрельное оружие', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
🔫 || Огнестрельные оружия:
 🔫 «Автомат Калашникова»
  🔎 60.000 ₽ | 20 едениц урона | #1
 🔫 Автомат «M16»
  🔎 30.000 ₽ | 17 едениц урона | #2
 🔫 Гранатомёт «РПГ-7»
  🔎 210.000 ₽ | 125 еденицы урона | #3
 🔫 Пистолет «HK USP»
  🔎 75.000 ₽ | 5 едениц урона | #4
 🔫 Пулемёт «Negev NG7»
  🔎 500.000 ₽ | 16 едениц урона | #5
 🔫 «Снайперская винтовка Драгунова»
  🔎 40.000 ₽ | 41 еденица урона | #6

💡 Для покупки напишите «Огнестрельное оружие [номер]».
		`);
	}
	if (!number || number < 1 || number > 6) return message.send(`🔫 || Огнестрельного оружия с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`🔫 || Недостаточно средств на карте, либо карты нет! ❌`);
	user.bank.balance -= cost[number];
	user.property.firearms = number;
	return message.send(`🔫 || Вы купили ${title[number+3]} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашем огнестрельном оружии напишите «Огнестрельное оружие».`, {keyboard: Keyboard.builder().textButton({label: 'Огнестрельное оружие', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(продать огнестрельное оружие|огнестрельное оружие продать)$/i, message => {
	if (!user.property.firearms) return message.send(`🔫 || У вас нет огнестрельного оружия! ❌\n\n💡 Для просмотра списка огнестрельных оружий напишите «Огнестрельные оружия».`, {keyboard: Keyboard.builder().textButton({label: 'Огнестрельные оружия'}).inline()});
	let cost = [93800, 364000, 56000, 0, 42000, 21000, 147000, 52500, 450000, 28000];
	let title = ['легендарное огнестрельное оружие «Крупнокалиберный пулемёт Владимирова»', 'эпическое огнестрельное оружие «Гранатомёт «РПГ-28»', 'редкое огнестрельное оружие «Автомат «M16»', 0, '«Автомат Калашникова»', 'автомат «M16»', 'гранатомёт «РПГ-7»', 'пистолет «HK USP»', 'пулемёт «Negev NG7»', '«Снайперская винтовка Драгунова»'];
	message.send(`🔫 || Вы продали ${title[user.property.firearms+3]} за ${spaces(cost[user.property.firearms+3])} ₽. ✔`);
	user.bank.balance += cost[user.property.firearms+3];
	delete user.property.firearms;
	return;
});

hearManager.hear(/^(?:передать огнестрельное оружие)\s?([0-9]+)?/i, message => {
	if (!user.property.firearms) return message.send(`🔫 || У вас нет огнестрельного оружия! ❌\n\n💡 Для просмотра списка огнестрельных оружий напишите «Огнестрельные оружия».`, {keyboard: Keyboard.builder().textButton({label: 'Огнестрельные оружия'}).inline()});
	let player = accounts.accounts[parserId(message.$match[1])];
	let title = ['легендарное огнестрельное оружие «Крупнокалиберный пулемёт Владимирова»', 'эпическое огнестрельное оружие «Гранатомёт «РПГ-28»', 'редкое огнестрельное оружие «Автомат «M16»', 0, '«Автомат Калашникова»', 'автомат «M16»', 'гранатомёт «РПГ-7»', 'пистолет «HK USP»', 'пулемёт «Negev NG7»', '«Снайперская винтовка Драгунова»'];
	if (!player) return message.send(`🔫 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`🔫 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`🔫 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`🔫 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.id == user.id) return message.send(`🔫 || Нельзя передать огнестрельное оружие самому себе! ❌`);
	if (!player.knowledge.belt || player.knowledge.belt < 2) return message.send(`🔫 || Для передачи огнестрельного оружия нужно, чтобы ${nick(player)} имел жёлтый пояс! ❌`);
	if (player.property.firearms) return message.send(`🔫 || ${nick(player)} уже имеет огнестрельное оружие! ❌`);
	player.property.firearms = user.property.firearms;
	delete user.property.firearms;
	notification(`🔫 || ${nick(user)} ${gender('передал', 'передала', user)} вам ${title[player.property.firearms+3]}. ✔\n\n💡 Для просмотра информации о вашем огнестрельном оружии напишите «Огнестрельное оружие».`, 'property_transfer', player, Keyboard.builder().textButton({label: 'Огнестрельное оружие', color: Keyboard.POSITIVE_COLOR}).inline());
	return message.send(`🔫 || ${nick(player)} ${gender('получил', 'получила', player)} ${title[player.property.firearms+3]}. ✔`);
});

hearManager.hear(/^(?:взрывчатки|взрывчатка)\s?([0-9]+)?/i, message => {
	if (!user.knowledge.belt || user.knowledge.belt < 3) return message.send(`💣 || Для покупки взрывчатки вы должны иметь зелёный пояс! ❌`);
	let explosives = user.property.explosives;
	let number = Number(parserId(message.$match[1]));
	let damage = [96, 91, 86, 0, 84, 7, 85, 76, 67];
	let cost = [0, 36000, 200, 43000, 45000, 10000];
	let title = ['Легендарная взрывчатка «CL-20»', 'Эпическая взрывчатка «Октоген»', 'Редкая взрывчатка «Астролит»', 0, '«Гексоген»', 'Граната «Ф-1»', '«Пентрит»', '«Тетрил»', '«Тринитротолуол»'];
	if (explosives) return message.send(`💣 || Ваша взрывчатка:\n  💣 ${title[explosives+3]} (${declination('урона', 'урон', 'урона', damage[explosives+3])})\n\n💡 Для продажи взрывчатки напишите «Продать взрывчатку».\n💡 Для передачи взрывчатки другому игроку напишите «Передать взрывчатку [ID аккаунта]».`, {keyboard: Keyboard.builder().textButton({label: 'Продать взрывчатку', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (!message.$match[1]) {
		return message.send(`
💣 || Взрывчатки:
 💣 «Гексоген»
  🔎 36.000 ₽ | 84 еденицы урона | #1
 💣 Граната «Ф-1»
  🔎 200 ₽ | 7 едениц урона | #2
 💣 «Пентрит»
  🔎 43.000 ₽ | 85 едениц урона | #3
 💣 «Тетрил»
  🔎 45.000 ₽ | 76 едениц урона | #4
 💣 «Тринитротолуол»
  🔎 10.000 ₽ | 67 едениц урона | #5

💡 Для покупки напишите «Взрывчатка [номер]».
		`);
	}
	title = [0, '«Гексоген»', 'гранату «Ф-1»', '«Пентрит»', '«Тетрил»', '«Тринитротолуол»'];
	if (!number || number < 1 || number > 6) return message.send(`💣 || Взрывчатки с таким номером не существует! ❌`);
	if (!user.bank.balance || user.bank.balance < cost[number]) return message.send(`💣 || Недостаточно средств на карте, либо карты нет! ❌`);
	user.bank.balance -= cost[number];
	user.property.explosives = number;
	return message.send(`💣 || Вы купили ${title[number]} за ${spaces(cost[number])} ₽. ✔\n\n💡 Для просмотра информации о вашей взрывчатки напишите «Взрывчатка».`, {keyboard: Keyboard.builder().textButton({label: 'Взрывчатка', color: Keyboard.POSITIVE_COLOR}).inline()});
});

hearManager.hear(/^(взрывчатка продать|продать взрывчатку)$/i, message => {
	if (!user.property.explosives) return message.send(`💣 || У вас нет взрывчатки! ❌\n\n💡 Для просмотра списка взрывчаток напишите «Взрывчатки».`, {keyboard: Keyboard.builder().textButton({label: 'Взрывчатки'}).inline()});
	let cost = [70000, 60900, 56000, 0, 25200, 140, 30100, 31500, 7000];
	let title = ['легендарную взрывчатку «CL-20»', 'эпическую взрывчатку «Октоген»', 'редкую взрывчатку «Астролит»', 0, '«Гексоген»', 'гранату «Ф-1»', '«Пентрит»', '«Тетрил»', '«Тринитротолуол»'];
	message.send(`💣 || Вы продали ${title[user.property.explosives+3]} за ${spaces(cost[user.property.explosives+3])} ₽. ✔`);
	user.bank.balance += cost[user.property.explosives+3];
	delete user.property.explosives;
	return;
});

hearManager.hear(/^(?:передать взрывчатку)\s?([0-9]+)?/i, message => {
	if (!user.property.explosives) return message.send(`💣 || У вас нет взрывчатки! ❌\n\n💡 Для просмотра списка взрывчаток напишите «Взрывчатки».`, {keyboard: Keyboard.builder().textButton({label: 'Взрывчатки'}).inline()});
	let player = accounts.accounts[parserId(message.$match[1])];
	let title = ['легендарную взрывчатку «CL-20»', 'эпическую взрывчатку «Октоген»', 'редкую взрывчатку «Астролит»', 0, '«Гексоген»', 'гранату «Ф-1»', '«Пентрит»', '«Тетрил»', '«Тринитротолуол»'];
	if (!player) return message.send(`💣 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💣 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💣 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💣 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.id == user.id) return message.send(`💣 || Нельзя передать взрывчатку самому себе! ❌`);
	if (!player.knowledge.belt || player.knowledge.belt < 3) return message.send(`💣 || Для передачи взрывчатки нужно, чтобы ${nick(player)} имел зелёный пояс! ❌`);
	if (player.property.explosives) return message.send(`💣 || ${nick(player)} уже имеет взрывчатку! ❌`);
	player.property.explosives = user.property.explosives;
	delete user.property.explosives;
	notification(`💣 || ${nick(user)} ${gender('передал', 'передала', user)} вам ${title[player.property.explosives+3]}. ✔\n\n💡 Для просмотра информации о вашей взрывчатке напишите «Взрывчатка».`, 'property_transfer', player, Keyboard.builder().textButton({label: 'Взрывчатка', color: Keyboard.POSITIVE_COLOR}).inline());
	return message.send(`💣 || ${nick(player)} ${gender('получил', 'получила', player)} ${title[player.property.explosives+3]}. ✔`);
});

hearManager.hear(/^(развлечения|развличения|развлечение|развлечения)$/i, message => {
	return message.send(`
🎈 || ${nick(user)}, развлечения:
  🧮 «Реши [пример]» — калькулятор.
  🔍 «Рандом от [первое число] до [второе число]» — выбрать случайное число в диапазоне.
  ✔ «Выбери [вариант 1] или [вариант 2]» — выбирает первый или второй вариант.
  🔮 «Шар [вопрос]» — отвечает на вопрос (да или нет).
  ⌚ «Сколько [событие]» — сколько осталось времени до события.
  📊 «Шанс [событие]» — шанс события в %.

  💒 «Брак» — информация о вашем браке.
  👊🏻 «Ударить [ID аккаута]» — ударить игрока.
  💋 «Поцеловать [ID аккаута]» — поцеловать игрока.
  😊 «Обнять [ID аккаута]» — обнять игрока.
  🖐🏻 «/me [действие]» — действие от третьего лица в беседе.
  🖐🏻 «/try [действие]» — действие от третьего лица с выводом успешно/неуспешно в беседе.
	`);
}); 

hearManager.hear(/^(?:реши|калькулятор)\s?([^]+)?/i, async message => {
	let example = message.$match[1];
	let allowed = /([^0-9.+*/%\s-)(]+)/;
	if (!example || allowed.test(example)) return message.send(`🧮 || Введите команду «Реши [пример]». Где [пример] — это пример, который может содержать числа (знак «.» делит десятичную часть) и знаки! («+» — сложение; «-» — вычитание; «*» — умножение; «/» — деление; «**» — возведение в степень; «%» — остаток от деления) ❌`);
	try {
		return message.send(`🧮 Пример: ${example.replace(/\s+/g, '')}\n✅ Ответ: ${spaces(eval(example))}`);
	} catch {
		return message.send(`🧮 || Введите команду «Реши [пример]». Где [пример] — это пример, который может содержать числа (знак «.» делит десятичную часть) и знаки! («+» — сложение; «-» — вычитание; «*» — умножение; «/» — деление; «**» — возведение в степень; «%» — остаток от деления) ❌`);
	}
});

hearManager.hear(/^(?:рандом от)\s?([0-9-]+)?\s(?:до)\s?([0-9-]+)?$/i, message => {
	if ((!Number(message.$match[1]) && message.$match[1] !== 0) || (!Number(message.$match[2]) && message.$match[2] !== 0)) return message.send(`🔍 || Вы не ввели числа! Используйте «Рандом от [первое число] до [второе число]». ❌`);
	return message.send(`🔍 || ${nick(user)}, рандом показал число ${spaces(random(Number(message.$match[1]), Number(message.$match[2])))}.`);
});

hearManager.hear(/^(?:выбери)\s?([^]+)?\s(?:или)\s?([^]+)?/i, message => {
	if (!message.$match[1] || !message.$match[2]) return message.send(`✔ Введите команду «Выбери [вариант 1] или [вариант 2]»! ❌`);
	return message.send(`✔ || ${nick(user)}, я выбираю «${[message.$match[1], message.$match[2]].random()}».`);
});

hearManager.hear(/^(?:шар)\s?([^]+)?/i, message => {
	if (!message.$match[1]) return message.send(`🔮 || Вы не ввели вопрос! Используйте «Шар [вопрос]». ❌`);
	return message.send(`🔮 || ${nick(user)}, ${['думаю, да','лучше не рассказывать..', 'не могу предсказать', 'пока не ясно', 'хорошие перспективы', 'сейчас нельзя предсказать', 'весьма сомнительно', 'мой ответ — нет', 'определённо — да', 'да', 'нет'].random()}.`);
});

hearManager.hear(/^(?:сколько)\s?([^]+)?/i, message => {
	if (!message.$match[1]) return message.send(`⌚ || Вы не ввели событие! Используйте «Сколько [событие]». ❌`);
	return message.send(`⌚ || ${nick(user)}, ${[`${declination('минут', 'минуту', 'минуты', random(1,60))}`,`нисколько`,`думаю, ${declination('часов', 'час', 'часа', random(1,24))}`,`${declination('лет', 'год', 'года', random(1,100))}`,`${declination('секунд', 'секунду', 'секунды', random(1,60))}`,`прямо сейчас`,`сутки`,`много`].random()}.`);
});

hearManager.hear(/^(?:шанс)\s?([^]+)?/i, message => {
	if (!message.$match[1]) return message.send(`📊 || Вы не ввели событие! Используйте «Шанс [событие]». ❌`);
	return message.send(`📊 || ${nick(user)}, примерно — ${random(100)}%.`);
});

hearManager.hear(/^брак$/i, message => {
	let partner = user.partner;
	return message.send(`💒 || ${nick(user)}, ваш брак:\n  👫 ${partner && accounts.accounts[partner].partner ? `Вы состоите в браке с ${nick(accounts.accounts[partner])}.\n\n💡 Для развода напишите «Развестись».` : 'Вы не состоите в браке.\n\n💡 Для регистрации брака напишите «Сделать предложение [ID игрока]».'}`);
});

hearManager.hear(/^(?:сделать предложение)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`💒 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💒 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💒 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💒 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (user.partner && accounts.accounts[user.partner].partner) return message.send(`💒 || Вы уже состоите в браке! ❌\n\n💡 Для развода напишите «Развестись».`, {keyboard: Keyboard.builder().textButton({label: 'Развестись', color: Keyboard.NEGATIVE_COLOR}).inline()});
	if (player.partner == user.id) return message.send(`💒 || ${nick(player)} уже ${gender('сделал', 'сделала', player)} вам предложение!\n\n💡 Для принятия предложения напишите «Принять предложение ${player.id}».`);
	if (user.partner == player.id) return message.send(`💒 || Вы уже сделали ${gender('ему', 'ей', player)} предложение! ❌`);
	if (player.partner && accounts.accounts[player.partner].partner) return message.send(`💒 || ${nick(player)} уже состоит в браке! ❌`);
	if (player == user) return message.send(`💒 || Нельзя сделать предложение себе! ❌`);
	user.partner = player.id;
	notification(`💒 || Барабанная дробь... Внимание... ${nick(user)} делает вам предложение! 💘\n\n💡 Для принятия предложения напишите «Принять предложение ${user.id}».\n💡 Для отказа напишите «Отказать ${user.id}».`, 'proposal', player, Keyboard.builder().textButton({label: `Принять предложение ${user.id}`, color: Keyboard.POSITIVE_COLOR}).row().textButton({label: `Отказать ${user.id}`, color: Keyboard.NEGATIVE_COLOR}).inline());
	return message.send(`💒 || Вы сделали предложение. ✔`);
});

hearManager.hear(/^(?:принять предложение)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`💒 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💒 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💒 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💒 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.partner != user.id || (player.partner == user.id && user.partner == player.id)) return message.send(`💒 || ${nick(player)} не ${gender('делал', 'делала', player)} вам предложение, отменил его, либо вы уже в браке! ❌`);
	user.partner = player.id;
	for (i in accounts.accounts) if (accounts.accounts[i].partner == user.id && user.partner != i || accounts.accounts[i].partner == player.id && player.partner != i) delete user.partner;
	notification(`💒 || Поздравляю! ${nick(user)} ${gender('вступил', 'вступила', player)} с вами в брак. ❤`, 'proposal', player);
	return message.send(`💒 || Вы вступили в брак. ✔`);
});

hearManager.hear(/^(?:отказать)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`💒 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💒 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💒 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💒 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	if (player.partner != user.id || (player.partner == user.id && user.partner == player.id)) return message.send(`💒 || ${nick(player)} не ${gender('делал', 'делала', player)} вам предложение, отменил его, либо вы уже в браке! ❌`);
	delete player.partner;
	notification(`💒 || ${nick(user)} ${gender('отказал', 'отказала', player)} вам в предложении! 💔`, 'proposal', player);
	return message.send(`💒 || Вы отказали в предложении. ✔`);
});

hearManager.hear(/^развестись$/i, message => {
	let player = accounts.accounts[user.partner];
	if (!user.partner) return message.send(`💒 || Вы не состоите в браке! ❌\n\n💡 Для регистрации брака напишите «Сделать предложение [ID игрока]».`);
	delete player.partner;
	delete user.partner;
	notification(`💒 || ${nick(user)} ${gender('подал', 'подала', player)} на развод! 💔`, 'proposal', player);
	return message.send(`💒 || Вы развелись с ${nick(player)}. ✔`);
});

hearManager.hear(/^(?:ударить)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`👊🏻 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID аккаунта можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`👊🏻 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`👊🏻 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`👊🏻 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	return message.send(`👊🏻 ${nick(user)} ${gender('ударил', 'ударила', user)} ${nick(player)}.`);
});

hearManager.hear(/^(?:поцеловать)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`💋 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`💋 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`💋 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`💋 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	return message.send(`💋 ${nick(user)} ${gender('поцеловал', 'поцеловала', user)} ${nick(player)}.`);
});

hearManager.hear(/^(?:обнять)\s?([0-9]+)?/i, message => {
	let player = accounts.accounts[parserId(message.$match[1])];
	if (!player) return message.send(`😊 || Вы не ввели ID аккаунта, либо аккаунт с таким ID удалён или ещё не создан! ❌\n\n💡 ID игрока можно узнать в команде «Аккаунт». (Например: #1)`);
	for (i in player.settings.blacklist) if (player.settings.blacklist[i] == user.id) return message.send(`😊 || ${nick(player)} ${gender('добавил', 'добавила', player)} вас в чёрный список! ❌`);
	for (i in user.settings.blacklist) if (user.settings.blacklist[i] == player.id) return message.send(`😊 || Вы добавили ${nick(player)} в чёрный список! ❌`);
	if (player.fines && player.fines.account_ban) return message.send(`😊 || ${nick(player)} ${gender('заблокирован', 'заблокирована', player)} в боте за нарушение правил! ❌`);
	return message.send(`😊 ${nick(user)} ${gender('обнял', 'обняла', user)} ${nick(player)}.`);
});

hearManager.hear(/^(?:\/me)\s?([^]+)?/i, message => {
	if (!message.$match[1]) return message.send(`🖐🏻 || Вы не ввели действие! Используйте «/me [действие]». ❌`);
	return message.send(`🖐🏻 || ${nick(user)} ${message.$match[1]}.`);
});

hearManager.hear(/^(?:\/try)\s?([^]+)?/i, message => {
	if (!message.$match[1]) return message.send(`🖐🏻 || Вы не ввели действие! Используйте «/try [действие]». ❌`);
	return message.send(`🖐🏻 || ${nick(user)} ${message.$match[1]}. (${['Успешно', 'Неуспешно'].random()})`);
});

/*hearManager.hear(/^открыть подарок|подарок открыть|открыть подарки|подарок$/i, message => {
	if (!user.cases.gifts) return message.send(`🎁 || У вас нет новых подарков! ❌`);
	let key = Keyboard.builder();
	let money = progress(random(1,100), user.id)*1000;
	let improvement = progress(random(2), user.id);
	let donat = progress(random(4), user.id);
	let real_estate = ['car', 'house', 'flat', 'garage'].random();
	let description = '';
	let names = {
		house: [8,'дома в лесу','дома в селе','дачи в городе','дома в городе','двухэтажного дома','трёхэтажного дома','трёхэтажного дома с бассейном','коттеджа','особняка'],
		flat: [5,'квартиры в двухэтажке','однокомнатной квартиры в новом доме','двухкомнатной квартиры в новом доме','трёхкомнатной квартиры в новом доме','двухуровневой квартиры'],
		car: [10,'«Mercedes-Benz W124»','«Suzuki Kizashi»','«Volkswagen Passat CC»','«Skoda Superb»','«Mercedes-Benz CLA-Class»','«Range Rover»','«Audi A7»','«BMW 6-Series»','«Lexus LX570»','«Porsche Panamera»'],
		garage: [4,'металлического контейнера во дворе ','обыкновенного гаража','гаража во дворе','ангара']
	};
	if (improvement != 0 && improvement < 4 && user.property[real_estate] != names[real_estate][0]) {
		!user.property[real_estate] || user.property[real_estate] + improvement <= names[real_estate][0] ? (user.property[real_estate] = user.property[real_estate] + improvement ? user.property[real_estate] + improvement : improvement) : user.property[real_estate] = names[real_estate][0];
		description = `\n  🔑 Ключи от ${names[real_estate][user.property[real_estate]]}`;
	}
	if (donat == 1 && (!user.extensions || !user.extensions.nickname_without_end)) {
		user.extensions ? user.extensions.nickname_without_end = true : user.extensions = {nickname_without_end: true};
		notification(`🍀 || Вам доступен донат «Ник без конца»! Вы можете использовать ник свыше 15 символов. ⚡\n\n💡 Для смены ника напишите «Ник [имя]».`)
		description += '\n  🍀 Донат «Ник без конца»';
	}
	user.cases.gifts--;
	user.balance += money;
	if (user.cases.gifts) key.textButton({label: 'Открыть подарок'});
	message.send(`
🎁 || Вы нашли в подарке:
  💸 ${spaces(money)} ₽${description}

💡 ${user.cases.gifts ? `У вас есть ещё ${declination('подарков', 'подарок', 'подарка', user.cases.gifts)}.` : `Вы открыли все свои подарки!`}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^открыть обычный кейс|обычный кейс открыть$/i, message => {
	if (!user.cases.ordinary) return message.send(`📦 || У вас нет обычных кейсов! ❌`);
	let key = Keyboard.builder();
	let money = progress(random(5,14), user.id);
	let damage_boost = progress(random(5,14), user.id);
	let chance = progress(random(500), user.id);
	let weapon = ['firearms', 'knife', 'explosives', 'combat_vehicle'].random();
	let description = '';
	if (chance < 31 && !(user.property[weapon] <= -1)) {
		user.property[weapon] = -1;
		description += `\n  ${weapon == 'firearms' ? '🔫 Редкое огнестрельное оружие' : (weapon == 'knife' ? '🔪 Редкий нож' : (weapon == 'explosives' ? '💣 Редкую взрывчатку' : '🚨 Редкую боевую машину'))}`;
	}
	user.gang.damage_boost === undefined ? user.gang.damage_boost = 1 + damage_boost/100 : user.gang.damage_boost += damage_boost/100;
	user.bank.balance += money;
	user.cases.ordinary--;
	if (user.cases.ordinary) key.textButton({label: 'Открыть обычный кейс'});
	return message.send(`
📦 || Вы нашли в обычном кейсе:
  💸 ${spaces(money)} ₽
  📈 Буст урона — ${damage_boost}%${description}

💡 ${user.cases.ordinary ? `У вас есть ещё ${declination('обычных кейсов', 'обычный кейс', 'обычных кейса', user.cases.ordinary)}.` : `Вы открыли все обычные кейсы!`}
	`, {keyboard: key.inline()});
});

hearManager.hear(/^открыть редкий кейс|редкий кейс открыть$/i, message => {
	if (!user.cases.rare) return message.send(`📦 || У вас нет редких кейсов! ❌`);
	let key = Keyboard.builder();
	let money = progress(random(6,15), user.id);
	let damage_boost = progress(random(6,15), user.id);
	let chance = progress(random(600), user.id);
	let subscription = random(99);
	let level = random(1000) < 300 ? -2 : -1;
	let weapon = ['firearms', 'knife', 'explosives', 'combat_vehicle'].random();
	let description = '';
	let names = {
		firearms: ["🔫 Эпическое огнестрельное оружие", "🔫 Редкое огнестрельное оружие"],
		knife: ["🔪 Эпический нож", "🔪 Редкий нож"],
		explosives: ["💣 Эпическую взрывчатку", "💣 Редкую взрывчатку"],
		combat_vehicle: ["🚨 Эпическую боевую машину", "🚨 Редкую боевую машину"],
	};
	if (chance < 31 && !(user.property[weapon] <= level)) {
		user.property[weapon] = level;
		description += `\n  ${names[weapon][level+2]}`;
	}
	if (subscription < 10) {
		subscription = true;
		description += `\n  ⚔ Подписка «Gang Pass» на месяц`
	}
	user.gang.damage_boost === undefined ? user.gang.damage_boost = 1 + damage_boost/100 : user.gang.damage_boost += damage_boost/100;
	user.bank.balance += money;
	user.cases.rare--;
	if (user.cases.rare) key.textButton({label: 'Открыть редкий кейс'});
	message.send(`
📦 || Вы нашли в редком кейсе:
  💸 ${spaces(money)} ₽
  📈 Буст урона — ${damage_boost}%${description}

💡 ${user.cases.rare ? `У вас есть ещё ${declination('редких кейсов', 'редкий кейс', 'редких кейса', user.cases.rare)}.` : `Вы открыли все редкие кейсы!`}
	`, {keyboard: key.inline()});
	if (subscription === true) donations(4, user);
	return;
});

hearManager.hear(/^открыть легендарный кейс|легендарный кейс открыть$/i, message => {
	if (!user.cases.legendary) return message.send(`📦 || У вас нет легендарных кейсов! ❌`);
	let key = Keyboard.builder();
	let money = progress(random(60,150), user.id);
	let damage_boost = progress(random(7,16), user.id);
	let chance = progress(random(700), user.id);
	let subscription = random(99);
	let level = random(1000) < 30 ? -3 : (random(1000) < 400 ? -2 : -1);
	let weapon = ['firearms', 'knife', 'explosives', 'combat_vehicle'].random();
	let donations;
	let description = '';
	let names = {
		firearms: ["🔫 Легендарное огнестрельное оружие", "🔫 Эпическое огнестрельное оружие", "🔫 Редкое огнестрельное оружие"],
		knife: ["🔪 Легендарный нож", "🔪 Эпический нож", "🔪 Редкий нож"],
		explosives: ["💣 Легендарную взрывчатку", "💣 Эпическую взрывчатку", "💣 Редкую взрывчатку"],
		combat_vehicle: ["🚨 Легендарную боевую машину", "🚨 Эпическую боевую машину", "🚨 Редкую боевую машину"],
	};
	if (chance < 31 && !(user.property[weapon] <= level)) {
		user.property[weapon] = level;
		description += `\n  ${names[weapon][level+3]}`;
	}
	if (subscription < 3) {
		donations = 5;
		description += `\n  ⚔ Подписка «Gang Pass Plus» на месяц`
	} else if (subscription < 20) {
		donations = 4;
		description += `\n  ⚔ Подписка «Gang Pass» на месяц`
	}
	user.gang.damage_boost === undefined ? user.gang.damage_boost = 1 + damage_boost/100 : user.gang.damage_boost += damage_boost/100;
	user.bank.balance += money;
	user.cases.legendary--;
	if (user.cases.legendary) key.textButton({label: 'Открыть легендарный кейс'});
	message.send(`
📦 || Вы нашли в легендарном кейсе:
  💸 ${spaces(money)} ₽
  📈 Буст урона — ${damage_boost}%${description}

💡 ${user.cases.legendary ? `У вас есть ещё ${declination('легендарных кейсов', 'легендарный кейс', 'легендарных кейса', user.cases.legendary)}.` : `Вы открыли все легендарные кейсы!`}
	`, {keyboard: key.inline()});
	if (donations) donations(donations, user);
	return;
});*/

hearManager.hear(/^(?:поддержка|репорт)/i, message => {
	return message.send(`❓ || Поддержка находится тут — https://vk.com/gorozaninsup.`);
});

hearManager.hear(/^(обновления|обновление)$/i, message => {
	return message.send(`${!user.subscription || !user.subscription.don ? accounts.update : accounts.updateForDons}`);
});

hearManager.hear(/^(привет|приф|прив|здарова|дарова|здравствуйте|начать)$/i, message => {
	if (message.isChat) return;
	return message.send(`
❣ || Здравствуйте, ${nick(user)}! Это игровой чат-бот «Горожанин бот».

🔗 | Полезные ссылки:
  🌐 Наш сайт — http://gorozaninconnect.ru/
  🌻 Экосистема «Горожанин» - https://vk.com/gorozaninconnect
  📜 Правила бота — https://vk.com/topic-187145687_43552342

💡 Для просмотра списка всех команд напишите «Помощь».
💡 Для просмотра информации о вашем аккаунте напишите «Аккаунт».
	`, {keyboard: Keyboard.builder().textButton({label: 'Помощь', color: Keyboard.POSITIVE_COLOR}).textButton({label: 'Аккаунт'}).inline()});
});

hearManager.hear(/суицид|самоубийств|депресси|умереть|здохнуть|сдохнуть|не хочу жить|смерт|убить|покончить с собой|порезать вены|повеситься|самовыпилиться|прыгать с крыши|камнем вниз/i, message => {
	return message.send(`🙏 || 	Помочь справится с переживаниями и получить помощь психолога призван бесплатный и анонимный общероссийский телефон доверия для детей, подростков и их родителей +7 (800) 200-01-22. 🗣`);
});

hearManager.hear(/^бот$/i, message => {
	return message.send({sticker_id: [51571, 15727, 11708, 15721, 20085, 15271, 15257, 12710, 50647, 57836, 51594, 51580, 51561, 50477, 50465, 50460, 59426, 59410, 59404, 59399, 59403].random()});
});

hearManager.hear(/^(?:\/adminpanel|\/apanel)$/i, (message, next) => {
	if (message.isChat || (user.id != 1 && !agent(user.idvk))) return next();
	return message.send(`🎛 || Административная панель:${user.id == 1 || agent(user.idvk) ? `\n  —«/account ban [ID аккаунта] [срок в часах/0, если навсегда] [причина]» — забанить игрока.\n  —«/[disable/enable] transfers [ID аккаунта]» — запертить/разрешить переводы валюты игроку.\n  —«/send message [ID аккаунта] [текст]» — отправить сообщение игроку.` : ``}${user.id == 1 || agent(user.idvk) == 2 ? `\n  —«/info agent [полная ссылка]» — информация об агенте поддержки.\n  —«/add agent 1 [ID аккаунта]» — добавить агента поддержки.` : ``}${user.id == 1 ? `\n  —«/give gifts [men/women/ID аккаунта]» — выдать подарки.\n  —«/give money [ID аккаунта] [сумма]» — выдать российские рубли игроку.\n  —«/start gang league» — начать лигу банд.\n  —«/set update [1-2] [текст]» — установить обновление.\n  —«/mailing post/text [for dons] [ссылка на пост]» — рассылка.` : ``}`);
});

hearManager.hear(/^(?:\/account ban)\s([0-9]+)\s([0-9]+)\s([^]+)/i, (message, next) => {
	if (message.isChat || (user.id != 1 && agent(user.idvk) != 2)) return next();
	let player = accounts.accounts[message.$match[1]];
	let clock = watch.accounts[player.id];
	let term = Number(message.$match[2]);
	if (!player || (!term && term !== 0)) return message.send(`Данные введены неверно.`);
	player.fines ? player.fines.account_ban = true : player.fines = {account_ban: true};
	player.fines.reason_ban = message.$match[3];
	if (term) clock.fines ? clock.fines.account_ban = term*3600 : clock.fines = {account_ban: term*3600};
	send(`📛 || Вас забанили в боте по причине «${message.$match[3]}»! Блокировки выдана на${term ? ' ' + declination('часов', 'час', 'часа', term) : 'всегда'}. ❌\n\n💡 Для связи с технической поддержкой напишите «Поддержка [текст]».\n💡 Для просмотра списка команд напишите «Помощь».`, player.idvk);
	return message.send(`Вы забанили игрока ${nick(player)}.`);
});

hearManager.hear(/^(\/)(disable|enable)\s(transfers)\s([0-9]+)$/i, (message, next) => {
	if (message.isChat || (user.id != 1 && !agent(user.idvk))) return next();
	let player = accounts.accounts[message.$match[4]];
	let action = message.$match[2] == 'disable' ? 1 : 2;
	if (!player || (action == 2 && (!player.fines || !player.fines.transfer_ban))) return message.send(`Данные введены неверно.`);
	if (action == 1) player.fines ? player.fines.transfer_ban = true : player.fines = {transfer_ban: true};
	if (action == 2) !player.fines[1] ? delete player.fines : delete player.fines.transfer_ban;
	send(`📛 || ${action == 1 ? `Вам закрыли команду «Перевести [ID аккаунта] [сумма] [комментарий (не обязательно)]» за нарушение правил! ❌` : `Вам снова открыли команду «Перевести [ID аккаунта] [сумма] [комментарий (не обязательно)]». ✔`}`, player.idvk);
	return message.send(`Вы настроили возможность перевода валюты.`);
});

hearManager.hear(/^(?:\/send message)\s([0-9]+)\s([^]+)/i, (message, next) => {
	if (message.isChat || (user.id != 1 && !agent(user.idvk))) return next();
	let player = accounts.accounts[message.$match[1]];
	if (!player) return message.send(`Данные введены неверно.`);
	send(`💬 ${message.$match[2]}`, player.idvk);
	return message.send(`Сообщение отправлено.`);
});

hearManager.hear(/^(?:\/info agent https:\/\/vk\.com\/)\s?(id)?([^]+)/i, (message, next) => {
	if (message.isChat || (user.id != 1 && agent(user.idvk) != 2)) return next();
	let idvk = message.$match[2];
	if (!Number(idvk)) {
		vk.api.call('users.get', {
			user_ids: idvk
		}).then(res => {
			let player = accounts.accounts[aid(res[0].id)];
			callback(player);
		}).catch(err => {
			return message.send(`Данные введены неверно.`)
		});
	} else {
		callback(accounts.accounts[aid(idvk)]);
	}
	function callback(player) {
		let profile = support.agents[player.agent];
		let quantity = profile.marks[0]+profile.marks[1]+profile.marks[2]+profile.marks[3]+profile.marks[4];
		if (!player || !player.agent) return message.send(`Данные введены неверно.`);
		return message.send(`🐩 || Информация об агенте поддержки #${player.agent}\n  📌 Статус: ${profile.question ? 'решает вопрос' : 'свободен'}\n  📁 Решено ${declination('вопросов', 'вопрос', 'вопроса', quantity)}\n  🧮 Средняя оценка ответов — ${!quantity ? 0 : Math.round((profile.marks[0]+profile.marks[1]*2+profile.marks[2]*3+profile.marks[3]*4+profile.marks[4]*5)/quantity*100)/100}\n\n💡 Для удаления агента поддержки напишите «/delete agent [ID агента]».`);
	}
});

hearManager.hear(/^(?:\/add agent)\s([1-2])\s([0-9]+)$/i, (message, next) => {
	if (message.isChat || (user.id != 1 && agent(user.idvk) != 2)) return next();
	let player = accounts.accounts[message.$match[2]];
	let seniority = message.$match[1];
	if ((!seniority && !player) || (seniority == 2 && agent(user.idvk) == 2)) return message.send(`Данные введены неверно.`);
	if (player.agent) return message.send(`Игрок уже агент поддержки.`);
	support.sup_quantity++;
	player.agent = support.sup_quantity;
	support.agents[player.agent] = {"id": player.idvk, "marks": [0, 0, 0, 0, 0]};
	if (seniority == 2) support.agents[player.agent].senior = true;
	send(`🐩 || Поздравляю! Вы назначены${seniority == 2 ? ` старшим` : ``} агентом поддержки. ✔\n\n${seniority == 2 ? `Читайте документацию для старшего агента поддержки — vk.com/@gorozanin.documentation-dokumentaciya-dlya-starshego-agenta-podderzhki` : `Читайте документацию для агента поддержки — vk.com/@gorozanin.documentation-dokumentaciya-dlya-agenta-podderzhki`}`, player.idvk);
	return message.send(`${nick(player)} назначен агентом поддержки.`);
});

hearManager.hear(/^(?:\/delete agent)\s([0-9]+)$/i, (message, next) => {
	if (message.isChat || (user.id != 1 && agent(user.idvk) != 2)) return next();
	if (!support.agents[message.$match[1]]) return message.send(`Данные введены неверно.`);
	let player = accounts.accounts[aid(support.agents[message.$match[1]].id)];
	if (!player || player.id == user.id) return message.send(`Данные введены неверно.`);
	if (!player.agent) return message.send(`Игрок не является агентом поддержки.`);
	delete support.agents[player.agent];
	delete player.agent;
	send(`🐩 || Вы сняты с поста агента поддержки! ❌`, player.idvk);
	return message.send(`${nick(player)} снят с поста агента поддержки.`);
});

hearManager.hear(/^(?:\/give gifts)\s?([^]+)?/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	if (message.$match[1] != 'men' && message.$match[1] != 'women' && (!Number(message.$match[1]) || !accounts.accounts[message.$match[1]]) && message.$match[1]) return message.send(`Данные введены неверно.`);
	let text = '🎁 || Поздравляю! Вы получили подарок. ✔\n\n💡 Для распаковки подарка напишите «Открыть подарок».';
	let key = Keyboard.builder().textButton({label: 'Открыть подарок', color: Keyboard.POSITIVE_COLOR}).inline();
	if (!Number(message.$match[1])) {
		let gender = message.$match[1] == 'men' ? 1 : 2;
		for (i in accounts.accounts) {
			let player = accounts.accounts[i];
			if (player.gender == gender || !message.$match[1]) {
				player.cases.gifts ? player.cases.gifts++ : player.cases.gifts = 1;
				notification(text, 'gifts', player, key);
			}
		}
	} else {
		let player = accounts.accounts[message.$match[1]];
		player.cases.gifts ? player.cases.gifts++ : player.cases.gifts = 1;
		notification(text, 'gifts', player, key);
	}
	return message.send(`Подарки успешно выданы.`);
});

hearManager.hear(/^(?:\/give money)\s([0-9]+)\s([0-9]+)$/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	let player = accounts.accounts[message.$match[1]];
	money[player.idvk] += Number(message.$match[2]);
	send(`🤑 || ${nick(player)}, вам выдано ${declination('российских рублей', 'российский рубль', 'российских рубля', message.$match[2])}! ✔\n\n💡 Для просмотра вашего баланса напишите «Баланс».\n💡 Российские рубли можно будет вывести после Beta-тестирования.`, player.idvk);
	return message.send(`${nick(player)} получил ${message.$match[2]} российских рублей.`);
});

hearManager.hear(/^\/start gang league$/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	accounts.gangleague = true;
	return message.send(`Начинается лига банд.`);
});

hearManager.hear(/^(?:\/set update)\s([1-2])\s([^]+)/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	let don = message.$match[1];
	let text = message.$match[2];
	if (!don || !text) return message.send(`Данные введены неверно.`);
	don == 1 ? accounts.update = text : accounts.updateForDons = text;
	return message.send(`Обновление установлено.`);
});

hearManager.hear(/^(?:\/mailing post)\s([^]+)/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	for (i in conversations) {
		vk.api.call('messages.send', {
			chat_id: conversations[i].id,
			random_id: 0,
			attachment: message.$match[1]
		}).catch(err => {});
	}
	for (i in accounts.accounts) notification('', 'mailing', accounts.accounts[i], Keyboard.builder().inline(), message.$match[1]);
	return message.send(`Посты отправлены.`);
});

hearManager.hear(/^(?:\/mailing text)\s([^]+)/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	for (i in conversations) {
		vk.api.call('messages.send', {
			chat_id: conversations[i].id,
			random_id: 0,
			message: message.$match[1]
		}).catch(err => {});
	}
	for (i in accounts.accounts) notification(message.$match[1], 'mailing', accounts.accounts[i]);
	return message.send(`Рассылка отправлена.`);
});

hearManager.hear(/^(?:\/mailing post for dons)\s([^]+)/i, (message, next) => {
	if (message.isChat || user.id != 1) return next();
	for (i in accounts.accounts) if (accounts.accounts[i].subscriptions && accounts.accounts[i].subscriptions.don) notification('', 'mailing', accounts.accounts[i], Keyboard.builder().inline(), message.$match[1]);
	return message.send(`Посты отправлены.`);
});

vk.updates.on('message_new', message => {
	if (message.isChat) return;
	unknown.commands.push(message.text);
	return message.send(`❌ || ${nick(user)}, я не понимаю. Пожалуйста, убедитесь, что команда введена верно.\n\n💡 Для просмотра списка всех команд напишите «Помощь».`, {keyboard: Keyboard.builder().textButton({label: 'Помощь', color: Keyboard.POSITIVE_COLOR}).inline()});
});

setInterval(() => {
	let gang1;
	let gang2;
	for (i in gangs.gangs) if (gangs.gangs[i] && gangs.gangs[i].battle && gangs.gangs[i].battle.search) {gang1 = gangs.gangs[i]; break;}
	if (!gang1) return;
	for (i in gangs.gangs) {
		let gang = gangs.gangs[random(1, gangs.quantity)];
		if (gang.id != gang1.id && gang.battle && gang.battle.search && gang.battle.bet == gang1.battle.bet) {
			gang2 = gang;
			break;
		}
	}
	if (!gang2) return;
	delete gang1.battle.search;
	delete gang2.battle.search;
	gang1.battle.opponent = gang2.id;
	gang2.battle.opponent = gang1.id;
	gang1.battle.damage = 0;
	gang2.battle.damage = 0;
	watch.gangs[gang1.id].battle = 600;
	watch.gangs[gang2.id].battle = 600;
	for (i in accounts.accounts) if (accounts.accounts[i].gang.id == gang1.id || accounts.accounts[i].gang.id == gang2.id) {accounts.accounts[i].gang.blows = 1; accounts.accounts[i].gang.damage = 0}
	gang_notification(`⚔ || В банде «${gang1.title}» начинается бой!\n\n💡 Для просмотра информации о бое напишите «Бой».\n💡 Для атаки напишите «Атаковать».`, gang1, null, false, Keyboard.builder().textButton({label: 'Бой', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Атаковать', color: Keyboard.POSITIVE_COLOR}).inline());
	gang_notification(`⚔ || В банде «${gang2.title}» начинается бой!\n\n💡 Для просмотра информации о бое напишите «Бой».\n💡 Для атаки напишите «Атаковать».`, gang2, null, false, Keyboard.builder().textButton({label: 'Бой', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Атаковать', color: Keyboard.POSITIVE_COLOR}).inline());
}, 10000);

setInterval(() => {
	for (i in watch.accounts) {
		let player = accounts.accounts[i];
		let time = watch.accounts[i];
		if (time.contribution) {
			let early_closure;
			time.contribution.endcontribution--;
			time.contribution.payout--;
			if (!time.contribution.payout) {
				time.contribution.payout = 108000;
				!player.subscriptions || !player.subscriptions.bankpass ? player.bank.contribution = Math.round(player.bank.contribution*1.03) : player.bank.contribution = Math.round(player.bank.contribution*1.05);
				early_closure = player.bank.contribution < 1;
			}
			if (!time.contribution.endcontribution) {
				notification(`🗃 || ${nick(player)}, срок вклада закончился и он закрыт. На баланс карты зачислено ${spaces(player.bank.contribution)} ₽.\n\n💡 Для просмотра своих счетов напишите «Баланс».`, 'contribution', player, Keyboard.builder().textButton({label: 'Баланс'}).inline());
				player.bank.balance += player.bank.contribution;
				delete time.contribution;
				delete player.bank.contribution;
			}
			if (time.contribution && early_closure) {
				delete time.contribution;
				delete player.bank.contribution;
				notification(`🗃 || ${nick(player)}, вклад досрочно закрыт, так как вы его не пополняли на протяжении 30 часов.`, 'contribution', player);
			}
		}
		if (time.billing_period) {
			time.billing_period--;
			if (!time.billing_period) {
				notification(`💳 || ${nick(player)}, расчётный период завершён! Вы получили ${spaces(player.bank.cashback.balance)} ₽ кэшбэка на баланс карты.\n\n💡 Для просмотра меню по кэшбэку напишите «Кэшбэк».\n💡 Для просмотра своих счетов напишите «Баланс».`, 'cashback', player, Keyboard.builder().textButton({label: 'Кэшбэк', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Баланс'}).inline());
				player.bank.balance += player.bank.cashback.balance;
				player.bank.cashback.balance = 0;
				player.bank.cashback.increased = false;
				player.bank.cashback.option_increased = [utils.random(0,4), utils.random(0,4), utils.random(0,4)];
				time.billing_period = 108000;
			}
		}
		if (time.autoschool) {
			time.autoschool--;
			if (!time.autoschool) {
				delete time.autoschool;
				delete player.autoschool.stop;
			}
		}
		if (time.training) {
			time.training--;
			if (!time.training) {
				delete time.training;
				delete player.training.stop;
			}
		}
		if (time.education) {
			time.education--;
			if (!time.education) {
				delete time.education;
				delete player.education.stop;
			}
		}
		if (time.deduction) {
			time.deduction--;
			if (!time.deduction) {
				delete time.education;
				delete time.deduction;
				delete player.education;
				send(`📚 || ${nick(player)}, вас отчислили из-за долгого ответа на вопрос! ❌`, player.idvk);
			}
		}
		enterprise: if (time.enterprise) {
			time.enterprise--;
			if (!time.enterprise) {
				delete time.enterprise;
				if (!player.enterprise.permission) break enterprise;
				delete time.deregistration;
				let id = ++enterprises.quantity;
				let date = new Date();
				date = date.getMonth() + 1;
				let divider = player.enterprise.type == 1 ? 13 : 11;
				let psrn = `${player.enterprise.type}${date < 10 ? `0${date}` : date}${id.toString().padStart(6, '0')}`;
				psrn = `${psrn}${psrn%divider > 9 ? (psrn%divider).toString()[1] : psrn%divider}`;
				let cofounders = [];
				let balance = 0;
				if (player.enterprise.type > 2) balance = player.enterprise.fraction;
				if (player.enterprise.type == 2) for (j in player.enterprise.cofounders) if (accounts.accounts[player.enterprise.cofounders[j]]) cofounders.push(player.enterprise.cofounders[j]);
				if (player.enterprise.type == 2) for (j in accounts.accounts) if (cofounders.findIndex(fou => fou == j) != -1) balance += accounts.accounts[j].enterprise.fraction;
				enterprises.enterprises[id] = {id: id, title: player.enterprise.title, psrn: psrn, type: player.enterprise.type, founders: player.enterprise.type != 2 ? player.id : cofounders, capital: balance}
				watch.enterprises[id] = {};
				if (player.enterprise.type == 2) {
					for (j in accounts.accounts) {
						let player1 = accounts.accounts[j];
						if (cofounders.findIndex(fou => fou == j) != -1) {
							player1.enterprise = {id: id, fraction: player1.enterprise.fraction/balance*100};
							notification(`🗂 || ${nick(player1)}, регистрация предприятия завершена.\n\n💡 Для просмотра информации о вашем предприятии напишите «Предприятие».\n💡 Для просмотра помощи по предпринимателству напишите «Предпринимателство».`, 'enterprise', player1, Keyboard.builder().textButton({label: 'Предприятие', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Предпринимательство'}).inline());
						}
					}
					break enterprise;
				}
				player.enterprise = {id: id};
				notification(`🗂 || ${nick(player)}, регистрация предприятия завершена.\n\n💡 Для просмотра информации о вашем предприятии напишите «Предприятие».\n💡 Для просмотра помощи по предпринимателству напишите «Предпринимателство».`, 'enterprise', player, Keyboard.builder().textButton({label: 'Предприятие', color: Keyboard.POSITIVE_COLOR}).row().textButton({label: 'Предпринимательство'}).inline());
			}
		}
		if (time.deregistration) {
			time.deregistration--;
			if (!time.deregistration) {
				delete time.enterprise;
				delete time.deregistration;
				for (j in player.enterprise.cofounders) {
					let player1 = accounts.accounts[player.enterprise.cofounders[j]];
					if (player1) {
						if (player1.enterprise) player1.bank.balance += player1.enterprise.fraction;
						delete player1.enterprise;
						notification(`🗂 || ${nick(player1)}, регистрация предприятия отменена, так как некоторые игроки не согласились стать соучредителями.`, 'enterprise', player1);
					}
				}
			}
		}
		fines: if (time.fines) {
			if (time.fines.changenick_ban) {
				time.fines.changenick_ban--;
				if (!time.fines.changenick_ban) {
					time.fines[1] ? delete time.fines.changenick_ban : delete time.fines;
					player.fines[1] ? delete player.fines.changenick_ban : delete player.fines;
					send(`📛 || ${nick(player)}, срок блокировки смены ника закончился! Вы снова можете менять ник. ✔`, player.idvk);
					break fines;
				}
			}
			if (time.fines.account_ban) {
				time.fines.account_ban--;
				if (time.fines.account_ban == 0) {
					time.fines[1] ? delete time.fines.account_ban : delete time.fines;
					player.fines[1] ? delete player.fines.account_ban : delete player.fines;
					send(`📛 || ${nick(player)}, срок блокировки аккаунта закончился! Вы снова можете играть в игрового чат-бота «Горожанин бот». ✔`, player.idvk);
					break fines;
				}
			}
		}
		subscriptions: if (time.subscriptions) {
			if (time.subscriptions.bankpass) {
				time.subscriptions.bankpass--;
				if (time.subscriptions.bankpass == 86400) notification(`💳 || ${nick(player)}, через 24 часа подписка «Bank Pass» закончится. Если вы не хотите потерять подписку «Bank Pass», продлейте её на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
				if (!time.subscriptions.bankpass) {
					time.subscriptions[1] ? delete time.subscriptions.bankpass : delete time.subscriptions;
					player.subscriptions[1] ? delete player.subscriptions.bankpass : delete player.subscriptions;
					delete user.bank.cashback;
					notification(`💳 || ${nick(player)}, срок подписки «Bank Pass» закончился, подписка отключена. Вы можете снова купить подписку «Bank Pass» на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
					break subscriptions;
				}
			}
			if (time.subscriptions.gangpass) {
				time.subscriptions.gangpass--;
				if (time.subscriptions.gangpass == 86400) notification(`⚔ || ${nick(player)}, через 24 часа подписка «Gang Pass» закончится. Если вы не хотите потерять подписку «Gang Pass», продлейте её на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
				if (!time.subscriptions.gangpass) {
					time.subscriptions[1] ? delete time.subscriptions.gangpass : delete time.subscriptions;
					player.subscriptions[1] ? delete player.subscriptions.gangpass : delete player.subscriptions;
					notification(`⚔ || ${nick(player)}, срок подписки «Gang Pass» закончился, подписка отключена. Вы можете снова купить подписку «Gang Pass» на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
					break subscriptions;
				}
			}
			if (time.subscriptions.gangpassplus) {
				time.subscriptions.gangpassplus--;
				if (time.subscriptions.gangpassplus == 86400) notification(`⚔ || ${nick(player)}, через 24 часа подписка «Gang Pass Plus» закончится. Если вы не хотите потерять подписку «Gang Pass Plus», продлейте её на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
				if (!time.subscriptions.gangpassplus) {
					time.subscriptions[1] ? delete time.subscriptions.gangpassplus : delete time.subscriptions;
					player.subscriptions[1] ? delete player.subscriptions.gangpassplus : delete player.subscriptions;
					notification(`⚔ || ${nick(player)}, срок подписки «Gang Pass Plus» закончился, подписка отключена. Вы можете снова купить подписку «Gang Pass Plus» на нашем сайте - https://gorozaninconnect.ru.`, 'subscription', player);
					break subscriptions;
				}
			}
		}
	}
	for (i in watch.gangs) {
		let time = watch.gangs[i];
		let gang = gangs.gangs[i];
		if (time.jamming) {
			time.jamming--;
			if (!time.jamming) {
				delete time.jamming;
				gang_notification(`⚔ || Глушение банды «${gang.title}» закончилось.\n\n💡 Для поиска боя напишите «Бой поиск».`, gang, null, true, Keyboard.builder().textButton({label: 'Бой поиск'}).inline());
			}
		}
		if (time.battle) {
			time.battle--;
			if (!time.battle) {
				let opponent = gangs.gangs[gang.battle.opponent];
				delete time.battle;
				delete watch.gangs[opponent.id].battle;
				battleStop(gang, opponent);
			}
		}
	}
	for (i in watch.enterprises) {
		let time = watch.enterprises[i];
		let enterprise = enterprises.enterprises[i];
		trademark: if (time.trademark && time.trademark.trademark) {
			time.trademark.trademark--;
			if (!time.trademark.trademark) {
				delete time.trademark.trademark;
				if (!time.trademark.permission) break trademark;
				enterprise.trademark = time.trademark.title;
				enterprise_notification(`® || Теперь ваше предприятие имеет товарный знак «${time.trademark.title}».\n\n💡 Для просмотра бизнеса вашего предприятия напишите «Бизнес».`, 'addreg', enterprise, null, false, Keyboard.builder().textButton({label: 'Бизнес'}).inline());
				delete time.trademark;
			}
		}
		if (time.liquidation) {
			time.liquidation--;
			if (!time.liquidation) {
				for (j in accounts.accounts) {
					let player = accounts.accounts[j];
					if (player.enterprise && player.enterprise.id == enterprise.id) {
						enterprise.type == 2 ? (player.bank.balance += (enterprise.capital ? Math.round(enterprise.capital/100*player.enterprise.fraction) : Math.round(enterprise.accpayment.balance/100*player.enterprise.fraction))) : (player.bank.balance += (enterprise.capital ? enterprise.capital : enterprise.accpayment.balance));
						notification(`🗂 || ${nick(player)}, ликвидация предприятия «${enterprise.title}» закончена.`, 'enterprise', player);
						delete player.enterprise;
					}
				}
				delete watch.enterprises[i];
				delete enterprises.enterprises[i];
			}
		}
	}
}, 1000);

function aid(idvk) {
	return uid[idvk].id;
}

function nick(user) {
	let smile = '';
	if (user.subscriptions) {
		if (user.subscriptions.bankpass) smile = '🐲';
		if (user.subscriptions.gangpass) smile = '🏀';
		if (user.subscriptions.gangpassplus) smile = '📀';
		if (user.subscriptions.don) smile = '🍩';
	}
	if (agent(user.idvk) == 1) smile = '🔥';
	if (agent(user.idvk) == 2) smile = '💵';
	if (user.id == 1) smile = '🌶';
	return !user.settings.hyperlink ? `@id${user.idvk}(${user.nickname})${smile}` : `${user.nickname}${smile}`;
}

function send(text, idvk, keyboard = Keyboard.builder().inline()) {
	vk.api.call('messages.send', {
		peer_id: idvk,
		random_id: 0,
		message: text,
		keyboard: keyboard
	});
}

function snackbar(eventId, userId, peerId, text) {
	vk.api.call('messages.sendMessageEventAnswer', {
		event_id: eventId,
		user_id: userId,
		peer_id: peerId,
		event_data: JSON.stringify({"type":"show_snackbar","text":text})
	});
}

function ucFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function spaces(number) {
	let remains = number % 1;
	let decimal_array = remains.toString().split('');
	number -= remains;
	return number.toString().split('').reverse().join('').match(/.{1,3}/g).join('.').split('').reverse().join('') + (decimal_array[2] ? ',' + decimal_array[2] : '') + (decimal_array[3] ? decimal_array[3] : '') + (decimal_array[4] ? decimal_array[4] : '');
}

function declination(genitive_plural, nominative, genitive, number) {
	let number1 = number % 100;
	if (number1 > 10 && number1 < 20) return spaces(number) + ' ' + genitive_plural;
	number1 %= 10;
	if (number1 == 1) return spaces(number) + ' ' + nominative;
	if (number1 > 1 && number1 < 5) return spaces(number) + ' ' + genitive;
	return spaces(number) + ' ' + genitive_plural;
}

function gender(male, female, user) {
	if (user.gender == 'ж') return female;
	return male;
}

function parserId(string) {
	if (Number(string) || !string) return Number(string);
	return string.replace(/#/ig, '');
}

function parserInteger(string) {
	if (/всё|все/i.test(string)) return string;
	if (!/(k|к)/i.test(string)) return Math.round(string);
	let quantity = string.toString().match(/к|k{1}/g).join('').length;
	return Math.round(string.replace(/\,/ig, '.').replace(/k|к/ig, '')*(1000**quantity));
}

function notification(text, type, user, keyboard = Keyboard.builder().inline(), attachment) {
	if (!user.settings.notdisturb && !user.settings.notifications[type] && (!user.fines || !user.fines.account_ban)) {
		vk.api.call('messages.send', {
			peer_id: user.idvk,
			random_id: 0,
			message: text,
			keyboard: keyboard,
			attachment: attachment
		}).catch(err => {});
	}
}

function agent(id) {
	let agent = false;
	for (i in support.agents) if (support.agents[i].id == id) support.agents[i].senior ? agent = 2 : agent = 1;
	return agent;
}

function checkUniqTittle(title) {
	for (i in gangs.gangs) if (gangs.gangs[i].title == title) return false;
	return true;
}

function checkNameGang(data) {
	if (Number(data)) return data;
	for (i in gangs.gangs) if (gangs.gangs[i].title == data) return i;
	return false;
}

function gang_notification(text, gang, user, creator, keyboard = Keyboard.builder().inline()) {
	if (gang.conversation && !conversations[gang.conversation].gang.notifications) {
		vk.api.call('messages.send', {
			chat_id: gang.conversation,
			random_id: 0,
			message: text,
			keyboard: keyboard
		}).catch(err => {});
		return;
	} 
	if (creator && (!user || user.id != gang.creator)) return notification(text, 'gang_notification', accounts.accounts[gang.creator], keyboard);
	for (i in accounts.accounts) if (accounts.accounts[i].gang.id == gang.id && (!user || user.id != i)) notification(text, 'gang_notification', accounts.accounts[i], keyboard);
}

function enterprise_notification(text, type, enterprise, user, command, keyboard = Keyboard.builder().inline()) {
	if (enterprise.type == 2) {
		for (i in enterprise.founders) if (accounts.accounts[enterprise.founders[i]] && (!user || enterprise.founders[i] != user.id)) notification(text, type, accounts.accounts[enterprise.founders[i]], keyboard);
		return;
	}
	if (!command) notification(text, type, accounts.accounts[enterprise.founders], keyboard);
}

function payoff(gang) {
	if (gang.rating < 5) return 500;
	if (gang.rating < 10) return 1000;
	if (gang.rating < 25) return 10000;
	if (gang.rating < 50) return 50000;
	if (gang.rating < 100) return 100000;
	if (gang.rating < 200) return 200000;
	if (gang.rating < 1000) return 500000;
	if (gang.rating < 2000) return 1000000;
	return 10000000;
}

function random(x, y) {
	return y ? Math.round(Math.random() * (y - x)) + x : Math.round(Math.random() * x);
}

Array.prototype.random = function() {
	return this[Math.floor(this.length * Math.random())];
}

function progress(lvl1, id) {
	return lvl1;
}

function timeAndDay() {
	let date = new Date();
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let day = date.getDate();
	let mounth = date.getMonth()+1;
	let year = date.getFullYear();
	return hours+':'+minutes+' '+day+'.'+mounth+'.'+year+' МСК';
}

function battleStop(gang1, gang2) {
	let winner = gang1.battle.damage > gang2.battle.damage ? gang1 : gang2;
	let loser = gang1.battle.damage > gang2.battle.damage ? gang2 : gang1;
	let jamming_winner = Math.round(loser.battle.damage/200);
	let jamming_loser = Math.round(winner.battle.damage/200);
	victory: {
		if (gang1.battle.damage == gang2.battle.damage) {
			gang_notification(`⚔ || В этом сражении нет победителя — ничья! 😇\n\n${jamming_winner ? `💡 Ваша банда заглушена на ${jamming_winner < 60 ? declination('секунд', 'секунду', 'секунды', jamming_winner) : declination('минут', 'минуту', 'минуты', Math.round(jamming_winner/60))}.\n` : ``}💡 Для просмотра информации о вашей банде напишите «Банда».`, winner, null, false, Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).inline());
			gang_notification(`⚔ || В этом сражении нет победителя — ничья! 😇\n\n${jamming_loser ? `💡 Ваша банда заглушена на ${jamming_loser < 60 ? declination('секунд', 'секунду', 'секунды', jamming_loser) : declination('минут', 'минуту', 'минуты', Math.round(jamming_loser/60))}.\n` : ``}💡 Для просмотра информации о вашей банде напишите «Банда».`, loser, null, false, Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).inline());
			for (i in accounts.accounts) if (accounts.accounts[i].gang.id == winner.id || accounts.accounts[i].gang.id == loser.id) {delete accounts.accounts[i].gang.damage; delete accounts.accounts[i].gang.blows}
			winner.balance += winner.battle.bet;
			loser.balance += loser.battle.bet;
			break victory;
		}
		gang_notification(`⚔ || Банда «${winner.title}» выиграла это сражение! Выигрыш составляет ${spaces(winner.battle.bet)} ₽. 👑\n\n${jamming_winner ? `💡 Ваша банда заглушена на ${jamming_winner < 60 ? declination('секунд', 'секунду', 'секунды', jamming_winner) : declination('минут', 'минуту', 'минуты', Math.round(jamming_winner/60))}.\n` : ``}💡 Для просмотра информации о вашей банде напишите «Банда».`, winner, null, false, Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).inline());
		gang_notification(`⚔ || Банда «${loser.title}» проиграла это сражение! Проигрыш составляет ${spaces(loser.battle.bet)} ₽. 👺\n\n${jamming_loser ? `💡 Ваша банда заглушена на ${jamming_loser < 60 ? declination('секунд', 'секунду', 'секунды', jamming_loser) : declination('минут', 'минуту', 'минуты', Math.round(jamming_loser/60))}.\n` : ``}💡 Для просмотра информации о вашей банде напишите «Банда».`, loser, null, false, Keyboard.builder().textButton({label: 'Банда', color: Keyboard.POSITIVE_COLOR}).inline());
		for (i in accounts.accounts) {
			let player = accounts.accounts[i];
			if (player.gang.id == winner.id && player.gang.damage) {
				let winning = Math.round(player.gang.damage/2);
				player.balance += winning;
				notification(`⚔ || ${nick(player)}, вы получили ${spaces(winning)} ₽ за атаку в бое.\n\n💡 Для просмотра всех ваших счетов напишите «Баланс».`, 'winning', player, Keyboard.builder().textButton({label: 'Баланс'}).inline());
			}
			if (player.gang.id == winner.id || player.gang.id == loser.id) {delete player.gang.damage; delete player.gang.blows}
		}
		winner.balance += winner.battle.bet*2;
		winner.rating++;
		loser.rating == 0 ? loser.rating = 0 : loser.rating--;
	}
	winner.battle = {};
	loser.battle = {};
	jamming_winner ? watch.gangs[winner.id].jamming = jamming_winner : true;
	jamming_loser ? watch.gangs[loser.id].jamming = jamming_loser : true;
	delete watch.gangs[winner.id].battle;
	delete watch.gangs[loser.id].battle;
}

async function run() {
	await vk.updates.start().catch(console.error);
	console.log('«Горожанин бот» успешно запущен и готов к использованию.');
}
run().catch(console.error);