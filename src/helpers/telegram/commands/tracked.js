const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const hastebin = require('hastebin-gen')
const config = require('config')

let monsterDataPath = `${__dirname}/../../../util/monsters.json`
if (_.includes(['de', 'fr', 'ja', 'ko', 'ru'], config.locale.language.toLowerCase())) {
	monsterDataPath = `${__dirname}/../../../util/locale/monsters${config.locale.language.toLowerCase()}.json`
}
const monsterData = require(monsterDataPath)
const teamData = require(`${__dirname}/../../../util/teams`)
const formData = require(`${__dirname}/../../../util/forms`)
const genderData = require(`${__dirname}/../../../util/genders`)
const questDts = require('../../../../config/questdts')

module.exports = (ctx) => {

	const { controller, command } = ctx.state
	const user = ctx.update.message.from
	const channelName = ctx.update.message.chat.title ? ctx.update.message.chat.title : ''

	let target = { id: user.id.toString(), name: user.first_name }
	if (!_.includes(controller.config.telegram.admins, user.id.toString()) && ctx.update.message.chat.type === 'supergroup') {
		return ctx.telegram.sendMessage(user.id, 'Por favor ejecuta los comandos por privado').catch((O_o) => {
			controller.log.error(O_o.message)
		})
	}
	if (_.includes(controller.config.telegram.admins, user.id.toString()) && ctx.update.message.chat.type === 'supergroup') target = { id: ctx.update.message.chat.id.toString(), name: ctx.update.message.chat.title }
	controller.query.countQuery('id', 'humans', 'id', target.id)
		.then((isregistered) => {
			if (!isregistered && _.includes(controller.config.telegram.admins, user.id.toString()) && ctx.update.message.chat.type === 'supergroup') {
				return ctx.reply(`${channelName} does not seem to be registered. add it with /channel add`).catch((O_o) => {
					controller.log.error(O_o.message)
				})
			}
			if (!isregistered && ctx.update.message.chat.type === 'private') {
				return ctx.telegram.sendMessage(user.id, `No estas registrado!!\nRegistrate con /registroavisos en el canal de Radar Chat`).catch((O_o) => {
					controller.log.error(O_o.message)
				})
			}
			if (isregistered) {
				Promise.all([
					controller.query.selectAllQuery('monsters', 'id', target.id),
					controller.query.selectAllQuery('raid', 'id', target.id),
					controller.query.selectAllQuery('egg', 'id', target.id),
					controller.query.selectOneQuery('humans', 'id', target.id),
					controller.query.selectAllQuery('quest', 'id', target.id),
					controller.query.selectAllQuery('incident', 'id', target.id),
				]).then((data) => {
					const monsters = data[0]
					const raids = data[1]
					const eggs = data[2]
					const human = data[3]
					const quests = data[4]
					const invasions = data[5]
					const maplink = `https://www.google.com/maps/search/?api=1&query=${human.latitude},${human.longitude}`
					ctx.reply(`👋\nTu localización esta fijada en: ${maplink} \nTienes puesta la ciudad: ${human.area}`).catch((O_o) => {
						controller.log.error(O_o.message)
					})
					let message = ''
					if (monsters.length) {
						message = message.concat('\nTienes los siguientes filtros de pokemon:\n')
					}
					else message = message.concat('\nNo tienes ningun filtro de pokemon')

					monsters.forEach((monster) => {
						const monsterName = monsterData[monster.pokemon_id].name
						let miniv = monster.min_iv
						let formName = formData[monster.pokemon_id] ? formData[monster.pokemon_id][monster.form] : 'none'
						if (formName === undefined) formName = 'none'
						if (miniv === -1) miniv = 0
						message = message.concat(`\n*${monsterName}* forma: ${formName} distancia: ${monster.distance}m IV: ${miniv}%-${monster.max_iv}% PC: ${monster.min_cp}-${monster.max_cp} Nivel: ${monster.min_level}-${monster.max_level} Estadisticas: ${monster.atk}/${monster.def}/${monster.sta} - ${monster.maxAtk}/${monster.maxDef}/${monster.maxSta}, Genero:${genderData[monster.gender]}`)
					})
					if (raids.length || eggs.length) {
						message = message.concat('\nTienes los siguientes filtros de incursiones:\n')
					}
					else message = message.concat('\nNo tienes ningun filtro de incursiones')
					raids.forEach((raid) => {
						const monsterName = monsterData[raid.pokemon_id].name
						const raidTeam = teamData[raid.team].name
						let formName = formData[raid.pokemon_id] ? formData[raid.pokemon_id][raid.form] : 'none'
						if (formName === undefined) formName = 'none'

						if (parseInt(raid.pokemon_id, 10) === 721) {
							message = message.concat(`\n*Nivel:${raid.level} * Distancia: ${raid.distance}m controlado por ${raidTeam} , EX: ${raid.park}`)
						}
						else {
							message = message.concat(`\n*${monsterName}* Forma: ${formName}, Distancia: ${raid.distance}m controlado por ${raidTeam}, EX: ${raid.park}`)
						}
					})
					eggs.forEach((egg) => {
						const raidTeam = teamData[egg.team].name
						message = message.concat(`\n*Nivel ${egg.raid_level} * Distancia: ${egg.distance}m controlado por ${raidTeam} , EX: ${egg.park}`)
					})

					if (quests.length) {
						message = message.concat('\nTienes los siguientes filtros de misiones:\n')
					}
					else message = message.concat('\nNo tienes ningun filtro de misiones')

					quests.forEach((quest) => {
						let rewardThing = ''
						if (quest.reward_type === 7) rewardThing = monsterData[quest.reward].name
						if (quest.reward_type === 3) rewardThing = `${quest.reward} or more stardust`
						if (quest.reward_type === 2) rewardThing = questDts.rewardItems[quest.reward]
						message = message.concat(`\nRecompensa: ${rewardThing} Distancia: ${quest.distance}m `)
					})

					if (invasions.length) {
						message = message.concat('\nTienes los siguientes filtros de invasiones:\n')
					}
					else message = message.concat('\nno tienes ningun filtro de invasion')

					invasions.forEach((invasion) => {
						let genderText = ''
						let typeText = ''
						if (invasion.gender === 1) {
							genderText = 'Gender: Macho, '
						}
						else if (invasion.gender === 2) {
							genderText = 'Gender: Hembra, '
						}
						if (!invasion.gruntType || invasion.gruntType === '') {
							typeText = 'Cualquiera'
						}
						else {
							typeText = invasion.gruntType
						}
						message = message.concat(`\nInvasion: ${genderText} Tipo: ${typeText}`)
					})

					controller.log.log({ level: 'debug', message: `${user.first_name} checked trackings`, event: 'telegram:tracked' })

					if (message.length < 6000) {
						ctx.reply(message)
					}
					else {
						const hastebinMessage = hastebin(message)
						hastebinMessage
							.then((hastelink) => {
								ctx.reply(`${target.name} la lista es muy larga. Puedes verla en`).catch((O_o) => {
									controller.log.error(O_o.message)
								})
							})
							.catch((err) => {
								const filepath = path.join(__dirname, `../../../../.cache/${human.name}.txt`)
								fs.writeFileSync(filepath, message)
								ctx.reply(`${target.name} lista muy larga.`).catch((O_o) => {
									controller.log.error(O_o.message)
								})
								const attachment = fs.readFileSync(filepath, { encoding: 'utf-8' })
								ctx.telegram.sendDocument(target.id, attachment)
									.then(() => {
										fs.unlinkSync(filepath)
									})
									.catch((O_o) => {
										controller.log.error(O_o.message)
									})
								controller.log.error(`Hastebin unhappy: ${err.message}`)
							})
					}
				})
			}
		})
		.catch((err) => {
			controller.log.error(`Telegram commando /tracked errored with: ${err.message} (command was "${command.text}")`)
		})
}