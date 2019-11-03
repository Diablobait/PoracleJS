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

				controller.query.updateQuery('humans', 'enabled', true, 'id', target.id).catch((O_o) => {})
				ctx.reply('✅').catch((O_o) => {
					controller.log.error(O_o.message)
				})
				controller.log.log({ level: 'debug', message: `${user.first_name} enabled ${target.name} alarms`, event: 'discord:enable' })
			}
		})
		.catch((err) => {
			controller.log.error(`Telegram commando /start errored with: ${err.message} (command was "${command.text}")`)
		})
}