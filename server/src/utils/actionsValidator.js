import { actions, actionDefinitions } from './../constants/general.js'

const validateType = (value, type) => {
  const compareFunction =
    type === 'array' ? (value) => Array.isArray(value) : (value) => typeof value === type

  return compareFunction(value)
}

const validateProperty = (value, property) => {
  for (const key in property) {
    if (!value.hasOwnProperty(key)) return false
    if (!validateType(value[key], property[key].type)) return false

    if (property[key].type === 'number') {
      if (property[key].minimum && value[key] < property[key].minimum) return false
      if (property[key].maximum && value[key] > property[key].maximum) return false
    } else if (property[key].type === 'object') {
      if (!validateProperty(value[key], property[key].content)) return false
    } else if (property[key].type === 'array') {
      if (property[key].arrayType === 'object') {
        if (!validateProperty(value[key][0], property[key].content)) return false
      } else {
        if (!validateType(value[key][0], property[key].arrayType)) return false
        if (
          property[key].arrayType === 'number' &&
          !value[key].every(
            (item) => item >= property[key].minimum || item <= property[key].maximum
          )
        )
          return false
      }
    }
  }

  return true
}

const validateAction = (options) => {
  const action = options.action
  if (!actionDefinitions.hasOwnProperty(action)) return false

  const actionDefinition = actionDefinitions[action]
  if (!actionDefinition) return true
  return validateProperty(options, actionDefinition)
}

export { validateAction }
