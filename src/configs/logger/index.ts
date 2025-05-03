import winston from 'winston'

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint(),
    winston.format.printf((info) => {
      return `${info.timestamp}:${info.label}:${info.message}`
    })
  ),
  transports: [
    new winston.transports.Console()
    // new winston.transports.File({
    //   level: 'info',
    //   format: winston.format.printf((info) => {
    //     return `${info.timestamp}:${info.label}:${info.message}`
    //   }),
    //   filename: `${new Date().getTime()}-info.log`,
    //   dirname: 'logs',
    //   maxsize: 1
    // })
  ]
})
