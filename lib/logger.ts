function log(level: string, context: string, message: string, data?: any) {
  var entry = {
    timestamp: new Date().toISOString(),
    level: level,
    context: context,
    message: message,
    data: data || null,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

function logInfo(context: string, message: string, data?: any) { log('info', context, message, data) }
function logError(context: string, message: string, data?: any) { log('error', context, message, data) }
function logWarn(context: string, message: string, data?: any) { log('warn', context, message, data) }

export { logInfo, logError, logWarn }
