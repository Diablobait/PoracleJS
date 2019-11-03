const _ = require('lodash')

module.exports = (ctx) => {

	const { controller, command } = ctx.state
	const user = ctx.update.message.from
	const channelName = ctx.update.message.chat.title ? ctx.update.message.chat.title : ''
	const search = command.args

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
				controller.query.geolocate(search).then((location) => {
					controller.query.updateLocation('humans', location[0].latitude, location[0].longitude, 'id', target.id).catch((O_o) => {})
					const maplink = `https://www.google.com/maps/search/?api=1&query=${location[0].latitude},${location[0].longitude}`
					ctx.reply(`✅, Localizacion fijada ${target.name}s a: \n${maplink}`)
				}).catch((O_o) => {})
			}
		})
		.catch((err) => {
			controller.log.error(`Telegram commando /location errored with: ${err.message} (command was "${command.text}")`)
		})
}