const _ = require('lodash')

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
				let message = ''
				const greeting = controller.dts.greeting.embed.fields
				greeting.forEach((field) => {
					message = message.concat(`\n\n${field.name}\n\n${field.value}`)
				})
				ctx.reply(message, { parse_mode: 'Markdown' }).catch((O_o) => {
					controller.log.error(O_o.message)
				})
			}
		})
		.catch((err) => {
			controller.log.error(`Telegram commando /help errored with: ${err.message} (command was "${command.text}")`)
		})
}