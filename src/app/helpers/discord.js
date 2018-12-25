const Discord = require('discord.js')

const client = new Discord.Client()
const config = require('config')
const log = require('../logger')


client.on('ready', () => {
	log.info(`Discord botto "${client.user.tag}" ready for action!`)
	process.on('message', (msg) => {
		if (msg.reason === 'food') {
			clearInterval(hungryInterval)
			if (client.channels.keyArray().includes(msg.job.target)) {
				client.channels.get(msg.job.target).send(msg.job.message).then((message) => {
					if (config.discord.typereact) {
						msg.job.emoji.forEach((emoji) => {
							message.react(emoji)
							let hungryInterval = startBeingHungry()
						})
					}
					else {
						let hungryInterval = startBeingHungry()
					}
				})
			}
			else if (client.users.keyArray().includes(msg.job.target)) {
				client.users.get(msg.job.target).send(msg.job.message).then((message) => {
					if (config.discord.typereact) {
						msg.job.emoji.forEach((emoji) => {
							message.react(emoji)
							const hungryInterval = startBeingHungry()
						})
					}
					else {
						let hungryInterval = startBeingHungry()
					}
				})
			}
			else log.warn(`Tried to send message to ${msg.job.name} ID ${msg.job.target}, but error ocurred`)
		}
	})
	let hungryInterval = startBeingHungry()
})

function startBeingHungry() {
	log.debug(`Discord worker ${process.pid} started being hungry`)
	const hungryInterval = setInterval(() => {
		process.send({ reason: 'hungry' })
	}, 10)
	return hungryInterval
}

client.on('rateLimitInfo', (rateLimit) => {
	log.warn(`Discord ${client.user.tag} rate limit info: ${rateLimit}`)
})

client.on('warn', (warning) => {
	log.warn(`Discord ${client.user.tag} sent general warning: ${warning}`)
})


client.login(process.env.k)
	.catch((err) => {
		log.error(err.message)
		process.send({ reason: 'seppuku', key: process.env.k })
		process.exit()
	})

