const { GoogleGenerativeAI } = require('@google/generative-ai')
const config = require('../config')

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY)

module.exports.prompt = async function (system, content) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: system
  })

  const result = await model.generateContent(content)
  const response = await result.response
  const text = response.text()

  console.log(text)

  const lines = text.split('\n').map(line => line.trim())

  const bodyStartIndex = lines.findIndex(line => line === '```json' || line === '```')
  if (bodyStartIndex === -1) {
    throw new Error('Response does not contain a code block')
  }

  const bodyEndIndex = lines.indexOf('```', bodyStartIndex + 1)
  if (bodyEndIndex === -1) {
    throw new Error('Response does not contain a closing code block')
  }

  const data = JSON.parse(lines.slice(bodyStartIndex + 1, bodyEndIndex).join('\n').trim())
  return data
}
